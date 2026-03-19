const crypto = require('crypto');
const { Op } = require('sequelize');
const { User, Role, RefreshToken, PasswordResetToken } = require('../../models');
const notificationsService = require('../notifications/notifications.service');
const { hashPassword, comparePassword } = require('../../utils/bcrypt');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../../utils/jwt');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getRoleId = async (roleName) => {
  const role = await Role.findOne({ where: { name: roleName } });
  if (!role) throw new Error(`Role '${roleName}' not found`);
  return role.id;
};

const buildTokens = async (user) => {
  const payload = { id: user.id, email: user.email, role: user.role ? user.role.name : null };
  const accessToken = signAccessToken(payload);
  const rawRefreshToken = signRefreshToken({ id: user.id });

  // Store bcrypt hash of refresh token
  const bcrypt = require('bcryptjs');
  const tokenHash = await bcrypt.hash(rawRefreshToken, 10);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await RefreshToken.create({ user_id: user.id, token_hash: tokenHash, expires_at: expiresAt });

  return { accessToken, rawRefreshToken };
};

const safeUser = (user) => ({
  id: user.id,
  first_name: user.first_name,
  last_name: user.last_name,
  email: user.email,
  phone: user.phone,
  avatar_url: user.avatar_url,
  is_email_verified: user.is_email_verified,
  registration_completed: user.registration_completed,
  role: user.role ? user.role.name : null,
});

// ─── Service Methods ───────────────────────────────────────────────────────────

const register = async (data) => {
  const existing = await User.findOne({ where: { email: data.email } });
  if (existing) {
    const err = new Error('Email already registered');
    err.code = 'EMAIL_TAKEN';
    throw err;
  }

  const roleId = await getRoleId('customer');
  const password_hash = await hashPassword(data.password);

  const user = await User.create({
    role_id: roleId,
    first_name: data.first_name,
    last_name: data.last_name,
    email: data.email,
    password_hash,
    phone: data.phone || null,
    is_email_verified: false,
    registration_completed: true,
  });

  const fullUser = await User.findOne({
    where: { id: user.id },
    include: [{ model: Role, as: 'role' }],
  });

  const { accessToken, rawRefreshToken } = await buildTokens(fullUser);

  notificationsService.sendWelcomeEmail(fullUser).catch(() => {});

  return { user: safeUser(fullUser), accessToken, rawRefreshToken };
};

const login = async (email, password) => {
  const user = await User.findOne({
    where: { email: email.toLowerCase().trim() },
    include: [{ model: Role, as: 'role' }],
  });

  if (!user || !user.password_hash) {
    const err = new Error('Invalid email or password');
    err.code = 'INVALID_CREDENTIALS';
    throw err;
  }

  if (!user.is_active) {
    const err = new Error('Account is deactivated');
    err.code = 'ACCOUNT_INACTIVE';
    throw err;
  }

  const isMatch = await comparePassword(password, user.password_hash);
  if (!isMatch) {
    const err = new Error('Invalid email or password');
    err.code = 'INVALID_CREDENTIALS';
    throw err;
  }

  const { accessToken, rawRefreshToken } = await buildTokens(user);
  return { user: safeUser(user), accessToken, rawRefreshToken };
};

const googleLogin = async (googleProfile, email) => {
  const googleId = googleProfile.id;
  const avatarUrl = googleProfile.photos && googleProfile.photos[0] ? googleProfile.photos[0].value : null;
  const firstName = googleProfile.name ? googleProfile.name.givenName : '';
  const lastName = googleProfile.name ? googleProfile.name.familyName : '';

  // Try find by google_id first, then by email
  let user = await User.findOne({
    where: { google_id: googleId },
    include: [{ model: Role, as: 'role' }],
  });

  if (!user) {
    user = await User.findOne({
      where: { email },
      include: [{ model: Role, as: 'role' }],
    });

    if (user) {
      // Link Google ID to existing account
      await user.update({ google_id: googleId, avatar_url: avatarUrl || user.avatar_url, is_email_verified: true });
      await user.reload({ include: [{ model: Role, as: 'role' }] });
    }
  }

  let isNewUser = false;
  if (!user) {
    const roleId = await getRoleId('customer');
    user = await User.create({
      role_id: roleId,
      first_name: firstName,
      last_name: lastName || 'User',
      email,
      google_id: googleId,
      avatar_url: avatarUrl,
      is_email_verified: true,
      registration_completed: false, // Must complete registration
    });
    user = await User.findOne({
      where: { id: user.id },
      include: [{ model: Role, as: 'role' }],
    });
    isNewUser = true;
  }

  if (!user.is_active) {
    const err = new Error('Account is deactivated');
    err.code = 'ACCOUNT_INACTIVE';
    throw err;
  }

  const { accessToken, rawRefreshToken } = await buildTokens(user);
  return { user: safeUser(user), accessToken, rawRefreshToken, isNewUser };
};

const completeRegistration = async (userId, data) => {
  const user = await User.findByPk(userId);
  if (!user) {
    const err = new Error('User not found');
    err.code = 'NOT_FOUND';
    throw err;
  }

  await user.update({
    first_name: data.first_name,
    last_name: data.last_name,
    phone: data.phone || null,
    registration_completed: true,
  });

  // Note: addresses table created in a later session — skipping address creation here
  // The address fields in the request are accepted but stored in Session 05+

  const fullUser = await User.findOne({
    where: { id: userId },
    include: [{ model: Role, as: 'role' }],
  });

  return { user: safeUser(fullUser) };
};

const refreshToken = async (rawToken) => {
  let decoded;
  try {
    decoded = verifyRefreshToken(rawToken);
  } catch {
    const err = new Error('Invalid or expired refresh token');
    err.code = 'INVALID_TOKEN';
    throw err;
  }

  // Find all non-expired tokens for this user and check each hash
  const bcrypt = require('bcryptjs');
  const tokens = await RefreshToken.findAll({
    where: {
      user_id: decoded.id,
      expires_at: { [Op.gt]: new Date() },
    },
  });

  let matchedToken = null;
  for (const t of tokens) {
    const match = await bcrypt.compare(rawToken, t.token_hash);
    if (match) {
      matchedToken = t;
      break;
    }
  }

  if (!matchedToken) {
    const err = new Error('Refresh token not found or already used');
    err.code = 'INVALID_TOKEN';
    throw err;
  }

  // Rotate: delete old token
  await matchedToken.destroy();

  const user = await User.findOne({
    where: { id: decoded.id, is_active: true },
    include: [{ model: Role, as: 'role' }],
  });

  if (!user) {
    const err = new Error('User not found');
    err.code = 'NOT_FOUND';
    throw err;
  }

  const { accessToken, rawRefreshToken: newRawRefreshToken } = await buildTokens(user);
  return { user: safeUser(user), accessToken, rawRefreshToken: newRawRefreshToken };
};

const logout = async (rawToken) => {
  if (!rawToken) return;

  try {
    const decoded = verifyRefreshToken(rawToken);
    const bcrypt = require('bcryptjs');

    const tokens = await RefreshToken.findAll({
      where: { user_id: decoded.id, expires_at: { [Op.gt]: new Date() } },
    });

    for (const t of tokens) {
      const match = await bcrypt.compare(rawToken, t.token_hash);
      if (match) {
        await t.destroy();
        break;
      }
    }
  } catch {
    // Ignore errors during logout — token may already be expired
  }
};

const forgotPassword = async (email) => {
  const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });

  // Always return success to prevent email enumeration
  if (!user || !user.password_hash) {
    return { message: 'If that email exists, a reset link has been sent.' };
  }

  // Invalidate any existing reset tokens
  await PasswordResetToken.destroy({ where: { user_id: user.id } });

  const rawToken = crypto.randomBytes(32).toString('hex');
  const bcrypt = require('bcryptjs');
  const tokenHash = await bcrypt.hash(rawToken, 10);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await PasswordResetToken.create({
    user_id: user.id,
    token_hash: tokenHash,
    expires_at: expiresAt,
    is_used: false,
  });

  notificationsService.sendPasswordReset(user, rawToken).catch(() => {});

  return {
    message: 'If that email exists, a reset link has been sent.',
    ...(process.env.NODE_ENV === 'development' ? { debug_token: rawToken } : {}),
  };
};

const resetPassword = async (rawToken, newPassword) => {
  const bcrypt = require('bcryptjs');

  // Find all non-expired, unused reset tokens
  const tokens = await PasswordResetToken.findAll({
    where: { is_used: false, expires_at: { [Op.gt]: new Date() } },
  });

  let matchedToken = null;
  for (const t of tokens) {
    const match = await bcrypt.compare(rawToken, t.token_hash);
    if (match) {
      matchedToken = t;
      break;
    }
  }

  if (!matchedToken) {
    const err = new Error('Invalid or expired reset token');
    err.code = 'INVALID_TOKEN';
    throw err;
  }

  const password_hash = await hashPassword(newPassword);

  // Mark token as used and update password
  await matchedToken.update({ is_used: true });
  await User.update({ password_hash }, { where: { id: matchedToken.user_id } });

  // Revoke all refresh tokens for this user
  await RefreshToken.destroy({ where: { user_id: matchedToken.user_id } });
};

module.exports = {
  register,
  login,
  googleLogin,
  completeRegistration,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  safeUser,
};

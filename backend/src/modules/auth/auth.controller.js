const authService = require('./auth.service');
const { success, created, unauthorized, conflict, businessError } = require('../../utils/response');
const env = require('../../config/env');

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  path: '/',
};

const setRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, REFRESH_COOKIE_OPTIONS);
};

const clearRefreshCookie = (res) => {
  res.clearCookie('refreshToken', { path: '/' });
};

// POST /auth/register
const register = async (req, res, next) => {
  try {
    const { user, accessToken, rawRefreshToken } = await authService.register(req.body);
    setRefreshCookie(res, rawRefreshToken);
    return created(res, { user, accessToken }, 'Registration successful');
  } catch (err) {
    if (err.code === 'EMAIL_TAKEN') return conflict(res, err.message);
    next(err);
  }
};

// POST /auth/login
const login = async (req, res, next) => {
  try {
    const { user, accessToken, rawRefreshToken } = await authService.login(req.body.email, req.body.password);
    setRefreshCookie(res, rawRefreshToken);
    return success(res, { user, accessToken }, 'Login successful');
  } catch (err) {
    if (err.code === 'INVALID_CREDENTIALS') return unauthorized(res, err.message);
    if (err.code === 'ACCOUNT_INACTIVE') return unauthorized(res, err.message);
    next(err);
  }
};

// POST /auth/logout
const logout = async (req, res, next) => {
  try {
    const rawToken = req.cookies.refreshToken;
    await authService.logout(rawToken);
    clearRefreshCookie(res);
    return success(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
};

// POST /auth/refresh-token
const refreshToken = async (req, res, next) => {
  try {
    const rawToken = req.cookies.refreshToken;
    if (!rawToken) return unauthorized(res, 'No refresh token');

    const { user, accessToken, rawRefreshToken } = await authService.refreshToken(rawToken);
    setRefreshCookie(res, rawRefreshToken);
    return success(res, { user, accessToken }, 'Token refreshed');
  } catch (err) {
    if (err.code === 'INVALID_TOKEN') {
      clearRefreshCookie(res);
      return unauthorized(res, err.message);
    }
    next(err);
  }
};

// POST /auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const result = await authService.forgotPassword(req.body.email);
    return success(res, result, result.message);
  } catch (err) {
    next(err);
  }
};

// POST /auth/reset-password
const resetPassword = async (req, res, next) => {
  try {
    await authService.resetPassword(req.body.token, req.body.password);
    return success(res, null, 'Password reset successful');
  } catch (err) {
    if (err.code === 'INVALID_TOKEN') return businessError(res, err.message, 'INVALID_TOKEN');
    next(err);
  }
};

// GET /auth/google — initiates OAuth (handled by passport middleware in routes)

// GET /auth/google/callback
const googleCallback = async (req, res, next) => {
  try {
    // req.user set by passport GoogleStrategy — contains { googleProfile, email, emailVerified }
    const { googleProfile, email } = req.user;
    const { user, accessToken, rawRefreshToken, isNewUser } = await authService.googleLogin(googleProfile, email);

    setRefreshCookie(res, rawRefreshToken);

    // Redirect frontend with token + flag
    const redirectUrl = `${env.FRONTEND_URL}/auth/google/success?token=${encodeURIComponent(accessToken)}&new_user=${isNewUser}`;
    return res.redirect(redirectUrl);
  } catch (err) {
    const redirectUrl = `${env.FRONTEND_URL}/login?error=${encodeURIComponent(err.message)}`;
    return res.redirect(redirectUrl);
  }
};

// POST /auth/complete-registration
const completeRegistration = async (req, res, next) => {
  try {
    const { user } = await authService.completeRegistration(req.user.id, req.body);
    return success(res, { user }, 'Registration completed');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  googleCallback,
  completeRegistration,
};

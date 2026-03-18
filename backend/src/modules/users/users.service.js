'use strict';

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { User, Role } = require('../../models');
const { AppError } = require('../../utils/errors');
const { Op } = require('sequelize');

// ─── helpers ──────────────────────────────────────────────────────────────────

const generatePassword = () =>
  crypto.randomBytes(9).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 12).padEnd(12, 'x');

const safeUser = (user) => {
  const obj = user.toJSON ? user.toJSON() : { ...user };
  delete obj.password_hash;
  return obj;
};

// ─── listUsers ────────────────────────────────────────────────────────────────

const listUsers = async ({ role, is_active, page = 1, limit = 20 } = {}) => {
  const offset = (page - 1) * limit;
  const where = {};

  if (is_active !== undefined && is_active !== null && is_active !== '') {
    where.is_active = is_active === true || is_active === 'true';
  }

  const roleWhere = {};
  if (role && role !== 'all') {
    roleWhere.name = role;
  }

  const { rows: users, count: total } = await User.findAndCountAll({
    where,
    include: [{ model: Role, as: 'role', where: Object.keys(roleWhere).length ? roleWhere : undefined }],
    attributes: { exclude: ['password_hash'] },
    order: [['created_at', 'DESC']],
    limit: parseInt(limit),
    offset,
  });

  return {
    users: users.map(safeUser),
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    total_pages: Math.ceil(total / limit),
  };
};

// ─── toggleUserStatus ─────────────────────────────────────────────────────────

const toggleUserStatus = async (id, is_active) => {
  const user = await User.findByPk(id, { include: [{ model: Role, as: 'role' }] });
  if (!user) throw new AppError('User not found.', 404, 'NOT_FOUND');
  await user.update({ is_active });
  return safeUser(user);
};

// ─── createUser ───────────────────────────────────────────────────────────────

const createUser = async ({ first_name, last_name, email, role: roleName }) => {
  if (!first_name || !last_name || !email || !roleName) {
    throw new AppError('first_name, last_name, email, and role are required.', 400, 'VALIDATION_ERROR');
  }

  const roleRecord = await Role.findOne({ where: { name: roleName } });
  if (!roleRecord) throw new AppError(`Role "${roleName}" not found.`, 400, 'VALIDATION_ERROR');

  const existing = await User.findOne({ where: { email } });
  if (existing) throw new AppError('A user with this email already exists.', 409, 'CONFLICT');

  const generated_password = generatePassword();
  const password_hash = await bcrypt.hash(generated_password, 12);

  const user = await User.create({
    first_name,
    last_name,
    email,
    role_id: roleRecord.id,
    password_hash,
    is_active: true,
    is_email_verified: true,
    registration_completed: true,
  });

  const userWithRole = await User.findByPk(user.id, {
    include: [{ model: Role, as: 'role' }],
    attributes: { exclude: ['password_hash'] },
  });

  return { user: safeUser(userWithRole), generated_password };
};

// ─── resetPassword ────────────────────────────────────────────────────────────

const resetPassword = async (id) => {
  const user = await User.findByPk(id);
  if (!user) throw new AppError('User not found.', 404, 'NOT_FOUND');

  const generated_password = generatePassword();
  const password_hash = await bcrypt.hash(generated_password, 12);

  await user.update({ password_hash });

  return { generated_password };
};

module.exports = { listUsers, toggleUserStatus, createUser, resetPassword };

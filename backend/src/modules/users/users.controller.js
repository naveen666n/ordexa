'use strict';

const usersService = require('./users.service');
const { success } = require('../../utils/response');

const listUsers = async (req, res, next) => {
  try {
    const { role, is_active, page = 1, limit = 20 } = req.query;
    const result = await usersService.listUsers({ role, is_active, page, limit });
    return success(res, result);
  } catch (err) { next(err); }
};

const createUser = async (req, res, next) => {
  try {
    const { first_name, last_name, email, role } = req.body;
    const result = await usersService.createUser({ first_name, last_name, email, role });
    return success(res, result, 'User created successfully', 201);
  } catch (err) { next(err); }
};

const toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    const user = await usersService.toggleUserStatus(id, is_active);
    return success(res, { user }, 'User status updated');
  } catch (err) { next(err); }
};

const resetPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await usersService.resetPassword(id);
    return success(res, result, 'Password reset successfully');
  } catch (err) { next(err); }
};

module.exports = { listUsers, createUser, toggleUserStatus, resetPassword };

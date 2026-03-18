'use strict';

const router = require('express').Router();
const controller = require('./users.controller');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');
const auditLog = require('../../middleware/auditLog');

router.use(authenticate, requireRole('admin'));

router.get('/', controller.listUsers);
router.post('/', auditLog('USER_CREATE', 'user'), controller.createUser);
router.patch('/:id/status', auditLog('USER_STATUS_TOGGLE', 'user'), controller.toggleUserStatus);
router.post('/:id/reset-password', auditLog('USER_PASSWORD_RESET', 'user'), controller.resetPassword);

module.exports = router;

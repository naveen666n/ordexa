'use strict';

const router = require('express').Router();
const configService = require('./config.service');
const featureFlagsService = require('./feature-flags.service');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');
const { success } = require('../../utils/response');
const SiteConfig = require('../../models/SiteConfig');
const emailProvider = require('../notifications/email/email.provider');
const smsProvider = require('../notifications/sms/sms.provider');
const auditLog = require('../../middleware/auditLog');
const { clearProviderCache } = require('../storage/storage.service');

// ─── Public route ─────────────────────────────────────────────────────────────
// GET /api/v1/config/public
router.get('/config/public', async (req, res, next) => {
  try {
    const config = await configService.getPublicConfig();
    success(res, config);
  } catch (err) {
    next(err);
  }
});

// ─── Admin routes — all require admin auth ─────────────────────────────────────

// GET /api/v1/admin/config/feature-flags
router.get('/admin/config/feature-flags', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const flags = await featureFlagsService.getAll();
    success(res, flags);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/admin/config/feature-flags/:key
router.patch('/admin/config/feature-flags/:key', authenticate, requireRole('admin'), auditLog('FEATURE_FLAG_TOGGLE', 'feature_flag'), async (req, res, next) => {
  try {
    const flag = await featureFlagsService.toggleFlag(req.params.key, req.body.enabled);
    success(res, flag);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/admin/config/test-email
router.post('/admin/config/test-email', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const recipientEmail = req.user.email;
    try {
      await emailProvider.send(
        recipientEmail,
        'Test Email from Store',
        '<p>This is a test email from your store notification system.</p>'
      );
      success(res, { sent: true, message: `Test email sent to ${recipientEmail}` });
    } catch (mailErr) {
      success(res, { sent: false, message: `Email failed: ${mailErr.message}` });
    }
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/admin/config/test-sms
router.post('/admin/config/test-sms', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    await smsProvider.send(req.user.phone || 'admin', 'This is a test SMS from your store notification system.');
    success(res, { sent: true, message: 'SMS test logged — SMS integration not yet implemented.' });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/admin/config/:group
router.get('/admin/config/:group', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const data = await configService.getGroupRaw(req.params.group);
    success(res, data);
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/admin/config/:group
router.put('/admin/config/:group', authenticate, requireRole('admin'), auditLog('CONFIG_UPDATE', 'config'), async (req, res, next) => {
  try {
    await configService.updateGroup(req.params.group, req.body);
    // Clear storage provider cache whenever any config group is saved so the next
    // upload picks up new provider settings immediately.
    if (req.params.group === 'storage') clearProviderCache();
    const updated = await configService.getGroupRaw(req.params.group);
    success(res, updated, 'Configuration saved successfully');
  } catch (err) {
    next(err);
  }
});

module.exports = router;

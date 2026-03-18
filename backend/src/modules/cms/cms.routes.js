'use strict';

const router = require('express').Router();
const cmsService = require('./cms.service');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');
const { success } = require('../../utils/response');

// ─── Public route ─────────────────────────────────────────────────────────────
// GET /api/v1/cms/:section
router.get('/cms/:section', async (req, res, next) => {
  try {
    const data = await cmsService.getSection(req.params.section);
    success(res, data);
  } catch (err) {
    next(err);
  }
});

// ─── Admin routes ─────────────────────────────────────────────────────────────
// GET /api/v1/admin/cms  — all sections
router.get('/admin/cms', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const data = await cmsService.getAllSections();
    success(res, data);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/admin/cms/:section
router.get('/admin/cms/:section', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const data = await cmsService.getSection(req.params.section);
    success(res, data);
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/admin/cms/:section
router.put('/admin/cms/:section', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    await cmsService.updateSection(req.params.section, req.body);
    const updated = await cmsService.getSection(req.params.section);
    success(res, updated, 'CMS content saved successfully');
  } catch (err) {
    next(err);
  }
});

module.exports = router;

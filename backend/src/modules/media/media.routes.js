'use strict';

const router = require('express').Router();
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');
const { uploadMiddleware, uploadFile } = require('../storage/storage.service');
const { success, businessError } = require('../../utils/response');

// POST /api/v1/admin/media/upload
// Generic single-image upload. Returns { url } compatible with any image field
// in CMS, config, or category create forms.
router.post(
  '/admin/media/upload',
  authenticate,
  requireRole('admin'),
  uploadMiddleware,
  async (req, res, next) => {
    try {
      if (!req.file) return businessError(res, 'No file provided');
      const url = await uploadFile(req.file);
      return success(res, { url });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;

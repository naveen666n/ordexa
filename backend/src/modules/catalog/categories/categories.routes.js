const express = require('express');
const router = express.Router();
const controller = require('./categories.controller');
const authenticate = require('../../../middleware/authenticate');
const requireRole = require('../../../middleware/requireRole');
const validation = require('./categories.validation');
const { uploadMiddleware } = require('../../storage/storage.service');

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    const { validationError } = require('../../../utils/response');
    return validationError(res, error.details.map((d) => ({ field: d.context.key, message: d.message })));
  }
  req.body = value;
  next();
};

// ─── Public routes ────────────────────────────────────────────────────────────
router.get('/', controller.getTree);
router.get('/:slug/filters', controller.getFilters);
router.get('/:slug', controller.getBySlug);

// ─── Admin routes ─────────────────────────────────────────────────────────────
router.get('/admin/list', authenticate, requireRole('admin'), controller.getAll);
router.post('/admin', authenticate, requireRole('admin'), validate(validation.create), controller.create);
router.put('/admin/:id', authenticate, requireRole('admin'), validate(validation.update), controller.update);
router.delete('/admin/:id', authenticate, requireRole('admin'), controller.destroy);
router.post('/admin/:id/image', authenticate, requireRole('admin'), uploadMiddleware, controller.uploadImage);

module.exports = router;

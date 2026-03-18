const express = require('express');
const router = express.Router();
const controller = require('./products.controller');
const authenticate = require('../../../middleware/authenticate');
const requireRole = require('../../../middleware/requireRole');
const validation = require('./products.validation');
const { uploadMiddleware } = require('../../storage/storage.service');

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const { validationError } = require('../../../utils/response');
    return validationError(res, error.details.map((d) => ({ field: d.context.key, message: d.message })));
  }
  req.body = value;
  next();
};

// ─── Public routes ────────────────────────────────────────────────────────────
router.get('/search', controller.search);
router.get('/:slug', controller.getBySlug);
router.get('/', controller.getProducts);

module.exports = router;

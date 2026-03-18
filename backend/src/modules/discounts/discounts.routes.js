'use strict';

const router = require('express').Router();
const controller = require('./discounts.controller');
const validation = require('./discounts.validation');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details: error.details },
    });
  }
  next();
};

// All discount admin routes require admin role
router.use(authenticate, requireRole('admin'));

// ─── Discount Codes ───────────────────────────────────────────────────────────
router.get('/discount-codes', controller.listDiscountCodes);
router.get('/discount-codes/:id', controller.getDiscountCode);
router.post('/discount-codes', validate(validation.createDiscountCode), controller.createDiscountCode);
router.put('/discount-codes/:id', validate(validation.updateDiscountCode), controller.updateDiscountCode);
router.delete('/discount-codes/:id', controller.deleteDiscountCode);

// ─── Global Offers ────────────────────────────────────────────────────────────
router.get('/global-offers', controller.listGlobalOffers);
router.get('/global-offers/:id', controller.getGlobalOffer);
router.post('/global-offers', validate(validation.createGlobalOffer), controller.createGlobalOffer);
router.put('/global-offers/:id', validate(validation.updateGlobalOffer), controller.updateGlobalOffer);
router.delete('/global-offers/:id', controller.deleteGlobalOffer);
router.patch('/global-offers/:id/activate', controller.activateGlobalOffer);

module.exports = router;

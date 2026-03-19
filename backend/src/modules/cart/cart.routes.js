'use strict';

const router = require('express').Router();
const Joi = require('joi');
const controller = require('./cart.controller');
const authenticate = require('../../middleware/authenticate');

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

const addItemSchema = Joi.object({
  variant_id: Joi.number().integer().min(1).required(),
  quantity: Joi.number().integer().min(1).default(1),
});

const updateItemSchema = Joi.object({
  quantity: Joi.number().integer().min(0).required(),
});

const applyCouponSchema = Joi.object({
  code: Joi.string().trim().uppercase().required(),
});

const summarySchema = Joi.object({
  region: Joi.string().max(10).optional().allow(null, ''),
});

// All cart routes require authentication
router.use(authenticate);

router.get('/', controller.getCart);
router.get('/available-coupons', controller.getAvailableCoupons);
router.post('/items', validate(addItemSchema), controller.addItem);
router.put('/items/:variantId', validate(updateItemSchema), controller.updateItem);
router.delete('/items/:variantId', controller.removeItem);
router.delete('/', controller.clearCart);
router.post('/apply-coupon', validate(applyCouponSchema), controller.applyCoupon);
router.delete('/remove-coupon', controller.removeCoupon);
router.post('/summary', validate(summarySchema), controller.getCartSummary);

module.exports = router;

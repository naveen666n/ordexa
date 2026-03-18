'use strict';

const router = require('express').Router();
const Joi = require('joi');
const controller = require('./orders.controller');
const paymentController = require('../payments/payments.controller');
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

const createOrderSchema = Joi.object({
  address_id: Joi.number().integer().min(1).optional().allow(null),
  coupon_code: Joi.string().trim().uppercase().optional().allow(null, ''),
  notes: Joi.string().max(500).optional().allow(null, ''),
});

// All customer order routes require authentication
router.use(authenticate);

router.post('/', validate(createOrderSchema), controller.createOrder);
router.get('/', controller.listOrders);
router.get('/:orderNumber', controller.getOrder);
router.post('/:orderNumber/cancel', controller.cancelOrder);
router.get('/:orderNumber/payment', paymentController.getPaymentStatus);

module.exports = router;

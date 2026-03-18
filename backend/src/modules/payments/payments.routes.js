'use strict';

const router = require('express').Router();
const controller = require('./payments.controller');
const authenticate = require('../../middleware/authenticate');
const env = require('../../config/env');

// POST /api/v1/payments/verify — customer verifies after Razorpay modal closes
router.post('/verify', authenticate, controller.verifyPayment);

// POST /api/v1/payments/webhook/razorpay — Razorpay webhook (no auth)
// Raw body captured via express.json() verify callback in app.js
router.post('/webhook/razorpay', controller.razorpayWebhook);

// POST /api/v1/payments/mock/confirm — simulate payment capture (dev / test / UAT only)
// Guarded: only available when PAYMENT_GATEWAY=mock AND not in production
const mockGuard = (req, res, next) => {
  if (env.PAYMENT_GATEWAY !== 'mock' || env.NODE_ENV === 'production') {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Route not found' },
    });
  }
  next();
};

router.post('/mock/confirm', mockGuard, authenticate, controller.mockConfirm);

module.exports = router;

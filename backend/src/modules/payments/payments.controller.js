'use strict';

const paymentService = require('./payment.service');
const { success } = require('../../utils/response');
const { AppError } = require('../../utils/errors');
const env = require('../../config/env');

// POST /api/v1/payments/verify
const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new AppError('Missing payment verification fields.', 400, 'VALIDATION_ERROR');
    }
    const result = await paymentService.verifyPayment(
      { razorpay_order_id, razorpay_payment_id, razorpay_signature },
      req.user.id
    );
    return success(res, result, 'Payment verified');
  } catch (err) { next(err); }
};

// POST /api/v1/payments/mock/confirm
// Only available when PAYMENT_GATEWAY=mock — blocked in production by route guard
const mockConfirm = async (req, res, next) => {
  try {
    const { gateway_order_id } = req.body;
    if (!gateway_order_id) {
      throw new AppError('gateway_order_id is required.', 400, 'VALIDATION_ERROR');
    }
    const result = await paymentService.mockConfirm(gateway_order_id, req.user?.id);
    return success(res, result, 'Mock payment confirmed — order marked as paid');
  } catch (err) { next(err); }
};

// POST /api/v1/payments/webhook/razorpay  (no auth — raw body)
const razorpayWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    // req.rawBody set by express.json() verify callback in app.js
    const rawBody = req.rawBody || '';

    const { getGateway } = require('./gateways/gateway.factory');
    const gateway = getGateway();
    const valid = gateway.handleWebhook(rawBody, signature);
    if (!valid) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_SIGNATURE', message: 'Webhook signature invalid' } });
    }

    // Parse body — either already parsed by express.json() or parse manually
    const payload = req.body && typeof req.body === 'object' ? req.body : JSON.parse(rawBody);
    await paymentService.handleWebhookEvent(payload.event, payload);

    return res.status(200).json({ success: true });
  } catch (err) {
    // Always return 200 to Razorpay to avoid retries on internal errors
    console.error('[Webhook Error]', err.message);
    return res.status(200).json({ success: true });
  }
};

// GET /api/v1/orders/:orderNumber/payment
const getPaymentStatus = async (req, res, next) => {
  try {
    const result = await paymentService.getPaymentForOrder(req.params.orderNumber, req.user.id);
    return success(res, result);
  } catch (err) { next(err); }
};

// POST /api/v1/admin/payments/:id/refund
const refundPayment = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const result = await paymentService.processRefund(req.params.id, amount);
    return success(res, result, 'Refund initiated');
  } catch (err) { next(err); }
};

// POST /api/v1/payments/mock/refund — simulate refund via mock gateway (dev/test only)
// Body: { payment_id } — internal Payment table ID
const mockRefund = async (req, res, next) => {
  try {
    const { payment_id, amount } = req.body;
    if (!payment_id) {
      throw new AppError('payment_id is required.', 400, 'VALIDATION_ERROR');
    }
    const result = await paymentService.processRefund(payment_id, amount);
    return success(res, result, 'Mock refund processed');
  } catch (err) { next(err); }
};

module.exports = { verifyPayment, razorpayWebhook, getPaymentStatus, refundPayment, mockConfirm, mockRefund };

'use strict';

const { Payment, Order, OrderStatusHistory } = require('../../models');
const { getGateway } = require('./gateways/gateway.factory');
const { validateTransition } = require('../orders/status.validator');
const { AppError } = require('../../utils/errors');

// ─── initiatePayment ──────────────────────────────────────────────────────────

/**
 * Creates a gateway order and records a Payment row in "initiated" status.
 * Returns initiation data to send back to the frontend.
 */
const initiatePayment = async (order) => {
  const gateway = getGateway();
  const initData = await gateway.initiatePayment(order);

  await Payment.create({
    order_id: order.id,
    gateway: 'razorpay',
    gateway_order_id: initData.gateway_order_id,
    amount: order.total_amount,
    currency: initData.currency,
    status: 'initiated',
  });

  return initData;
};

// ─── verifyPayment ────────────────────────────────────────────────────────────

/**
 * Called by the frontend after the Razorpay modal completes successfully.
 * Re-verifies the signature server-side, updates payment + order status.
 */
const verifyPayment = async ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }, userId) => {
  const gateway = getGateway();

  // 1. Signature check
  const valid = gateway.verifyPayment({ razorpay_order_id, razorpay_payment_id, razorpay_signature });
  if (!valid) throw new AppError('Payment signature verification failed.', 400, 'INVALID_SIGNATURE');

  // 2. Find the payment record
  const payment = await Payment.findOne({ where: { gateway_order_id: razorpay_order_id } });
  if (!payment) throw new AppError('Payment record not found.', 404, 'NOT_FOUND');

  // Idempotency — already captured
  if (payment.status === 'captured') {
    const order = await Order.findByPk(payment.order_id);
    return { payment, order };
  }

  // 3. Update payment record
  await payment.update({
    gateway_payment_id: razorpay_payment_id,
    gateway_signature: razorpay_signature,
    status: 'captured',
  });

  // 4. Advance order to "paid"
  const order = await Order.findByPk(payment.order_id);
  if (order && order.status === 'pending') {
    await order.update({ status: 'paid' });
    await OrderStatusHistory.create({
      order_id: order.id,
      from_status: 'pending',
      to_status: 'paid',
      changed_by: userId || null,
      note: 'Payment captured via verify endpoint',
    });
  }

  return { payment, order };
};

// ─── handleWebhookEvent ───────────────────────────────────────────────────────

/**
 * Processes a verified Razorpay webhook event.
 * Called only after signature verification passes.
 */
const handleWebhookEvent = async (event, rawPayload) => {
  const { event: eventName, payload } = rawPayload;

  if (eventName === 'payment.captured') {
    const p = payload?.payment?.entity;
    if (!p) return;

    const payment = await Payment.findOne({ where: { gateway_order_id: p.order_id } });
    if (!payment) return; // unknown order — ignore

    // Idempotency: skip if already captured
    if (payment.status === 'captured') return;

    await payment.update({
      gateway_payment_id: p.id,
      status: 'captured',
      payment_method: p.method || null,
      raw_webhook_payload: rawPayload,
    });

    const order = await Order.findByPk(payment.order_id);
    if (order && order.status === 'pending') {
      await order.update({ status: 'paid' });
      await OrderStatusHistory.create({
        order_id: order.id,
        from_status: 'pending',
        to_status: 'paid',
        changed_by: null,
        note: 'Payment captured via webhook',
      });
    }
  }

  if (eventName === 'payment.failed') {
    const p = payload?.payment?.entity;
    if (!p) return;

    const payment = await Payment.findOne({ where: { gateway_order_id: p.order_id } });
    if (!payment || payment.status === 'captured') return;

    await payment.update({
      gateway_payment_id: p.id,
      status: 'failed',
      failure_reason: p.error_description || p.error_code || null,
      raw_webhook_payload: rawPayload,
    });
    // Order stays PENDING so customer can retry
  }
};

// ─── getPaymentForOrder ───────────────────────────────────────────────────────

const getPaymentForOrder = async (orderNumber, userId = null) => {
  const where = { order_number: orderNumber };
  if (userId) where.user_id = userId;

  const order = await Order.findOne({ where });
  if (!order) throw new AppError('Order not found.', 404, 'NOT_FOUND');

  const payment = await Payment.findOne({ where: { order_id: order.id } });
  return { order, payment: payment || null };
};

// ─── processRefund ────────────────────────────────────────────────────────────

const processRefund = async (paymentId, amount) => {
  const payment = await Payment.findByPk(paymentId);
  if (!payment) throw new AppError('Payment not found.', 404, 'NOT_FOUND');
  if (payment.status !== 'captured') throw new AppError('Only captured payments can be refunded.', 400, 'INVALID_STATUS');

  const gateway = getGateway();
  const refundAmount = amount || Number(payment.amount);
  const refundResult = await gateway.processRefund(payment.gateway_payment_id, refundAmount);

  const isPartial = refundAmount < Number(payment.amount);
  await payment.update({
    status: isPartial ? 'partially_refunded' : 'refunded',
    refund_amount: refundAmount,
  });

  const order = await Order.findByPk(payment.order_id);
  if (order && !isPartial) {
    // Full refund — no status change needed (order already handled by cancel flow)
  }

  return { payment, refundResult };
};

// ─── mockConfirm ──────────────────────────────────────────────────────────────

/**
 * Simulates a successful payment capture without any real gateway call.
 * Only accessible when PAYMENT_GATEWAY=mock (enforced by the route layer).
 *
 * Generates a deterministic mock_pay_<id> payment ID, marks the payment
 * as captured, and advances the order from pending → paid.
 */
const mockConfirm = async (gatewayOrderId, userId = null) => {
  const payment = await Payment.findOne({ where: { gateway_order_id: gatewayOrderId } });
  if (!payment) throw new AppError('Payment record not found for this gateway_order_id.', 404, 'NOT_FOUND');

  if (payment.status === 'captured') {
    const order = await Order.findByPk(payment.order_id);
    return { payment, order };
  }

  const mockPaymentId = `mock_pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const mockSignature = `mock_sig_${Date.now()}`;

  await payment.update({
    gateway_payment_id: mockPaymentId,
    gateway_signature: mockSignature,
    status: 'captured',
    payment_method: 'mock',
  });

  const order = await Order.findByPk(payment.order_id);
  if (order && order.status === 'pending') {
    await order.update({ status: 'paid' });
    await OrderStatusHistory.create({
      order_id: order.id,
      from_status: 'pending',
      to_status: 'paid',
      changed_by: userId || null,
      note: 'Payment captured via mock gateway',
    });
  }

  return { payment, order };
};

module.exports = {
  initiatePayment,
  verifyPayment,
  handleWebhookEvent,
  getPaymentForOrder,
  processRefund,
  mockConfirm,
};

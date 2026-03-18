'use strict';

const crypto = require('crypto');

// Prevent actual Razorpay SDK initialization
jest.mock('razorpay', () => jest.fn().mockImplementation(() => ({ orders: {}, payments: {} })));

// Module exports a singleton instance
const gateway = require('../../src/modules/payments/gateways/razorpay.gateway');

const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret';
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'webhook_secret';

const makeSignature = (body, secret) =>
  crypto.createHmac('sha256', secret).update(body).digest('hex');

describe('RazorpayGateway.verifyPayment', () => {
  test('valid signature returns true', () => {
    const orderId = 'order_abc123';
    const paymentId = 'pay_xyz789';
    const body = `${orderId}|${paymentId}`;
    const sig = makeSignature(body, KEY_SECRET);

    expect(gateway.verifyPayment({
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: sig,
    })).toBe(true);
  });

  test('invalid signature returns false', () => {
    expect(gateway.verifyPayment({
      razorpay_order_id: 'order_abc123',
      razorpay_payment_id: 'pay_xyz789',
      razorpay_signature: 'invalid_signature',
    })).toBe(false);
  });

  test('wrong order_id makes signature invalid', () => {
    const paymentId = 'pay_xyz789';
    const sig = makeSignature('order_correct|pay_xyz789', KEY_SECRET);

    expect(gateway.verifyPayment({
      razorpay_order_id: 'order_wrong',
      razorpay_payment_id: paymentId,
      razorpay_signature: sig,
    })).toBe(false);
  });
});

describe('RazorpayGateway.handleWebhook', () => {
  test('valid webhook signature returns true', () => {
    const rawBody = JSON.stringify({ event: 'payment.captured' });
    const sig = makeSignature(rawBody, WEBHOOK_SECRET);
    expect(gateway.handleWebhook(rawBody, sig)).toBe(true);
  });

  test('invalid webhook signature returns false', () => {
    const rawBody = JSON.stringify({ event: 'payment.captured' });
    expect(gateway.handleWebhook(rawBody, 'bad_signature')).toBe(false);
  });
});

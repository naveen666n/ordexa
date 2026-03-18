'use strict';

const Razorpay = require('razorpay');
const crypto = require('crypto');
const env = require('../../../config/env');
const { PaymentGateway } = require('./gateway.interface');

class RazorpayGateway extends PaymentGateway {
  constructor() {
    super();
    this._client = null;
  }

  _getClient() {
    if (!this._client) {
      this._client = new Razorpay({
        key_id: env.RAZORPAY_KEY_ID,
        key_secret: env.RAZORPAY_KEY_SECRET,
      });
    }
    return this._client;
  }

  /**
   * Create a Razorpay order and return initiation data for the frontend.
   * Amount is converted to paise (smallest currency unit).
   */
  async initiatePayment(order) {
    const client = this._getClient();
    const amountPaise = Math.round(Number(order.total_amount) * 100);

    const razorpayOrder = await client.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: order.order_number,
      notes: {
        order_id: String(order.id),
        order_number: order.order_number,
      },
    });

    return {
      gateway_order_id: razorpayOrder.id,
      amount: amountPaise,
      currency: razorpayOrder.currency,
      key_id: env.RAZORPAY_KEY_ID,
    };
  }

  /**
   * Verify payment signature after Razorpay checkout success.
   * Signature = HMAC-SHA256(razorpay_order_id + "|" + razorpay_payment_id, key_secret)
   */
  verifyPayment({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');
    return expected === razorpay_signature;
  }

  /**
   * Initiate a refund for a captured payment.
   */
  async processRefund(gatewayPaymentId, amount) {
    const client = this._getClient();
    const amountPaise = Math.round(Number(amount) * 100);
    return client.payments.refund(gatewayPaymentId, { amount: amountPaise });
  }

  /**
   * Verify Razorpay webhook signature using HMAC-SHA256.
   * rawBody must be the raw request body string.
   */
  handleWebhook(rawBody, signature) {
    if (!env.RAZORPAY_WEBHOOK_SECRET) return true; // skip if not configured
    const expected = crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');
    return expected === signature;
  }
}

module.exports = new RazorpayGateway();

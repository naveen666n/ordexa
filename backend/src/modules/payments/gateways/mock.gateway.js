'use strict';

const crypto = require('crypto');
const { PaymentGateway } = require('./gateway.interface');

/**
 * MockGateway — drop-in replacement for RazorpayGateway.
 *
 * Use when PAYMENT_GATEWAY=mock (default for development, test, and UAT).
 * No real credentials required. Generates deterministic fake IDs.
 *
 * Frontend flow when key_id === 'mock':
 *   Instead of opening the Razorpay modal, the UI shows a "Simulate Payment" button.
 *   Clicking it calls POST /api/v1/payments/mock/confirm with { gateway_order_id }.
 *   That endpoint advances the order to 'paid' — the same state a real webhook would produce.
 */
class MockGateway extends PaymentGateway {

  /**
   * Returns fake initiation data. The sentinel key_id 'mock' lets the
   * frontend know to render the simulation UI instead of the real modal.
   */
  async initiatePayment(order) {
    const gateway_order_id = `mock_order_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    return {
      gateway_order_id,
      amount: Math.round(Number(order.total_amount) * 100), // paise
      currency: 'INR',
      key_id: 'mock', // sentinel value for the frontend
    };
  }

  /**
   * Accepts any payment_id that starts with 'mock_pay_'.
   * Signature is ignored — always valid in mock mode.
   */
  verifyPayment({ razorpay_order_id, razorpay_payment_id }) {
    return typeof razorpay_payment_id === 'string' && razorpay_payment_id.startsWith('mock_pay_');
  }

  /**
   * Returns a fake refund object without touching any external API.
   */
  async processRefund(gatewayPaymentId, amount) {
    return {
      id: `mock_refund_${Date.now()}`,
      payment_id: gatewayPaymentId,
      amount: Math.round(Number(amount) * 100),
      currency: 'INR',
      status: 'processed',
    };
  }

  /**
   * Webhook signature verification is skipped in mock mode — always valid.
   */
  handleWebhook(rawBody, signature) {
    return true;
  }
}

module.exports = new MockGateway();

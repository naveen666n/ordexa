'use strict';

/**
 * PaymentGateway interface contract.
 * All gateway implementations must provide these methods.
 *
 * initiatePayment(order)
 *   @param {Object} order  — Sequelize Order instance
 *   @returns {Promise<{ gateway_order_id, amount, currency, key_id }>}
 *
 * verifyPayment(payload)
 *   @param {Object} payload  — { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 *   @returns {boolean}  — true if signature is valid
 *
 * processRefund(gatewayPaymentId, amount)
 *   @param {string} gatewayPaymentId
 *   @param {number} amount  — amount in rupees (converted to paise internally)
 *   @returns {Promise<Object>}  — gateway refund response
 *
 * handleWebhook(rawBody, signature)
 *   @param {string} rawBody  — raw request body string
 *   @param {string} signature  — value of X-Razorpay-Signature header
 *   @returns {boolean}  — true if signature is valid
 */

class PaymentGateway {
  async initiatePayment(order) { throw new Error('Not implemented'); }
  verifyPayment(payload) { throw new Error('Not implemented'); }
  async processRefund(gatewayPaymentId, amount) { throw new Error('Not implemented'); }
  handleWebhook(rawBody, signature) { throw new Error('Not implemented'); }
}

module.exports = { PaymentGateway };

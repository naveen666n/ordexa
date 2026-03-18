'use strict';

const env = require('../../../config/env');

const GATEWAYS = {
  mock:     () => require('./mock.gateway'),
  razorpay: () => require('./razorpay.gateway'),
};

/**
 * Returns the active payment gateway instance.
 * Controlled by PAYMENT_GATEWAY env variable ('mock' | 'razorpay').
 *
 * In S15, this will also check the configurations table so admins can
 * switch gateways at runtime without redeploying.
 */
const getGateway = () => {
  const name = env.PAYMENT_GATEWAY || 'mock';
  const loader = GATEWAYS[name];
  if (!loader) throw new Error(`Unknown payment gateway: "${name}". Valid options: ${Object.keys(GATEWAYS).join(', ')}`);
  return loader();
};

module.exports = { getGateway };

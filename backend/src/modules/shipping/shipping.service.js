'use strict';

const flatRate = require('./strategies/flat-rate.strategy');

/**
 * Calculate shipping for a cart.
 * @param {number} subtotal — subtotal after item-level discounts
 * @param {boolean} couponFreeShipping — whether an applied coupon grants free shipping
 * @returns {number} shipping amount
 */
const calculate = async (subtotal, couponFreeShipping = false) => {
  return flatRate.calculate(subtotal, couponFreeShipping);
};

module.exports = { calculate };

'use strict';

const { ShippingRule } = require('../../../models');

/**
 * Flat rate shipping strategy.
 * Reads the active shipping_rule with strategy='flat_rate'.
 * Config shape: { amount: number, free_above?: number }
 *   amount      — flat shipping charge
 *   free_above  — order subtotal above which shipping is free (optional)
 *
 * @param {number} subtotal — cart subtotal after item discounts
 * @param {boolean} couponFreeShipping — true if coupon grants free shipping
 * @returns {number} shipping amount
 */
const calculate = async (subtotal, couponFreeShipping = false) => {
  if (couponFreeShipping) return 0;

  const rule = await ShippingRule.findOne({
    where: { strategy: 'flat_rate', is_active: true },
    order: [['id', 'ASC']],
  });

  if (!rule) return 0;

  const { amount = 0, free_above = null } = rule.config || {};

  if (free_above !== null && subtotal >= Number(free_above)) return 0;

  return Number(amount);
};

module.exports = { calculate };

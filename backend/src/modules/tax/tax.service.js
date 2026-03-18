'use strict';

const { TaxRule } = require('../../models');
const { Op } = require('sequelize');

/**
 * Calculate tax for cart items.
 *
 * Matching priority per item:
 *   1. Rule with matching region AND category_slug
 *   2. Rule with matching category_slug (any region)
 *   3. Rule with matching region (any category)
 *   4. Global catch-all rule (both null)
 *
 * Tax is applied on (item line total after offer discount).
 *
 * @param {Array}  cartItems  — array of { subtotal_after_discount, category_slug }
 * @param {string} region     — buyer region code (optional, e.g. 'MH', 'IN')
 * @returns {number} total tax amount
 */
const calculate = async (cartItems, region = null) => {
  if (!cartItems || cartItems.length === 0) return 0;

  // Fetch all active tax rules once
  const rules = await TaxRule.findAll({ where: { is_active: true } });

  let totalTax = 0;

  for (const item of cartItems) {
    const lineAmount = item.subtotal_after_discount || 0;
    const catSlug = item.category_slug || null;

    // Find best matching rule
    const rule =
      rules.find((r) => r.region === region && r.category_slug === catSlug) ||
      rules.find((r) => r.region === null && r.category_slug === catSlug) ||
      rules.find((r) => r.region === region && r.category_slug === null) ||
      rules.find((r) => r.region === null && r.category_slug === null) ||
      null;

    if (rule) {
      totalTax += Math.round(lineAmount * (Number(rule.rate) / 100) * 100) / 100;
    }
  }

  return Math.round(totalTax * 100) / 100;
};

module.exports = { calculate };

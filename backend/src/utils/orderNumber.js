'use strict';

const { Order } = require('../models');

/**
 * Generates a sequential order number in the format ORD-YYYY-XXXXX.
 * Uses the count of existing orders to determine the sequence.
 * Wrapped in a passed transaction for atomicity.
 */
const generateOrderNumber = async (transaction) => {
  const year = new Date().getFullYear();
  const count = await Order.count({ transaction });
  const seq = String(count + 1).padStart(5, '0');
  return `ORD-${year}-${seq}`;
};

module.exports = { generateOrderNumber };

'use strict';

const { DiscountCode, DiscountCodeUsage } = require('../../models');
const { Op } = require('sequelize');
const { AppError } = require('../../utils/errors');

// ─── Validate Coupon ──────────────────────────────────────────────────────────

/**
 * Validates a coupon code for a given user and cart subtotal.
 * Throws AppError if invalid.
 * Returns the DiscountCode record if valid.
 */
const validateCoupon = async (code, userId, cartSubtotal) => {
  const coupon = await DiscountCode.findOne({
    where: { code: code.toUpperCase(), is_active: true },
  });

  if (!coupon) {
    throw new AppError('Coupon code not found or inactive.', 400, 'INVALID_COUPON');
  }

  const n = new Date();
  if (coupon.starts_at && new Date(coupon.starts_at) > n) {
    throw new AppError('Coupon is not yet active.', 400, 'COUPON_NOT_ACTIVE');
  }
  if (coupon.ends_at && new Date(coupon.ends_at) < n) {
    throw new AppError('Coupon has expired.', 400, 'COUPON_EXPIRED');
  }

  // Global usage limit
  if (coupon.max_uses !== null && coupon.current_uses >= coupon.max_uses) {
    throw new AppError('Coupon usage limit reached.', 400, 'COUPON_LIMIT_REACHED');
  }

  // Min order value
  if (coupon.min_order_value && Number(cartSubtotal) < Number(coupon.min_order_value)) {
    throw new AppError(
      `Minimum order value of ₹${coupon.min_order_value} required.`,
      400,
      'COUPON_MIN_ORDER'
    );
  }

  // Per-user usage limit
  const userUses = await DiscountCodeUsage.count({
    where: { discount_code_id: coupon.id, user_id: userId },
  });
  if (userUses >= coupon.per_user_limit) {
    throw new AppError('You have already used this coupon.', 400, 'COUPON_USER_LIMIT');
  }

  return coupon;
};

// ─── Calculate Coupon Discount ────────────────────────────────────────────────

/**
 * Calculates the discount amount given a coupon and cart subtotal.
 * Also returns whether shipping is free.
 */
const calculateCouponDiscount = (coupon, cartSubtotal) => {
  if (!coupon) return { discount_amount: 0, free_shipping: false };

  switch (coupon.offer_type) {
    case 'PERCENT': {
      const rate = Number(coupon.discount_value) / 100;
      return {
        discount_amount: Math.round(cartSubtotal * rate * 100) / 100,
        free_shipping: false,
      };
    }
    case 'FIXED': {
      return {
        discount_amount: Math.min(Number(coupon.discount_value), cartSubtotal),
        free_shipping: false,
      };
    }
    case 'FREE_SHIPPING':
      return { discount_amount: 0, free_shipping: true };
    default:
      return { discount_amount: 0, free_shipping: false };
  }
};

// ─── Record Usage ─────────────────────────────────────────────────────────────

/**
 * Records coupon usage and increments current_uses.
 * Called when an order is placed.
 */
const recordUsage = async (couponId, userId, orderId = null) => {
  await Promise.all([
    DiscountCodeUsage.create({ discount_code_id: couponId, user_id: userId, order_id: orderId }),
    DiscountCode.increment('current_uses', { where: { id: couponId } }),
  ]);
};

module.exports = { validateCoupon, calculateCouponDiscount, recordUsage };

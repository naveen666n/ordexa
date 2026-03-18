'use strict';

jest.mock('../../src/models', () => ({
  DiscountCode: { findOne: jest.fn() },
  DiscountCodeUsage: { count: jest.fn(), create: jest.fn() },
}));

const { DiscountCode, DiscountCodeUsage } = require('../../src/models');
const { validateCoupon, calculateCouponDiscount } = require('../../src/modules/discounts/coupon.service');
const { AppError } = require('../../src/utils/errors');

const makeCoupon = (overrides = {}) => ({
  id: 1,
  code: 'SAVE10',
  offer_type: 'PERCENT',
  discount_value: 10,
  is_active: true,
  starts_at: null,
  ends_at: null,
  max_uses: null,
  current_uses: 0,
  per_user_limit: 1,
  min_order_value: null,
  ...overrides,
});

describe('validateCoupon', () => {
  const USER_ID = 42;
  const SUBTOTAL = 500;

  afterEach(() => jest.clearAllMocks());

  test('valid coupon returns coupon record', async () => {
    const coupon = makeCoupon();
    DiscountCode.findOne.mockResolvedValue(coupon);
    DiscountCodeUsage.count.mockResolvedValue(0);

    const result = await validateCoupon('SAVE10', USER_ID, SUBTOTAL);
    expect(result).toBe(coupon);
  });

  test('unknown code throws INVALID_COUPON', async () => {
    DiscountCode.findOne.mockResolvedValue(null);

    await expect(validateCoupon('BOGUS', USER_ID, SUBTOTAL))
      .rejects.toMatchObject({ code: 'INVALID_COUPON' });
  });

  test('expired coupon throws COUPON_EXPIRED', async () => {
    const coupon = makeCoupon({ ends_at: new Date(Date.now() - 1000) });
    DiscountCode.findOne.mockResolvedValue(coupon);

    await expect(validateCoupon('SAVE10', USER_ID, SUBTOTAL))
      .rejects.toMatchObject({ code: 'COUPON_EXPIRED' });
  });

  test('usage limit reached throws COUPON_LIMIT_REACHED', async () => {
    const coupon = makeCoupon({ max_uses: 100, current_uses: 100 });
    DiscountCode.findOne.mockResolvedValue(coupon);

    await expect(validateCoupon('SAVE10', USER_ID, SUBTOTAL))
      .rejects.toMatchObject({ code: 'COUPON_LIMIT_REACHED' });
  });

  test('per-user limit exceeded throws COUPON_USER_LIMIT', async () => {
    const coupon = makeCoupon({ per_user_limit: 1 });
    DiscountCode.findOne.mockResolvedValue(coupon);
    DiscountCodeUsage.count.mockResolvedValue(1); // already used once

    await expect(validateCoupon('SAVE10', USER_ID, SUBTOTAL))
      .rejects.toMatchObject({ code: 'COUPON_USER_LIMIT' });
  });

  test('min order value not met throws COUPON_MIN_ORDER', async () => {
    const coupon = makeCoupon({ min_order_value: 1000 });
    DiscountCode.findOne.mockResolvedValue(coupon);

    await expect(validateCoupon('SAVE10', USER_ID, 500))
      .rejects.toMatchObject({ code: 'COUPON_MIN_ORDER' });
  });
});

describe('calculateCouponDiscount', () => {
  test('PERCENT: 10% of ₹500 = ₹50', () => {
    const coupon = makeCoupon({ offer_type: 'PERCENT', discount_value: 10 });
    const result = calculateCouponDiscount(coupon, 500);
    expect(result.discount_amount).toBe(50);
    expect(result.free_shipping).toBe(false);
  });

  test('FIXED: ₹75 off ₹500', () => {
    const coupon = makeCoupon({ offer_type: 'FIXED', discount_value: 75 });
    const result = calculateCouponDiscount(coupon, 500);
    expect(result.discount_amount).toBe(75);
  });

  test('FIXED: capped at subtotal when discount > subtotal', () => {
    const coupon = makeCoupon({ offer_type: 'FIXED', discount_value: 600 });
    const result = calculateCouponDiscount(coupon, 500);
    expect(result.discount_amount).toBe(500);
  });

  test('FREE_SHIPPING: discount 0, free_shipping true', () => {
    const coupon = makeCoupon({ offer_type: 'FREE_SHIPPING' });
    const result = calculateCouponDiscount(coupon, 500);
    expect(result.discount_amount).toBe(0);
    expect(result.free_shipping).toBe(true);
  });

  test('null coupon → 0 discount, no free shipping', () => {
    const result = calculateCouponDiscount(null, 500);
    expect(result.discount_amount).toBe(0);
    expect(result.free_shipping).toBe(false);
  });
});

'use strict';

// ─── Mock all DB + service dependencies ───────────────────────────────────────

const mockTransaction = {
  commit: jest.fn(),
  rollback: jest.fn(),
};

jest.mock('../../src/models', () => ({
  sequelize: {
    transaction: jest.fn((fn) => fn(mockTransaction)),
  },
  Order: { create: jest.fn() },
  OrderItem: { bulkCreate: jest.fn() },
  OrderStatusHistory: { create: jest.fn() },
  ProductVariant: { decrement: jest.fn() },
  Address: { findOne: jest.fn() },
  User: {},
  Payment: {},
  Op: {},
}));

jest.mock('../../src/modules/notifications/notifications.service', () => ({
  sendOrderConfirmation: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../src/modules/payments/payment.service', () => ({
  initiatePayment: jest.fn().mockResolvedValue({ gateway_order_id: 'gw_123' }),
}));

jest.mock('../../src/modules/cart/cart.repository', () => ({
  findCartItems: jest.fn(),
  clearCart: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../src/modules/cart/cart.service', () => ({
  getCouponForUser: jest.fn().mockReturnValue(null),
  clearCouponStore: jest.fn(),
}));

jest.mock('../../src/modules/discounts/offer.engine', () => ({
  resolveOffer: jest.fn().mockResolvedValue({ offer: null, source: null, discount: 0 }),
}));

jest.mock('../../src/modules/discounts/coupon.service', () => ({
  validateCoupon: jest.fn(),
  calculateCouponDiscount: jest.fn().mockReturnValue({ discount_amount: 0, free_shipping: false }),
  recordUsage: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../src/modules/shipping/shipping.service', () => ({
  calculate: jest.fn().mockResolvedValue(0),
}));

jest.mock('../../src/modules/tax/tax.service', () => ({
  calculate: jest.fn().mockResolvedValue(0),
}));

jest.mock('../../src/utils/orderNumber', () => ({
  generateOrderNumber: jest.fn().mockResolvedValue('ORD-20260318-0001'),
}));

jest.mock('../../src/modules/orders/status.validator', () => ({
  validateTransition: jest.fn(),
  validateCancellable: jest.fn(),
}));

// ─── Load module under test after all mocks are set up ───────────────────────

const { createOrder } = require('../../src/modules/orders/orders.service');
const {
  sequelize,
  Order,
  OrderItem,
  OrderStatusHistory,
  ProductVariant,
  Address,
} = require('../../src/models');
const cartRepo = require('../../src/modules/cart/cart.repository');
const offerEngine = require('../../src/modules/discounts/offer.engine');
const couponService = require('../../src/modules/discounts/coupon.service');
const { AppError } = require('../../src/utils/errors');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeCartItem = (overrides = {}) => ({
  quantity: 2,
  variant: {
    id: 1,
    sku: 'TEST-001',
    name: 'Test Variant',
    price: 100,
    stock_quantity: 10,
    product: {
      id: 10,
      name: 'Test Product',
      images: [],
    },
    ...overrides.variant,
  },
  ...overrides,
});

const makeOrder = (overrides = {}) => ({
  id: 99,
  order_number: 'ORD-20260318-0001',
  status: 'pending',
  total_amount: 200,
  ...overrides,
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('createOrder', () => {
  const USER_ID = 1;

  beforeEach(() => {
    jest.clearAllMocks();

    // Default happy-path setup
    cartRepo.findCartItems.mockResolvedValue([makeCartItem()]);
    Address.findOne.mockResolvedValue(null);
    Order.create.mockResolvedValue(makeOrder());
    OrderItem.bulkCreate.mockResolvedValue([]);
    OrderStatusHistory.create.mockResolvedValue({});
    ProductVariant.decrement.mockResolvedValue([1]);

    // getOrderByNumber is called at the end — mock sequelize query helper indirectly
    // Since getOrderByNumber uses Order.findOne internally (via models), we just need
    // the function to not crash. Spy on the returned value.
    Order.findOne = jest.fn().mockResolvedValue({ ...makeOrder(), items: [] });
  });

  test('throws EMPTY_CART when cart has no items', async () => {
    cartRepo.findCartItems.mockResolvedValue([]);
    await expect(createOrder(USER_ID)).rejects.toMatchObject({ code: 'EMPTY_CART' });
  });

  test('throws INSUFFICIENT_STOCK when variant stock is less than qty', async () => {
    // INVENTORY_BLOCKING is true by default unless explicitly set false
    process.env.INVENTORY_BLOCKING_ENABLED = 'true';

    cartRepo.findCartItems.mockResolvedValue([
      makeCartItem({ quantity: 5, variant: { id: 1, sku: 'SKU-001', name: 'V1', price: 100, stock_quantity: 2, product: { id: 10, name: 'P', images: [] } } }),
    ]);

    await expect(createOrder(USER_ID)).rejects.toMatchObject({ code: 'INSUFFICIENT_STOCK' });
  });

  test('decrements stock for each order item on success', async () => {
    await createOrder(USER_ID);
    expect(ProductVariant.decrement).toHaveBeenCalledWith(
      'stock_quantity',
      expect.objectContaining({ by: 2, where: { id: 1 } })
    );
  });

  test('records coupon usage when valid coupon applied', async () => {
    const fakeCoupon = { id: 5, code: 'SAVE10' };
    couponService.validateCoupon.mockResolvedValue(fakeCoupon);
    couponService.calculateCouponDiscount.mockReturnValue({ discount_amount: 20, free_shipping: false });

    await createOrder(USER_ID, { coupon_code: 'SAVE10' });

    expect(couponService.recordUsage).toHaveBeenCalledWith(5, USER_ID, expect.any(Number));
  });

  test('clears cart after successful order creation', async () => {
    await createOrder(USER_ID);
    expect(cartRepo.clearCart).toHaveBeenCalledWith(USER_ID);
  });

  test('still creates order even if notification service throws', async () => {
    const notifs = require('../../src/modules/notifications/notifications.service');
    notifs.sendOrderConfirmation.mockRejectedValue(new Error('SMTP down'));

    await expect(createOrder(USER_ID)).resolves.toBeDefined();
  });
});

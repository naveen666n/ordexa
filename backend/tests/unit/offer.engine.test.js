'use strict';

// Mock DB models — offer engine only calls getActiveProductOffer / getActiveGlobalOffer
// which are themselves tested via resolveOffer. We mock those helpers to control behavior.
jest.mock('../../src/models', () => ({
  ProductOffer: { findOne: jest.fn() },
  GlobalOffer: { findOne: jest.fn() },
}));

const { ProductOffer, GlobalOffer } = require('../../src/models');
const { resolveOffer, calculateOfferDiscount } = require('../../src/modules/discounts/offer.engine');

const UNIT_PRICE = 100;
const QTY = 3;

const makeOffer = (overrides = {}) => ({
  offer_type: 'PERCENT',
  discount_value: 10,
  is_active: true,
  starts_at: null,
  ends_at: null,
  min_order_value: null,
  buy_quantity: null,
  get_quantity: null,
  precedence: 'best_deal',
  ...overrides,
});

describe('calculateOfferDiscount', () => {
  test('PERCENT: 10% off ₹100 × 3 = ₹30', () => {
    const offer = makeOffer({ offer_type: 'PERCENT', discount_value: 10 });
    expect(calculateOfferDiscount(offer, UNIT_PRICE, QTY)).toBe(30);
  });

  test('FIXED: ₹20 off × 3 = ₹60 (capped at ₹300 line)', () => {
    const offer = makeOffer({ offer_type: 'FIXED', discount_value: 20 });
    expect(calculateOfferDiscount(offer, UNIT_PRICE, QTY)).toBe(60);
  });

  test('FIXED: discount capped at line total', () => {
    const offer = makeOffer({ offer_type: 'FIXED', discount_value: 200 });
    expect(calculateOfferDiscount(offer, UNIT_PRICE, 1)).toBe(100); // capped at ₹100
  });

  test('BXGY: buy 2 get 1 with qty 3 → 1 free unit', () => {
    const offer = makeOffer({ offer_type: 'BXGY', buy_quantity: 2, get_quantity: 1 });
    // Math.floor(3 / (2+1)) = 1 set → 1 free unit at ₹100
    expect(calculateOfferDiscount(offer, UNIT_PRICE, QTY)).toBe(100);
  });

  test('expired offer returns 0', () => {
    const offer = makeOffer({ ends_at: new Date(Date.now() - 1000) }); // 1s ago
    expect(calculateOfferDiscount(offer, UNIT_PRICE, QTY)).toBe(0);
  });

  test('offer with unmet min_order_value returns 0', () => {
    const offer = makeOffer({ min_order_value: 500 }); // line total ₹300 < ₹500
    expect(calculateOfferDiscount(offer, UNIT_PRICE, QTY)).toBe(0);
  });

  test('null offer returns 0', () => {
    expect(calculateOfferDiscount(null, UNIT_PRICE, QTY)).toBe(0);
  });
});

describe('resolveOffer – DB-backed precedence', () => {
  afterEach(() => jest.clearAllMocks());

  test('product offer only — applies product offer', async () => {
    const po = makeOffer({ offer_type: 'PERCENT', discount_value: 10 });
    ProductOffer.findOne.mockResolvedValue(po);
    GlobalOffer.findOne.mockResolvedValue(null);

    const result = await resolveOffer(1, UNIT_PRICE, QTY);
    expect(result.source).toBe('product');
    expect(result.discount).toBe(30);
  });

  test('global offer only — applies global offer', async () => {
    ProductOffer.findOne.mockResolvedValue(null);
    const go = makeOffer({ offer_type: 'PERCENT', discount_value: 20 });
    GlobalOffer.findOne.mockResolvedValue(go);

    const result = await resolveOffer(1, UNIT_PRICE, QTY);
    expect(result.source).toBe('global');
    expect(result.discount).toBe(60);
  });

  test('global_wins precedence — always picks global', async () => {
    const po = makeOffer({ offer_type: 'PERCENT', discount_value: 30 }); // 30% product
    const go = makeOffer({ offer_type: 'PERCENT', discount_value: 10, precedence: 'global_wins' }); // 10% global
    ProductOffer.findOne.mockResolvedValue(po);
    GlobalOffer.findOne.mockResolvedValue(go);

    const result = await resolveOffer(1, UNIT_PRICE, QTY);
    expect(result.source).toBe('global');
    expect(result.discount).toBe(30); // 10% of 300
  });

  test('product_wins precedence — always picks product', async () => {
    const po = makeOffer({ offer_type: 'PERCENT', discount_value: 10 }); // 10% product
    const go = makeOffer({ offer_type: 'PERCENT', discount_value: 30, precedence: 'product_wins' }); // 30% global
    ProductOffer.findOne.mockResolvedValue(po);
    GlobalOffer.findOne.mockResolvedValue(go);

    const result = await resolveOffer(1, UNIT_PRICE, QTY);
    expect(result.source).toBe('product');
    expect(result.discount).toBe(30); // 10% of 300
  });

  test('best_deal — picks global when global is higher', async () => {
    const po = makeOffer({ offer_type: 'PERCENT', discount_value: 10 }); // 10% = ₹30
    const go = makeOffer({ offer_type: 'PERCENT', discount_value: 20, precedence: 'best_deal' }); // 20% = ₹60
    ProductOffer.findOne.mockResolvedValue(po);
    GlobalOffer.findOne.mockResolvedValue(go);

    const result = await resolveOffer(1, UNIT_PRICE, QTY);
    expect(result.source).toBe('global');
    expect(result.discount).toBe(60);
  });

  test('best_deal — picks product when product is higher', async () => {
    const po = makeOffer({ offer_type: 'PERCENT', discount_value: 20 }); // 20% = ₹60
    const go = makeOffer({ offer_type: 'PERCENT', discount_value: 10, precedence: 'best_deal' }); // 10% = ₹30
    ProductOffer.findOne.mockResolvedValue(po);
    GlobalOffer.findOne.mockResolvedValue(go);

    const result = await resolveOffer(1, UNIT_PRICE, QTY);
    expect(result.source).toBe('product');
    expect(result.discount).toBe(60);
  });

  test('no offers → discount 0, source null', async () => {
    ProductOffer.findOne.mockResolvedValue(null);
    GlobalOffer.findOne.mockResolvedValue(null);

    const result = await resolveOffer(1, UNIT_PRICE, QTY);
    expect(result.source).toBeNull();
    expect(result.discount).toBe(0);
  });
});

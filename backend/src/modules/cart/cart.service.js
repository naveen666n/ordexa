'use strict';

const cartRepo = require('./cart.repository');
const offerEngine = require('../discounts/offer.engine');
const couponService = require('../discounts/coupon.service');
const shippingService = require('../shipping/shipping.service');
const taxService = require('../tax/tax.service');
const { AppError } = require('../../utils/errors');

// In-memory coupon store per user session — stored in process memory.
// Persisted as part of cart summary flow; replaced by Redis/DB in a future hardening pass.
const couponStore = new Map(); // userId -> { code, couponRecord }

// ─── Helpers ──────────────────────────────────────────────────────────────────

const INVENTORY_BLOCKING = process.env.INVENTORY_BLOCKING_ENABLED !== 'false';

const resolveItemsWithOffers = async (rawItems) => {
  const resolved = await Promise.all(
    rawItems.map(async (item) => {
      const variant = item.variant;
      const product = variant?.product;

      if (!variant || !product) return null;

      const unitPrice = Number(variant.price);
      const qty = item.quantity;

      // Resolve offer for this product
      const { offer, source: offerSource, discount } = await offerEngine.resolveOffer(
        product.id,
        unitPrice,
        qty
      );

      const lineTotal = unitPrice * qty;
      const discountAmount = Math.round(discount * 100) / 100;
      const lineTotalAfterDiscount = Math.max(0, lineTotal - discountAmount);

      const primaryImage = product.images?.[0];

      return {
        id: item.id,
        variant_id: variant.id,
        sku: variant.sku,
        product_id: product.id,
        product_name: product.name,
        product_slug: product.slug,
        variant_name: variant.name,
        brand: product.brand,
        image_url: primaryImage?.url || null,
        unit_price: unitPrice,
        compare_price: variant.compare_price ? Number(variant.compare_price) : null,
        quantity: qty,
        stock_quantity: variant.stock_quantity,
        line_total: Math.round(lineTotal * 100) / 100,
        offer_discount: discountAmount,
        line_total_after_discount: Math.round(lineTotalAfterDiscount * 100) / 100,
        offer: offer
          ? {
              offer_type: offer.offer_type,
              discount_value: offer.discount_value,
              source: offerSource,
            }
          : null,
      };
    })
  );

  return resolved.filter(Boolean);
};

// ─── Get Cart ─────────────────────────────────────────────────────────────────

const getCart = async (userId) => {
  const rawItems = await cartRepo.findCartItems(userId);
  const items = await resolveItemsWithOffers(rawItems);

  const subtotal = items.reduce((sum, i) => sum + i.line_total_after_discount, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const appliedCoupon = couponStore.get(userId) || null;

  return {
    items,
    item_count: itemCount,
    subtotal: Math.round(subtotal * 100) / 100,
    applied_coupon: appliedCoupon
      ? {
          code: appliedCoupon.code,
          offer_type: appliedCoupon.couponRecord.offer_type,
          discount_value: appliedCoupon.couponRecord.discount_value,
        }
      : null,
  };
};

// ─── Add Item ─────────────────────────────────────────────────────────────────

const addItem = async (userId, variantId, quantity) => {
  const { ProductVariant } = require('../../models');
  const variant = await ProductVariant.findByPk(variantId);

  if (!variant || !variant.is_active) {
    throw new AppError('Product variant not found.', 404, 'VARIANT_NOT_FOUND');
  }

  if (INVENTORY_BLOCKING && variant.stock_quantity <= 0) {
    throw new AppError('Item is out of stock.', 400, 'OUT_OF_STOCK');
  }

  const maxQty = variant.stock_quantity || 999;
  const clampedQty = Math.min(quantity, maxQty);

  await cartRepo.upsertItem(userId, variantId, clampedQty);
  return getCart(userId);
};

// ─── Update Item Quantity ─────────────────────────────────────────────────────

const updateItem = async (userId, variantId, quantity) => {
  if (quantity <= 0) {
    await cartRepo.removeItem(userId, variantId);
    return getCart(userId);
  }

  const item = await cartRepo.findCartItem(userId, variantId);
  if (!item) throw new AppError('Item not in cart.', 404, 'CART_ITEM_NOT_FOUND');

  const { ProductVariant } = require('../../models');
  const variant = await ProductVariant.findByPk(variantId);
  const maxQty = variant?.stock_quantity || 999;
  const clampedQty = Math.min(quantity, maxQty);

  await cartRepo.updateQuantity(userId, variantId, clampedQty);
  return getCart(userId);
};

// ─── Remove Item ──────────────────────────────────────────────────────────────

const removeItem = async (userId, variantId) => {
  await cartRepo.removeItem(userId, variantId);
  return getCart(userId);
};

// ─── Clear Cart ───────────────────────────────────────────────────────────────

const clearCart = async (userId) => {
  await cartRepo.clearCart(userId);
  couponStore.delete(userId);
  return getCart(userId);
};

// ─── Apply Coupon ─────────────────────────────────────────────────────────────

const applyCoupon = async (userId, code) => {
  const cart = await getCart(userId);
  const couponRecord = await couponService.validateCoupon(code, userId, cart.subtotal);
  couponStore.set(userId, { code: code.toUpperCase(), couponRecord });
  return getCart(userId);
};

// ─── Remove Coupon ────────────────────────────────────────────────────────────

const removeCoupon = async (userId) => {
  couponStore.delete(userId);
  return getCart(userId);
};

// ─── Cart Summary (full price breakdown) ─────────────────────────────────────

const getCartSummary = async (userId, region = null) => {
  const rawItems = await cartRepo.findCartItems(userId);
  const items = await resolveItemsWithOffers(rawItems);

  const subtotal = items.reduce((sum, i) => sum + i.line_total_after_discount, 0);

  // Build items with category_slug for tax calculation
  const taxItems = items.map((i) => ({
    subtotal_after_discount: i.line_total_after_discount,
    category_slug: null, // category not eagerly loaded here — tax applies at catch-all level
  }));

  const appliedCoupon = couponStore.get(userId) || null;

  let couponDiscount = 0;
  let couponFreeShipping = false;
  let discountSource = null;

  if (appliedCoupon) {
    const result = couponService.calculateCouponDiscount(appliedCoupon.couponRecord, subtotal);
    couponDiscount = result.discount_amount;
    couponFreeShipping = result.free_shipping;
    discountSource = `Coupon: ${appliedCoupon.code}`;
  }

  const subtotalAfterCoupon = Math.max(0, subtotal - couponDiscount);

  const [shippingAmount, taxAmount] = await Promise.all([
    shippingService.calculate(subtotalAfterCoupon, couponFreeShipping),
    taxService.calculate(taxItems, region),
  ]);

  const total = Math.round((subtotalAfterCoupon + shippingAmount + taxAmount) * 100) / 100;

  return {
    items,
    item_count: items.reduce((s, i) => s + i.quantity, 0),
    subtotal: Math.round(subtotal * 100) / 100,
    discount_amount: Math.round(couponDiscount * 100) / 100,
    discount_source: discountSource,
    shipping_amount: Math.round(shippingAmount * 100) / 100,
    tax_amount: Math.round(taxAmount * 100) / 100,
    total_amount: total,
    applied_coupon: appliedCoupon
      ? {
          code: appliedCoupon.code,
          offer_type: appliedCoupon.couponRecord.offer_type,
          discount_value: appliedCoupon.couponRecord.discount_value,
        }
      : null,
  };
};

// Export couponStore so order service can clear it after order creation
const clearCouponStore = (userId) => couponStore.delete(userId);
const getCouponForUser = (userId) => couponStore.get(userId) || null;

module.exports = {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
  applyCoupon,
  removeCoupon,
  getCartSummary,
  clearCouponStore,
  getCouponForUser,
};

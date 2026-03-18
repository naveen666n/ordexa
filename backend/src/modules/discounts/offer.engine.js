'use strict';

const { ProductOffer, GlobalOffer } = require('../../models');
const { Op } = require('sequelize');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const now = () => new Date();

const isWithinDateRange = (offer) => {
  const n = now();
  if (offer.starts_at && new Date(offer.starts_at) > n) return false;
  if (offer.ends_at && new Date(offer.ends_at) < n) return false;
  return true;
};

// Calculate discount amount for a given offer, unit price, and quantity.
// Returns the total discount applied to (quantity × unitPrice).
const calculateOfferDiscount = (offer, unitPrice, quantity) => {
  if (!offer) return 0;
  if (!isWithinDateRange(offer)) return 0;

  const lineTotal = unitPrice * quantity;

  // Check min order value constraint
  if (offer.min_order_value && lineTotal < Number(offer.min_order_value)) return 0;

  switch (offer.offer_type) {
    case 'PERCENT': {
      const rate = Number(offer.discount_value) / 100;
      return Math.round(lineTotal * rate * 100) / 100;
    }
    case 'FIXED': {
      // Fixed discount per item, capped at line total
      const total = Number(offer.discount_value) * quantity;
      return Math.min(total, lineTotal);
    }
    case 'FREE_SHIPPING':
      // Discount is applied at shipping level, not item level
      return 0;
    case 'BXGY': {
      // Buy buy_quantity get get_quantity free
      const buy = offer.buy_quantity || 1;
      const get = offer.get_quantity || 1;
      const sets = Math.floor(quantity / (buy + get));
      const freeUnits = sets * get;
      return Math.round(freeUnits * unitPrice * 100) / 100;
    }
    default:
      return 0;
  }
};

// ─── Active Offer Queries ─────────────────────────────────────────────────────

const getActiveProductOffer = async (productId) => {
  const n = now();
  return ProductOffer.findOne({
    where: {
      product_id: productId,
      is_active: true,
      [Op.and]: [
        { [Op.or]: [{ starts_at: null }, { starts_at: { [Op.lte]: n } }] },
        { [Op.or]: [{ ends_at: null }, { ends_at: { [Op.gte]: n } }] },
      ],
    },
    order: [['created_at', 'DESC']],
  });
};

const getActiveGlobalOffer = async () => {
  const n = now();
  return GlobalOffer.findOne({
    where: {
      is_active: true,
      [Op.and]: [
        { [Op.or]: [{ starts_at: null }, { starts_at: { [Op.lte]: n } }] },
        { [Op.or]: [{ ends_at: null }, { ends_at: { [Op.gte]: n } }] },
      ],
    },
  });
};

// ─── Precedence Resolution ────────────────────────────────────────────────────

/**
 * Resolves which offer applies to a product.
 * @param {number} productId
 * @param {number} unitPrice — used to compare discount amounts for best_deal
 * @param {number} quantity
 * @returns {{ offer: object|null, source: 'product'|'global'|null, discount: number }}
 */
const resolveOffer = async (productId, unitPrice = 0, quantity = 1) => {
  const [productOffer, globalOffer] = await Promise.all([
    getActiveProductOffer(productId),
    getActiveGlobalOffer(),
  ]);

  if (!productOffer && !globalOffer) {
    return { offer: null, source: null, discount: 0 };
  }

  if (!globalOffer) {
    const discount = calculateOfferDiscount(productOffer, unitPrice, quantity);
    return { offer: productOffer, source: 'product', discount };
  }

  if (!productOffer) {
    const discount = calculateOfferDiscount(globalOffer, unitPrice, quantity);
    return { offer: globalOffer, source: 'global', discount };
  }

  // Both exist — apply precedence from global offer config
  const precedence = globalOffer.precedence || 'best_deal';

  if (precedence === 'global_wins') {
    const discount = calculateOfferDiscount(globalOffer, unitPrice, quantity);
    return { offer: globalOffer, source: 'global', discount };
  }

  if (precedence === 'product_wins') {
    const discount = calculateOfferDiscount(productOffer, unitPrice, quantity);
    return { offer: productOffer, source: 'product', discount };
  }

  // best_deal — whichever gives a higher discount
  const productDiscount = calculateOfferDiscount(productOffer, unitPrice, quantity);
  const globalDiscount = calculateOfferDiscount(globalOffer, unitPrice, quantity);

  if (globalDiscount >= productDiscount) {
    return { offer: globalOffer, source: 'global', discount: globalDiscount };
  }
  return { offer: productOffer, source: 'product', discount: productDiscount };
};

module.exports = { getActiveProductOffer, getActiveGlobalOffer, resolveOffer, calculateOfferDiscount };

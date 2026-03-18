'use strict';

const { CartItem, ProductVariant, Product, ProductImage } = require('../../models');

// ─── Fetch full cart items for a user ─────────────────────────────────────────

const findCartItems = (userId) =>
  CartItem.findAll({
    where: { user_id: userId },
    include: [
      {
        model: ProductVariant,
        as: 'variant',
        attributes: ['id', 'sku', 'name', 'price', 'compare_price', 'stock_quantity', 'is_active'],
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'slug', 'brand', 'is_active'],
            include: [
              {
                model: ProductImage,
                as: 'images',
                attributes: ['url', 'alt_text'],
                where: { is_primary: true },
                required: false,
                limit: 1,
              },
            ],
          },
        ],
      },
    ],
    order: [['created_at', 'ASC']],
  });

// ─── Single item ──────────────────────────────────────────────────────────────

const findCartItem = (userId, variantId) =>
  CartItem.findOne({ where: { user_id: userId, variant_id: variantId } });

// ─── Upsert item ──────────────────────────────────────────────────────────────

const upsertItem = async (userId, variantId, quantity) => {
  const existing = await findCartItem(userId, variantId);
  if (existing) {
    existing.quantity = quantity;
    return existing.save();
  }
  return CartItem.create({ user_id: userId, variant_id: variantId, quantity });
};

// ─── Update quantity ──────────────────────────────────────────────────────────

const updateQuantity = async (userId, variantId, quantity) => {
  const [count] = await CartItem.update(
    { quantity },
    { where: { user_id: userId, variant_id: variantId } }
  );
  return count;
};

// ─── Remove item ──────────────────────────────────────────────────────────────

const removeItem = (userId, variantId) =>
  CartItem.destroy({ where: { user_id: userId, variant_id: variantId } });

// ─── Clear cart ───────────────────────────────────────────────────────────────

const clearCart = (userId) => CartItem.destroy({ where: { user_id: userId } });

module.exports = { findCartItems, findCartItem, upsertItem, updateQuantity, removeItem, clearCart };

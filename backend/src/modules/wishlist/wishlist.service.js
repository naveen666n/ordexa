'use strict';

const { WishlistItem, ProductVariant, Product, ProductImage } = require('../../models');

const getWishlist = async (userId) => {
  const items = await WishlistItem.findAll({
    where: { user_id: userId },
    include: [{
      model: ProductVariant,
      as: 'variant',
      include: [{
        model: Product,
        as: 'product',
        include: [{ model: ProductImage, as: 'images' }],
      }],
    }],
    order: [['created_at', 'DESC']],
  });
  return { items };
};

const addToWishlist = async (userId, variantId) => {
  const variant = await ProductVariant.findByPk(variantId);
  if (!variant) {
    const err = new Error('Variant not found');
    err.code = 'NOT_FOUND';
    throw err;
  }
  const [item, created] = await WishlistItem.findOrCreate({
    where: { user_id: userId, variant_id: variantId },
  });
  return { item, created };
};

const removeFromWishlist = async (userId, variantId) => {
  const item = await WishlistItem.findOne({ where: { user_id: userId, variant_id: variantId } });
  if (!item) {
    const err = new Error('Item not in wishlist');
    err.code = 'NOT_FOUND';
    throw err;
  }
  await item.destroy();
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist };

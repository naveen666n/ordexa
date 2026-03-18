'use strict';

const wishlistService = require('./wishlist.service');
const { success, created, notFound } = require('../../utils/response');

const getWishlist = async (req, res, next) => {
  try {
    const result = await wishlistService.getWishlist(req.user.id);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const addToWishlist = async (req, res, next) => {
  try {
    const { variant_id } = req.body;
    if (!variant_id) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'variant_id is required' },
      });
    }
    const { item, created: wasCreated } = await wishlistService.addToWishlist(req.user.id, variant_id);
    if (wasCreated) {
      return created(res, { item }, 'Added to wishlist');
    }
    return success(res, { item }, 'Already in wishlist');
  } catch (err) {
    if (err.code === 'NOT_FOUND') return notFound(res, err.message);
    next(err);
  }
};

const removeFromWishlist = async (req, res, next) => {
  try {
    const variantId = req.params.variantId;
    await wishlistService.removeFromWishlist(req.user.id, variantId);
    return success(res, null, 'Removed from wishlist');
  } catch (err) {
    if (err.code === 'NOT_FOUND') return notFound(res, err.message);
    next(err);
  }
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist };

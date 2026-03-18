'use strict';

const cartService = require('./cart.service');
const { success } = require('../../utils/response');

const getCart = async (req, res, next) => {
  try {
    const cart = await cartService.getCart(req.user.id);
    return success(res, { cart });
  } catch (err) { next(err); }
};

const addItem = async (req, res, next) => {
  try {
    const { variant_id, quantity = 1 } = req.body;
    const cart = await cartService.addItem(req.user.id, variant_id, Number(quantity));
    return success(res, { cart }, 'Item added to cart', 201);
  } catch (err) { next(err); }
};

const updateItem = async (req, res, next) => {
  try {
    const { variantId } = req.params;
    const { quantity } = req.body;
    const cart = await cartService.updateItem(req.user.id, Number(variantId), Number(quantity));
    return success(res, { cart });
  } catch (err) { next(err); }
};

const removeItem = async (req, res, next) => {
  try {
    const { variantId } = req.params;
    const cart = await cartService.removeItem(req.user.id, Number(variantId));
    return success(res, { cart });
  } catch (err) { next(err); }
};

const clearCart = async (req, res, next) => {
  try {
    const cart = await cartService.clearCart(req.user.id);
    return success(res, { cart });
  } catch (err) { next(err); }
};

const applyCoupon = async (req, res, next) => {
  try {
    const { code } = req.body;
    const cart = await cartService.applyCoupon(req.user.id, code);
    return success(res, { cart }, 'Coupon applied');
  } catch (err) { next(err); }
};

const removeCoupon = async (req, res, next) => {
  try {
    const cart = await cartService.removeCoupon(req.user.id);
    return success(res, { cart }, 'Coupon removed');
  } catch (err) { next(err); }
};

const getCartSummary = async (req, res, next) => {
  try {
    const region = req.body.region || null;
    const summary = await cartService.getCartSummary(req.user.id, region);
    return success(res, { summary });
  } catch (err) { next(err); }
};

module.exports = { getCart, addItem, updateItem, removeItem, clearCart, applyCoupon, removeCoupon, getCartSummary };

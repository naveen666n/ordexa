'use strict';

const Joi = require('joi');

const couponOfferTypes = ['PERCENT', 'FIXED', 'FREE_SHIPPING'];
const offerTypes = ['PERCENT', 'FIXED', 'FREE_SHIPPING', 'BXGY'];
const precedenceOptions = ['global_wins', 'product_wins', 'best_deal'];

const createDiscountCode = Joi.object({
  code: Joi.string().trim().uppercase().min(3).max(60).required(),
  offer_type: Joi.string().valid(...couponOfferTypes).required(),
  discount_value: Joi.number().min(0).optional().allow(null),
  min_order_value: Joi.number().min(0).optional().allow(null),
  max_uses: Joi.number().integer().min(1).optional().allow(null),
  per_user_limit: Joi.number().integer().min(1).default(1),
  starts_at: Joi.date().iso().optional().allow(null),
  ends_at: Joi.date().iso().optional().allow(null),
  is_active: Joi.boolean().default(true),
});

const updateDiscountCode = Joi.object({
  code: Joi.string().trim().uppercase().min(3).max(60).optional(),
  offer_type: Joi.string().valid(...couponOfferTypes).optional(),
  discount_value: Joi.number().min(0).optional().allow(null),
  min_order_value: Joi.number().min(0).optional().allow(null),
  max_uses: Joi.number().integer().min(1).optional().allow(null),
  per_user_limit: Joi.number().integer().min(1).optional(),
  starts_at: Joi.date().iso().optional().allow(null),
  ends_at: Joi.date().iso().optional().allow(null),
  is_active: Joi.boolean().optional(),
}).min(1);

const createGlobalOffer = Joi.object({
  name: Joi.string().trim().min(1).max(150).required(),
  offer_type: Joi.string().valid(...offerTypes).required(),
  discount_value: Joi.number().min(0).optional().allow(null),
  buy_quantity: Joi.number().integer().min(1).optional().allow(null),
  get_quantity: Joi.number().integer().min(1).optional().allow(null),
  min_order_value: Joi.number().min(0).optional().allow(null),
  precedence: Joi.string().valid(...precedenceOptions).default('best_deal'),
  starts_at: Joi.date().iso().optional().allow(null),
  ends_at: Joi.date().iso().optional().allow(null),
  is_active: Joi.boolean().default(false),
});

const updateGlobalOffer = Joi.object({
  name: Joi.string().trim().min(1).max(150).optional(),
  offer_type: Joi.string().valid(...offerTypes).optional(),
  discount_value: Joi.number().min(0).optional().allow(null),
  buy_quantity: Joi.number().integer().min(1).optional().allow(null),
  get_quantity: Joi.number().integer().min(1).optional().allow(null),
  min_order_value: Joi.number().min(0).optional().allow(null),
  precedence: Joi.string().valid(...precedenceOptions).optional(),
  starts_at: Joi.date().iso().optional().allow(null),
  ends_at: Joi.date().iso().optional().allow(null),
  is_active: Joi.boolean().optional(),
}).min(1);

module.exports = { createDiscountCode, updateDiscountCode, createGlobalOffer, updateGlobalOffer };

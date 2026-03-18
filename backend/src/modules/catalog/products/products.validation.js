const Joi = require('joi');

const createProduct = Joi.object({
  name: Joi.string().trim().min(1).max(255).required(),
  slug: Joi.string().trim().lowercase().pattern(/^[a-z0-9-]+$/).max(300).optional(),
  description: Joi.string().trim().optional().allow('', null),
  brand: Joi.string().trim().max(100).optional().allow('', null),
  category_ids: Joi.array().items(Joi.number().integer().positive()).min(1).required(),
  is_active: Joi.boolean().default(true),
  is_featured: Joi.boolean().default(false),
  meta_title: Joi.string().trim().max(255).optional().allow('', null),
  meta_description: Joi.string().trim().max(500).optional().allow('', null),
  sort_order: Joi.number().integer().min(0).default(0),
});

const updateProduct = Joi.object({
  name: Joi.string().trim().min(1).max(255).optional(),
  slug: Joi.string().trim().lowercase().pattern(/^[a-z0-9-]+$/).max(300).optional(),
  description: Joi.string().trim().optional().allow('', null),
  brand: Joi.string().trim().max(100).optional().allow('', null),
  category_ids: Joi.array().items(Joi.number().integer().positive()).min(1).optional(),
  is_active: Joi.boolean().optional(),
  is_featured: Joi.boolean().optional(),
  meta_title: Joi.string().trim().max(255).optional().allow('', null),
  meta_description: Joi.string().trim().max(500).optional().allow('', null),
  sort_order: Joi.number().integer().min(0).optional(),
}).min(1);

const createVariant = Joi.object({
  sku: Joi.string().trim().max(100).required(),
  name: Joi.string().trim().max(255).optional().allow('', null),
  price: Joi.number().precision(2).positive().required(),
  compare_price: Joi.number().precision(2).positive().optional().allow(null),
  cost_price: Joi.number().precision(2).positive().optional().allow(null),
  stock_quantity: Joi.number().integer().min(0).default(0),
  low_stock_threshold: Joi.number().integer().min(0).default(5),
  is_active: Joi.boolean().default(true),
  attribute_value_ids: Joi.array().items(Joi.number().integer().positive()).optional(),
});

const updateVariant = Joi.object({
  sku: Joi.string().trim().max(100).optional(),
  name: Joi.string().trim().max(255).optional().allow('', null),
  price: Joi.number().precision(2).positive().optional(),
  compare_price: Joi.number().precision(2).positive().optional().allow(null),
  cost_price: Joi.number().precision(2).positive().optional().allow(null),
  stock_quantity: Joi.number().integer().min(0).optional(),
  low_stock_threshold: Joi.number().integer().min(0).optional(),
  is_active: Joi.boolean().optional(),
  attribute_value_ids: Joi.array().items(Joi.number().integer().positive()).optional(),
}).min(1);

module.exports = { createProduct, updateProduct, createVariant, updateVariant };

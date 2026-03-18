const Joi = require('joi');

const createAttribute = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  slug: Joi.string().trim().lowercase().pattern(/^[a-z0-9-]+$/).max(120).optional(),
  type: Joi.string().valid('select', 'multiselect', 'text', 'number', 'boolean').default('select'),
  is_filterable: Joi.boolean().default(false),
  is_visible: Joi.boolean().default(true),
  sort_order: Joi.number().integer().min(0).default(0),
});

const updateAttribute = Joi.object({
  name: Joi.string().trim().min(1).max(100).optional(),
  slug: Joi.string().trim().lowercase().pattern(/^[a-z0-9-]+$/).max(120).optional(),
  type: Joi.string().valid('select', 'multiselect', 'text', 'number', 'boolean').optional(),
  is_filterable: Joi.boolean().optional(),
  is_visible: Joi.boolean().optional(),
  sort_order: Joi.number().integer().min(0).optional(),
}).min(1);

const createValue = Joi.object({
  value: Joi.string().trim().min(1).max(200).required(),
  slug: Joi.string().trim().lowercase().pattern(/^[a-z0-9-]+$/).max(220).optional(),
  color_hex: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional().allow(null, ''),
  sort_order: Joi.number().integer().min(0).default(0),
});

const updateValue = Joi.object({
  value: Joi.string().trim().min(1).max(200).optional(),
  slug: Joi.string().trim().lowercase().pattern(/^[a-z0-9-]+$/).max(220).optional(),
  color_hex: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional().allow(null, ''),
  sort_order: Joi.number().integer().min(0).optional(),
}).min(1);

module.exports = { createAttribute, updateAttribute, createValue, updateValue };

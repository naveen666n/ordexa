const Joi = require('joi');

const create = Joi.object({
  name: Joi.string().trim().min(1).max(150).required(),
  // Accept any string (including empty) — service will slugify it; empty string treated as "auto-generate"
  slug: Joi.string().trim().max(200).allow('').optional(),
  parent_id: Joi.number().integer().min(1).allow(null).optional(),
  description: Joi.string().trim().max(5000).optional().allow('', null),
  image_url: Joi.string().max(500).optional().allow('', null),
  sort_order: Joi.number().integer().min(0).default(0),
  is_active: Joi.boolean().default(true),
});

const update = Joi.object({
  name: Joi.string().trim().min(1).max(150).optional(),
  slug: Joi.string().trim().max(200).allow('').optional(),
  parent_id: Joi.number().integer().min(1).allow(null).optional(),
  description: Joi.string().trim().max(5000).optional().allow('', null),
  image_url: Joi.string().max(500).optional().allow('', null),
  sort_order: Joi.number().integer().min(0).optional(),
  is_active: Joi.boolean().optional(),
}).min(1);

module.exports = { create, update };

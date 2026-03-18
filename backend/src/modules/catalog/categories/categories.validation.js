const Joi = require('joi');

const create = Joi.object({
  name: Joi.string().trim().min(1).max(150).required(),
  slug: Joi.string().trim().lowercase().pattern(/^[a-z0-9-]+$/).max(200).optional(),
  parent_id: Joi.number().integer().positive().optional().allow(null),
  description: Joi.string().trim().max(5000).optional().allow('', null),
  image_url: Joi.string().uri().max(500).optional().allow('', null),
  sort_order: Joi.number().integer().min(0).default(0),
  is_active: Joi.boolean().default(true),
});

const update = Joi.object({
  name: Joi.string().trim().min(1).max(150).optional(),
  slug: Joi.string().trim().lowercase().pattern(/^[a-z0-9-]+$/).max(200).optional(),
  parent_id: Joi.number().integer().positive().optional().allow(null),
  description: Joi.string().trim().max(5000).optional().allow('', null),
  image_url: Joi.string().uri().max(500).optional().allow('', null),
  sort_order: Joi.number().integer().min(0).optional(),
  is_active: Joi.boolean().optional(),
}).min(1);

module.exports = { create, update };

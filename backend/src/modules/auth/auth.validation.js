const Joi = require('joi');

const passwordSchema = Joi.string()
  .min(8)
  .max(128)
  .pattern(/[A-Z]/, 'uppercase')
  .pattern(/[a-z]/, 'lowercase')
  .pattern(/[0-9]/, 'number')
  .pattern(/[^A-Za-z0-9]/, 'special character')
  .required()
  .messages({
    'string.pattern.name': 'Password must contain at least one {#name}',
  });

const register = Joi.object({
  first_name: Joi.string().trim().min(1).max(100).required(),
  last_name: Joi.string().trim().min(1).max(100).required(),
  email: Joi.string().email().lowercase().required(),
  password: passwordSchema,
  phone: Joi.string().pattern(/^\+?[0-9\s\-()]{7,20}$/).optional().allow('', null),
});

const login = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().required(),
});

const forgotPassword = Joi.object({
  email: Joi.string().email().lowercase().required(),
});

const resetPassword = Joi.object({
  token: Joi.string().required(),
  password: passwordSchema,
});

const completeRegistration = Joi.object({
  first_name: Joi.string().trim().min(1).max(100).required(),
  last_name: Joi.string().trim().min(1).max(100).required(),
  phone: Joi.string().pattern(/^\+?[0-9\s\-()]{7,20}$/).optional().allow('', null),
  address_line1: Joi.string().trim().min(1).max(255).required(),
  address_line2: Joi.string().trim().max(255).optional().allow('', null),
  city: Joi.string().trim().min(1).max(100).required(),
  state: Joi.string().trim().min(1).max(100).required(),
  postal_code: Joi.string().trim().min(1).max(20).required(),
  country: Joi.string().trim().length(2).uppercase().required(),
});

module.exports = { register, login, forgotPassword, resetPassword, completeRegistration };

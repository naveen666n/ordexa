'use strict';

const router = require('express').Router();
const Joi = require('joi');
const controller = require('./addresses.controller');
const authenticate = require('../../middleware/authenticate');

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details: error.details },
    });
  }
  next();
};

const addressSchema = Joi.object({
  label: Joi.string().max(60).optional().allow('', null),
  full_name: Joi.string().min(2).max(150).required(),
  phone: Joi.string().max(20).optional().allow('', null),
  address_line1: Joi.string().min(5).max(255).required(),
  address_line2: Joi.string().max(255).optional().allow('', null),
  city: Joi.string().min(2).max(100).required(),
  state: Joi.string().min(2).max(100).required(),
  postal_code: Joi.string().min(3).max(20).required(),
  country: Joi.string().max(100).default('India'),
  is_default: Joi.boolean().optional(),
});

const updateSchema = addressSchema.fork(
  ['full_name', 'address_line1', 'city', 'state', 'postal_code'],
  (s) => s.optional()
).min(1);

router.use(authenticate);

router.get('/', controller.list);
router.post('/', validate(addressSchema), controller.create);
router.put('/:id', validate(updateSchema), controller.update);
router.delete('/:id', controller.remove);
router.patch('/:id/set-default', controller.setDefault);

module.exports = router;

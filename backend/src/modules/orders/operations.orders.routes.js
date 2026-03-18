'use strict';

const router = require('express').Router();
const Joi = require('joi');
const controller = require('./orders.controller');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');
const auditLog = require('../../middleware/auditLog');

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

const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled')
    .required(),
  note: Joi.string().max(500).optional().allow(null, ''),
});

router.use(authenticate, requireRole('admin', 'operations'));

// GET /api/v1/operations/orders            — all orders, filterable
// GET /api/v1/operations/orders/:number    — full detail
// PUT /api/v1/operations/orders/:number/status — update status (operations only)

router.get('/', controller.listAllOrders);
router.get('/:orderNumber', controller.getOrderDetail);
router.put(
  '/:orderNumber/status',
  requireRole('operations'),
  auditLog('ORDER_STATUS_UPDATE', 'order'),
  validate(updateStatusSchema),
  controller.updateOrderStatus
);

module.exports = router;

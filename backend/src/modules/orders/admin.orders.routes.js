'use strict';

const router = require('express').Router();
const controller = require('./orders.controller');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');

router.use(authenticate, requireRole('admin'));

// GET /api/v1/admin/orders           — all orders (filterable, paginated)
// GET /api/v1/admin/orders/:number   — full detail

router.get('/', controller.listAllOrders);
router.get('/:orderNumber', controller.getOrderDetail);
router.put('/:orderNumber/status', controller.updateOrderStatus);

module.exports = router;

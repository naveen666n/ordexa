'use strict';

const router = require('express').Router();
const controller = require('./payments.controller');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');

router.use(authenticate, requireRole('admin'));

// POST /api/v1/admin/payments/:id/refund
router.post('/:id/refund', controller.refundPayment);

module.exports = router;

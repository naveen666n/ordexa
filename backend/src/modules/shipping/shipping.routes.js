'use strict';

const router = require('express').Router();
const ShippingRule = require('../../models/ShippingRule');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');
const { success, created, notFound } = require('../../utils/response');

router.use(authenticate, requireRole('admin'));

// GET /api/v1/admin/shipping/rules
router.get('/rules', async (req, res, next) => {
  try {
    const rules = await ShippingRule.findAll({ order: [['id', 'ASC']] });
    success(res, rules);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/admin/shipping/rules
router.post('/rules', async (req, res, next) => {
  try {
    const { name, strategy, config, is_active } = req.body;
    const rule = await ShippingRule.create({
      name,
      strategy: strategy || 'flat_rate',
      config: config || {},
      is_active: is_active !== undefined ? is_active : true,
    });
    created(res, rule, 'Shipping rule created');
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/admin/shipping/rules/:id
router.put('/rules/:id', async (req, res, next) => {
  try {
    const rule = await ShippingRule.findByPk(req.params.id);
    if (!rule) return notFound(res, 'Shipping rule not found');
    const { name, strategy, config, is_active } = req.body;
    await rule.update({
      ...(name !== undefined && { name }),
      ...(strategy !== undefined && { strategy }),
      ...(config !== undefined && { config }),
      ...(is_active !== undefined && { is_active }),
    });
    success(res, rule, 'Shipping rule updated');
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/admin/shipping/rules/:id
router.delete('/rules/:id', async (req, res, next) => {
  try {
    const rule = await ShippingRule.findByPk(req.params.id);
    if (!rule) return notFound(res, 'Shipping rule not found');
    await rule.destroy();
    success(res, null, 'Shipping rule deleted');
  } catch (err) {
    next(err);
  }
});

module.exports = router;

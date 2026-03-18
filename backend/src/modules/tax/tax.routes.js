'use strict';

const router = require('express').Router();
const TaxRule = require('../../models/TaxRule');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');
const { success, created, notFound } = require('../../utils/response');

router.use(authenticate, requireRole('admin'));

// GET /api/v1/admin/tax/rules
router.get('/rules', async (req, res, next) => {
  try {
    const rules = await TaxRule.findAll({ order: [['id', 'ASC']] });
    success(res, rules);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/admin/tax/rules
router.post('/rules', async (req, res, next) => {
  try {
    const { name, region, category_slug, rate, is_active } = req.body;
    const rule = await TaxRule.create({
      name,
      region: region || null,
      category_slug: category_slug || null,
      rate: rate || 0,
      is_active: is_active !== undefined ? is_active : true,
    });
    created(res, rule, 'Tax rule created');
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/admin/tax/rules/:id
router.put('/rules/:id', async (req, res, next) => {
  try {
    const rule = await TaxRule.findByPk(req.params.id);
    if (!rule) return notFound(res, 'Tax rule not found');
    const { name, region, category_slug, rate, is_active } = req.body;
    await rule.update({
      ...(name !== undefined && { name }),
      ...(region !== undefined && { region }),
      ...(category_slug !== undefined && { category_slug }),
      ...(rate !== undefined && { rate }),
      ...(is_active !== undefined && { is_active }),
    });
    success(res, rule, 'Tax rule updated');
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/admin/tax/rules/:id
router.delete('/rules/:id', async (req, res, next) => {
  try {
    const rule = await TaxRule.findByPk(req.params.id);
    if (!rule) return notFound(res, 'Tax rule not found');
    await rule.destroy();
    success(res, null, 'Tax rule deleted');
  } catch (err) {
    next(err);
  }
});

module.exports = router;

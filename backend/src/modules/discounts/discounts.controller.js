'use strict';

const { DiscountCode, GlobalOffer } = require('../../models');
const { success } = require('../../utils/response');
const { AppError } = require('../../utils/errors');

// ─── Discount Codes ───────────────────────────────────────────────────────────

const listDiscountCodes = async (req, res, next) => {
  try {
    const codes = await DiscountCode.findAll({ order: [['created_at', 'DESC']] });
    return success(res, { discount_codes: codes });
  } catch (err) { next(err); }
};

const getDiscountCode = async (req, res, next) => {
  try {
    const code = await DiscountCode.findByPk(req.params.id);
    if (!code) throw new AppError('Discount code not found', 404, 'NOT_FOUND');
    return success(res, { discount_code: code });
  } catch (err) { next(err); }
};

const createDiscountCode = async (req, res, next) => {
  try {
    const { code, ...rest } = req.body;
    const dc = await DiscountCode.create({ code: code.toUpperCase(), ...rest });
    return success(res, { discount_code: dc }, 'Discount code created', 201);
  } catch (err) { next(err); }
};

const updateDiscountCode = async (req, res, next) => {
  try {
    const dc = await DiscountCode.findByPk(req.params.id);
    if (!dc) throw new AppError('Discount code not found', 404, 'NOT_FOUND');
    await dc.update(req.body);
    return success(res, { discount_code: dc });
  } catch (err) { next(err); }
};

const deleteDiscountCode = async (req, res, next) => {
  try {
    const dc = await DiscountCode.findByPk(req.params.id);
    if (!dc) throw new AppError('Discount code not found', 404, 'NOT_FOUND');
    await dc.destroy();
    return success(res, null, 'Discount code deleted');
  } catch (err) { next(err); }
};

// ─── Global Offers ────────────────────────────────────────────────────────────

const listGlobalOffers = async (req, res, next) => {
  try {
    const offers = await GlobalOffer.findAll({ order: [['created_at', 'DESC']] });
    return success(res, { global_offers: offers });
  } catch (err) { next(err); }
};

const getGlobalOffer = async (req, res, next) => {
  try {
    const offer = await GlobalOffer.findByPk(req.params.id);
    if (!offer) throw new AppError('Global offer not found', 404, 'NOT_FOUND');
    return success(res, { global_offer: offer });
  } catch (err) { next(err); }
};

const createGlobalOffer = async (req, res, next) => {
  try {
    const offer = await GlobalOffer.create(req.body);
    return success(res, { global_offer: offer }, 'Global offer created', 201);
  } catch (err) { next(err); }
};

const updateGlobalOffer = async (req, res, next) => {
  try {
    const offer = await GlobalOffer.findByPk(req.params.id);
    if (!offer) throw new AppError('Global offer not found', 404, 'NOT_FOUND');
    await offer.update(req.body);
    return success(res, { global_offer: offer });
  } catch (err) { next(err); }
};

const deleteGlobalOffer = async (req, res, next) => {
  try {
    const offer = await GlobalOffer.findByPk(req.params.id);
    if (!offer) throw new AppError('Global offer not found', 404, 'NOT_FOUND');
    await offer.destroy();
    return success(res, null, 'Global offer deleted');
  } catch (err) { next(err); }
};

// PATCH /admin/global-offers/:id/activate — set is_active=true, deactivate all others
const activateGlobalOffer = async (req, res, next) => {
  try {
    const offer = await GlobalOffer.findByPk(req.params.id);
    if (!offer) throw new AppError('Global offer not found', 404, 'NOT_FOUND');

    // Deactivate all, then activate this one
    await GlobalOffer.update({ is_active: false }, { where: {} });
    await offer.update({ is_active: true });

    return success(res, { global_offer: offer }, 'Global offer activated');
  } catch (err) { next(err); }
};

module.exports = {
  listDiscountCodes,
  getDiscountCode,
  createDiscountCode,
  updateDiscountCode,
  deleteDiscountCode,
  listGlobalOffers,
  getGlobalOffer,
  createGlobalOffer,
  updateGlobalOffer,
  deleteGlobalOffer,
  activateGlobalOffer,
};

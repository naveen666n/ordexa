'use strict';

const { Address } = require('../../models');
const { success } = require('../../utils/response');
const { AppError } = require('../../utils/errors');

const list = async (req, res, next) => {
  try {
    const addresses = await Address.findAll({
      where: { user_id: req.user.id },
      order: [['is_default', 'DESC'], ['created_at', 'ASC']],
    });
    return success(res, { addresses });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { is_default, ...rest } = req.body;

    // If this is the first address or explicitly set as default, unset others first
    const existingCount = await Address.count({ where: { user_id: req.user.id } });
    const setDefault = is_default || existingCount === 0;

    if (setDefault) {
      await Address.update({ is_default: false }, { where: { user_id: req.user.id } });
    }

    const address = await Address.create({ ...rest, user_id: req.user.id, is_default: setDefault });
    return success(res, { address }, 'Address created', 201);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const address = await Address.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!address) throw new AppError('Address not found', 404, 'NOT_FOUND');
    await address.update(req.body);
    return success(res, { address });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const address = await Address.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!address) throw new AppError('Address not found', 404, 'NOT_FOUND');
    await address.destroy();
    return success(res, null, 'Address deleted');
  } catch (err) { next(err); }
};

const setDefault = async (req, res, next) => {
  try {
    const address = await Address.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!address) throw new AppError('Address not found', 404, 'NOT_FOUND');
    // Unset all, then set this one
    await Address.update({ is_default: false }, { where: { user_id: req.user.id } });
    await address.update({ is_default: true });
    return success(res, { address }, 'Default address updated');
  } catch (err) { next(err); }
};

module.exports = { list, create, update, remove, setDefault };

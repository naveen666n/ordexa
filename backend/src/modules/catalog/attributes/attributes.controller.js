const service = require('./attributes.service');
const { success, created, notFound, conflict } = require('../../../utils/response');

// GET /api/v1/admin/attributes
const getAll = async (req, res, next) => {
  try {
    const attributes = await service.getAll();
    return success(res, { attributes });
  } catch (err) { next(err); }
};

// GET /api/v1/admin/attributes/:id
const getOne = async (req, res, next) => {
  try {
    const attribute = await service.getById(Number(req.params.id));
    return success(res, { attribute });
  } catch (err) {
    if (err.code === 'NOT_FOUND') return notFound(res, err.message);
    next(err);
  }
};

// POST /api/v1/admin/attributes
const create = async (req, res, next) => {
  try {
    const attribute = await service.createAttribute(req.body);
    return created(res, { attribute }, 'Attribute created');
  } catch (err) { next(err); }
};

// PUT /api/v1/admin/attributes/:id
const update = async (req, res, next) => {
  try {
    const attribute = await service.updateAttribute(Number(req.params.id), req.body);
    return success(res, { attribute }, 'Attribute updated');
  } catch (err) {
    if (err.code === 'NOT_FOUND') return notFound(res, err.message);
    next(err);
  }
};

// DELETE /api/v1/admin/attributes/:id
const destroy = async (req, res, next) => {
  try {
    await service.deleteAttribute(Number(req.params.id));
    return success(res, null, 'Attribute deleted');
  } catch (err) {
    if (err.code === 'NOT_FOUND') return notFound(res, err.message);
    next(err);
  }
};

// POST /api/v1/admin/attributes/:id/values
const addValue = async (req, res, next) => {
  try {
    const value = await service.addValue(Number(req.params.id), req.body);
    return created(res, { value }, 'Attribute value added');
  } catch (err) {
    if (err.code === 'NOT_FOUND') return notFound(res, err.message);
    if (err.code === 'CONFLICT') return conflict(res, err.message);
    next(err);
  }
};

// PUT /api/v1/admin/attributes/:id/values/:vid
const updateValue = async (req, res, next) => {
  try {
    const value = await service.updateValue(Number(req.params.id), Number(req.params.vid), req.body);
    return success(res, { value }, 'Attribute value updated');
  } catch (err) {
    if (err.code === 'NOT_FOUND') return notFound(res, err.message);
    if (err.code === 'CONFLICT') return conflict(res, err.message);
    next(err);
  }
};

// DELETE /api/v1/admin/attributes/:id/values/:vid
const deleteValue = async (req, res, next) => {
  try {
    await service.deleteValue(Number(req.params.id), Number(req.params.vid));
    return success(res, null, 'Attribute value deleted');
  } catch (err) {
    if (err.code === 'NOT_FOUND') return notFound(res, err.message);
    next(err);
  }
};

module.exports = { getAll, getOne, create, update, destroy, addValue, updateValue, deleteValue };

const service = require('./categories.service');
const { success, created, notFound, conflict, businessError } = require('../../../utils/response');

// GET /api/v1/categories
const getTree = async (req, res, next) => {
  try {
    const tree = await service.getTree();
    return success(res, { categories: tree });
  } catch (err) { next(err); }
};

// GET /api/v1/categories/:slug
const getBySlug = async (req, res, next) => {
  try {
    const category = await service.getBySlug(req.params.slug);
    return success(res, { category });
  } catch (err) {
    if (err.code === 'NOT_FOUND') return notFound(res, err.message);
    next(err);
  }
};

// GET /api/v1/admin/categories  (flat list for admin UI)
const getAll = async (req, res, next) => {
  try {
    const categories = await service.getAllFlat();
    return success(res, { categories });
  } catch (err) { next(err); }
};

// POST /api/v1/admin/categories
const create = async (req, res, next) => {
  try {
    const category = await service.createCategory(req.body);
    return created(res, { category }, 'Category created');
  } catch (err) {
    if (err.code === 'NOT_FOUND') return notFound(res, err.message);
    next(err);
  }
};

// PUT /api/v1/admin/categories/:id
const update = async (req, res, next) => {
  try {
    const category = await service.updateCategory(Number(req.params.id), req.body);
    return success(res, { category }, 'Category updated');
  } catch (err) {
    if (err.code === 'NOT_FOUND') return notFound(res, err.message);
    if (err.code === 'VALIDATION_ERROR') return businessError(res, err.message);
    next(err);
  }
};

// DELETE /api/v1/admin/categories/:id
const destroy = async (req, res, next) => {
  try {
    await service.deleteCategory(Number(req.params.id));
    return success(res, null, 'Category deleted');
  } catch (err) {
    if (err.code === 'NOT_FOUND') return notFound(res, err.message);
    if (err.code === 'HAS_CHILDREN') return businessError(res, err.message, 'HAS_CHILDREN');
    next(err);
  }
};

// GET /api/v1/categories/:slug/filters
const getFilters = async (req, res, next) => {
  try {
    const productService = require('../products/products.service');
    const result = await productService.getCategoryFilters(req.params.slug);
    return success(res, result);
  } catch (err) { next(err); }
};

module.exports = { getTree, getBySlug, getAll, create, update, destroy, getFilters };

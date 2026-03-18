const service = require('./products.service');
const { success, created, notFound, conflict, businessError } = require('../../../utils/response');

// ─── Public ───────────────────────────────────────────────────────────────────

// GET /api/v1/products
const getProducts = async (req, res, next) => {
  try {
    const result = await service.getProducts(req.query);
    return success(res, result);
  } catch (err) { next(err); }
};

// GET /api/v1/products/search?q=
const search = async (req, res, next) => {
  try {
    const result = await service.searchProducts(req.query.q, {
      page: req.query.page,
      limit: req.query.limit,
    });
    return success(res, result);
  } catch (err) {
    if (err.code === 'VALIDATION_ERROR') return businessError(res, err.message);
    next(err);
  }
};

// GET /api/v1/products/:slug
const getBySlug = async (req, res, next) => {
  try {
    const product = await service.getProductBySlug(req.params.slug);
    return success(res, { product });
  } catch (err) {
    if (err.code === 'NOT_FOUND') return notFound(res, err.message);
    next(err);
  }
};

// ─── Admin ────────────────────────────────────────────────────────────────────

// GET /api/v1/admin/products
const listAdmin = async (req, res, next) => {
  try {
    const result = await service.listAllForAdmin({ limit: req.query.limit, page: req.query.page });
    return success(res, result);
  } catch (err) { next(err); }
};

// GET /api/v1/admin/products/:id
const getById = async (req, res, next) => {
  try {
    const product = await service.getProductById(Number(req.params.id));
    return success(res, { product });
  } catch (err) {
    if (err.code === 'NOT_FOUND') return notFound(res, err.message);
    next(err);
  }
};

// POST /api/v1/admin/products
const create = async (req, res, next) => {
  try {
    const product = await service.createProduct(req.body);
    return created(res, { product }, 'Product created');
  } catch (err) { next(err); }
};

// PUT /api/v1/admin/products/:id
const update = async (req, res, next) => {
  try {
    const product = await service.updateProduct(Number(req.params.id), req.body);
    return success(res, { product }, 'Product updated');
  } catch (err) {
    if (err.code === 'NOT_FOUND') return notFound(res, err.message);
    next(err);
  }
};

// DELETE /api/v1/admin/products/:id
const destroy = async (req, res, next) => {
  try {
    await service.deleteProduct(Number(req.params.id));
    return success(res, null, 'Product deactivated');
  } catch (err) {
    if (err.code === 'NOT_FOUND') return notFound(res, err.message);
    next(err);
  }
};

// POST /api/v1/admin/products/:id/images
const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) return businessError(res, 'No image file provided');
    const image = await service.addImage(Number(req.params.id), req.file);
    return created(res, { image }, 'Image uploaded');
  } catch (err) {
    if (err.code === 'NOT_FOUND') return notFound(res, err.message);
    next(err);
  }
};

// DELETE /api/v1/admin/products/:id/images/:imgId
const deleteImage = async (req, res, next) => {
  try {
    await service.deleteImage(Number(req.params.id), Number(req.params.imgId));
    return success(res, null, 'Image deleted');
  } catch (err) {
    if (err.code === 'NOT_FOUND') return notFound(res, err.message);
    next(err);
  }
};

// POST /api/v1/admin/products/:id/variants
const addVariant = async (req, res, next) => {
  try {
    const variant = await service.createVariant(Number(req.params.id), req.body);
    return created(res, { variant }, 'Variant created');
  } catch (err) {
    if (err.code === 'NOT_FOUND') return notFound(res, err.message);
    if (err.code === 'CONFLICT') return conflict(res, err.message);
    next(err);
  }
};

// PUT /api/v1/admin/products/:id/variants/:vid
const updateVariant = async (req, res, next) => {
  try {
    const variant = await service.updateVariant(Number(req.params.id), Number(req.params.vid), req.body);
    return success(res, { variant }, 'Variant updated');
  } catch (err) {
    if (err.code === 'NOT_FOUND') return notFound(res, err.message);
    if (err.code === 'CONFLICT') return conflict(res, err.message);
    next(err);
  }
};

// DELETE /api/v1/admin/products/:id/variants/:vid
const deactivateVariant = async (req, res, next) => {
  try {
    await service.deactivateVariant(Number(req.params.id), Number(req.params.vid));
    return success(res, null, 'Variant deactivated');
  } catch (err) {
    if (err.code === 'NOT_FOUND') return notFound(res, err.message);
    next(err);
  }
};

module.exports = {
  getProducts, search, getBySlug,
  listAdmin, getById, create, update, destroy,
  uploadImage, deleteImage,
  addVariant, updateVariant, deactivateVariant,
};

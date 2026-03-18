const repo = require('./products.repository');
const slugify = require('../../../utils/slugify');
const { getOrSet, del, invalidatePattern, CACHE_KEYS, CACHE_TTL } = require('../../../utils/cache');
const storageService = require('../../storage/storage.service');
const xss = require('xss');

// Sanitize HTML fields to prevent XSS
const sanitizeProductData = (data) => {
  const out = { ...data };
  if (out.description != null) out.description = xss(out.description);
  if (out.short_description != null) out.short_description = xss(out.short_description);
  return out;
};

// Inventory blocking — defaults to true; replaced by feature_flags table in a later session
const isInventoryBlockingEnabled = () => process.env.INVENTORY_BLOCKING_ENABLED !== 'false';

const addStockStatus = (variant) => {
  const qty = Number(variant.stock_quantity ?? variant.dataValues?.stock_quantity);
  const isBlocking = isInventoryBlockingEnabled();
  return {
    ...((variant.dataValues || variant)),
    is_in_stock: isBlocking ? qty > 0 : true,
    is_low_stock: qty <= Number(variant.low_stock_threshold ?? 5) && qty > 0,
  };
};

// ─── Slug helpers ─────────────────────────────────────────────────────────────

const resolveUniqueSlug = async (rawSlug, excludeId = null) => {
  let slug = rawSlug;
  let counter = 1;
  while (await repo.slugExists(slug, excludeId)) {
    slug = `${rawSlug}-${counter++}`;
  }
  return slug;
};

// ─── Public listing ───────────────────────────────────────────────────────────

const getProducts = async (filters) => {
  const { page = 1, limit = 20, category, sort, min_price, max_price, attributes, in_stock, featured } = filters;

  const parsedLimit = Math.min(Number(limit) || 20, 100);
  const parsedPage = Math.max(Number(page) || 1, 1);

  // Build cache key from filter fingerprint
  const fingerprint = JSON.stringify({ category, sort, min_price, max_price, attributes, in_stock, featured, page: parsedPage, limit: parsedLimit });
  const cacheKey = CACHE_KEYS.PRODUCT_LISTING(fingerprint);

  return getOrSet(cacheKey, async () => {
    const { rows, total } = await repo.findListing({
      categorySlug: category,
      minPrice: min_price !== undefined ? Number(min_price) : undefined,
      maxPrice: max_price !== undefined ? Number(max_price) : undefined,
      attributes: attributes ? (typeof attributes === 'string' ? JSON.parse(attributes) : attributes) : undefined,
      inStock: in_stock === 'true' || in_stock === true,
      featured: featured === 'true' || featured === true,
      sort,
      page: parsedPage,
      limit: parsedLimit,
    });

    return {
      products: rows,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        total_pages: Math.ceil(total / parsedLimit),
      },
    };
  }, CACHE_TTL.PRODUCT_LISTING);
};

const searchProducts = async (q, { page = 1, limit = 20 } = {}) => {
  if (!q || q.trim().length < 2) {
    const err = new Error('Search query must be at least 2 characters');
    err.code = 'VALIDATION_ERROR';
    throw err;
  }
  const parsedLimit = Math.min(Number(limit) || 20, 100);
  const parsedPage = Math.max(Number(page) || 1, 1);
  const { rows, total } = await repo.searchProducts(q.trim(), { page: parsedPage, limit: parsedLimit });
  return {
    products: rows,
    pagination: { total, page: parsedPage, limit: parsedLimit, total_pages: Math.ceil(total / parsedLimit) },
  };
};

// ─── Public detail ────────────────────────────────────────────────────────────

const getProductBySlug = async (slug) => {
  const product = await repo.findBySlug(slug);
  if (!product) {
    const err = new Error('Product not found');
    err.code = 'NOT_FOUND';
    throw err;
  }
  const data = product.toJSON();
  data.variants = (data.variants || []).map(addStockStatus);
  return data;
};

// ─── Category filters ─────────────────────────────────────────────────────────

const getCategoryFilters = async (categorySlug) => {
  const cacheKey = CACHE_KEYS.CATALOG_FILTERS(categorySlug);
  return getOrSet(cacheKey, async () => {
    const rows = await repo.findFilterCounts(categorySlug);
    // Group by attribute
    const attrMap = new Map();
    for (const row of rows) {
      if (!attrMap.has(row.attr_id)) {
        attrMap.set(row.attr_id, {
          id: row.attr_id,
          name: row.attr_name,
          slug: row.attr_slug,
          values: [],
        });
      }
      attrMap.get(row.attr_id).values.push({
        id: row.val_id,
        value: row.val_value,
        slug: row.val_slug,
        color_hex: row.color_hex,
        product_count: Number(row.product_count),
      });
    }
    return { filters: Array.from(attrMap.values()) };
  }, CACHE_TTL.CATALOG_FILTERS);
};

// ─── Admin product CRUD ───────────────────────────────────────────────────────

const listAllForAdmin = async ({ limit = 200, page = 1 } = {}) => {
  const parsedLimit = Math.min(Number(limit) || 200, 500);
  const parsedPage = Math.max(Number(page) || 1, 1);
  const offset = (parsedPage - 1) * parsedLimit;
  const { rows, count } = await repo.findAllForAdmin({ limit: parsedLimit, offset });
  return {
    products: rows.map((p) => p.toJSON()),
    pagination: { total: count, page: parsedPage, limit: parsedLimit, total_pages: Math.ceil(count / parsedLimit) },
  };
};

const getProductById = async (id) => {
  const product = await repo.findById(id);
  if (!product) {
    const err = new Error('Product not found');
    err.code = 'NOT_FOUND';
    throw err;
  }
  const data = product.toJSON();
  data.variants = (data.variants || []).map(addStockStatus);
  return data;
};

const createProduct = async (data) => {
  const sanitized = sanitizeProductData(data);
  const rawSlug = sanitized.slug || slugify(sanitized.name);
  const slug = await resolveUniqueSlug(rawSlug);
  const product = await repo.createProduct({ ...sanitized, slug });
  await invalidatePattern('products:listing:*');
  return repo.findById(product.id);
};

const updateProduct = async (id, data) => {
  const existing = await repo.findById(id);
  if (!existing) {
    const err = new Error('Product not found');
    err.code = 'NOT_FOUND';
    throw err;
  }
  data = sanitizeProductData(data);
  if (data.name || data.slug) {
    const rawSlug = data.slug || slugify(data.name || existing.name);
    data.slug = await resolveUniqueSlug(rawSlug, id);
  }
  await repo.updateProduct(id, data);
  await invalidatePattern('products:listing:*');
  return repo.findById(id);
};

const deleteProduct = async (id) => {
  const existing = await repo.findById(id);
  if (!existing) {
    const err = new Error('Product not found');
    err.code = 'NOT_FOUND';
    throw err;
  }
  await repo.destroyProduct(id);
  await invalidatePattern('products:listing:*');
};

// ─── Images ───────────────────────────────────────────────────────────────────

const addImage = async (productId, file) => {
  const existing = await repo.findById(productId);
  if (!existing) {
    const err = new Error('Product not found');
    err.code = 'NOT_FOUND';
    throw err;
  }
  const url = storageService.uploadFile(file);
  return repo.createImage(productId, url, file.originalname);
};

const deleteImage = async (productId, imageId) => {
  const image = await repo.findImageById(imageId);
  if (!image || image.product_id !== productId) {
    const err = new Error('Image not found');
    err.code = 'NOT_FOUND';
    throw err;
  }
  storageService.deleteFile(image.url);
  await repo.destroyImage(imageId);
};

// ─── Variants ─────────────────────────────────────────────────────────────────

const createVariant = async (productId, data) => {
  const product = await repo.findById(productId);
  if (!product) {
    const err = new Error('Product not found');
    err.code = 'NOT_FOUND';
    throw err;
  }
  if (await repo.skuExists(data.sku)) {
    const err = new Error(`SKU "${data.sku}" already exists`);
    err.code = 'CONFLICT';
    throw err;
  }
  const variant = await repo.createVariant(productId, data);
  await invalidatePattern('products:listing:*');
  return variant;
};

const updateVariant = async (productId, variantId, data) => {
  const variant = await repo.findVariantById(variantId);
  if (!variant || variant.product_id !== productId) {
    const err = new Error('Variant not found');
    err.code = 'NOT_FOUND';
    throw err;
  }
  if (data.sku && await repo.skuExists(data.sku, variantId)) {
    const err = new Error(`SKU "${data.sku}" already exists`);
    err.code = 'CONFLICT';
    throw err;
  }
  const updated = await repo.updateVariant(variantId, data);
  await invalidatePattern('products:listing:*');
  return updated;
};

const deactivateVariant = async (productId, variantId) => {
  const variant = await repo.findVariantById(variantId);
  if (!variant || variant.product_id !== productId) {
    const err = new Error('Variant not found');
    err.code = 'NOT_FOUND';
    throw err;
  }
  await repo.deactivateVariant(variantId);
  await invalidatePattern('products:listing:*');
};

module.exports = {
  getProducts, searchProducts, getProductBySlug, getProductById, listAllForAdmin, getCategoryFilters,
  createProduct, updateProduct, deleteProduct,
  addImage, deleteImage,
  createVariant, updateVariant, deactivateVariant,
};

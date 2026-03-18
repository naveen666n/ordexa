const { Product, ProductVariant, ProductImage, Category, Attribute, AttributeValue, sequelize } = require('../../../models');
const { QueryTypes, Op } = require('sequelize');
const slugify = require('../../../utils/slugify');

// ─── Product CRUD ─────────────────────────────────────────────────────────────

const findById = (id) =>
  Product.findByPk(id, {
    include: [
      {
        model: ProductVariant,
        as: 'variants',
        where: { is_active: true },
        required: false,
        include: [
          { model: AttributeValue, as: 'attributeValues', include: [{ model: Attribute, as: 'attribute' }] },
          { model: ProductImage, as: 'images', order: [['sort_order', 'ASC']] },
        ],
      },
      { model: ProductImage, as: 'images', order: [['sort_order', 'ASC'], ['is_primary', 'DESC']] },
      { model: Category, as: 'categories' },
    ],
  });

const findBySlug = (slug) =>
  Product.findOne({
    where: { slug, is_active: true },
    include: [
      {
        model: ProductVariant,
        as: 'variants',
        where: { is_active: true },
        required: false,
        include: [
          { model: AttributeValue, as: 'attributeValues', include: [{ model: Attribute, as: 'attribute' }] },
          { model: ProductImage, as: 'images', order: [['sort_order', 'ASC']] },
        ],
      },
      { model: ProductImage, as: 'images', order: [['sort_order', 'ASC'], ['is_primary', 'DESC']] },
      { model: Category, as: 'categories' },
    ],
  });

const slugExists = async (slug, excludeId = null) => {
  const where = { slug };
  if (excludeId) where.id = { [Op.ne]: excludeId };
  return (await Product.count({ where })) > 0;
};

const createProduct = async (data) => {
  const { category_ids, ...productData } = data;
  const product = await Product.create(productData);
  if (category_ids && category_ids.length) {
    await product.setCategories(category_ids);
  }
  return product;
};

const updateProduct = async (id, data) => {
  const { category_ids, ...productData } = data;
  if (Object.keys(productData).length) {
    await Product.update(productData, { where: { id } });
  }
  if (category_ids !== undefined) {
    const product = await Product.findByPk(id);
    await product.setCategories(category_ids);
  }
};

const destroyProduct = (id) => Product.update({ is_active: false }, { where: { id } });

// ─── Product listing (raw SQL for performance) ────────────────────────────────

const buildListingQuery = ({ categorySlug, minPrice, maxPrice, attributes, inStock, featured, sort, page, limit }) => {
  const params = [];
  let joins = '';
  let where = 'WHERE p.is_active = 1';
  let having = '';

  if (categorySlug) {
    joins += `
      JOIN product_categories pc ON pc.product_id = p.id
      JOIN categories cat ON cat.id = pc.category_id AND cat.slug = ?`;
    params.push(categorySlug);
  }

  // Attribute filters: each attribute slug key maps to array of value slugs
  if (attributes && typeof attributes === 'object') {
    const attrEntries = Object.entries(attributes);
    attrEntries.forEach(([attrSlug, valueSlugs], i) => {
      if (!Array.isArray(valueSlugs) || valueSlugs.length === 0) return;
      const alias = `vav${i}`;
      const avAlias = `av${i}`;
      const aAlias = `a${i}`;
      const placeholders = valueSlugs.map(() => '?').join(',');
      joins += `
        JOIN product_variants pv_attr${i} ON pv_attr${i}.product_id = p.id AND pv_attr${i}.is_active = 1
        JOIN variant_attribute_values ${alias} ON ${alias}.variant_id = pv_attr${i}.id
        JOIN attribute_values ${avAlias} ON ${avAlias}.id = ${alias}.attribute_value_id AND ${avAlias}.slug IN (${placeholders})
        JOIN attributes ${aAlias} ON ${aAlias}.id = ${avAlias}.attribute_id AND ${aAlias}.slug = ?`;
      params.push(...valueSlugs, attrSlug);
    });
  }

  if (featured) {
    where += ' AND p.is_featured = 1';
  }

  if (minPrice !== undefined) {
    having += (having ? ' AND ' : 'HAVING ') + 'min_price >= ?';
    params.push(minPrice);
  }
  if (maxPrice !== undefined) {
    having += (having ? ' AND ' : 'HAVING ') + 'max_price <= ?';
    params.push(maxPrice);
  }
  if (inStock) {
    having += (having ? ' AND ' : 'HAVING ') + 'has_stock = 1';
  }

  let orderBy;
  switch (sort) {
    case 'price_asc': orderBy = 'min_price ASC'; break;
    case 'price_desc': orderBy = 'max_price DESC'; break;
    case 'featured': orderBy = 'p.is_featured DESC, p.sort_order ASC'; break;
    case 'newest': orderBy = 'p.created_at DESC'; break;
    default: orderBy = 'p.sort_order ASC, p.created_at DESC';
  }

  const offset = (page - 1) * limit;

  const baseSelect = `
    SELECT
      p.id, p.name, p.slug, p.brand, p.is_featured, p.sort_order, p.created_at,
      MIN(pv.price) as min_price,
      MAX(pv.price) as max_price,
      SUM(CASE WHEN pv.is_active = 1 AND pv.stock_quantity > 0 THEN 1 ELSE 0 END) > 0 as has_stock,
      COUNT(DISTINCT pv.id) as variant_count,
      pi.url as primary_image_url,
      pi.alt_text as primary_image_alt
    FROM products p
    LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.is_active = 1
    LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = 1
    ${joins}
    ${where}
    GROUP BY p.id, p.name, p.slug, p.brand, p.is_featured, p.sort_order, p.created_at, pi.url, pi.alt_text
    ${having}
  `;

  const countSql = `SELECT COUNT(*) as total FROM (${baseSelect}) as counted`;
  const listSql = `${baseSelect} ORDER BY ${orderBy} LIMIT ? OFFSET ?`;

  return { listSql, countSql, listParams: [...params, limit, offset], countParams: [...params] };
};

const findListing = async (filters) => {
  const { listSql, countSql, listParams, countParams } = buildListingQuery(filters);
  const [rows, countRows] = await Promise.all([
    sequelize.query(listSql, { replacements: listParams, type: QueryTypes.SELECT }),
    sequelize.query(countSql, { replacements: countParams, type: QueryTypes.SELECT }),
  ]);
  return { rows, total: countRows[0].total };
};

// ─── FULLTEXT search ──────────────────────────────────────────────────────────

const searchProducts = async (q, { page = 1, limit = 20 } = {}) => {
  const offset = (page - 1) * limit;
  const sql = `
    SELECT
      p.id, p.name, p.slug, p.brand, p.is_featured,
      MIN(pv.price) as min_price, MAX(pv.price) as max_price,
      pi.url as primary_image_url,
      MATCH(p.name, p.description, p.brand) AGAINST(? IN BOOLEAN MODE) as relevance
    FROM products p
    LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.is_active = 1
    LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = 1
    WHERE p.is_active = 1
      AND MATCH(p.name, p.description, p.brand) AGAINST(? IN BOOLEAN MODE)
    GROUP BY p.id, p.name, p.slug, p.brand, p.is_featured, pi.url, relevance
    ORDER BY relevance DESC
    LIMIT ? OFFSET ?
  `;
  const countSql = `
    SELECT COUNT(*) as total FROM products p
    WHERE p.is_active = 1
      AND MATCH(p.name, p.description, p.brand) AGAINST(? IN BOOLEAN MODE)
  `;
  const [rows, countRows] = await Promise.all([
    sequelize.query(sql, { replacements: [q, q, limit, offset], type: QueryTypes.SELECT }),
    sequelize.query(countSql, { replacements: [q], type: QueryTypes.SELECT }),
  ]);
  return { rows, total: countRows[0].total };
};

// ─── Filter counts per category ───────────────────────────────────────────────

const findFilterCounts = async (categorySlug) => {
  const sql = `
    SELECT
      a.id as attr_id, a.name as attr_name, a.slug as attr_slug, a.sort_order as attr_sort,
      av.id as val_id, av.value as val_value, av.slug as val_slug, av.color_hex, av.sort_order as val_sort,
      COUNT(DISTINCT p.id) as product_count
    FROM products p
    JOIN product_categories pc ON pc.product_id = p.id
    JOIN categories cat ON cat.id = pc.category_id AND cat.slug = ?
    JOIN product_variants pv ON pv.product_id = p.id AND pv.is_active = 1
    JOIN variant_attribute_values vav ON vav.variant_id = pv.id
    JOIN attribute_values av ON av.id = vav.attribute_value_id
    JOIN attributes a ON a.id = av.attribute_id AND a.is_filterable = 1 AND a.is_visible = 1
    WHERE p.is_active = 1
    GROUP BY a.id, a.name, a.slug, a.sort_order, av.id, av.value, av.slug, av.color_hex, av.sort_order
    ORDER BY a.sort_order ASC, a.name ASC, av.sort_order ASC, av.value ASC
  `;
  return sequelize.query(sql, { replacements: [categorySlug], type: QueryTypes.SELECT });
};

// ─── Images ───────────────────────────────────────────────────────────────────

const findImageById = (id) => ProductImage.findByPk(id);

const createImage = async (productId, url, altText) => {
  const hasPrimary = await ProductImage.count({ where: { product_id: productId, is_primary: true } });
  return ProductImage.create({
    product_id: productId,
    url,
    alt_text: altText || null,
    is_primary: hasPrimary === 0,
    sort_order: await ProductImage.count({ where: { product_id: productId } }),
  });
};

const destroyImage = (id) => ProductImage.destroy({ where: { id } });

// ─── Variants ─────────────────────────────────────────────────────────────────

const findVariantById = (id) =>
  ProductVariant.findByPk(id, {
    include: [{ model: AttributeValue, as: 'attributeValues', include: [{ model: Attribute, as: 'attribute' }] }],
  });

const skuExists = async (sku, excludeId = null) => {
  const where = { sku };
  if (excludeId) where.id = { [Op.ne]: excludeId };
  return (await ProductVariant.count({ where })) > 0;
};

const createVariant = async (productId, data) => {
  const { attribute_value_ids, ...variantData } = data;
  const variant = await ProductVariant.create({ ...variantData, product_id: productId });
  if (attribute_value_ids && attribute_value_ids.length) {
    await variant.setAttributeValues(attribute_value_ids);
  }
  return findVariantById(variant.id);
};

const updateVariant = async (id, data) => {
  const { attribute_value_ids, ...variantData } = data;
  if (Object.keys(variantData).length) {
    await ProductVariant.update(variantData, { where: { id } });
  }
  if (attribute_value_ids !== undefined) {
    const variant = await ProductVariant.findByPk(id);
    await variant.setAttributeValues(attribute_value_ids);
  }
  return findVariantById(id);
};

const deactivateVariant = (id) => ProductVariant.update({ is_active: false }, { where: { id } });

// Admin list — includes inactive products, with minimal includes for performance
const findAllForAdmin = ({ limit = 200, offset = 0 } = {}) =>
  Product.findAndCountAll({
    limit,
    offset,
    order: [['id', 'DESC']],
    include: [
      { model: ProductImage, as: 'images', order: [['is_primary', 'DESC'], ['sort_order', 'ASC']], required: false },
      { model: Category, as: 'categories', required: false },
      {
        model: ProductVariant,
        as: 'variants',
        where: { is_active: true },
        required: false,
        attributes: ['id', 'price', 'stock_quantity'],
      },
    ],
  });

module.exports = {
  findById, findBySlug, slugExists, createProduct, updateProduct, destroyProduct,
  findListing, findAllForAdmin, searchProducts, findFilterCounts,
  findImageById, createImage, destroyImage,
  findVariantById, skuExists, createVariant, updateVariant, deactivateVariant,
};

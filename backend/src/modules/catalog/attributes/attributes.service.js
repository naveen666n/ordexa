const repo = require('./attributes.repository');
const slugify = require('../../../utils/slugify');

// ─── Attributes ───────────────────────────────────────────────────────────────

const getAll = () => repo.findAll();

const getById = async (id) => {
  const attr = await repo.findById(id);
  if (!attr) {
    const err = new Error('Attribute not found');
    err.code = 'NOT_FOUND';
    throw err;
  }
  return attr;
};

const createAttribute = async (data) => {
  const rawSlug = data.slug || slugify(data.name);
  let slug = rawSlug;
  let counter = 1;
  while (await repo.slugExists(slug)) {
    slug = `${rawSlug}-${counter++}`;
  }
  return repo.createAttribute({ ...data, slug });
};

const updateAttribute = async (id, data) => {
  const existing = await repo.findById(id);
  if (!existing) {
    const err = new Error('Attribute not found');
    err.code = 'NOT_FOUND';
    throw err;
  }

  if (data.name || data.slug) {
    const rawSlug = data.slug || slugify(data.name || existing.name);
    let slug = rawSlug;
    let counter = 1;
    while (await repo.slugExists(slug, id)) {
      slug = `${rawSlug}-${counter++}`;
    }
    data.slug = slug;
  }

  await repo.updateAttribute(id, data);
  return repo.findById(id);
};

const deleteAttribute = async (id) => {
  const existing = await repo.findById(id);
  if (!existing) {
    const err = new Error('Attribute not found');
    err.code = 'NOT_FOUND';
    throw err;
  }
  // Values cascade-delete via FK
  await repo.destroyAttribute(id);
};

// ─── Attribute Values ─────────────────────────────────────────────────────────

const addValue = async (attributeId, data) => {
  const attr = await repo.findById(attributeId);
  if (!attr) {
    const err = new Error('Attribute not found');
    err.code = 'NOT_FOUND';
    throw err;
  }

  const rawSlug = data.slug || slugify(data.value);
  // Check slug uniqueness within this attribute
  const existing = await repo.findValueBySlug(attributeId, rawSlug);
  if (existing) {
    const err = new Error(`Value with slug "${rawSlug}" already exists for this attribute`);
    err.code = 'CONFLICT';
    throw err;
  }

  return repo.createValue({ ...data, attribute_id: attributeId, slug: rawSlug });
};

const updateValue = async (attributeId, valueId, data) => {
  const value = await repo.findValueById(valueId);
  if (!value || value.attribute_id !== attributeId) {
    const err = new Error('Attribute value not found');
    err.code = 'NOT_FOUND';
    throw err;
  }

  if (data.value || data.slug) {
    const rawSlug = data.slug || slugify(data.value || value.value);
    const conflict = await repo.findValueBySlug(attributeId, rawSlug, valueId);
    if (conflict) {
      const err = new Error(`Value with slug "${rawSlug}" already exists for this attribute`);
      err.code = 'CONFLICT';
      throw err;
    }
    data.slug = rawSlug;
  }

  await repo.updateValue(valueId, data);
  return repo.findValueById(valueId);
};

const deleteValue = async (attributeId, valueId) => {
  const value = await repo.findValueById(valueId);
  if (!value || value.attribute_id !== attributeId) {
    const err = new Error('Attribute value not found');
    err.code = 'NOT_FOUND';
    throw err;
  }
  await repo.destroyValue(valueId);
};

module.exports = {
  getAll, getById, createAttribute, updateAttribute, deleteAttribute,
  addValue, updateValue, deleteValue,
};

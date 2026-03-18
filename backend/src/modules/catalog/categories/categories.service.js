const repo = require('./categories.repository');
const slugify = require('../../../utils/slugify');
const { getOrSet, del, CACHE_KEYS, CACHE_TTL } = require('../../../utils/cache');

// ─── Tree builder ─────────────────────────────────────────────────────────────
// Builds a nested tree from a flat list in O(n) using a map.

const buildTree = (flatList) => {
  const map = {};
  const roots = [];

  flatList.forEach((cat) => {
    map[cat.id] = { ...cat.toJSON(), children: [] };
  });

  flatList.forEach((cat) => {
    if (cat.parent_id && map[cat.parent_id]) {
      map[cat.parent_id].children.push(map[cat.id]);
    } else {
      roots.push(map[cat.id]);
    }
  });

  return roots;
};

// ─── Public ───────────────────────────────────────────────────────────────────

const getTree = async () => {
  return getOrSet(
    CACHE_KEYS.CATEGORY_TREE,
    async () => {
      const all = await repo.findAll();
      return buildTree(all);
    },
    CACHE_TTL.CATEGORY_TREE
  );
};

const getBySlug = async (slug) => {
  const cat = await repo.findBySlug(slug);
  if (!cat) {
    const err = new Error('Category not found');
    err.code = 'NOT_FOUND';
    throw err;
  }
  return cat;
};

// ─── Admin ────────────────────────────────────────────────────────────────────

const createCategory = async (data) => {
  // Auto-generate slug if not provided
  const rawSlug = data.slug || slugify(data.name);

  // Ensure slug is unique — append counter if needed
  let slug = rawSlug;
  let counter = 1;
  while (await repo.slugExists(slug)) {
    slug = `${rawSlug}-${counter++}`;
  }

  // Validate parent exists
  if (data.parent_id) {
    const parent = await repo.findById(data.parent_id);
    if (!parent) {
      const err = new Error('Parent category not found');
      err.code = 'NOT_FOUND';
      throw err;
    }
  }

  const category = await repo.create({ ...data, slug });
  await del(CACHE_KEYS.CATEGORY_TREE);
  return category;
};

const updateCategory = async (id, data) => {
  const existing = await repo.findById(id);
  if (!existing) {
    const err = new Error('Category not found');
    err.code = 'NOT_FOUND';
    throw err;
  }

  // Handle slug update
  if (data.slug || data.name) {
    const rawSlug = data.slug || slugify(data.name || existing.name);
    let slug = rawSlug;
    let counter = 1;
    while (await repo.slugExists(slug, id)) {
      slug = `${rawSlug}-${counter++}`;
    }
    data.slug = slug;
  }

  // Prevent circular parent
  if (data.parent_id) {
    if (data.parent_id === id) {
      const err = new Error('A category cannot be its own parent');
      err.code = 'VALIDATION_ERROR';
      throw err;
    }
    const parent = await repo.findById(data.parent_id);
    if (!parent) {
      const err = new Error('Parent category not found');
      err.code = 'NOT_FOUND';
      throw err;
    }
  }

  await repo.update(id, data);
  await del(CACHE_KEYS.CATEGORY_TREE);
  return repo.findById(id);
};

const deleteCategory = async (id) => {
  const existing = await repo.findById(id);
  if (!existing) {
    const err = new Error('Category not found');
    err.code = 'NOT_FOUND';
    throw err;
  }

  // Block deletion if children exist (RESTRICT strategy — documented)
  const children = await repo.findChildrenOf(id);
  if (children.length > 0) {
    const err = new Error(`Cannot delete category with ${children.length} child category(ies). Remove children first.`);
    err.code = 'HAS_CHILDREN';
    throw err;
  }

  await repo.destroy(id);
  await del(CACHE_KEYS.CATEGORY_TREE);
};

// Admin list (flat, all statuses)
const getAllFlat = async () => {
  return repo.findAll();
};

module.exports = { getTree, getBySlug, createCategory, updateCategory, deleteCategory, getAllFlat };

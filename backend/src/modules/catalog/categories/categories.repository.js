const { Category } = require('../../../models');

const findAll = () =>
  Category.findAll({ order: [['sort_order', 'ASC'], ['name', 'ASC']] });

const findBySlug = (slug) =>
  Category.findOne({
    where: { slug, is_active: true },
    include: [{ model: Category, as: 'children', where: { is_active: true }, required: false, order: [['sort_order', 'ASC']] }],
  });

const findById = (id) =>
  Category.findByPk(id);

const findChildrenOf = (parentId) =>
  Category.findAll({ where: { parent_id: parentId } });

const create = (data) => Category.create(data);

const update = (id, data) =>
  Category.update(data, { where: { id } });

const destroy = (id) =>
  Category.destroy({ where: { id } });

const slugExists = async (slug, excludeId = null) => {
  const where = { slug };
  if (excludeId) {
    const { Op } = require('sequelize');
    where.id = { [Op.ne]: excludeId };
  }
  const count = await Category.count({ where });
  return count > 0;
};

module.exports = { findAll, findBySlug, findById, findChildrenOf, create, update, destroy, slugExists };

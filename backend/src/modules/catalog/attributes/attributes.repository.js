const { Attribute, AttributeValue } = require('../../../models');

// ─── Attributes ───────────────────────────────────────────────────────────────

const findAll = () =>
  Attribute.findAll({
    include: [{ model: AttributeValue, as: 'values', order: [['sort_order', 'ASC'], ['value', 'ASC']] }],
    order: [['sort_order', 'ASC'], ['name', 'ASC']],
  });

const findById = (id) =>
  Attribute.findByPk(id, {
    include: [{ model: AttributeValue, as: 'values', order: [['sort_order', 'ASC']] }],
  });

const findFilterable = () =>
  Attribute.findAll({
    where: { is_filterable: true, is_visible: true },
    include: [{ model: AttributeValue, as: 'values', order: [['sort_order', 'ASC']] }],
    order: [['sort_order', 'ASC']],
  });

const createAttribute = (data) => Attribute.create(data);

const updateAttribute = (id, data) =>
  Attribute.update(data, { where: { id } });

const destroyAttribute = (id) =>
  Attribute.destroy({ where: { id } });

const slugExists = async (slug, excludeId = null) => {
  const { Op } = require('sequelize');
  const where = { slug };
  if (excludeId) where.id = { [Op.ne]: excludeId };
  return (await Attribute.count({ where })) > 0;
};

// ─── Attribute Values ─────────────────────────────────────────────────────────

const findValueById = (id) => AttributeValue.findByPk(id);

const findValueBySlug = async (attributeId, slug, excludeId = null) => {
  const { Op } = require('sequelize');
  const where = { attribute_id: attributeId, slug };
  if (excludeId) where.id = { [Op.ne]: excludeId };
  return AttributeValue.findOne({ where });
};

const createValue = (data) => AttributeValue.create(data);

const updateValue = (id, data) =>
  AttributeValue.update(data, { where: { id } });

const destroyValue = (id) =>
  AttributeValue.destroy({ where: { id } });

module.exports = {
  findAll, findById, findFilterable, createAttribute, updateAttribute, destroyAttribute, slugExists,
  findValueById, findValueBySlug, createValue, updateValue, destroyValue,
};

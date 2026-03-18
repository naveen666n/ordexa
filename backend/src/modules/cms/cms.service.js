'use strict';

const CmsContent = require('../../models/CmsContent');
const xss = require('xss');

// Keys that may contain HTML — sanitized before storage
const HTML_CMS_KEYS = ['body', 'content', 'description', 'html'];

const sanitizeCmsValue = (key, val) => {
  if (typeof val === 'string' && HTML_CMS_KEYS.some((k) => key.includes(k))) {
    return xss(val);
  }
  return val;
};

/**
 * Parse a stored value based on value_type.
 */
const parseValue = (val, valueType) => {
  if (val === null || val === undefined) return null;
  if (valueType === 'json') {
    try { return JSON.parse(val); } catch { return val; }
  }
  return val;
};

/**
 * Get a section as { key: parsedValue }.
 */
const getSection = async (section) => {
  const rows = await CmsContent.findAll({ where: { section } });
  const result = {};
  for (const row of rows) {
    result[row.key] = parseValue(row.value, row.value_type);
  }
  return result;
};

/**
 * Upsert each key/value pair for a section.
 */
const updateSection = async (section, data) => {
  for (const [key, val] of Object.entries(data)) {
    const existing = await CmsContent.findOne({ where: { section, key } });
    const sanitized = sanitizeCmsValue(key, val);
    const serialized = (sanitized === null || sanitized === undefined) ? null : String(sanitized);

    if (existing) {
      await existing.update({ value: serialized });
    } else {
      await CmsContent.create({ section, key, value: serialized, value_type: 'string' });
    }
  }
};

/**
 * Get all cms_content rows grouped by section.
 */
const getAllSections = async () => {
  const rows = await CmsContent.findAll({ order: [['section', 'ASC'], ['key', 'ASC']] });
  const grouped = {};
  for (const row of rows) {
    if (!grouped[row.section]) grouped[row.section] = {};
    grouped[row.section][row.key] = parseValue(row.value, row.value_type);
  }
  return grouped;
};

module.exports = { getSection, updateSection, getAllSections };

'use strict';

const SiteConfig = require('../../models/SiteConfig');
const FeatureFlag = require('../../models/FeatureFlag');

const DEFAULT_CANCELLABLE_STATUSES = ['pending', 'paid', 'processing'];

/**
 * Infer value_type from a JS value
 */
const inferType = (val) => {
  if (val === null || val === undefined) return 'string';
  if (typeof val === 'boolean') return 'boolean';
  if (typeof val === 'number') return 'number';
  if (typeof val === 'object') return 'json';
  return 'string';
};

/**
 * Parse a stored string value back to its typed value.
 */
const parseValue = (strVal, valueType) => {
  if (strVal === null || strVal === undefined) return null;
  if (valueType === 'boolean') return strVal === 'true';
  if (valueType === 'number') return Number(strVal);
  if (valueType === 'json') {
    try { return JSON.parse(strVal); } catch { return strVal; }
  }
  return strVal;
};

/**
 * Serialize a value to string for storage.
 */
const serializeValue = (val) => {
  if (val === null || val === undefined) return null;
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
};

/**
 * Get all rows for a group as { key: value } — secrets are masked as null.
 */
const getGroup = async (group) => {
  const rows = await SiteConfig.findAll({ where: { group } });
  const result = {};
  for (const row of rows) {
    result[row.key] = row.is_secret ? null : parseValue(row.value, row.value_type);
  }
  return result;
};

/**
 * Get all rows for a group as { key: value } — secrets shown as actual values (admin only).
 */
const getGroupRaw = async (group) => {
  const rows = await SiteConfig.findAll({ where: { group } });
  const result = {};
  for (const row of rows) {
    // Secrets are returned as null even in raw (write-only pattern — admin sets but never reads back)
    result[row.key] = row.is_secret ? null : parseValue(row.value, row.value_type);
  }
  return result;
};

/**
 * Upsert each key/value for the group from a plain object.
 * If a key value is null and the row is secret, skip (keep existing).
 */
const updateGroup = async (group, data) => {
  for (const [key, val] of Object.entries(data)) {
    // Find existing row
    const existing = await SiteConfig.findOne({ where: { group, key } });

    // If the field is secret and incoming value is null or empty string, skip update
    if (existing && existing.is_secret && (val === null || val === '')) {
      continue;
    }

    const valueType = existing ? existing.value_type : inferType(val);
    const serialized = serializeValue(val);

    if (existing) {
      await existing.update({ value: serialized, value_type: valueType });
    } else {
      await SiteConfig.create({
        group,
        key,
        value: serialized,
        value_type: valueType,
        is_secret: false,
      });
    }
  }
};

/**
 * Get the currently configured cancellable statuses for customer orders.
 * Reads from SiteConfig group='orders', key='cancellable_statuses'.
 * Falls back to the default list if not yet configured.
 */
const getCancellableStatuses = async () => {
  const row = await SiteConfig.findOne({ where: { group: 'orders', key: 'cancellable_statuses' } });
  if (row) {
    const parsed = parseValue(row.value, row.value_type);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  }
  return DEFAULT_CANCELLABLE_STATUSES;
};

/**
 * Return public config for ConfigContext:
 * { site, theme, features, contact, order }
 */
const getPublicConfig = async () => {
  const [siteRows, themeRows, flagRows] = await Promise.all([
    SiteConfig.findAll({ where: { group: 'site' } }),
    SiteConfig.findAll({ where: { group: 'theme' } }),
    FeatureFlag.findAll(),
  ]);

  const site = {};
  for (const row of siteRows) {
    if (!row.is_secret) site[row.key] = parseValue(row.value, row.value_type);
  }

  const theme = {};
  for (const row of themeRows) {
    if (!row.is_secret) theme[row.key] = parseValue(row.value, row.value_type);
  }

  const features = {};
  for (const flag of flagRows) {
    features[flag.key] = flag.enabled;
  }

  const contact = {
    email: site.contact_email || '',
    phone: site.contact_phone || '',
  };

  const cancellableStatuses = await getCancellableStatuses();

  return { site, theme, features, contact, order: { cancellable_statuses: cancellableStatuses } };
};

module.exports = { getGroup, getGroupRaw, updateGroup, getPublicConfig, getCancellableStatuses };

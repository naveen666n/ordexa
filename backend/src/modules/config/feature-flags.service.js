'use strict';

const FeatureFlag = require('../../models/FeatureFlag');

/**
 * Get all feature flags.
 */
const getAll = async () => {
  return FeatureFlag.findAll({ order: [['key', 'ASC']] });
};

/**
 * Toggle (upsert) a feature flag.
 */
const toggleFlag = async (key, enabled) => {
  const [flag] = await FeatureFlag.findOrCreate({
    where: { key },
    defaults: { key, enabled: !!enabled, description: '' },
  });

  if (flag.enabled !== !!enabled) {
    await flag.update({ enabled: !!enabled });
  }

  return flag;
};

module.exports = { getAll, toggleFlag };

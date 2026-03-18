const { getRedisClient } = require('../config/redis');

const DEFAULT_TTL = 3600; // 1 hour in seconds

const get = async (key) => {
  try {
    const client = getRedisClient();
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch (err) {
    console.error(`Cache GET error for key "${key}":`, err.message);
    return null;
  }
};

const set = async (key, value, ttlSeconds = DEFAULT_TTL) => {
  try {
    const client = getRedisClient();
    await client.setex(key, ttlSeconds, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error(`Cache SET error for key "${key}":`, err.message);
    return false;
  }
};

const del = async (key) => {
  try {
    const client = getRedisClient();
    await client.del(key);
    return true;
  } catch (err) {
    console.error(`Cache DEL error for key "${key}":`, err.message);
    return false;
  }
};

const invalidatePattern = async (pattern) => {
  try {
    const client = getRedisClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
    return true;
  } catch (err) {
    console.error(`Cache INVALIDATE error for pattern "${pattern}":`, err.message);
    return false;
  }
};

const getOrSet = async (key, fetchFn, ttlSeconds = DEFAULT_TTL) => {
  const cached = await get(key);
  if (cached !== null) return cached;

  const fresh = await fetchFn();
  await set(key, fresh, ttlSeconds);
  return fresh;
};

const CACHE_KEYS = {
  PUBLIC_CONFIG: 'config:public',
  FEATURE_FLAGS: 'config:features',
  CATEGORY_TREE: 'categories:tree',
  CMS_SECTION: (section) => `cms:section:${section}`,
  CATALOG_FILTERS: (slug) => `filters:${slug}`,
  PRODUCT_LISTING: (fingerprint) => `products:listing:${fingerprint}`,
};

const CACHE_TTL = {
  PUBLIC_CONFIG: 3600,    // 1 hour
  FEATURE_FLAGS: 3600,    // 1 hour
  CATEGORY_TREE: 1800,    // 30 mins
  CMS_SECTION: 3600,      // 1 hour
  CATALOG_FILTERS: 1800,  // 30 mins
  PRODUCT_LISTING: 600,   // 10 mins
};

module.exports = {
  get,
  set,
  del,
  invalidatePattern,
  getOrSet,
  CACHE_KEYS,
  CACHE_TTL,
};

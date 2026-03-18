/**
 * Converts a string to a URL-safe slug.
 * e.g. "Men's Clothing & Shoes" → "mens-clothing-shoes"
 */
const slugify = (text) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/['']/g, '')          // remove apostrophes
    .replace(/[^a-z0-9\s-]/g, '') // strip non-alphanumeric
    .replace(/[\s_]+/g, '-')      // spaces/underscores → hyphens
    .replace(/-+/g, '-')          // collapse multiple hyphens
    .replace(/^-|-$/g, '');       // trim leading/trailing hyphens

module.exports = slugify;

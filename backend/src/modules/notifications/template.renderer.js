'use strict';
const cmsService = require('../cms/cms.service');

// Cache templates for 5 minutes
let _cache = null;
let _cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

const loadTemplates = async () => {
  const now = Date.now();
  if (_cache && now - _cacheTime < CACHE_TTL) return _cache;
  _cache = await cmsService.getSection('email_template');
  _cacheTime = now;
  return _cache;
};

/**
 * Render a template by key, replacing {{variable}} placeholders.
 * @param {string} templateKey — key in email_template section
 * @param {Object} variables — { order_number, customer_name, ... }
 * @returns {{ subject: string, html: string }}
 */
const render = async (templateKey, variables = {}) => {
  const templates = await loadTemplates();
  let html = templates[templateKey] || `<p>Notification: ${templateKey}</p>`;

  for (const [key, val] of Object.entries(variables)) {
    html = html.replaceAll(`{{${key}}}`, val ?? '');
  }

  // Extract subject from first <title> or first <h1> tag, or use template key
  const subjectMatch = html.match(/<title>(.*?)<\/title>/i) || html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  const subject = subjectMatch ? subjectMatch[1].replace(/<[^>]*>/g, '').trim() : templateKey.replace(/_/g, ' ');

  return { subject, html };
};

module.exports = { render };

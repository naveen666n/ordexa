import client from '../client';

const getGroup = (group) => client.get(`/admin/config/${group}`);
const updateGroup = (group, body) => client.put(`/admin/config/${group}`, body);
const getFeatureFlags = () => client.get('/admin/config/feature-flags');
const toggleFlag = (key, enabled) => client.patch(`/admin/config/feature-flags/${key}`, { enabled });
const getShippingRules = () => client.get('/admin/shipping/rules');
const createShippingRule = (body) => client.post('/admin/shipping/rules', body);
const updateShippingRule = (id, body) => client.put(`/admin/shipping/rules/${id}`, body);
const deleteShippingRule = (id) => client.delete(`/admin/shipping/rules/${id}`);
const getTaxRules = () => client.get('/admin/tax/rules');
const createTaxRule = (body) => client.post('/admin/tax/rules', body);
const updateTaxRule = (id, body) => client.put(`/admin/tax/rules/${id}`, body);
const deleteTaxRule = (id) => client.delete(`/admin/tax/rules/${id}`);
const testEmail = () => client.post('/admin/config/test-email');
const testSms = () => client.post('/admin/config/test-sms');

export default {
  getGroup,
  updateGroup,
  getFeatureFlags,
  toggleFlag,
  getShippingRules,
  createShippingRule,
  updateShippingRule,
  deleteShippingRule,
  getTaxRules,
  createTaxRule,
  updateTaxRule,
  deleteTaxRule,
  testEmail,
  testSms,
};

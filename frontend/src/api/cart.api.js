import client from './client';

const get = () => client.get('/cart');
const addItem = (variantId, quantity = 1) =>
  client.post('/cart/items', { variant_id: variantId, quantity });
const updateItem = (variantId, quantity) =>
  client.put(`/cart/items/${variantId}`, { quantity });
const removeItem = (variantId) => client.delete(`/cart/items/${variantId}`);
const clear = () => client.delete('/cart');
const applyCoupon = (code) => client.post('/cart/apply-coupon', { code });
const removeCoupon = () => client.delete('/cart/remove-coupon');
const getSummary = (region = null) => client.post('/cart/summary', { region });
const getAvailableCoupons = () => client.get('/cart/available-coupons');

export default { get, addItem, updateItem, removeItem, clear, applyCoupon, removeCoupon, getSummary, getAvailableCoupons };

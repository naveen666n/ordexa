import client from '../client';

const list = (params = {}) => client.get('/admin/orders', { params });
const getByNumber = (orderNumber) => client.get(`/admin/orders/${orderNumber}`);
const refund = (paymentId, amount) => client.post(`/admin/payments/${paymentId}/refund`, { amount });
const getProductOrders = (productId, params = {}) => client.get(`/admin/products/${productId}/orders`, { params });

export default { list, getByNumber, refund, getProductOrders };

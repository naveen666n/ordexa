import client from './client';

const create = (body) => client.post('/orders', body);
const list = (params = {}) => client.get('/orders', { params });
const getByNumber = (orderNumber) => client.get(`/orders/${orderNumber}`);
const cancel = (orderNumber) => client.post(`/orders/${orderNumber}/cancel`);

export default { create, list, getByNumber, cancel };

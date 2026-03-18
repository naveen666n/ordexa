import client from '../client';

const list = (params = {}) => client.get('/operations/orders', { params });
const getByNumber = (orderNumber) => client.get(`/operations/orders/${orderNumber}`);
const updateStatus = (orderNumber, body) => client.put(`/operations/orders/${orderNumber}/status`, body);

export default { list, getByNumber, updateStatus };

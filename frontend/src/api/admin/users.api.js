import client from '../client';

const list = (params = {}) => client.get('/admin/users', { params });
const create = (body) => client.post('/admin/users', body);
const toggleStatus = (id, is_active) => client.patch(`/admin/users/${id}/status`, { is_active });
const resetPassword = (id) => client.post(`/admin/users/${id}/reset-password`);

export default { list, create, toggleStatus, resetPassword };

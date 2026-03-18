import client from '../client';

// Admin routes are nested under /categories/admin/...
const list = () => client.get('/categories/admin/list');
const create = (body) => client.post('/categories/admin', body);
const update = (id, body) => client.put(`/categories/admin/${id}`, body);
const remove = (id) => client.delete(`/categories/admin/${id}`);

export default { list, create, update, remove };

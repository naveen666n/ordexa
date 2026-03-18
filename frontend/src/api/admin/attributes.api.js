import client from '../client';

const list = () => client.get('/admin/attributes');
const getOne = (id) => client.get(`/admin/attributes/${id}`);
const create = (body) => client.post('/admin/attributes', body);
const update = (id, body) => client.put(`/admin/attributes/${id}`, body);
const remove = (id) => client.delete(`/admin/attributes/${id}`);

const addValue = (id, body) => client.post(`/admin/attributes/${id}/values`, body);
const updateValue = (id, vid, body) => client.put(`/admin/attributes/${id}/values/${vid}`, body);
const deleteValue = (id, vid) => client.delete(`/admin/attributes/${id}/values/${vid}`);

export default { list, getOne, create, update, remove, addValue, updateValue, deleteValue };

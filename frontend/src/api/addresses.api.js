import client from './client';

const list = () => client.get('/addresses');
const create = (body) => client.post('/addresses', body);
const update = (id, body) => client.put(`/addresses/${id}`, body);
const remove = (id) => client.delete(`/addresses/${id}`);
const setDefault = (id) => client.patch(`/addresses/${id}/set-default`);

export default { list, create, update, remove, setDefault };

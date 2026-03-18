import client from '../client';

const listPending = () => client.get('/admin/reviews');
const approve = (id) => client.patch(`/admin/reviews/${id}/approve`);
const remove = (id) => client.delete(`/admin/reviews/${id}`);

export default { listPending, approve, remove };

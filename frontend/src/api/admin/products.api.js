import client from '../client';

const list = (params = {}) => client.get('/admin/products', { params: { limit: 100, ...params } });
const getById = (id) => client.get(`/admin/products/${id}`);

const create = (body) => client.post('/admin/products', body);
const update = (id, body) => client.put(`/admin/products/${id}`, body);
const remove = (id) => client.delete(`/admin/products/${id}`);

const uploadImage = (id, file) => {
  const fd = new FormData();
  fd.append('image', file);
  return client.post(`/admin/products/${id}/images`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
const deleteImage = (id, imgId) => client.delete(`/admin/products/${id}/images/${imgId}`);

const addVariant = (id, body) => client.post(`/admin/products/${id}/variants`, body);
const updateVariant = (id, vid, body) => client.put(`/admin/products/${id}/variants/${vid}`, body);
const deactivateVariant = (id, vid) => client.delete(`/admin/products/${id}/variants/${vid}`);

export default { list, getById, create, update, remove, uploadImage, deleteImage, addVariant, updateVariant, deactivateVariant };

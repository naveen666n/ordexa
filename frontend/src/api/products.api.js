import client from './client';

const list = (params = {}) => client.get('/products', { params });
const getBySlug = (slug) => client.get(`/products/${slug}`);
const search = (q, params = {}) => client.get('/products/search', { params: { q, ...params } });

export default { list, getBySlug, search };

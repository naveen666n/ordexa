import client from './client';

const getTree = () => client.get('/categories');
const getBySlug = (slug) => client.get(`/categories/${slug}`);
const getFilters = (slug) => client.get(`/categories/${slug}/filters`);

export default { getTree, getBySlug, getFilters };

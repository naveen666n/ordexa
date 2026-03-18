import client from './client';

const getAll = () => client.get('/wishlist');
const add = (variantId) => client.post('/wishlist', { variant_id: variantId });
const remove = (variantId) => client.delete(`/wishlist/${variantId}`);

export default { getAll, add, remove };

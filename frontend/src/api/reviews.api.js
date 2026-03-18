import client from './client';

const getProductReviews = (slug, params = {}) =>
  client.get(`/products/${slug}/reviews`, { params });

const submitReview = (slug, formData) =>
  client.post(`/products/${slug}/reviews`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export default { getProductReviews, submitReview };

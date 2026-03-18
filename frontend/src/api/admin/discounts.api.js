import client from '../client';

const listCoupons = (params = {}) => client.get('/admin/discount-codes', { params });
const getCoupon = (id) => client.get(`/admin/discount-codes/${id}`);
const createCoupon = (body) => client.post('/admin/discount-codes', body);
const updateCoupon = (id, body) => client.put(`/admin/discount-codes/${id}`, body);
const deleteCoupon = (id) => client.delete(`/admin/discount-codes/${id}`);

const listOffers = () => client.get('/admin/global-offers');
const getOffer = (id) => client.get(`/admin/global-offers/${id}`);
const createOffer = (body) => client.post('/admin/global-offers', body);
const updateOffer = (id, body) => client.put(`/admin/global-offers/${id}`, body);
const deleteOffer = (id) => client.delete(`/admin/global-offers/${id}`);
const activateOffer = (id) => client.patch(`/admin/global-offers/${id}/activate`);

export default {
  listCoupons, getCoupon, createCoupon, updateCoupon, deleteCoupon,
  listOffers, getOffer, createOffer, updateOffer, deleteOffer, activateOffer,
};

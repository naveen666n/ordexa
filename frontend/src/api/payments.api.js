import client from './client';

const verify = ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) =>
  client.post('/payments/verify', { razorpay_order_id, razorpay_payment_id, razorpay_signature });

const mockConfirm = (gateway_order_id) =>
  client.post('/payments/mock/confirm', { gateway_order_id });

const getPaymentStatus = (orderNumber) =>
  client.get(`/orders/${orderNumber}/payment`);

export default { verify, mockConfirm, getPaymentStatus };

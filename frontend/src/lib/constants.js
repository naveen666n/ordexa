export const ROLES = {
  ADMIN: 'admin',
  CUSTOMER: 'customer',
  OPERATIONS: 'operations',
};

export const ORDER_STATUSES = {
  PENDING: 'pending',
  PAID: 'paid',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

export const ORDER_STATUS_LABELS = {
  pending: 'Pending',
  paid: 'Paid',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const ORDER_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export const CANCELLABLE_STATUSES = ['pending', 'paid', 'processing'];

export const OFFER_TYPES = {
  PERCENTAGE: 'percentage',
  FLAT: 'flat',
  FREE_SHIPPING: 'free_shipping',
  BUY_X_GET_Y: 'buy_x_get_y',
};

export const PAYMENT_STATUSES = {
  INITIATED: 'initiated',
  SUCCESS: 'success',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  PARTIALLY_REFUNDED: 'partially_refunded',
};

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const CACHE_TIME = {
  PUBLIC_CONFIG: 60 * 60 * 1000,   // 1 hour
  CATALOG: 10 * 60 * 1000,         // 10 mins
  FILTERS: 30 * 60 * 1000,         // 30 mins
};

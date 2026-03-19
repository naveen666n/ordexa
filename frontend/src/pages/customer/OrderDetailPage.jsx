import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Package, MapPin, Clock, AlertCircle, Loader2, CreditCard, RotateCcw, Check } from 'lucide-react';
import ordersApi from '../../api/orders.api';
import useAuthStore from '../../store/auth.store';
import usePayment from '../../hooks/usePayment';
import { useConfig } from '../../context/ConfigContext';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { getImageSrc } from '../../lib/utils';
import { formatCurrency, formatDateTime } from '../../lib/formatters';

const ORDER_STATUS_STYLES = {
  pending:    'bg-yellow-50 text-yellow-700 border-yellow-200',
  paid:       'bg-blue-50 text-blue-700 border-blue-200',
  processing: 'bg-purple-50 text-purple-700 border-purple-200',
  shipped:    'bg-indigo-50 text-indigo-700 border-indigo-200',
  delivered:  'bg-green-50 text-green-700 border-green-200',
  cancelled:  'bg-gray-50 text-gray-500 border-gray-200',
};

const ORDER_STATUS_LABELS = {
  pending: 'Pending', paid: 'Paid', processing: 'Processing',
  shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled',
};

const PAYMENT_STATUS_STYLES = {
  initiated:           'bg-gray-50 text-gray-500 border-gray-200',
  captured:            'bg-green-50 text-green-700 border-green-200',
  failed:              'bg-red-50 text-red-600 border-red-200',
  refunded:            'bg-orange-50 text-orange-700 border-orange-200',
  partially_refunded:  'bg-orange-50 text-orange-600 border-orange-200',
};

const PAYMENT_STATUS_LABELS = {
  initiated: 'Awaiting Payment', captured: 'Paid',
  failed: 'Payment Failed', refunded: 'Refunded', partially_refunded: 'Partially Refunded',
};

// CANCELLABLE list is now driven by admin config (fetched via ConfigContext)

// ─── Order Tracker ────────────────────────────────────────────────────────────

const TRACK_STEPS = [
  { key: 'pending',    label: 'Order Placed',  desc: 'Your order has been placed.' },
  { key: 'paid',       label: 'Payment Confirmed', desc: 'Payment received.' },
  { key: 'processing', label: 'Processing',    desc: 'We\'re preparing your order.' },
  { key: 'shipped',    label: 'Shipped',        desc: 'Your order is on its way.' },
  { key: 'delivered',  label: 'Delivered',      desc: 'Order delivered successfully.' },
];

const OrderTracker = ({ order }) => {
  const history = order.statusHistory || [];
  const status = order.status;
  const isCancelled = status === 'cancelled';

  if (isCancelled) {
    const cancelEntry = [...history].reverse().find((h) => h.to_status === 'cancelled');
    return (
      <div className="md:col-span-2 bg-white border border-gray-100 rounded-xl shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <Clock size={16} className="text-primary" /> Order Tracking
        </h2>
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-bold">✕</span>
          </div>
          <div>
            <p className="font-semibold text-red-700">Order Cancelled</p>
            {cancelEntry?.note && <p className="text-xs text-red-600 mt-0.5">{cancelEntry.note}</p>}
            {cancelEntry?.created_at && (
              <p className="text-xs text-red-500 mt-0.5">{formatDateTime(cancelEntry.created_at)}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const currentStepIndex = TRACK_STEPS.findIndex((s) => s.key === status);

  // Find timestamp for each status from history
  const getTimestamp = (stepKey) => {
    const entry = history.find((h) => h.to_status === stepKey);
    return entry ? formatDateTime(entry.created_at) : null;
  };

  const getNote = (stepKey) => {
    const entry = history.find((h) => h.to_status === stepKey);
    return entry?.note || null;
  };

  return (
    <div className="md:col-span-2 bg-white border border-gray-100 rounded-xl shadow-sm p-6">
      <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-6">
        <Clock size={16} className="text-primary" /> Order Tracking
      </h2>

      {/* Desktop stepper */}
      <div className="hidden sm:flex items-start w-full mb-6">
        {TRACK_STEPS.map((step, i) => {
          const done = currentStepIndex > i;
          const current = currentStepIndex === i;
          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center min-w-0">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                  done    ? 'bg-green-500 border-green-500' :
                  current ? 'bg-primary border-primary' :
                            'bg-white border-gray-200'
                }`}>
                  {done ? (
                    <Check size={14} className="text-white" strokeWidth={3} />
                  ) : current ? (
                    <div className="w-3 h-3 rounded-full bg-white" />
                  ) : (
                    <div className="w-3 h-3 rounded-full bg-gray-200" />
                  )}
                </div>
                <p className={`mt-2 text-xs font-semibold text-center ${
                  done ? 'text-green-600' : current ? 'text-primary' : 'text-gray-400'
                }`}>{step.label}</p>
                {getTimestamp(step.key) && (
                  <p className="text-[10px] text-muted-foreground text-center mt-0.5">{getTimestamp(step.key)}</p>
                )}
              </div>
              {i < TRACK_STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 mt-[-20px] ${done ? 'bg-green-400' : 'bg-gray-200'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: vertical steps */}
      <div className="flex sm:hidden flex-col gap-0 mb-4">
        {TRACK_STEPS.map((step, i) => {
          const done = currentStepIndex > i;
          const current = currentStepIndex === i;
          return (
            <div key={step.key} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 flex-shrink-0 ${
                  done    ? 'bg-green-500 border-green-500' :
                  current ? 'bg-primary border-primary' :
                            'bg-white border-gray-200'
                }`}>
                  {done ? <Check size={13} className="text-white" strokeWidth={3} />
                        : current ? <div className="w-2.5 h-2.5 rounded-full bg-white" />
                        : <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />}
                </div>
                {i < TRACK_STEPS.length - 1 && (
                  <div className={`w-0.5 h-6 ${done ? 'bg-green-400' : 'bg-gray-200'}`} />
                )}
              </div>
              <div className="pt-1 pb-3">
                <p className={`text-sm font-semibold ${
                  done ? 'text-green-600' : current ? 'text-primary' : 'text-gray-400'
                }`}>{step.label}</p>
                {getTimestamp(step.key) && (
                  <p className="text-xs text-muted-foreground mt-0.5">{getTimestamp(step.key)}</p>
                )}
                {current && getNote(step.key) && (
                  <p className="text-xs text-gray-500 mt-0.5 italic">{getNote(step.key)}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Shipping note (if shipped) */}
      {getNote('shipped') && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-3 text-sm text-indigo-800">
          <span className="font-medium">Tracking info: </span>{getNote('shipped')}
        </div>
      )}
    </div>
  );
};

// ─── Retry Payment Panel ──────────────────────────────────────────────────────

const RetryPaymentPanel = ({ order, queryClient }) => {
  const { user } = useAuthStore();
  const config = useConfig();
  const [retryError, setRetryError] = useState('');

  const { pay, status, error, retry } = usePayment({
    onSuccess: (orderNumber) => {
      queryClient.invalidateQueries({ queryKey: ['order', orderNumber] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      window.location.replace(`/order-confirmation/${orderNumber}`);
    },
    onCancel: () => {},
  });

  const paymentRecord = order.payment;
  const gatewayOrderId = paymentRecord?.gateway_order_id;
  const isMock = gatewayOrderId?.startsWith('mock_order_');

  const handleRetry = () => {
    if (!gatewayOrderId) {
      setRetryError('Payment data not found. Please contact support.');
      return;
    }
    setRetryError('');
    pay(
      {
        gateway_order_id: gatewayOrderId,
        key_id: isMock ? 'mock' : paymentRecord?.gateway || 'razorpay',
        amount: Math.round(Number(order.total_amount) * 100),
        currency: 'INR',
      },
      order,
      user,
      config
    );
  };

  const isProcessing = status === 'processing';
  const payError = retryError || error;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-3">
      <div>
        <p className="font-semibold text-amber-800 text-sm">Payment Pending</p>
        <p className="text-amber-700 text-xs mt-0.5">
          {isMock ? 'Simulate payment to confirm this order.' : 'Complete payment to confirm your order.'}
        </p>
      </div>

      {payError && (
        <p className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
          <AlertCircle size={13} /> {payError}
        </p>
      )}

      <Button size="sm" onClick={status === 'failed' ? retry : handleRetry} disabled={isProcessing}>
        {isProcessing ? (
          <><Loader2 size={14} className="animate-spin mr-1.5" />Processing…</>
        ) : status === 'failed' ? (
          <><RotateCcw size={14} className="mr-1.5" />Retry Payment</>
        ) : (
          <><CreditCard size={14} className="mr-1.5" />{isMock ? 'Simulate Payment' : 'Complete Payment'}</>
        )}
      </Button>
    </div>
  );
};

// ─── OrderDetailPage ──────────────────────────────────────────────────────────

const OrderDetailPage = () => {
  const { orderNumber } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [refundInfo, setRefundInfo] = useState(null);

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ['order', orderNumber],
    queryFn: () => ordersApi.getByNumber(orderNumber).then((r) => r.data.data.order),
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl space-y-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground mb-4">Order not found.</p>
        <Link to="/orders"><Button variant="outline">Back to Orders</Button></Link>
      </div>
    );
  }

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setCancelError('');
    setRefundInfo(null);
    setCancelling(true);
    try {
      const res = await ordersApi.cancel(orderNumber);
      const refund = res.data?.data?.refund;
      if (refund) setRefundInfo(refund);
      queryClient.invalidateQueries({ queryKey: ['order', orderNumber] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    } catch (err) {
      setCancelError(err.response?.data?.error?.message || 'Failed to cancel order.');
    } finally {
      setCancelling(false);
    }
  };

  const config = useConfig();
  const cancellableStatuses = config?.order?.cancellable_statuses ?? ['pending', 'paid', 'processing'];
  const canCancel = cancellableStatuses.includes(order.status);
  const paymentStatus = order.payment?.status;
  const needsPayment = order.status === 'pending' && paymentStatus !== 'captured';

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Back nav */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft size={15} /> Back to Orders
      </button>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{order.order_number}</h1>
          <p className="text-sm text-muted-foreground">{formatDateTime(order.created_at)}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Order status */}
          <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${ORDER_STATUS_STYLES[order.status] || ORDER_STATUS_STYLES.pending}`}>
            {ORDER_STATUS_LABELS[order.status] || order.status}
          </span>

          {/* Payment status badge */}
          {paymentStatus && (
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${PAYMENT_STATUS_STYLES[paymentStatus] || PAYMENT_STATUS_STYLES.initiated}`}>
              {PAYMENT_STATUS_LABELS[paymentStatus] || paymentStatus}
            </span>
          )}

          {canCancel && order.status !== 'pending' && (
            <Button variant="outline" size="sm" onClick={handleCancel} disabled={cancelling}
              className="text-red-600 border-red-200 hover:bg-red-50">
              {cancelling ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
              Cancel Order
            </Button>
          )}
        </div>
      </div>

      {cancelError && (
        <p className="flex items-center gap-1.5 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3 mb-4">
          <AlertCircle size={14} /> {cancelError}
        </p>
      )}

      {refundInfo && (
        <div className={`flex items-start gap-3 rounded-xl px-4 py-4 mb-4 border ${
          refundInfo.status === 'refunded'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          {refundInfo.status === 'refunded' ? <Check size={16} className="flex-shrink-0 mt-0.5" /> : <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />}
          <div>
            {refundInfo.status === 'refunded' && refundInfo.amount && (
              <p className="font-semibold text-sm">{formatCurrency(refundInfo.amount)} refund initiated</p>
            )}
            <p className="text-sm mt-0.5">{refundInfo.message}</p>
          </div>
        </div>
      )}

      {/* Pending payment banner + retry */}
      {needsPayment && (
        <div className="mb-4">
          <RetryPaymentPanel order={order} queryClient={queryClient} />
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Order Tracker — always visible, full width */}
        <OrderTracker order={order} />

        {/* Order Items */}
        <div className="md:col-span-2 bg-white border border-gray-100 rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <Package size={16} className="text-primary" />
            Items
          </h2>
          <div className="space-y-4">
            {order.items?.map((item) => (
              <div key={item.id} className="flex items-center gap-4 text-sm">
                {item.image_url && (
                  item.product_slug ? (
                    <Link to={`/products/${item.product_slug}`} className="flex-shrink-0">
                      <img src={getImageSrc(item.image_url)} alt={item.product_name}
                        className="w-14 h-14 rounded-lg object-cover border hover:opacity-80 transition-opacity" />
                    </Link>
                  ) : (
                    <img src={getImageSrc(item.image_url)} alt={item.product_name}
                      className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border" />
                  )
                )}
                <div className="flex-1 min-w-0">
                  {item.product_slug ? (
                    <Link to={`/products/${item.product_slug}`} className="font-medium text-gray-800 hover:text-primary hover:underline">
                      {item.product_name}
                    </Link>
                  ) : (
                    <p className="font-medium text-gray-800">{item.product_name}</p>
                  )}
                  {item.variant_info?.name && (
                    <p className="text-xs text-muted-foreground">{item.variant_info.name}</p>
                  )}
                  <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-medium text-gray-900">{formatCurrency(item.line_total)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(item.unit_price)} × {item.quantity}
                  </p>
                  {Number(item.offer_discount) > 0 && (
                    <p className="text-xs text-green-600">−{formatCurrency(item.offer_discount)} offer</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t mt-4 pt-4 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span>
            </div>
            {Number(order.discount_amount) > 0 && (
              <div className="flex justify-between text-green-600">
                <span>{order.discount_source || 'Discount'}</span>
                <span>−{formatCurrency(order.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span>{Number(order.shipping_amount) === 0
                ? <span className="text-green-600">Free</span>
                : formatCurrency(order.shipping_amount)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax</span><span>{formatCurrency(order.tax_amount)}</span>
            </div>
            {paymentStatus === 'captured' && (
              <div className="flex justify-between text-green-700 font-medium border-t pt-2">
                <span>Payment</span><span>Received</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900 border-t pt-2">
              <span>Total</span><span>{formatCurrency(order.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* Delivery Address */}
        {order.address_snapshot && (
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
              <MapPin size={16} className="text-primary" />
              Delivery Address
            </h2>
            <div className="text-sm text-gray-600 space-y-0.5">
              <p className="font-medium text-gray-800">{order.address_snapshot.full_name}</p>
              {order.address_snapshot.phone && <p>{order.address_snapshot.phone}</p>}
              <p>{order.address_snapshot.address_line1}
                {order.address_snapshot.address_line2 ? `, ${order.address_snapshot.address_line2}` : ''}
              </p>
              <p>{order.address_snapshot.city}, {order.address_snapshot.state} – {order.address_snapshot.postal_code}</p>
              <p>{order.address_snapshot.country}</p>
            </div>
          </div>
        )}

        {/* Notes */}
        {order.notes && (
          <div className="md:col-span-2 bg-white border border-gray-100 rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-2">Notes</h2>
            <p className="text-sm text-gray-600">{order.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetailPage;

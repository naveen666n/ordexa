import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Package, MapPin, Clock, AlertCircle, Loader2, CreditCard, User } from 'lucide-react';
import adminOrdersApi from '../../../api/admin/orders.api';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Skeleton } from '../../../components/ui/skeleton';
import { formatCurrency, formatDateTime } from '../../../lib/formatters';

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
  initiated:          'bg-gray-50 text-gray-500 border-gray-200',
  captured:           'bg-green-50 text-green-700 border-green-200',
  failed:             'bg-red-50 text-red-600 border-red-200',
  refunded:           'bg-orange-50 text-orange-700 border-orange-200',
  partially_refunded: 'bg-orange-50 text-orange-600 border-orange-200',
};

const PAYMENT_STATUS_LABELS = {
  initiated: 'Awaiting Payment', captured: 'Paid',
  failed: 'Payment Failed', refunded: 'Refunded', partially_refunded: 'Partially Refunded',
};

// ─── StatusTimeline ───────────────────────────────────────────────────────────

const StatusTimeline = ({ history }) => {
  if (!history?.length) return null;
  return (
    <div className="space-y-3">
      {history.map((entry, i) => (
        <div key={entry.id} className="flex gap-3 text-sm">
          <div className="flex flex-col items-center">
            <div className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${
              i === history.length - 1 ? 'bg-primary' : 'bg-gray-300'
            }`} />
            {i < history.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
          </div>
          <div className="pb-3">
            <p className="font-medium text-gray-800">{ORDER_STATUS_LABELS[entry.to_status] || entry.to_status}</p>
            {entry.changedByUser && (
              <p className="text-muted-foreground text-xs">
                by {entry.changedByUser.first_name} {entry.changedByUser.last_name}
              </p>
            )}
            {entry.note && <p className="text-muted-foreground text-xs">{entry.note}</p>}
            <p className="text-muted-foreground text-xs mt-0.5">{formatDateTime(entry.created_at)}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── RefundPanel ──────────────────────────────────────────────────────────────

const RefundPanel = ({ payment, orderNumber }) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRefund = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Enter a valid refund amount.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await adminOrdersApi.refund(payment.id, Number(amount));
      setSuccess(`Refund of ${formatCurrency(Number(amount))} initiated.`);
      setAmount('');
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin', 'order', orderNumber] });
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Refund failed.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
        {success}
      </p>
    );
  }

  return (
    <div>
      {!open ? (
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
          <CreditCard size={13} /> Issue Refund
        </Button>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
          <p className="text-sm font-medium text-gray-800">Issue Refund</p>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              className="h-8 text-sm w-40"
              placeholder="Amount (₹)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Button size="sm" className="h-8 gap-1" onClick={handleRefund} disabled={loading}>
              {loading ? <Loader2 size={12} className="animate-spin" /> : null}
              Refund
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8"
              onClick={() => { setOpen(false); setError(''); setAmount(''); }}
            >
              Cancel
            </Button>
          </div>
          {error && (
            <p className="flex items-center gap-1.5 text-xs text-red-600">
              <AlertCircle size={12} /> {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// ─── OrderDetailPage ──────────────────────────────────────────────────────────

const AdminOrderDetailPage = () => {
  const { orderNumber } = useParams();
  const navigate = useNavigate();

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ['admin', 'order', orderNumber],
    queryFn: () => adminOrdersApi.getByNumber(orderNumber).then((r) => r.data.data.order),
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground mb-4">Order not found.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const payment = order.payment;
  const paymentStatus = payment?.status;

  return (
    <div className="max-w-4xl">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft size={15} /> Back to Orders
      </button>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 font-mono">{order.order_number}</h1>
          <p className="text-sm text-muted-foreground">{formatDateTime(order.created_at)}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${
            ORDER_STATUS_STYLES[order.status] || ORDER_STATUS_STYLES.pending
          }`}>
            {ORDER_STATUS_LABELS[order.status] || order.status}
          </span>
          {paymentStatus && (
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${
              PAYMENT_STATUS_STYLES[paymentStatus] || PAYMENT_STATUS_STYLES.initiated
            }`}>
              {PAYMENT_STATUS_LABELS[paymentStatus] || paymentStatus}
            </span>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Customer Info */}
        {order.user && (
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
              <User size={16} className="text-primary" />
              Customer
            </h2>
            <div className="text-sm text-gray-600 space-y-1">
              <p className="font-medium text-gray-800">
                {order.user.first_name} {order.user.last_name}
              </p>
              <p>{order.user.email}</p>
              {order.user.phone && <p>{order.user.phone}</p>}
            </div>
          </div>
        )}

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
              <p>
                {order.address_snapshot.address_line1}
                {order.address_snapshot.address_line2 ? `, ${order.address_snapshot.address_line2}` : ''}
              </p>
              <p>
                {order.address_snapshot.city}, {order.address_snapshot.state} – {order.address_snapshot.postal_code}
              </p>
              <p>{order.address_snapshot.country}</p>
            </div>
          </div>
        )}

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
                  <img
                    src={item.image_url}
                    alt={item.product_name}
                    className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800">{item.product_name}</p>
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
              <span>
                {Number(order.shipping_amount) === 0
                  ? <span className="text-green-600">Free</span>
                  : formatCurrency(order.shipping_amount)}
              </span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax</span><span>{formatCurrency(order.tax_amount)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 border-t pt-2">
              <span>Total</span><span>{formatCurrency(order.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* Payment Info */}
        {payment && (
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
              <CreditCard size={16} className="text-primary" />
              Payment
            </h2>
            <div className="text-sm text-gray-600 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gateway</span>
                <span className="font-medium text-gray-800 capitalize">{payment.gateway || '—'}</span>
              </div>
              {payment.gateway_order_id && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground flex-shrink-0">Gateway Order ID</span>
                  <span className="font-mono text-xs text-gray-700 text-right break-all">{payment.gateway_order_id}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                  PAYMENT_STATUS_STYLES[payment.status] || PAYMENT_STATUS_STYLES.initiated
                }`}>
                  {PAYMENT_STATUS_LABELS[payment.status] || payment.status}
                </span>
              </div>
              {payment.amount && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-medium text-gray-800">{formatCurrency(payment.amount)}</span>
                </div>
              )}
            </div>

            {/* Refund */}
            {paymentStatus === 'captured' && (
              <div className="mt-4 pt-4 border-t">
                <RefundPanel payment={payment} orderNumber={orderNumber} />
              </div>
            )}
          </div>
        )}

        {/* Status History */}
        {order.statusHistory?.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Clock size={16} className="text-primary" />
              Order Timeline
            </h2>
            <StatusTimeline history={order.statusHistory} />
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

export default AdminOrderDetailPage;

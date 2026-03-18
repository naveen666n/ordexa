import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, User, MapPin, Package, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import ordersApi from '../../api/operations/orders.api';
import { formatCurrency, formatDateTime } from '../../lib/formatters';
import OrderStatusStepper from '../../components/operations/OrderStatusStepper';

const STATUS_STYLES = {
  pending:    'bg-yellow-50 text-yellow-700 border-yellow-200',
  paid:       'bg-blue-50 text-blue-700 border-blue-200',
  processing: 'bg-purple-50 text-purple-700 border-purple-200',
  shipped:    'bg-indigo-50 text-indigo-700 border-indigo-200',
  delivered:  'bg-green-50 text-green-700 border-green-200',
  cancelled:  'bg-gray-50 text-gray-500 border-gray-200',
};

const STATUS_LABELS = {
  pending: 'Pending',
  paid: 'Paid',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const NEXT_STATUS = {
  paid: 'processing',
  processing: 'shipped',
  shipped: 'delivered',
};

const NEXT_LABEL = {
  processing: 'Mark as Processing',
  shipped: 'Mark as Shipped',
  delivered: 'Mark as Delivered',
};

const OrderProcessingPage = () => {
  const { orderNumber } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['operations', 'order', orderNumber],
    queryFn: async () => {
      const res = await ordersApi.getByNumber(orderNumber);
      return res.data?.data ?? res.data;
    },
    enabled: !!orderNumber,
  });

  const order = data?.order ?? data;

  const nextStatus = order ? NEXT_STATUS[order.status] : null;
  const requiresNote = nextStatus === 'shipped';

  const handleSubmit = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (requiresNote && !note.trim()) {
      setErrorMsg('Notes / Tracking Info is required when marking as Shipped.');
      return;
    }

    setIsSubmitting(true);
    try {
      await ordersApi.updateStatus(orderNumber, { status: nextStatus, note: note.trim() });
      setSuccessMsg('Status updated successfully.');
      setNote('');
      queryClient.invalidateQueries({ queryKey: ['operations', 'order', orderNumber] });
      queryClient.invalidateQueries({ queryKey: ['operations', 'orders'] });
    } catch (err) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Failed to update status.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="space-y-4">
            <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
            <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="p-6 max-w-7xl mx-auto text-center py-20 text-red-600">
        <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-60" />
        <p className="font-medium">Failed to load order details.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-sm text-gray-600 hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  const addr = order.address_snapshot;
  const addrParts = addr
    ? [
        addr.address_line1,
        addr.address_line2,
        addr.city,
        addr.state,
        addr.postal_code,
        addr.country,
      ].filter(Boolean)
    : [];

  const subtotal = order.items?.reduce(
    (sum, item) => sum + (item.unit_price ?? 0) * (item.quantity ?? 1),
    0
  ) ?? 0;

  const statusHistory = order.statusHistory ?? order.status_history ?? [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Orders
      </button>

      {/* Page title */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <h1 className="text-xl font-bold text-gray-900">
          Order #{order.order_number}
        </h1>
        <span className="text-sm text-gray-500">{formatDateTime(order.created_at)}</span>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">

        {/* ── LEFT PANEL ── */}
        <div className="space-y-5">

          {/* Customer card */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Customer</h2>
            </div>
            <div className="space-y-1 text-sm text-gray-700">
              {order.user && (
                <>
                  <p className="font-medium text-gray-900">
                    {order.user.first_name} {order.user.last_name}
                  </p>
                  <p className="text-gray-500">{order.user.email}</p>
                  {order.user.phone && <p className="text-gray-500">{order.user.phone}</p>}
                </>
              )}
            </div>
          </div>

          {/* Delivery address */}
          {addr && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-4 h-4 text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Delivery Address</h2>
              </div>
              <div className="text-sm text-gray-700 space-y-0.5">
                {addr.full_name && <p className="font-medium text-gray-900">{addr.full_name}</p>}
                {addr.phone && <p className="text-gray-500">{addr.phone}</p>}
                {addr.address_line1 && <p>{addr.address_line1}</p>}
                {addr.address_line2 && <p>{addr.address_line2}</p>}
                <p>
                  {[addr.city, addr.state, addr.postal_code].filter(Boolean).join(', ')}
                </p>
                {addr.country && <p>{addr.country}</p>}
              </div>
            </div>
          )}

          {/* Items list */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Items ({order.items?.length ?? 0})
              </h2>
            </div>

            <div className="divide-y divide-gray-100">
              {order.items?.map((item, i) => (
                <div key={i} className="py-3 flex gap-3 items-start">
                  {/* Thumbnail */}
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.product_name}
                      className="w-14 h-14 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.product_name}</p>
                    {item.variant_info && (
                      <p className="text-xs text-gray-500 mt-0.5">{item.variant_info}</p>
                    )}
                    {item.sku && (
                      <p className="text-xs text-gray-400">SKU: {item.sku}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {item.quantity} × {formatCurrency(item.unit_price)}
                    </p>
                  </div>
                  <div className="text-sm font-semibold text-gray-800 flex-shrink-0">
                    {formatCurrency((item.unit_price ?? 0) * (item.quantity ?? 1))}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Discount</span>
                  <span>−{formatCurrency(order.discount_amount)}</span>
                </div>
              )}
              {order.shipping_amount !== undefined && (
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>{formatCurrency(order.shipping_amount)}</span>
                </div>
              )}
              {order.tax_amount !== undefined && (
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span>{formatCurrency(order.tax_amount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-900 text-base pt-1 border-t border-gray-200">
                <span>Total</span>
                <span>{formatCurrency(order.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="space-y-5">

          {/* Status + Stepper card */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Order Status</h2>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${STATUS_STYLES[order.status] ?? STATUS_STYLES.pending}`}
              >
                {STATUS_LABELS[order.status] ?? order.status}
              </span>
            </div>

            <OrderStatusStepper status={order.status} />

            {/* Status update action */}
            {nextStatus && (
              <div className="mt-5 pt-4 border-t border-gray-100 space-y-3">
                <h3 className="text-sm font-medium text-gray-700">Advance Order Status</h3>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Notes / Tracking Info
                    {requiresNote && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    placeholder={
                      nextStatus === 'shipped'
                        ? 'Enter tracking number or carrier info…'
                        : 'Optional notes…'
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                {/* Feedback messages */}
                {successMsg && (
                  <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    {successMsg}
                  </div>
                )}
                {errorMsg && (
                  <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {errorMsg}
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Updating…
                    </>
                  ) : (
                    NEXT_LABEL[nextStatus]
                  )}
                </button>
              </div>
            )}

            {/* Terminal states: no action available */}
            {!nextStatus && order.status !== 'pending' && (
              <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500 text-center">
                No further actions available.
              </div>
            )}
          </div>

          {/* Order Timeline */}
          {statusHistory.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Order Timeline</h2>
              </div>

              <div className="space-y-4">
                {statusHistory.map((entry, i) => (
                  <div key={i} className="flex gap-3">
                    {/* Dot + line */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 ${
                          i === statusHistory.length - 1 ? 'bg-indigo-500' : 'bg-gray-300'
                        }`}
                      />
                      {i < statusHistory.length - 1 && (
                        <div className="w-px flex-1 bg-gray-200 mt-1" style={{ minHeight: '1.5rem' }} />
                      )}
                    </div>

                    {/* Content */}
                    <div className="pb-4 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_STYLES[entry.status] ?? STATUS_STYLES.pending}`}
                        >
                          {STATUS_LABELS[entry.status] ?? entry.status}
                        </span>
                        {entry.changed_by && (
                          <span className="text-xs text-gray-400">by {entry.changed_by}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{formatDateTime(entry.created_at ?? entry.timestamp)}</p>
                      {entry.note && (
                        <p className="text-xs text-gray-600 mt-1 bg-gray-50 rounded px-2 py-1 border border-gray-100">
                          {entry.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderProcessingPage;

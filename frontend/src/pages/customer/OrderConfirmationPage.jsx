import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Package, MapPin, ArrowRight, CreditCard } from 'lucide-react';
import ordersApi from '../../api/orders.api';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { formatCurrency, formatDateTime } from '../../lib/formatters';
import { getImageSrc } from '../../lib/utils';

const PAYMENT_STATUS_LABELS = {
  initiated: 'Awaiting Payment',
  captured: 'Payment Received',
  failed: 'Payment Failed',
  refunded: 'Refunded',
  partially_refunded: 'Partially Refunded',
};

const OrderConfirmationPage = () => {
  const { orderNumber } = useParams();
  const navigate = useNavigate();

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ['order', orderNumber],
    queryFn: () => ordersApi.getByNumber(orderNumber).then((r) => r.data.data.order),
    staleTime: 30_000,
  });

  // Redirect if no order found
  useEffect(() => {
    if (isError) navigate('/orders', { replace: true });
  }, [isError, navigate]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-2xl space-y-6">
        <Skeleton className="h-16 w-16 rounded-full mx-auto" />
        <Skeleton className="h-8 w-64 mx-auto" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      {/* Success header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={32} className="text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          {order.payment?.status === 'captured' ? 'Payment Confirmed!' : 'Order Placed!'}
        </h1>
        <p className="text-muted-foreground mt-1">
          Your order <span className="font-semibold text-foreground">{order.order_number}</span> has been placed successfully.
        </p>
        {/* Payment status badge */}
        {order.payment?.status && (
          <div className="flex items-center justify-center gap-1.5 mt-3">
            <CreditCard size={14} className={order.payment.status === 'captured' ? 'text-green-600' : 'text-amber-500'} />
            <span className={`text-sm font-medium ${order.payment.status === 'captured' ? 'text-green-600' : 'text-amber-600'}`}>
              {PAYMENT_STATUS_LABELS[order.payment.status] || order.payment.status}
            </span>
          </div>
        )}
      </div>

      {/* Order summary card */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Package size={16} className="text-primary" />
            Order Details
          </h2>
          <span className="text-xs font-medium text-muted-foreground">
            {formatDateTime(order.created_at)}
          </span>
        </div>

        {/* Items */}
        <div className="space-y-3 mb-4">
          {order.items?.map((item) => (
            <div key={item.id} className="flex items-center gap-3 text-sm">
              {item.image_url && (
                <img
                  src={getImageSrc(item.image_url)}
                  alt={item.product_name}
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">{item.product_name}</p>
                <p className="text-muted-foreground text-xs">
                  {item.variant_info?.name && `${item.variant_info.name} · `}Qty: {item.quantity}
                </p>
              </div>
              <span className="font-medium">{formatCurrency(item.line_total)}</span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-t pt-3 space-y-1.5 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>{formatCurrency(order.subtotal)}</span>
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
            <span>Tax</span>
            <span>{formatCurrency(order.tax_amount)}</span>
          </div>
          <div className="flex justify-between font-bold text-gray-900 border-t pt-2 mt-1">
            <span>Total</span>
            <span>{formatCurrency(order.total_amount)}</span>
          </div>
        </div>
      </div>

      {/* Delivery address */}
      {order.address_snapshot && (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 mb-4">
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

      {/* CTA */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link to={`/orders/${order.order_number}`} className="flex-1">
          <Button className="w-full" variant="outline">
            View Order <ArrowRight size={15} className="ml-1" />
          </Button>
        </Link>
        <Link to="/catalog" className="flex-1">
          <Button className="w-full">Continue Shopping</Button>
        </Link>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;

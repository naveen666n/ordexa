import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Package, ChevronRight } from 'lucide-react';
import ordersApi from '../../api/orders.api';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { formatCurrency, formatDate } from '../../lib/formatters';

const STATUS_STYLES = {
  pending:    'bg-yellow-50 text-yellow-700 border-yellow-200',
  paid:       'bg-blue-50 text-blue-700 border-blue-200',
  processing: 'bg-purple-50 text-purple-700 border-purple-200',
  shipped:    'bg-indigo-50 text-indigo-700 border-indigo-200',
  delivered:  'bg-green-50 text-green-700 border-green-200',
  cancelled:  'bg-gray-50 text-gray-500 border-gray-200',
};

const STATUS_LABELS = {
  pending: 'Pending', paid: 'Paid', processing: 'Processing',
  shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled',
};

const OrderCard = ({ order }) => (
  <Link
    to={`/orders/${order.order_number}`}
    className="block bg-white border border-gray-100 rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow"
  >
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-semibold text-gray-900 text-sm">{order.order_number}</p>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLES[order.status] || STATUS_STYLES.pending}`}>
            {STATUS_LABELS[order.status] || order.status}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mb-3">{formatDate(order.created_at)}</p>

        {/* Item previews */}
        <div className="flex flex-wrap gap-2">
          {order.items?.slice(0, 3).map((item) => (
            <div key={item.id} className="flex items-center gap-1.5 text-xs text-gray-600">
              {item.image_url && (
                <img src={item.image_url} alt={item.product_name} className="w-8 h-8 rounded-lg object-cover border" />
              )}
              <span className="truncate max-w-[120px]">{item.product_name}</span>
              <span className="text-muted-foreground">×{item.quantity}</span>
            </div>
          ))}
          {(order.items?.length || 0) > 3 && (
            <span className="text-xs text-muted-foreground self-center">
              +{order.items.length - 3} more
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="text-right">
          <p className="font-bold text-gray-900">{formatCurrency(order.total_amount)}</p>
          <p className="text-xs text-muted-foreground">{order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}</p>
        </div>
        <ChevronRight size={16} className="text-gray-400" />
      </div>
    </div>
  </Link>
);

const OrdersPage = () => {
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading } = useQuery({
    queryKey: ['orders', page],
    queryFn: () => ordersApi.list({ page, limit }).then((r) => r.data.data),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  const orders = data?.orders || [];
  const pagination = data?.pagination;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Skeleton className="h-7 w-32 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <Package size={48} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-lg font-semibold text-gray-800 mb-2">No orders yet</h2>
          <p className="text-muted-foreground mb-6">Start shopping to place your first order.</p>
          <Link to="/catalog"><Button>Shop Now</Button></Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.total_pages > 1 && (
            <div className="flex items-center justify-between mt-8">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.total_pages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.total_pages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OrdersPage;

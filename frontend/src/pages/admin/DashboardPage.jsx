import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShoppingBag, DollarSign, Package, AlertTriangle, Star, TrendingUp } from 'lucide-react';
import adminDashboardApi from '../../api/admin/dashboard.api';
import { Skeleton } from '../../components/ui/skeleton';
import { formatCurrency, formatDateTime } from '../../lib/formatters';

const ORDER_STATUS_STYLES = {
  pending:    'bg-yellow-50 text-yellow-700 border-yellow-200',
  paid:       'bg-blue-50 text-blue-700 border-blue-200',
  processing: 'bg-purple-50 text-purple-700 border-purple-200',
  shipped:    'bg-indigo-50 text-indigo-700 border-indigo-200',
  delivered:  'bg-green-50 text-green-700 border-green-200',
  cancelled:  'bg-gray-100 text-gray-500 border-gray-200',
};

// ─── StatsCard ─────────────────────────────────────────────────────────────────

const StatsCard = ({ icon: Icon, label, value, sub, accent }) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
    <div className={`p-2.5 rounded-lg ${accent}`}>
      <Icon size={20} className="text-white" />
    </div>
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  </div>
);

const StatsCardSkeleton = () => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
    <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
    <div className="flex-1">
      <Skeleton className="h-3 w-24 mb-2" />
      <Skeleton className="h-7 w-20" />
    </div>
  </div>
);

// ─── DashboardPage ─────────────────────────────────────────────────────────────

const DashboardPage = () => {
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => adminDashboardApi.getStats().then((r) => r.data.data),
    staleTime: 60_000,
    refetchInterval: 5 * 60 * 1000,
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Platform overview at a glance</p>
      </div>

      {isError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6">
          Failed to load dashboard stats.
        </p>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <StatsCardSkeleton key={i} />)
        ) : data ? (
          <>
            <StatsCard
              icon={ShoppingBag}
              label="Orders Today"
              value={data.orders_today}
              accent="bg-blue-500"
            />
            <StatsCard
              icon={DollarSign}
              label="Revenue This Month"
              value={formatCurrency(data.revenue_this_month)}
              accent="bg-emerald-500"
            />
            <StatsCard
              icon={Package}
              label="Total Products"
              value={data.total_products}
              accent="bg-violet-500"
            />
            <StatsCard
              icon={AlertTriangle}
              label="Low Stock Alerts"
              value={data.low_stock_alerts}
              sub={data.low_stock_alerts > 0 ? 'Variants running low' : 'All stocked up'}
              accent={data.low_stock_alerts > 0 ? 'bg-amber-500' : 'bg-gray-400'}
            />
            <StatsCard
              icon={Star}
              label="Pending Reviews"
              value={data.pending_reviews}
              sub={data.pending_reviews > 0 ? 'Awaiting moderation' : 'Nothing pending'}
              accent={data.pending_reviews > 0 ? 'bg-orange-500' : 'bg-gray-400'}
            />
          </>
        ) : null}
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-muted-foreground" />
            <h2 className="font-semibold text-gray-900 text-sm">Recent Orders</h2>
          </div>
          <button
            onClick={() => navigate('/admin/orders')}
            className="text-xs text-primary hover:underline"
          >
            View all
          </button>
        </div>

        {isLoading ? (
          <div className="divide-y divide-gray-50">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        ) : data?.recent_orders?.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">No orders yet.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {(data?.recent_orders ?? []).map((order) => (
              <div
                key={order.id}
                className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => navigate(`/admin/orders/${order.id}`)}
              >
                <span className="text-sm font-mono text-gray-700 w-28 truncate">
                  #{order.order_number}
                </span>
                <span className="text-sm text-gray-800 flex-1 truncate">
                  {order.first_name} {order.last_name}
                  <span className="ml-1 text-muted-foreground text-xs">{order.email}</span>
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${ORDER_STATUS_STYLES[order.status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                  {order.status}
                </span>
                <span className="text-sm font-medium text-gray-900 w-24 text-right">
                  {formatCurrency(order.total_amount)}
                </span>
                <span className="text-xs text-muted-foreground w-36 text-right">
                  {formatDateTime(order.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;

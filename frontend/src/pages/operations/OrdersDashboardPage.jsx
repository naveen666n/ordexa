import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, PackageOpen, Search } from 'lucide-react';
import ordersApi from '../../api/operations/orders.api';
import { formatCurrency, formatRelativeTime } from '../../lib/formatters';

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

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'paid', label: 'Paid' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
];

const OrdersDashboardPage = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['operations', 'orders'],
    queryFn: async () => {
      const res = await ordersApi.list({ limit: 500, page: 1 });
      return res.data?.data ?? res.data;
    },
    refetchInterval: 60_000,
  });

  const orders = useMemo(() => {
    const raw = data?.orders ?? [];
    // Sort newest first
    return [...raw].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [data]);

  // Count per status (for tab badges)
  const counts = useMemo(() => {
    const acc = { all: orders.length };
    TABS.slice(1).forEach(({ key }) => {
      acc[key] = orders.filter((o) => o.status === key).length;
    });
    return acc;
  }, [orders]);

  const filtered = useMemo(() => {
    let result = orders;
    if (activeTab !== 'all') {
      result = result.filter((o) => o.status === activeTab);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((o) =>
        o.order_number?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [orders, activeTab, search]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {counts.paid > 0 && (
              <span className="inline-flex items-center gap-1 text-blue-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                {counts.paid} order{counts.paid !== 1 ? 's' : ''} awaiting processing
              </span>
            )}
            {counts.paid === 0 && 'All caught up!'}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200 overflow-x-auto">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`
              flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
              ${activeTab === key
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            {label}
            <span
              className={`
                inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-semibold
                ${activeTab === key
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-100 text-gray-600'
                }
              `}
            >
              {counts[key] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by order number…"
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="text-center py-12 text-red-600">
          Failed to load orders. Please try refreshing.
        </div>
      )}

      {/* Orders table */}
      {!isLoading && !isError && (
        <>
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <PackageOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-base font-medium text-gray-500">No orders found.</p>
              {search && (
                <p className="text-sm mt-1">
                  Try clearing the search or changing the filter.
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
              {/* Table header */}
              <div className="hidden md:grid md:grid-cols-[1fr_140px_160px_80px_120px_110px] gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <div>Order</div>
                <div>Received</div>
                <div>Customer</div>
                <div className="text-center">Items</div>
                <div className="text-right">Total</div>
                <div className="text-center">Status</div>
              </div>

              {/* Rows */}
              <div className="divide-y divide-gray-100">
                {filtered.map((order) => {
                  const customerName = order.user
                    ? `${order.user.first_name ?? ''} ${order.user.last_name ?? ''}`.trim()
                    : '—';

                  return (
                    <div
                      key={order.id}
                      className="grid grid-cols-1 md:grid-cols-[1fr_140px_160px_80px_120px_110px] gap-2 md:gap-4 px-4 py-4 hover:bg-gray-50 transition-colors items-center"
                    >
                      {/* Order number */}
                      <div>
                        <Link
                          to={`/operations/orders/${order.order_number}`}
                          className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                        >
                          #{order.order_number}
                        </Link>
                        {/* Mobile-only extra info */}
                        <div className="md:hidden mt-1 flex flex-wrap gap-2 text-xs text-gray-500">
                          <span>{formatRelativeTime(order.created_at)}</span>
                          <span>·</span>
                          <span>{customerName}</span>
                          <span>·</span>
                          <span>{order.items?.length ?? 0} item{order.items?.length !== 1 ? 's' : ''}</span>
                          <span>·</span>
                          <span className="font-medium text-gray-800">{formatCurrency(order.total_amount)}</span>
                        </div>
                      </div>

                      {/* Received */}
                      <div className="hidden md:block text-sm text-gray-500">
                        {formatRelativeTime(order.created_at)}
                      </div>

                      {/* Customer */}
                      <div className="hidden md:block text-sm text-gray-700 truncate">
                        {customerName}
                      </div>

                      {/* Items count */}
                      <div className="hidden md:block text-sm text-gray-600 text-center">
                        {order.items?.length ?? 0}
                      </div>

                      {/* Total */}
                      <div className="hidden md:block text-sm font-semibold text-gray-800 text-right">
                        {formatCurrency(order.total_amount)}
                      </div>

                      {/* Status badge */}
                      <div className="md:flex md:justify-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_STYLES[order.status] ?? STATUS_STYLES.pending}`}
                        >
                          {STATUS_LABELS[order.status] ?? order.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OrdersDashboardPage;

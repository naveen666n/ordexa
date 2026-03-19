import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Search, ShoppingBag, AlertCircle, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
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

const PAYMENT_STATUS_STYLES = {
  initiated:          'bg-gray-50 text-gray-500 border-gray-200',
  captured:           'bg-green-50 text-green-700 border-green-200',
  failed:             'bg-red-50 text-red-600 border-red-200',
  refunded:           'bg-orange-50 text-orange-700 border-orange-200',
  partially_refunded: 'bg-orange-50 text-orange-600 border-orange-200',
};

const STATUS_OPTIONS = ['all', 'pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];

const OrdersListPage = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [search, setSearch] = useState('');

  const params = { page, limit: 20 };
  if (status !== 'all') params.status = status;
  if (from) params.from = from;
  if (to) params.to = to;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'orders', params],
    queryFn: () => adminOrdersApi.list(params).then((r) => r.data.data),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  const orders = data?.orders ?? [];
  const pagination = data?.pagination ?? {};

  const filtered = search.trim()
    ? orders.filter((o) =>
        o.order_number?.toLowerCase().includes(search.toLowerCase()) ||
        o.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
        `${o.user?.first_name} ${o.user?.last_name}`.toLowerCase().includes(search.toLowerCase())
      )
    : orders;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {pagination.total !== undefined ? `${pagination.total} total` : '—'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8 h-9 text-sm"
            placeholder="Search order # or customer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="h-9 rounded-md border border-input bg-white px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <Input
          type="date"
          className="h-9 text-sm w-auto"
          value={from}
          onChange={(e) => { setFrom(e.target.value); setPage(1); }}
          placeholder="From"
        />
        <Input
          type="date"
          className="h-9 text-sm w-auto"
          value={to}
          onChange={(e) => { setTo(e.target.value); setPage(1); }}
          placeholder="To"
        />
        {(from || to || status !== 'all') && (
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => { setFrom(''); setTo(''); setStatus('all'); setPage(1); }}
          >
            Clear
          </Button>
        )}
      </div>

      {isError && (
        <p className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
          <AlertCircle size={14} /> Failed to load orders.
        </p>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <ShoppingBag size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">{search ? 'No orders match your search.' : 'No orders found.'}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Order #</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Customer</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Items</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Total</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Payment</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono font-medium text-gray-900 text-xs">{order.order_number}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden sm:table-cell">
                    {formatDateTime(order.created_at)}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-gray-800 font-medium">
                      {order.user ? `${order.user.first_name} ${order.user.last_name}` : '—'}
                    </p>
                    <p className="text-xs text-muted-foreground">{order.user?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">
                    {order.items?.length ?? 0} item{order.items?.length !== 1 ? 's' : ''}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {formatCurrency(order.total_amount)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                      ORDER_STATUS_STYLES[order.status] || ORDER_STATUS_STYLES.pending
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {order.payment?.status ? (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                        PAYMENT_STATUS_STYLES[order.payment.status] || PAYMENT_STATUS_STYLES.initiated
                      }`}>
                        {order.payment.status}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 h-7 text-xs"
                      onClick={() => navigate(`/admin/orders/${order.order_number}`)}
                    >
                      <Eye size={12} /> View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <p className="text-muted-foreground">
            Page {pagination.page} of {pagination.total_pages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="gap-1"
            >
              <ChevronLeft size={14} /> Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(pagination.total_pages, p + 1))}
              disabled={page >= pagination.total_pages}
              className="gap-1"
            >
              Next <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersListPage;

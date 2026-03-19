import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save, AlertCircle, CheckCircle2, ShoppingBag, XCircle } from 'lucide-react';
import configApi from '../../../api/admin/config.api';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';

// The full set of statuses a customer could potentially cancel from.
// 'shipped', 'delivered', 'cancelled' are intentionally excluded as hard limits.
const CANCELLABLE_OPTIONS = [
  {
    value: 'pending',
    label: 'Pending',
    desc: 'Order placed but payment not yet received.',
    color: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  },
  {
    value: 'paid',
    label: 'Paid',
    desc: 'Payment received, order not yet being processed.',
    color: 'text-blue-700 bg-blue-50 border-blue-200',
  },
  {
    value: 'processing',
    label: 'Processing',
    desc: 'Order is being prepared / packed.',
    color: 'text-purple-700 bg-purple-50 border-purple-200',
  },
];

const DEFAULT_CANCELLABLE = ['pending', 'paid', 'processing'];

const OrdersConfigPage = () => {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState(DEFAULT_CANCELLABLE);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'config', 'orders'],
    queryFn: () => configApi.getGroup('orders').then((r) => r.data.data),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (data?.cancellable_statuses) {
      setSelected(
        Array.isArray(data.cancellable_statuses)
          ? data.cancellable_statuses
          : DEFAULT_CANCELLABLE
      );
    }
  }, [data]);

  const toggle = (value) => {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setStatusMsg(null);
    try {
      await configApi.updateGroup('orders', { cancellable_statuses: selected });
      // Invalidate public config so customer UI picks up the change immediately
      queryClient.invalidateQueries({ queryKey: ['config', 'public'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'config', 'orders'] });
      setStatusMsg({ type: 'success', message: 'Order settings saved successfully.' });
    } catch (err) {
      setStatusMsg({ type: 'error', message: err.response?.data?.error?.message || 'Failed to save settings.' });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Order Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure when customers are allowed to cancel their orders.
        </p>
      </div>

      {statusMsg && (
        <div className={`flex items-center gap-2 text-sm rounded-lg px-4 py-3 mb-5 border ${
          statusMsg.type === 'success'
            ? 'text-green-700 bg-green-50 border-green-200'
            : 'text-red-600 bg-red-50 border-red-200'
        }`}>
          {statusMsg.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          {statusMsg.message}
        </div>
      )}

      {/* Cancellation Policy */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <ShoppingBag size={16} className="text-primary" />
          <h2 className="font-semibold text-gray-900">Customer Cancellation Policy</h2>
        </div>
        <p className="text-sm text-muted-foreground -mt-2">
          Select the order statuses from which customers can cancel their own orders.
          The cancel button will only appear on the customer's order page when the order
          is in one of the selected stages.
        </p>

        <div className="space-y-3 pt-1">
          {CANCELLABLE_OPTIONS.map((opt) => {
            const isChecked = selected.includes(opt.value);
            return (
              <label
                key={opt.value}
                className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  isChecked
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                }`}
              >
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  checked={isChecked}
                  onChange={() => toggle(opt.value)}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${opt.color}`}>
                      {opt.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{opt.desc}</p>
                </div>
                {isChecked ? (
                  <CheckCircle2 size={18} className="text-primary flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle size={18} className="text-gray-300 flex-shrink-0 mt-0.5" />
                )}
              </label>
            );
          })}
        </div>

        {/* Summary */}
        <div className="pt-2 border-t border-gray-100">
          {selected.length === 0 ? (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-2">
              <AlertCircle size={13} />
              No cancellation stages selected — customers will not be able to cancel any orders.
            </p>
          ) : (
            <p className="text-sm text-gray-600">
              Customers can cancel orders in:{' '}
              <span className="font-medium text-gray-900">
                {selected.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')}
              </span>{' '}
              stage{selected.length > 1 ? 's' : ''}.
            </p>
          )}
        </div>

        <div className="pt-1">
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save Settings
          </Button>
        </div>
      </div>

      {/* Info note */}
      <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-600">
        <p className="font-medium text-gray-800 mb-1">Note</p>
        <ul className="list-disc list-inside space-y-1 text-xs text-gray-500">
          <li>Orders in <strong>Shipped</strong>, <strong>Delivered</strong>, or already <strong>Cancelled</strong> status can never be cancelled by customers, regardless of this setting.</li>
          <li>Operations staff can still cancel orders from any eligible stage using the operations portal.</li>
          <li>Changes take effect immediately for all customers.</li>
        </ul>
      </div>
    </div>
  );
};

export default OrdersConfigPage;

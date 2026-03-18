import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, AlertCircle, Loader2, Tag, Check, X } from 'lucide-react';
import discountsApi from '../../../api/admin/discounts.api';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Skeleton } from '../../../components/ui/skeleton';
import { formatCurrency, formatDate } from '../../../lib/formatters';

const OFFER_TYPE_LABELS = {
  PERCENT: 'Percent',
  FIXED: 'Fixed',
  FREE_SHIPPING: 'Free Shipping',
};

const formatOfferValue = (type, value) => {
  if (type === 'PERCENT') return `${value}% off`;
  if (type === 'FIXED') return `${formatCurrency(value)} off`;
  if (type === 'FREE_SHIPPING') return 'Free Shipping';
  return '—';
};

// ─── CouponForm ───────────────────────────────────────────────────────────────

const emptyForm = {
  code: '',
  offer_type: 'PERCENT',
  discount_value: '',
  min_order_value: '',
  max_uses: '',
  per_user_limit: '',
  starts_at: '',
  ends_at: '',
  is_active: true,
};

const CouponForm = ({ initial, onSave, onCancel, saving }) => {
  const [form, setForm] = useState(initial || emptyForm);

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((p) => ({ ...p, [key]: value }));
  };

  const handleCodeChange = (e) => {
    setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }));
  };

  const showValue = form.offer_type === 'PERCENT' || form.offer_type === 'FIXED';

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs">Code</Label>
          <Input
            className="h-8 text-sm font-mono uppercase"
            value={form.code}
            onChange={handleCodeChange}
            placeholder="SUMMER20"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Offer Type</Label>
          <select
            value={form.offer_type}
            onChange={set('offer_type')}
            className="w-full h-8 rounded-md border border-input bg-white px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="PERCENT">Percent Off</option>
            <option value="FIXED">Fixed Amount Off</option>
            <option value="FREE_SHIPPING">Free Shipping</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {showValue && (
          <div className="space-y-1">
            <Label className="text-xs">
              {form.offer_type === 'PERCENT' ? 'Discount %' : 'Discount Amount (₹)'}
            </Label>
            <Input
              type="number"
              className="h-8 text-sm"
              value={form.discount_value}
              onChange={set('discount_value')}
              placeholder={form.offer_type === 'PERCENT' ? '10' : '100'}
            />
          </div>
        )}
        <div className="space-y-1">
          <Label className="text-xs">Min Order Value (₹)</Label>
          <Input
            type="number"
            className="h-8 text-sm"
            value={form.min_order_value}
            onChange={set('min_order_value')}
            placeholder="0"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Max Uses</Label>
          <Input
            type="number"
            className="h-8 text-sm"
            value={form.max_uses}
            onChange={set('max_uses')}
            placeholder="Unlimited"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Per User Limit</Label>
          <Input
            type="number"
            className="h-8 text-sm"
            value={form.per_user_limit}
            onChange={set('per_user_limit')}
            placeholder="1"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs">Starts At</Label>
          <Input type="date" className="h-8 text-sm" value={form.starts_at} onChange={set('starts_at')} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Ends At</Label>
          <Input type="date" className="h-8 text-sm" value={form.ends_at} onChange={set('ends_at')} />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={form.is_active}
          onChange={set('is_active')}
          className="rounded"
        />
        Active
      </label>

      <div className="flex items-center gap-2 pt-1">
        <Button size="sm" onClick={() => onSave(form)} disabled={saving} className="gap-1.5 h-8">
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
          Save
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel} className="h-8 gap-1.5">
          <X size={12} /> Cancel
        </Button>
      </div>
    </div>
  );
};

// ─── CouponsPage ──────────────────────────────────────────────────────────────

const CouponsPage = () => {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ['admin', 'coupons'],
    queryFn: () => discountsApi.listCoupons().then((r) => r.data.data?.coupons ?? r.data.data ?? []),
    staleTime: 30_000,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const buildPayload = (form) => ({
    code: form.code,
    offer_type: form.offer_type,
    discount_value: form.discount_value ? Number(form.discount_value) : 0,
    min_order_value: form.min_order_value ? Number(form.min_order_value) : 0,
    max_uses: form.max_uses ? Number(form.max_uses) : null,
    per_user_limit: form.per_user_limit ? Number(form.per_user_limit) : 1,
    starts_at: form.starts_at || null,
    ends_at: form.ends_at || null,
    is_active: form.is_active,
  });

  const handleCreate = async (form) => {
    setSavingId('new');
    setError('');
    try {
      await discountsApi.createCoupon(buildPayload(form));
      refresh();
      setShowCreate(false);
      showSuccess('Coupon created.');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create coupon.');
    } finally {
      setSavingId(null);
    }
  };

  const handleUpdate = async (id, form) => {
    setSavingId(id);
    setError('');
    try {
      await discountsApi.updateCoupon(id, buildPayload(form));
      refresh();
      setEditingId(null);
      showSuccess('Coupon updated.');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to update coupon.');
    } finally {
      setSavingId(null);
    }
  };

  const handleToggleActive = async (coupon) => {
    setError('');
    try {
      await discountsApi.updateCoupon(coupon.id, { is_active: !coupon.is_active });
      refresh();
    } catch (err) {
      setError('Failed to update coupon status.');
    }
  };

  const handleDelete = async (coupon) => {
    if (!window.confirm(`Delete coupon "${coupon.code}"?`)) return;
    setError('');
    try {
      await discountsApi.deleteCoupon(coupon.id);
      refresh();
      showSuccess('Coupon deleted.');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to delete coupon.');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Coupons</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {Array.isArray(coupons) ? `${coupons.length} coupon${coupons.length !== 1 ? 's' : ''}` : ''}
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setShowCreate(true)} disabled={showCreate}>
          <Plus size={14} /> New Coupon
        </Button>
      </div>

      {error && (
        <p className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
          <AlertCircle size={14} /> {error}
        </p>
      )}
      {successMsg && (
        <p className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4">
          <Check size={14} /> {successMsg}
        </p>
      )}

      {showCreate && (
        <div className="mb-4">
          <CouponForm
            onSave={handleCreate}
            onCancel={() => setShowCreate(false)}
            saving={savingId === 'new'}
          />
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
          </div>
        ) : !Array.isArray(coupons) || coupons.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <Tag size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No coupons yet. Create one above.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Code</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Value</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Min Order</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Uses</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Expiry</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-gray-50 transition-colors">
                  {editingId === coupon.id ? (
                    <td colSpan={8} className="px-4 py-3">
                      <CouponForm
                        initial={{
                          code: coupon.code,
                          offer_type: coupon.offer_type,
                          discount_value: coupon.discount_value ?? '',
                          min_order_value: coupon.min_order_value ?? '',
                          max_uses: coupon.max_uses ?? '',
                          per_user_limit: coupon.per_user_limit ?? '',
                          starts_at: coupon.starts_at ? coupon.starts_at.slice(0, 10) : '',
                          ends_at: coupon.ends_at ? coupon.ends_at.slice(0, 10) : '',
                          is_active: coupon.is_active,
                        }}
                        onSave={(form) => handleUpdate(coupon.id, form)}
                        onCancel={() => setEditingId(null)}
                        saving={savingId === coupon.id}
                      />
                    </td>
                  ) : (
                    <>
                      <td className="px-4 py-3">
                        <span className="font-mono font-medium text-gray-900 text-xs">{coupon.code}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">
                        {OFFER_TYPE_LABELS[coupon.offer_type] || coupon.offer_type}
                      </td>
                      <td className="px-4 py-3 text-gray-700 hidden md:table-cell">
                        {formatOfferValue(coupon.offer_type, coupon.discount_value)}
                      </td>
                      <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">
                        {coupon.min_order_value ? formatCurrency(coupon.min_order_value) : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                        {coupon.current_uses ?? 0}{coupon.max_uses ? `/${coupon.max_uses}` : ''}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">
                        {coupon.ends_at ? formatDate(coupon.ends_at) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleActive(coupon)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            coupon.is_active ? 'bg-primary' : 'bg-gray-200'
                          }`}
                          title={coupon.is_active ? 'Active' : 'Inactive'}
                        >
                          <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                            coupon.is_active ? 'translate-x-4' : 'translate-x-1'
                          }`} />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => setEditingId(coupon.id)}
                            className="text-gray-400 hover:text-gray-700"
                            title="Edit"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(coupon)}
                            className="text-gray-400 hover:text-red-500"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CouponsPage;

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, AlertCircle, Loader2, Zap, Check, X } from 'lucide-react';
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
  BXGY: 'Buy X Get Y',
};

const PRECEDENCE_LABELS = {
  global_wins: 'Global Wins',
  product_wins: 'Product Wins',
  best_deal: 'Best Deal',
};

const formatOfferValue = (type, value, buy, get) => {
  if (type === 'PERCENT') return `${value}% off`;
  if (type === 'FIXED') return `${formatCurrency(value)} off`;
  if (type === 'FREE_SHIPPING') return 'Free Shipping';
  if (type === 'BXGY') return `Buy ${buy} Get ${get}`;
  return '—';
};

// ─── OfferForm ────────────────────────────────────────────────────────────────

const emptyForm = {
  name: '',
  offer_type: 'PERCENT',
  discount_value: '',
  buy_quantity: '',
  get_quantity: '',
  min_order_value: '',
  precedence: 'best_deal',
  starts_at: '',
  ends_at: '',
  is_active: false,
};

const OfferForm = ({ initial, onSave, onCancel, saving }) => {
  const [form, setForm] = useState(initial || emptyForm);

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((p) => ({ ...p, [key]: value }));
  };

  const showValue = form.offer_type === 'PERCENT' || form.offer_type === 'FIXED';
  const showBxgy = form.offer_type === 'BXGY';

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs">Name</Label>
          <Input
            className="h-8 text-sm"
            value={form.name}
            onChange={set('name')}
            placeholder="Summer Sale"
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
            <option value="BXGY">Buy X Get Y</option>
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
        {showBxgy && (
          <>
            <div className="space-y-1">
              <Label className="text-xs">Buy Quantity</Label>
              <Input
                type="number"
                className="h-8 text-sm"
                value={form.buy_quantity}
                onChange={set('buy_quantity')}
                placeholder="2"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Get Quantity</Label>
              <Input
                type="number"
                className="h-8 text-sm"
                value={form.get_quantity}
                onChange={set('get_quantity')}
                placeholder="1"
              />
            </div>
          </>
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
          <Label className="text-xs">Precedence</Label>
          <select
            value={form.precedence}
            onChange={set('precedence')}
            className="w-full h-8 rounded-md border border-input bg-white px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="global_wins">Global Wins</option>
            <option value="product_wins">Product Wins</option>
            <option value="best_deal">Best Deal</option>
          </select>
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

// ─── GlobalOffersPage ─────────────────────────────────────────────────────────

const GlobalOffersPage = () => {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [activatingId, setActivatingId] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { data: offers = [], isLoading } = useQuery({
    queryKey: ['admin', 'global-offers'],
    queryFn: () => discountsApi.listOffers().then((r) => r.data.data?.offers ?? r.data.data ?? []),
    staleTime: 30_000,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin', 'global-offers'] });

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const buildPayload = (form) => ({
    name: form.name,
    offer_type: form.offer_type,
    discount_value: form.discount_value ? Number(form.discount_value) : 0,
    buy_quantity: form.buy_quantity ? Number(form.buy_quantity) : null,
    get_quantity: form.get_quantity ? Number(form.get_quantity) : null,
    min_order_value: form.min_order_value ? Number(form.min_order_value) : 0,
    precedence: form.precedence,
    starts_at: form.starts_at || null,
    ends_at: form.ends_at || null,
    is_active: form.is_active,
  });

  const handleCreate = async (form) => {
    setSavingId('new');
    setError('');
    try {
      await discountsApi.createOffer(buildPayload(form));
      refresh();
      setShowCreate(false);
      showSuccess('Global offer created.');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create offer.');
    } finally {
      setSavingId(null);
    }
  };

  const handleUpdate = async (id, form) => {
    setSavingId(id);
    setError('');
    try {
      await discountsApi.updateOffer(id, buildPayload(form));
      refresh();
      setEditingId(null);
      showSuccess('Offer updated.');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to update offer.');
    } finally {
      setSavingId(null);
    }
  };

  const handleActivate = async (offer) => {
    setActivatingId(offer.id);
    setError('');
    try {
      await discountsApi.activateOffer(offer.id);
      refresh();
      showSuccess(`"${offer.name}" is now the active global offer.`);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to activate offer.');
    } finally {
      setActivatingId(null);
    }
  };

  const handleDelete = async (offer) => {
    if (!window.confirm(`Delete global offer "${offer.name}"?`)) return;
    setError('');
    try {
      await discountsApi.deleteOffer(offer.id);
      refresh();
      showSuccess('Offer deleted.');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to delete offer.');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Global Offers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {Array.isArray(offers) ? `${offers.length} offer${offers.length !== 1 ? 's' : ''}` : ''}
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setShowCreate(true)} disabled={showCreate}>
          <Plus size={14} /> New Offer
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
          <OfferForm
            onSave={handleCreate}
            onCancel={() => setShowCreate(false)}
            saving={savingId === 'new'}
          />
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
          </div>
        ) : !Array.isArray(offers) || offers.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <Zap size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No global offers yet. Create one above.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Type / Value</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Precedence</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Dates</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {offers.map((offer) => (
                <tr
                  key={offer.id}
                  className={`transition-colors ${
                    offer.is_active
                      ? 'bg-green-50/40 hover:bg-green-50/60'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {editingId === offer.id ? (
                    <td colSpan={6} className="px-4 py-3">
                      <OfferForm
                        initial={{
                          name: offer.name,
                          offer_type: offer.offer_type,
                          discount_value: offer.discount_value ?? '',
                          buy_quantity: offer.buy_quantity ?? '',
                          get_quantity: offer.get_quantity ?? '',
                          min_order_value: offer.min_order_value ?? '',
                          precedence: offer.precedence || 'best_deal',
                          starts_at: offer.starts_at ? offer.starts_at.slice(0, 10) : '',
                          ends_at: offer.ends_at ? offer.ends_at.slice(0, 10) : '',
                          is_active: offer.is_active,
                        }}
                        onSave={(form) => handleUpdate(offer.id, form)}
                        onCancel={() => setEditingId(null)}
                        saving={savingId === offer.id}
                      />
                    </td>
                  ) : (
                    <>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{offer.name}</p>
                          {offer.is_active && (
                            <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-green-100 text-green-700">
                              ACTIVE
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <p className="text-gray-700">
                          {formatOfferValue(offer.offer_type, offer.discount_value, offer.buy_quantity, offer.get_quantity)}
                        </p>
                        <p className="text-xs text-muted-foreground">{OFFER_TYPE_LABELS[offer.offer_type]}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                        {PRECEDENCE_LABELS[offer.precedence] || offer.precedence || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">
                        {offer.starts_at ? formatDate(offer.starts_at) : '—'}
                        {offer.ends_at ? ` – ${formatDate(offer.ends_at)}` : ''}
                      </td>
                      <td className="px-4 py-3">
                        {offer.is_active ? (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-green-50 text-green-700 border-green-200">
                            Active
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1"
                            onClick={() => handleActivate(offer)}
                            disabled={activatingId === offer.id}
                          >
                            {activatingId === offer.id ? <Loader2 size={11} className="animate-spin" /> : <Zap size={11} />}
                            Activate
                          </Button>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => setEditingId(offer.id)}
                            className="text-gray-400 hover:text-gray-700"
                            title="Edit"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(offer)}
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

export default GlobalOffersPage;

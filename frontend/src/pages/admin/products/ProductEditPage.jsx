import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  ArrowLeft, Loader2, AlertCircle, Plus, Trash2,
  Upload, X, ImageIcon, Save, ShoppingBag, ChevronLeft, ChevronRight,
} from 'lucide-react';
import adminProductsApi from '../../../api/admin/products.api';
import adminCategoriesApi from '../../../api/admin/categories.api';
import adminAttributesApi from '../../../api/admin/attributes.api';
import adminOrdersApi from '../../../api/admin/orders.api';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Skeleton } from '../../../components/ui/skeleton';
import { formatCurrency, slugify, formatDateTime } from '../../../lib/formatters';
import { getImageSrc } from '../../../lib/utils';

// ─── Variant Edit Row ──────────────────────────────────────────────────────────

const VariantEditRow = ({ variant, productId, attributes, onSaved, onDeactivate }) => {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    sku: variant.sku,
    name: variant.name || '',
    price: String(variant.price),
    compare_price: variant.compare_price ? String(variant.compare_price) : '',
    cost_price: variant.cost_price ? String(variant.cost_price) : '',
    stock_quantity: String(variant.stock_quantity ?? 0),
    attribute_value_ids: (variant.attributeValues || []).map((av) => av.id),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await adminProductsApi.updateVariant(productId, variant.id, {
        sku: form.sku,
        name: form.name || undefined,
        price: Number(form.price),
        compare_price: form.compare_price ? Number(form.compare_price) : null,
        cost_price: form.cost_price ? Number(form.cost_price) : null,
        stock_quantity: Number(form.stock_quantity) || 0,
        attribute_value_ids: form.attribute_value_ids,
      });
      setEditing(false);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to update variant.');
    } finally {
      setSaving(false);
    }
  };

  const toggleAttrValue = (valueId) => {
    setForm((prev) => ({
      ...prev,
      attribute_value_ids: prev.attribute_value_ids.includes(valueId)
        ? prev.attribute_value_ids.filter((id) => id !== valueId)
        : [...prev.attribute_value_ids, valueId],
    }));
  };

  const attrLabels = (variant.attributeValues || []).map((av) => av.value).join(', ');

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      {!editing ? (
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">SKU</p>
              <p className="font-mono text-gray-800">{variant.sku}</p>
            </div>
            {variant.name && (
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="text-gray-800">{variant.name}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Price</p>
              <p className="text-gray-800">{formatCurrency(variant.price)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Stock</p>
              <p className={variant.stock_quantity === 0 ? 'text-red-600' : 'text-gray-800'}>{variant.stock_quantity}</p>
            </div>
            {attrLabels && (
              <div className="col-span-2 sm:col-span-4">
                <p className="text-xs text-muted-foreground">Attributes</p>
                <p className="text-gray-600 text-xs">{attrLabels}</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Edit</Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => onDeactivate(variant.id)}
            >
              <Trash2 size={13} />
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <Label className="text-xs">SKU *</Label>
              <Input value={form.sku} onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))} className="mt-1 h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Name</Label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="mt-1 h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Price (₹) *</Label>
              <Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} className="mt-1 h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Compare price (₹)</Label>
              <Input type="number" min="0" step="0.01" value={form.compare_price} onChange={(e) => setForm((p) => ({ ...p, compare_price: e.target.value }))} className="mt-1 h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Cost price (₹) <span className="text-muted-foreground">(internal)</span></Label>
              <Input type="number" min="0" step="0.01" value={form.cost_price} onChange={(e) => setForm((p) => ({ ...p, cost_price: e.target.value }))} className="mt-1 h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Stock qty</Label>
              <Input type="number" min="0" value={form.stock_quantity} onChange={(e) => setForm((p) => ({ ...p, stock_quantity: e.target.value }))} className="mt-1 h-8 text-sm" />
            </div>
          </div>
          {attributes.length > 0 && (
            <div>
              <Label className="text-xs mb-1 block">Attribute values</Label>
              <div className="flex flex-wrap gap-2">
                {attributes.flatMap((attr) =>
                  (attr.values || []).map((val) => (
                    <label key={val.id} className="flex items-center gap-1.5 cursor-pointer text-xs">
                      <input type="checkbox" checked={form.attribute_value_ids.includes(val.id)} onChange={() => toggleAttrValue(val.id)} className="rounded" />
                      <span className="text-gray-600">{attr.name}: {val.value}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1">
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── New Variant Panel ─────────────────────────────────────────────────────────

const NewVariantPanel = ({ productId, attributes, onSaved }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ sku: '', name: '', price: '', compare_price: '', cost_price: '', stock_quantity: '0', attribute_value_ids: [] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const toggleAttrValue = (valueId) => {
    setForm((prev) => ({
      ...prev,
      attribute_value_ids: prev.attribute_value_ids.includes(valueId)
        ? prev.attribute_value_ids.filter((id) => id !== valueId)
        : [...prev.attribute_value_ids, valueId],
    }));
  };

  const handleSave = async () => {
    if (!form.sku.trim() || !form.price) { setError('SKU and price are required.'); return; }
    setSaving(true);
    setError('');
    try {
      await adminProductsApi.addVariant(productId, {
        sku: form.sku,
        name: form.name || undefined,
        price: Number(form.price),
        compare_price: form.compare_price ? Number(form.compare_price) : undefined,
        cost_price: form.cost_price ? Number(form.cost_price) : undefined,
        stock_quantity: Number(form.stock_quantity) || 0,
        attribute_value_ids: form.attribute_value_ids,
      });
      setForm({ sku: '', name: '', price: '', compare_price: '', cost_price: '', stock_quantity: '0', attribute_value_ids: [] });
      setOpen(false);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to add variant.');
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-1">
        <Plus size={13} /> Add Variant
      </Button>
    );
  }

  return (
    <div className="border border-dashed border-gray-300 rounded-lg p-4 space-y-3">
      <p className="text-sm font-medium text-gray-700">New Variant</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <Label className="text-xs">SKU *</Label>
          <Input value={form.sku} onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))} className="mt-1 h-8 text-sm" />
        </div>
        <div>
          <Label className="text-xs">Name</Label>
          <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="mt-1 h-8 text-sm" />
        </div>
        <div>
          <Label className="text-xs">Price (₹) *</Label>
          <Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} className="mt-1 h-8 text-sm" />
        </div>
        <div>
          <Label className="text-xs">Compare price (₹)</Label>
          <Input type="number" min="0" step="0.01" value={form.compare_price} onChange={(e) => setForm((p) => ({ ...p, compare_price: e.target.value }))} className="mt-1 h-8 text-sm" />
        </div>
        <div>
          <Label className="text-xs">Cost price (₹) <span className="text-muted-foreground">(internal)</span></Label>
          <Input type="number" min="0" step="0.01" value={form.cost_price} onChange={(e) => setForm((p) => ({ ...p, cost_price: e.target.value }))} className="mt-1 h-8 text-sm" />
        </div>
        <div>
          <Label className="text-xs">Stock qty</Label>
          <Input type="number" min="0" value={form.stock_quantity} onChange={(e) => setForm((p) => ({ ...p, stock_quantity: e.target.value }))} className="mt-1 h-8 text-sm" />
        </div>
      </div>
      {attributes.length > 0 && (
        <div>
          <Label className="text-xs mb-1 block">Attribute values</Label>
          <div className="flex flex-wrap gap-2">
            {attributes.flatMap((attr) =>
              (attr.values || []).map((val) => (
                <label key={val.id} className="flex items-center gap-1.5 cursor-pointer text-xs">
                  <input type="checkbox" checked={form.attribute_value_ids.includes(val.id)} onChange={() => toggleAttrValue(val.id)} className="rounded" />
                  <span className="text-gray-600">{attr.name}: {val.value}</span>
                </label>
              ))
            )}
          </div>
        </div>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1">
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Add
        </Button>
        <Button size="sm" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </div>
  );
};

// ─── ProductOrderHistory ───────────────────────────────────────────────────────

const ORDER_STATUS_STYLES = {
  pending:    'bg-yellow-50 text-yellow-700 border-yellow-200',
  paid:       'bg-blue-50 text-blue-700 border-blue-200',
  processing: 'bg-purple-50 text-purple-700 border-purple-200',
  shipped:    'bg-indigo-50 text-indigo-700 border-indigo-200',
  delivered:  'bg-green-50 text-green-700 border-green-200',
  cancelled:  'bg-gray-50 text-gray-500 border-gray-200',
};

const ProductOrderHistory = ({ productId }) => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'product-orders', productId, page],
    queryFn: () => adminOrdersApi.getProductOrders(productId, { page, limit: 10 }).then((r) => r.data.data),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  const orders = data?.orders ?? [];
  const pagination = data?.pagination ?? {};

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mt-6 mb-8">
      <div className="flex items-center gap-2 mb-4">
        <ShoppingBag size={16} className="text-primary" />
        <h2 className="font-semibold text-gray-900">Order History</h2>
        {pagination.total !== undefined && (
          <span className="text-xs text-muted-foreground ml-1">({pagination.total} order{pagination.total !== 1 ? 's' : ''})</span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
        </div>
      ) : isError ? (
        <p className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle size={13} /> Failed to load order history.
        </p>
      ) : orders.length === 0 ? (
        <div className="py-8 text-center border border-dashed border-gray-200 rounded-lg">
          <ShoppingBag size={24} className="mx-auto mb-2 opacity-30 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">This product has not been ordered yet.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">Order #</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600 hidden sm:table-cell">Date</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600 hidden md:table-cell">Customer</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">Qty</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">Line Total</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">Status</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((order) => {
                  const totalQty = order.items?.reduce((s, i) => s + i.quantity, 0) ?? 0;
                  const lineTotal = order.items?.reduce((s, i) => s + Number(i.line_total), 0) ?? 0;
                  return (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2">
                        <span className="font-mono font-medium text-gray-900 text-xs">{order.order_number}</span>
                      </td>
                      <td className="px-3 py-2 text-gray-500 text-xs hidden sm:table-cell">
                        {formatDateTime(order.created_at)}
                      </td>
                      <td className="px-3 py-2 hidden md:table-cell">
                        {order.user ? (
                          <div>
                            <p className="text-gray-800 font-medium text-xs">
                              {order.user.first_name} {order.user.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">{order.user.email}</p>
                          </div>
                        ) : '—'}
                      </td>
                      <td className="px-3 py-2 text-gray-700 text-xs">{totalQty}</td>
                      <td className="px-3 py-2 font-medium text-gray-900 text-xs">{formatCurrency(lineTotal)}</td>
                      <td className="px-3 py-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                          ORDER_STATUS_STYLES[order.status] || ORDER_STATUS_STYLES.pending
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-6 text-xs px-2"
                          onClick={() => navigate(`/admin/orders/${order.order_number}`)}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {pagination.total_pages > 1 && (
            <div className="flex items-center justify-between mt-3 text-xs">
              <p className="text-muted-foreground">Page {pagination.page} of {pagination.total_pages}</p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft size={12} /> Prev
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={() => setPage((p) => Math.min(pagination.total_pages, p + 1))}
                  disabled={page >= pagination.total_pages}
                >
                  Next <ChevronRight size={12} />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ─── ProductEditPage ───────────────────────────────────────────────────────────

const ProductEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState('');

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['admin', 'product', id],
    queryFn: () => adminProductsApi.getById(id).then((r) => r.data.data.product),
    staleTime: 30_000,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => adminCategoriesApi.list().then((r) => r.data.data.categories),
    staleTime: 60_000,
  });

  const { data: attributesData } = useQuery({
    queryKey: ['admin', 'attributes'],
    queryFn: () => adminAttributesApi.list().then((r) => r.data.data.attributes),
    staleTime: 60_000,
  });

  const categories = categoriesData ?? [];
  const attributes = attributesData ?? [];

  useEffect(() => {
    if (product && !form) {
      setForm({
        name: product.name,
        slug: product.slug,
        description: product.description || '',
        brand: product.brand || '',
        is_active: product.is_active,
        is_featured: product.is_featured,
        meta_title: product.meta_title || '',
        meta_description: product.meta_description || '',
        category_ids: (product.categories || []).map((c) => c.id),
      });
    }
  }, [product, form]);

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const toggleCategory = (catId) => {
    setForm((prev) => ({
      ...prev,
      category_ids: prev.category_ids.includes(catId)
        ? prev.category_ids.filter((c) => c !== catId)
        : [...prev.category_ids, catId],
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setSaveError('Product name is required.'); return; }
    if (form.category_ids.length === 0) { setSaveError('Select at least one category.'); return; }
    setSaving(true);
    setSaveError('');
    try {
      await adminProductsApi.update(id, {
        ...form,
        slug: slugify(form.slug || form.name),
        brand: form.brand || undefined,
        meta_title: form.meta_title || undefined,
        meta_description: form.meta_description || undefined,
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'product', id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    } catch (err) {
      setSaveError(err.response?.data?.error?.message || 'Failed to save product.');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadingImage(true);
    setImageError('');
    try {
      await adminProductsApi.uploadImage(id, files);
      queryClient.invalidateQueries({ queryKey: ['admin', 'product', id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    } catch (err) {
      setImageError(err.response?.data?.error?.message || 'Failed to upload image(s).');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleDeleteImage = async (imgId) => {
    if (!window.confirm('Delete this image?')) return;
    try {
      await adminProductsApi.deleteImage(id, imgId);
      queryClient.invalidateQueries({ queryKey: ['admin', 'product', id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    } catch (err) {
      setImageError(err.response?.data?.error?.message || 'Failed to delete image.');
    }
  };

  const handleSetPrimary = async (imgId) => {
    try {
      await adminProductsApi.setPrimaryImage(id, imgId);
      queryClient.invalidateQueries({ queryKey: ['admin', 'product', id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    } catch (err) {
      setImageError(err.response?.data?.error?.message || 'Failed to set default image.');
    }
  };

  const handleDeactivateVariant = async (variantId) => {
    if (!window.confirm('Deactivate this variant?')) return;
    try {
      await adminProductsApi.deactivateVariant(id, variantId);
      queryClient.invalidateQueries({ queryKey: ['admin', 'product', id] });
    } catch (err) {
      setSaveError(err.response?.data?.error?.message || 'Failed to deactivate variant.');
    }
  };

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'product', id] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
  };

  if (isLoading || !form) {
    return (
      <div className="max-w-3xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground mb-4">Product not found.</p>
        <Link to="/admin/products"><Button variant="outline">Back to Products</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin/products" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Edit: {product.name}</h1>
          <p className="text-xs text-muted-foreground">ID #{product.id} · slug: {product.slug}</p>
        </div>
      </div>

      {saveError && (
        <p className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
          <AlertCircle size={14} /> {saveError}
        </p>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic info */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Basic Information</h2>
          <div>
            <Label>Product name *</Label>
            <Input value={form.name} onChange={(e) => setField('name', e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Slug</Label>
            <Input value={form.slug} onChange={(e) => setField('slug', e.target.value)} className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Brand</Label>
              <Input value={form.brand} onChange={(e) => setField('brand', e.target.value)} className="mt-1" />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <textarea
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              rows={4}
              className="mt-1 w-full text-sm border border-input rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            />
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setField('is_active', e.target.checked)} className="rounded" />
              Active
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" checked={form.is_featured} onChange={(e) => setField('is_featured', e.target.checked)} className="rounded" />
              Featured
            </label>
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-3">Categories *</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <label key={cat.id} className={`flex items-center gap-1.5 cursor-pointer text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                form.category_ids.includes(cat.id)
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}>
                <input type="checkbox" className="sr-only" checked={form.category_ids.includes(cat.id)} onChange={() => toggleCategory(cat.id)} />
                {cat.name}
              </label>
            ))}
          </div>
        </div>

        {/* SEO */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">SEO</h2>
          <div>
            <Label>Meta title</Label>
            <Input value={form.meta_title} onChange={(e) => setField('meta_title', e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Meta description</Label>
            <Input value={form.meta_description} onChange={(e) => setField('meta_description', e.target.value)} className="mt-1" />
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving} className="gap-1.5">
            {saving ? <><Loader2 size={14} className="animate-spin" />Saving…</> : <><Save size={14} />Save Changes</>}
          </Button>
        </div>
      </form>

      {/* Images */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-900">Images</h2>
            <p className="text-xs text-muted-foreground mt-0.5">First image is the default shown in listings. Upload multiple at once.</p>
          </div>
          <label className={`flex items-center gap-1.5 text-sm cursor-pointer px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors ${uploadingImage ? 'opacity-50 pointer-events-none' : ''}`}>
            {uploadingImage ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
            {uploadingImage ? 'Uploading…' : 'Upload Images'}
            <input type="file" accept="image/*" multiple className="sr-only" onChange={handleImageUpload} disabled={uploadingImage} />
          </label>
        </div>
        {imageError && <p className="text-xs text-red-600 mb-3">{imageError}</p>}
        {(product.images || []).length === 0 ? (
          <div className="py-8 text-center text-muted-foreground border border-dashed border-gray-200 rounded-lg">
            <ImageIcon size={24} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No images yet. Upload one above.</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {[...(product.images || [])].sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0)).map((img) => {
              const src = getImageSrc(img.url);
              return (
                <div key={img.id} className={`relative group rounded-lg border-2 overflow-hidden ${img.is_primary ? 'border-primary' : 'border-gray-200'}`}>
                  <img src={src} alt={img.alt_text || product.name} className="w-28 h-28 object-cover" />
                  {img.is_primary && (
                    <div className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded">
                      Default
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end justify-center gap-1 pb-2 opacity-0 group-hover:opacity-100">
                    {!img.is_primary && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(img.id)}
                        className="text-[10px] bg-white text-gray-800 font-semibold px-2 py-1 rounded shadow hover:bg-gray-100"
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(img.id)}
                      className="text-[10px] bg-red-500 text-white font-semibold px-2 py-1 rounded shadow hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Variants */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Variants</h2>
        </div>
        <div className="space-y-3">
          {(product.variants || []).map((v) => (
            <VariantEditRow
              key={v.id}
              variant={v}
              productId={id}
              attributes={attributes}
              onSaved={invalidate}
              onDeactivate={handleDeactivateVariant}
            />
          ))}
          {(product.variants || []).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4 border border-dashed border-gray-200 rounded-lg">No active variants.</p>
          )}
          <NewVariantPanel productId={id} attributes={attributes} onSaved={invalidate} />
        </div>
      </div>

      {/* Order History */}
      <ProductOrderHistory productId={id} />
    </div>
  );
};

export default ProductEditPage;

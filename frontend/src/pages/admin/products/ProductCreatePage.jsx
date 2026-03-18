import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2, AlertCircle, Plus, Trash2 } from 'lucide-react';
import adminProductsApi from '../../../api/admin/products.api';
import adminCategoriesApi from '../../../api/admin/categories.api';
import adminAttributesApi from '../../../api/admin/attributes.api';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { slugify } from '../../../lib/formatters';

// ─── Variant Form Row ──────────────────────────────────────────────────────────

const emptyVariant = () => ({ sku: '', name: '', price: '', compare_price: '', stock_quantity: '0', attribute_value_ids: [] });

const VariantRow = ({ variant, index, attributes, onChange, onRemove }) => {
  const handleChange = (field, val) => onChange(index, { ...variant, [field]: val });

  const toggleAttrValue = (valueId) => {
    const ids = variant.attribute_value_ids.includes(valueId)
      ? variant.attribute_value_ids.filter((id) => id !== valueId)
      : [...variant.attribute_value_ids, valueId];
    handleChange('attribute_value_ids', ids);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Variant {index + 1}</span>
        <button type="button" onClick={() => onRemove(index)} className="text-red-500 hover:text-red-700">
          <Trash2 size={14} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <Label className="text-xs">SKU *</Label>
          <Input value={variant.sku} onChange={(e) => handleChange('sku', e.target.value)} placeholder="SKU-001" className="mt-1 h-8 text-sm" />
        </div>
        <div>
          <Label className="text-xs">Name</Label>
          <Input value={variant.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="e.g. Red / L" className="mt-1 h-8 text-sm" />
        </div>
        <div>
          <Label className="text-xs">Price (₹) *</Label>
          <Input type="number" min="0" step="0.01" value={variant.price} onChange={(e) => handleChange('price', e.target.value)} placeholder="0.00" className="mt-1 h-8 text-sm" />
        </div>
        <div>
          <Label className="text-xs">Compare price (₹)</Label>
          <Input type="number" min="0" step="0.01" value={variant.compare_price} onChange={(e) => handleChange('compare_price', e.target.value)} placeholder="0.00" className="mt-1 h-8 text-sm" />
        </div>
        <div>
          <Label className="text-xs">Stock qty</Label>
          <Input type="number" min="0" value={variant.stock_quantity} onChange={(e) => handleChange('stock_quantity', e.target.value)} className="mt-1 h-8 text-sm" />
        </div>
      </div>
      {attributes.length > 0 && (
        <div>
          <Label className="text-xs mb-1 block">Attribute values</Label>
          <div className="flex flex-wrap gap-2">
            {attributes.flatMap((attr) =>
              (attr.values || []).map((val) => (
                <label key={val.id} className="flex items-center gap-1.5 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={variant.attribute_value_ids.includes(val.id)}
                    onChange={() => toggleAttrValue(val.id)}
                    className="rounded"
                  />
                  <span className="text-gray-600">{attr.name}: {val.value}</span>
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── ProductCreatePage ─────────────────────────────────────────────────────────

const ProductCreatePage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '', slug: '', description: '', brand: '',
    is_active: true, is_featured: false,
    meta_title: '', meta_description: '',
    category_ids: [],
  });
  const [variants, setVariants] = useState([emptyVariant()]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

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

  const setField = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'name' && !prev.slug) {
        next.slug = slugify(value);
      }
      return next;
    });
    if (errors[field]) setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  };

  const toggleCategory = (id) => {
    setForm((prev) => ({
      ...prev,
      category_ids: prev.category_ids.includes(id)
        ? prev.category_ids.filter((c) => c !== id)
        : [...prev.category_ids, id],
    }));
  };

  const handleVariantChange = (index, variant) => {
    setVariants((prev) => prev.map((v, i) => i === index ? variant : v));
  };

  const handleVariantRemove = (index) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Product name is required.';
    if (form.category_ids.length === 0) errs.category_ids = 'Select at least one category.';
    variants.forEach((v, i) => {
      if (!v.sku.trim()) errs[`variant_${i}_sku`] = `Variant ${i + 1}: SKU is required.`;
      if (!v.price || Number(v.price) <= 0) errs[`variant_${i}_price`] = `Variant ${i + 1}: Price must be > 0.`;
    });
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    setSubmitError('');
    try {
      const body = {
        ...form,
        slug: form.slug || slugify(form.name),
        meta_title: form.meta_title || undefined,
        meta_description: form.meta_description || undefined,
        brand: form.brand || undefined,
      };
      const { data: res } = await adminProductsApi.create(body);
      const productId = res.data.product.id;

      // Create all variants
      for (const v of variants) {
        await adminProductsApi.addVariant(productId, {
          sku: v.sku,
          name: v.name || undefined,
          price: Number(v.price),
          compare_price: v.compare_price ? Number(v.compare_price) : undefined,
          stock_quantity: Number(v.stock_quantity) || 0,
          attribute_value_ids: v.attribute_value_ids,
        });
      }

      navigate(`/admin/products/${productId}/edit`);
    } catch (err) {
      setSubmitError(err.response?.data?.error?.message || 'Failed to create product.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin/products" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">New Product</h1>
      </div>

      {submitError && (
        <p className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
          <AlertCircle size={14} /> {submitError}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Basic Information</h2>

          <div>
            <Label>Product name *</Label>
            <Input value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="e.g. Classic White T-Shirt" className="mt-1" />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
          </div>

          <div>
            <Label>Slug (auto-generated if blank)</Label>
            <Input value={form.slug} onChange={(e) => setField('slug', e.target.value)} placeholder="classic-white-t-shirt" className="mt-1" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Brand</Label>
              <Input value={form.brand} onChange={(e) => setField('brand', e.target.value)} placeholder="e.g. Nike" className="mt-1" />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <textarea
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              rows={4}
              placeholder="Product description…"
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
          {errors.category_ids && <p className="text-xs text-red-600 mb-2">{errors.category_ids}</p>}
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">No categories yet. <Link to="/admin/catalog/categories" className="underline">Create one first.</Link></p>
          ) : (
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
          )}
        </div>

        {/* Variants */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Variants</h2>
            <Button type="button" variant="outline" size="sm" onClick={() => setVariants((prev) => [...prev, emptyVariant()])} className="gap-1">
              <Plus size={13} /> Add Variant
            </Button>
          </div>
          <div className="space-y-3">
            {variants.map((v, i) => (
              <VariantRow
                key={i}
                variant={v}
                index={i}
                attributes={attributes}
                onChange={handleVariantChange}
                onRemove={handleVariantRemove}
              />
            ))}
            {variants.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Add at least one variant before saving.</p>
            )}
            {Object.entries(errors).filter(([k]) => k.startsWith('variant_')).map(([k, msg]) => (
              <p key={k} className="text-xs text-red-600">{msg}</p>
            ))}
          </div>
        </div>

        {/* SEO */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">SEO (optional)</h2>
          <div>
            <Label>Meta title</Label>
            <Input value={form.meta_title} onChange={(e) => setField('meta_title', e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Meta description</Label>
            <Input value={form.meta_description} onChange={(e) => setField('meta_description', e.target.value)} className="mt-1" />
          </div>
        </div>

        <div className="flex gap-3 pb-8">
          <Button type="submit" disabled={saving} className="gap-1.5">
            {saving ? <><Loader2 size={14} className="animate-spin" />Saving…</> : 'Create Product'}
          </Button>
          <Link to="/admin/products"><Button variant="outline" type="button">Cancel</Button></Link>
        </div>
      </form>
    </div>
  );
};

export default ProductCreatePage;

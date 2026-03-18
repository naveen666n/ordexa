import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Loader2, AlertCircle, ChevronRight, FolderOpen } from 'lucide-react';
import adminCategoriesApi from '../../../api/admin/categories.api';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Skeleton } from '../../../components/ui/skeleton';

// ─── Category Form ─────────────────────────────────────────────────────────────

const CategoryForm = ({ initial, categories, onSave, onCancel }) => {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    slug: initial?.slug ?? '',
    parent_id: initial?.parent_id ?? '',
    sort_order: initial?.sort_order ?? 0,
    is_active: initial?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      const body = {
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        parent_id: form.parent_id ? Number(form.parent_id) : undefined,
        sort_order: Number(form.sort_order) || 0,
        is_active: form.is_active,
      };
      await onSave(body);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to save category.');
      setSaving(false);
    }
  };

  const parentOptions = categories.filter((c) => c.id !== initial?.id);

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label className="text-xs">Name *</Label>
        <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Electronics" className="mt-1 h-8 text-sm" autoFocus />
      </div>
      <div>
        <Label className="text-xs">Slug (auto-generated if blank)</Label>
        <Input value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} placeholder="electronics" className="mt-1 h-8 text-sm" />
      </div>
      <div>
        <Label className="text-xs">Parent category</Label>
        <select
          value={form.parent_id}
          onChange={(e) => setForm((p) => ({ ...p, parent_id: e.target.value }))}
          className="mt-1 w-full h-8 text-sm border border-input rounded-md px-2 focus:outline-none focus:ring-2 focus:ring-ring bg-white"
        >
          <option value="">— None (top-level) —</option>
          {parentOptions.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-4">
        <div className="w-24">
          <Label className="text-xs">Sort order</Label>
          <Input type="number" min="0" value={form.sort_order} onChange={(e) => setForm((p) => ({ ...p, sort_order: e.target.value }))} className="mt-1 h-8 text-sm" />
        </div>
        <div className="flex items-end pb-0.5">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} className="rounded" />
            Active
          </label>
        </div>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm" disabled={saving} className="gap-1">
          {saving ? <Loader2 size={12} className="animate-spin" /> : null}
          {initial ? 'Save' : 'Create'}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
};

// ─── CategoriesPage ────────────────────────────────────────────────────────────

const CategoriesPage = () => {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => adminCategoriesApi.list().then((r) => r.data.data.categories),
    staleTime: 30_000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });

  const handleCreate = async (body) => {
    await adminCategoriesApi.create(body);
    setShowCreate(false);
    invalidate();
  };

  const handleUpdate = async (id, body) => {
    await adminCategoriesApi.update(id, body);
    setEditingId(null);
    invalidate();
  };

  const handleDelete = async (category) => {
    if (!window.confirm(`Delete "${category.name}"? This cannot be undone.`)) return;
    setError('');
    try {
      await adminCategoriesApi.remove(category.id);
      invalidate();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to delete category.');
    }
  };

  const sorted = [...categories].sort((a, b) => {
    if (!a.parent_id && b.parent_id) return -1;
    if (a.parent_id && !b.parent_id) return 1;
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{categories.length} total</p>
        </div>
        {!showCreate && (
          <Button size="sm" className="gap-1.5" onClick={() => setShowCreate(true)}>
            <Plus size={15} /> New Category
          </Button>
        )}
      </div>

      {error && (
        <p className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
          <AlertCircle size={14} /> {error}
        </p>
      )}

      {showCreate && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-4">
          <h2 className="font-semibold text-gray-900 mb-4">New Category</h2>
          <CategoryForm
            categories={categories}
            onSave={handleCreate}
            onCancel={() => setShowCreate(false)}
          />
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
          </div>
        ) : sorted.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <FolderOpen size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No categories yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name / Slug</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Parent</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Order</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.map((cat) => {
                const depth = cat.parent_id ? 1 : 0;
                if (editingId === cat.id) {
                  return (
                    <tr key={cat.id} className="bg-blue-50">
                      <td colSpan={5} className="px-4 py-4">
                        <CategoryForm
                          initial={cat}
                          categories={categories}
                          onSave={(body) => handleUpdate(cat.id, body)}
                          onCancel={() => setEditingId(null)}
                        />
                      </td>
                    </tr>
                  );
                }
                return (
                  <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2" style={{ paddingLeft: depth * 20 }}>
                        {depth > 0 && <ChevronRight size={13} className="text-gray-400 flex-shrink-0" />}
                        <span className="font-medium text-gray-800">{cat.name}</span>
                        <span className="text-xs font-mono text-muted-foreground hidden sm:inline">{cat.slug}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-gray-600 hidden md:table-cell">
                      {cat.parent_id
                        ? categories.find((c) => c.id === cat.parent_id)?.name || '—'
                        : <span className="text-muted-foreground text-xs">Top-level</span>}
                    </td>
                    <td className="px-4 py-2.5 text-center text-gray-600 hidden sm:table-cell">{cat.sort_order}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                        cat.is_active
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-gray-50 text-gray-500 border-gray-200'
                      }`}>
                        {cat.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => setEditingId(cat.id)}>
                          <Pencil size={12} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => handleDelete(cat)}
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CategoriesPage;

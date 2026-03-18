import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Loader2, AlertCircle, ChevronDown, ChevronRight, Tag } from 'lucide-react';
import adminAttributesApi from '../../../api/admin/attributes.api';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Skeleton } from '../../../components/ui/skeleton';

// ─── Attribute Form ────────────────────────────────────────────────────────────

const AttributeForm = ({ initial, onSave, onCancel }) => {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    type: initial?.type ?? 'select',
    is_filterable: initial?.is_filterable ?? false,
    is_visible: initial?.is_visible ?? true,
    sort_order: initial?.sort_order ?? 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave({
        name: form.name.trim(),
        type: form.type,
        is_filterable: form.is_filterable,
        is_visible: form.is_visible,
        sort_order: Number(form.sort_order) || 0,
      });
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to save.');
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Name *</Label>
          <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Color" className="mt-1 h-8 text-sm" autoFocus />
        </div>
        <div>
          <Label className="text-xs">Type</Label>
          <select
            value={form.type}
            onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
            className="mt-1 w-full h-8 text-sm border border-input rounded-md px-2 focus:outline-none focus:ring-2 focus:ring-ring bg-white"
          >
            <option value="select">Select</option>
            <option value="multiselect">Multi-select</option>
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="boolean">Boolean</option>
          </select>
        </div>
      </div>
      <div className="flex gap-4">
        <div className="w-24">
          <Label className="text-xs">Sort order</Label>
          <Input type="number" min="0" value={form.sort_order} onChange={(e) => setForm((p) => ({ ...p, sort_order: e.target.value }))} className="mt-1 h-8 text-sm" />
        </div>
        <div className="flex items-end gap-4 pb-0.5">
          <label className="flex items-center gap-1.5 cursor-pointer text-sm">
            <input type="checkbox" checked={form.is_filterable} onChange={(e) => setForm((p) => ({ ...p, is_filterable: e.target.checked }))} className="rounded" />
            Filterable
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-sm">
            <input type="checkbox" checked={form.is_visible} onChange={(e) => setForm((p) => ({ ...p, is_visible: e.target.checked }))} className="rounded" />
            Visible
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

// ─── Value Form ────────────────────────────────────────────────────────────────

const ValueForm = ({ initial, onSave, onCancel }) => {
  const [form, setForm] = useState({
    value: initial?.value ?? '',
    color_hex: initial?.color_hex ?? '',
    sort_order: initial?.sort_order ?? 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.value.trim()) { setError('Value is required.'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave({
        value: form.value.trim(),
        color_hex: form.color_hex || undefined,
        sort_order: Number(form.sort_order) || 0,
      });
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to save value.');
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <div className="flex-1">
        <Label className="text-xs">Value *</Label>
        <Input value={form.value} onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))} placeholder="e.g. Red" className="mt-1 h-7 text-xs" autoFocus />
      </div>
      <div className="w-24">
        <Label className="text-xs">Color hex</Label>
        <Input value={form.color_hex} onChange={(e) => setForm((p) => ({ ...p, color_hex: e.target.value }))} placeholder="#FF0000" className="mt-1 h-7 text-xs" />
      </div>
      <div className="w-16">
        <Label className="text-xs">Order</Label>
        <Input type="number" min="0" value={form.sort_order} onChange={(e) => setForm((p) => ({ ...p, sort_order: e.target.value }))} className="mt-1 h-7 text-xs" />
      </div>
      {error && <p className="text-xs text-red-600 self-center">{error}</p>}
      <Button type="submit" size="sm" disabled={saving} className="h-7 text-xs gap-1 mb-0.5">
        {saving ? <Loader2 size={11} className="animate-spin" /> : null}
        {initial ? 'Save' : 'Add'}
      </Button>
      <Button type="button" size="sm" variant="outline" onClick={onCancel} className="h-7 text-xs mb-0.5">Cancel</Button>
    </form>
  );
};

// ─── Attribute Row (expandable) ────────────────────────────────────────────────

const AttributeRow = ({ attribute, onEdit, onDelete, onAddValue, onEditValue, onDeleteValue }) => {
  const [expanded, setExpanded] = useState(false);
  const [addingValue, setAddingValue] = useState(false);
  const [editingValueId, setEditingValueId] = useState(null);

  const values = attribute.values ?? [];

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Attribute header */}
      <div className="flex items-center px-4 py-3 bg-white hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => setExpanded((v) => !v)}>
        <button type="button" className="text-gray-400 mr-2 flex-shrink-0">
          {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </button>
        <div className="flex-1 min-w-0">
          <span className="font-medium text-gray-900 text-sm">{attribute.name}</span>
          <span className="ml-2 text-xs text-muted-foreground font-mono">{attribute.slug}</span>
          <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{attribute.type}</span>
          {attribute.is_filterable && (
            <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">filterable</span>
          )}
        </div>
        <span className="text-xs text-muted-foreground mr-3">{values.length} value{values.length !== 1 ? 's' : ''}</span>
        <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <Button variant="outline" size="sm" onClick={() => onEdit(attribute)} className="h-7 text-xs gap-1">
            <Pencil size={11} /> Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => onDelete(attribute)}
          >
            <Trash2 size={11} />
          </Button>
        </div>
      </div>

      {/* Values panel */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 space-y-2">
          {values.length === 0 && !addingValue && (
            <p className="text-xs text-muted-foreground py-1">No values yet.</p>
          )}
          {values.map((val) => (
            editingValueId === val.id ? (
              <ValueForm
                key={val.id}
                initial={val}
                onSave={(body) => onEditValue(attribute.id, val.id, body).then(() => setEditingValueId(null))}
                onCancel={() => setEditingValueId(null)}
              />
            ) : (
              <div key={val.id} className="flex items-center gap-2 text-sm group">
                {val.color_hex && (
                  <span className="w-4 h-4 rounded-full border flex-shrink-0" style={{ backgroundColor: val.color_hex }} />
                )}
                <span className="flex-1 text-gray-800">{val.value}</span>
                <span className="text-xs font-mono text-muted-foreground">{val.slug}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="outline" size="sm" className="h-6 text-xs w-6 p-0" onClick={() => setEditingValueId(val.id)}>
                    <Pencil size={10} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-xs w-6 p-0 text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => onDeleteValue(attribute.id, val.id)}
                  >
                    <Trash2 size={10} />
                  </Button>
                </div>
              </div>
            )
          ))}

          {addingValue ? (
            <ValueForm
              onSave={(body) => onAddValue(attribute.id, body).then(() => setAddingValue(false))}
              onCancel={() => setAddingValue(false)}
            />
          ) : (
            <button
              type="button"
              className="flex items-center gap-1 text-xs text-primary hover:underline mt-1"
              onClick={() => setAddingValue(true)}
            >
              <Plus size={11} /> Add value
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ─── AttributesPage ────────────────────────────────────────────────────────────

const AttributesPage = () => {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  const { data: attributes = [], isLoading } = useQuery({
    queryKey: ['admin', 'attributes'],
    queryFn: () => adminAttributesApi.list().then((r) => r.data.data.attributes),
    staleTime: 30_000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'attributes'] });

  const handleCreate = async (body) => {
    await adminAttributesApi.create(body);
    setShowCreate(false);
    invalidate();
  };

  const handleUpdate = async (id, body) => {
    await adminAttributesApi.update(id, body);
    setEditingId(null);
    invalidate();
  };

  const handleDelete = async (attribute) => {
    if (!window.confirm(`Delete attribute "${attribute.name}" and all its values?`)) return;
    setError('');
    try {
      await adminAttributesApi.remove(attribute.id);
      invalidate();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to delete attribute.');
    }
  };

  const handleAddValue = async (attrId, body) => {
    await adminAttributesApi.addValue(attrId, body);
    invalidate();
  };

  const handleEditValue = async (attrId, valueId, body) => {
    await adminAttributesApi.updateValue(attrId, valueId, body);
    invalidate();
  };

  const handleDeleteValue = async (attrId, valueId) => {
    if (!window.confirm('Delete this attribute value?')) return;
    setError('');
    try {
      await adminAttributesApi.deleteValue(attrId, valueId);
      invalidate();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to delete value.');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Attributes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{attributes.length} total — used for product variants &amp; filters</p>
        </div>
        {!showCreate && (
          <Button size="sm" className="gap-1.5" onClick={() => setShowCreate(true)}>
            <Plus size={15} /> New Attribute
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
          <h2 className="font-semibold text-gray-900 mb-4">New Attribute</h2>
          <AttributeForm onSave={handleCreate} onCancel={() => setShowCreate(false)} />
        </div>
      )}

      {editingId !== null && (
        <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-6 mb-4">
          <h2 className="font-semibold text-gray-900 mb-4">Edit Attribute</h2>
          <AttributeForm
            initial={attributes.find((a) => a.id === editingId)}
            onSave={(body) => handleUpdate(editingId, body)}
            onCancel={() => setEditingId(null)}
          />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
        </div>
      ) : attributes.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground border border-dashed border-gray-200 rounded-xl">
          <Tag size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No attributes yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {attributes.map((attr) => (
            <AttributeRow
              key={attr.id}
              attribute={attr}
              onEdit={(a) => setEditingId(a.id)}
              onDelete={handleDelete}
              onAddValue={handleAddValue}
              onEditValue={handleEditValue}
              onDeleteValue={handleDeleteValue}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AttributesPage;

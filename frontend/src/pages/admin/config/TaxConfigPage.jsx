import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Pencil, Trash2, Check, X, AlertCircle } from 'lucide-react';
import configApi from '../../../api/admin/config.api';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';

const emptyRule = { name: '', region: '', category_slug: '', rate: '', is_active: true };

const RuleForm = ({ initial, onSave, onCancel, saving }) => {
  const [form, setForm] = useState(initial || emptyRule);
  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs">Rule Name</Label>
          <Input value={form.name} onChange={set('name')} placeholder="GST 18%" className="h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Rate (%)</Label>
          <Input type="number" step="0.01" value={form.rate} onChange={set('rate')} placeholder="18" className="h-8 text-sm" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs">Region (blank = global)</Label>
          <Input value={form.region} onChange={set('region')} placeholder="IN, US, etc." className="h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Category Slug (blank = all)</Label>
          <Input value={form.category_slug} onChange={set('category_slug')} placeholder="electronics" className="h-8 text-sm" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
            className="rounded"
          />
          Active
        </label>
      </div>
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

const TaxConfigPage = () => {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState('');

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['admin', 'tax', 'rules'],
    queryFn: () => configApi.getTaxRules().then((r) => r.data.data),
    staleTime: 30_000,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin', 'tax', 'rules'] });

  const handleCreate = async (form) => {
    setSavingId('new');
    setError('');
    try {
      await configApi.createTaxRule({
        name: form.name,
        region: form.region || null,
        category_slug: form.category_slug || null,
        rate: Number(form.rate) || 0,
        is_active: form.is_active,
      });
      refresh();
      setShowAdd(false);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create tax rule.');
    } finally {
      setSavingId(null);
    }
  };

  const handleUpdate = async (id, form) => {
    setSavingId(id);
    setError('');
    try {
      await configApi.updateTaxRule(id, {
        name: form.name,
        region: form.region || null,
        category_slug: form.category_slug || null,
        rate: Number(form.rate) || 0,
        is_active: form.is_active,
      });
      refresh();
      setEditingId(null);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to update tax rule.');
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (rule) => {
    if (!window.confirm(`Delete tax rule "${rule.name}"?`)) return;
    setError('');
    try {
      await configApi.deleteTaxRule(rule.id);
      refresh();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to delete tax rule.');
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
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tax Rules</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{rules.length} rule{rules.length !== 1 ? 's' : ''} configured</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setShowAdd(true)} disabled={showAdd}>
          <Plus size={14} /> Add Rule
        </Button>
      </div>

      {error && (
        <p className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
          <AlertCircle size={14} /> {error}
        </p>
      )}

      {showAdd && (
        <div className="mb-4">
          <RuleForm
            onSave={handleCreate}
            onCancel={() => setShowAdd(false)}
            saving={savingId === 'new'}
          />
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {rules.length === 0 && !showAdd ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-gray-500 text-sm">No tax rules yet.</p>
            <p className="text-muted-foreground text-xs mt-1">Click "Add Rule" to configure tax rates.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Region</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Category</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Rate</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Active</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id} className="border-b border-gray-50 last:border-0">
                  {editingId === rule.id ? (
                    <td colSpan={6} className="px-4 py-3">
                      <RuleForm
                        initial={{
                          name: rule.name,
                          region: rule.region || '',
                          category_slug: rule.category_slug || '',
                          rate: rule.rate,
                          is_active: rule.is_active,
                        }}
                        onSave={(form) => handleUpdate(rule.id, form)}
                        onCancel={() => setEditingId(null)}
                        saving={savingId === rule.id}
                      />
                    </td>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-medium text-gray-900">{rule.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{rule.region || <span className="italic text-xs">Global</span>}</td>
                      <td className="px-4 py-3 text-muted-foreground">{rule.category_slug || <span className="italic text-xs">All</span>}</td>
                      <td className="px-4 py-3 font-semibold">{rule.rate}%</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          rule.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {rule.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={() => setEditingId(rule.id)} className="text-gray-400 hover:text-gray-700">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => handleDelete(rule)} className="text-gray-400 hover:text-red-500">
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

export default TaxConfigPage;

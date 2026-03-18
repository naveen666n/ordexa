import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import configApi from '../../../api/admin/config.api';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'];

const GeneralConfigPage = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: '',
    tagline: '',
    contact_email: '',
    contact_phone: '',
    currency: 'INR',
    logo_url: '',
    favicon_url: '',
  });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success'|'error', message }

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'config', 'site'],
    queryFn: () => configApi.getGroup('site').then((r) => r.data.data),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (data) {
      setForm((prev) => ({ ...prev, ...data }));
    }
  }, [data]);

  const handleChange = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      await configApi.updateGroup('site', form);
      queryClient.invalidateQueries({ queryKey: ['config', 'public'] });
      setStatus({ type: 'success', message: 'General settings saved successfully.' });
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.error?.message || 'Failed to save settings.' });
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
        <h1 className="text-xl font-bold text-gray-900">General Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Store name, contact info, and basic configuration.</p>
      </div>

      {status && (
        <div className={`flex items-center gap-2 text-sm rounded-lg px-4 py-3 mb-5 border ${
          status.type === 'success'
            ? 'text-green-700 bg-green-50 border-green-200'
            : 'text-red-600 bg-red-50 border-red-200'
        }`}>
          {status.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          {status.message}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Store Name</Label>
            <Input id="name" value={form.name} onChange={handleChange('name')} placeholder="My Store" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="currency">Currency</Label>
            <select
              id="currency"
              value={form.currency}
              onChange={handleChange('currency')}
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tagline">Tagline</Label>
          <Input id="tagline" value={form.tagline} onChange={handleChange('tagline')} placeholder="Discover amazing products" />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="contact_email">Contact Email</Label>
            <Input id="contact_email" type="email" value={form.contact_email} onChange={handleChange('contact_email')} placeholder="support@store.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact_phone">Contact Phone</Label>
            <Input id="contact_phone" value={form.contact_phone} onChange={handleChange('contact_phone')} placeholder="+91 98765 43210" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="logo_url">Logo URL</Label>
          <Input id="logo_url" value={form.logo_url} onChange={handleChange('logo_url')} placeholder="https://example.com/logo.png" />
          <p className="text-xs text-muted-foreground">Enter a URL to your logo image. Image upload coming soon.</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="favicon_url">Favicon URL</Label>
          <Input id="favicon_url" value={form.favicon_url} onChange={handleChange('favicon_url')} placeholder="https://example.com/favicon.ico" />
        </div>

        <div className="pt-2">
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GeneralConfigPage;

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import configApi from '../../../api/admin/config.api';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';

const GATEWAYS = ['mock', 'razorpay'];
const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'];

const SecretField = ({ id, label, value, onChange, placeholder }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder || '••••••••'}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
      <p className="text-xs text-muted-foreground">Leave blank to keep existing value unchanged.</p>
    </div>
  );
};

const PaymentConfigPage = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    gateway: 'mock',
    razorpay_key_id: '',
    razorpay_key_secret: '',
    razorpay_webhook_secret: '',
    currency: 'INR',
  });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'config', 'payment'],
    queryFn: () => configApi.getGroup('payment').then((r) => r.data.data),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (data) {
      setForm((prev) => ({
        ...prev,
        gateway: data.gateway || 'mock',
        razorpay_key_id: data.razorpay_key_id || '',
        // secret fields come back as null — keep as empty string (placeholder shows)
        razorpay_key_secret: '',
        razorpay_webhook_secret: '',
        currency: data.currency || 'INR',
      }));
    }
  }, [data]);

  const handleChange = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      // Only include secret fields if user typed a new value
      const payload = {
        gateway: form.gateway,
        razorpay_key_id: form.razorpay_key_id,
        currency: form.currency,
      };
      if (form.razorpay_key_secret) payload.razorpay_key_secret = form.razorpay_key_secret;
      if (form.razorpay_webhook_secret) payload.razorpay_webhook_secret = form.razorpay_webhook_secret;

      await configApi.updateGroup('payment', payload);
      queryClient.invalidateQueries({ queryKey: ['config', 'public'] });
      setStatus({ type: 'success', message: 'Payment settings saved successfully.' });
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
        <h1 className="text-xl font-bold text-gray-900">Payment Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Configure your payment gateway and currency.</p>
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
            <Label htmlFor="gateway">Payment Gateway</Label>
            <select
              id="gateway"
              value={form.gateway}
              onChange={handleChange('gateway')}
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {GATEWAYS.map((g) => (
                <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>
              ))}
            </select>
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

        {form.gateway === 'razorpay' && (
          <div className="space-y-5 pt-2 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-700 pt-1">Razorpay Configuration</p>
            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Secret fields are write-only — blank means keep existing value. Values are never shown once saved.
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="razorpay_key_id">Key ID</Label>
              <Input
                id="razorpay_key_id"
                value={form.razorpay_key_id}
                onChange={handleChange('razorpay_key_id')}
                placeholder="rzp_live_xxxxxxxxxxxxxxxx"
              />
            </div>
            <SecretField
              id="razorpay_key_secret"
              label="Key Secret"
              value={form.razorpay_key_secret}
              onChange={handleChange('razorpay_key_secret')}
            />
            <SecretField
              id="razorpay_webhook_secret"
              label="Webhook Secret"
              value={form.razorpay_webhook_secret}
              onChange={handleChange('razorpay_webhook_secret')}
            />
          </div>
        )}

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

export default PaymentConfigPage;

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save, AlertCircle, CheckCircle2, Eye, EyeOff, Mail } from 'lucide-react';
import configApi from '../../../api/admin/config.api';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';

const SMS_PROVIDERS = ['none', 'twilio', 'msg91'];

const SecretField = ({ id, label, value, onChange }) => {
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
          placeholder="••••••••"
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
      <p className="text-xs text-muted-foreground">Leave blank to keep existing value.</p>
    </div>
  );
};

const NotificationConfigPage = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    smtp_host: '',
    smtp_port: '587',
    smtp_user: '',
    smtp_pass: '',
    smtp_from_name: '',
    smtp_from_email: '',
    sms_provider: 'none',
    sms_api_key: '',
    sms_sender_id: '',
  });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [testStatus, setTestStatus] = useState(null);
  const [testingEmail, setTestingEmail] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'config', 'notification'],
    queryFn: () => configApi.getGroup('notification').then((r) => r.data.data),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (data) {
      setForm((prev) => ({
        ...prev,
        smtp_host: data.smtp_host || '',
        smtp_port: data.smtp_port || '587',
        smtp_user: data.smtp_user || '',
        smtp_pass: '', // secret — never pre-fill
        smtp_from_name: data.smtp_from_name || '',
        smtp_from_email: data.smtp_from_email || '',
        sms_provider: data.sms_provider || 'none',
        sms_api_key: '', // secret
        sms_sender_id: data.sms_sender_id || '',
      }));
    }
  }, [data]);

  const handleChange = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const payload = {
        smtp_host: form.smtp_host,
        smtp_port: form.smtp_port,
        smtp_user: form.smtp_user,
        smtp_from_name: form.smtp_from_name,
        smtp_from_email: form.smtp_from_email,
        sms_provider: form.sms_provider,
        sms_sender_id: form.sms_sender_id,
      };
      if (form.smtp_pass) payload.smtp_pass = form.smtp_pass;
      if (form.sms_api_key) payload.sms_api_key = form.sms_api_key;

      await configApi.updateGroup('notification', payload);
      queryClient.invalidateQueries({ queryKey: ['config', 'public'] });
      setStatus({ type: 'success', message: 'Notification settings saved successfully.' });
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.error?.message || 'Failed to save settings.' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    setTestingEmail(true);
    setTestStatus(null);
    try {
      const res = await configApi.testEmail();
      const result = res.data.data;
      setTestStatus({
        type: result.sent ? 'success' : 'error',
        message: result.message,
      });
    } catch (err) {
      setTestStatus({ type: 'error', message: err.response?.data?.error?.message || 'Test failed.' });
    } finally {
      setTestingEmail(false);
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
        <h1 className="text-xl font-bold text-gray-900">Notification Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Configure SMTP and SMS for order notifications.</p>
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

      {/* SMTP Section */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5 mb-4">
        <p className="text-sm font-semibold text-gray-800">SMTP Email Settings</p>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="smtp_host">SMTP Host</Label>
            <Input id="smtp_host" value={form.smtp_host} onChange={handleChange('smtp_host')} placeholder="smtp.gmail.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="smtp_port">SMTP Port</Label>
            <Input id="smtp_port" type="number" value={form.smtp_port} onChange={handleChange('smtp_port')} placeholder="587" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="smtp_user">SMTP Username</Label>
            <Input id="smtp_user" value={form.smtp_user} onChange={handleChange('smtp_user')} placeholder="user@gmail.com" />
          </div>
          <SecretField id="smtp_pass" label="SMTP Password" value={form.smtp_pass} onChange={handleChange('smtp_pass')} />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="smtp_from_name">From Name</Label>
            <Input id="smtp_from_name" value={form.smtp_from_name} onChange={handleChange('smtp_from_name')} placeholder="My Store" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="smtp_from_email">From Email</Label>
            <Input id="smtp_from_email" type="email" value={form.smtp_from_email} onChange={handleChange('smtp_from_email')} placeholder="noreply@store.com" />
          </div>
        </div>

        {testStatus && (
          <div className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 border ${
            testStatus.type === 'success'
              ? 'text-green-700 bg-green-50 border-green-200'
              : 'text-red-600 bg-red-50 border-red-200'
          }`}>
            {testStatus.type === 'success' ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
            {testStatus.message}
          </div>
        )}

        <Button variant="outline" onClick={handleTestEmail} disabled={testingEmail} size="sm" className="gap-2">
          {testingEmail ? <Loader2 size={13} className="animate-spin" /> : <Mail size={13} />}
          Send Test Email
        </Button>
      </div>

      {/* SMS Section */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5 mb-4">
        <p className="text-sm font-semibold text-gray-800">SMS Settings</p>

        <div className="space-y-1.5">
          <Label htmlFor="sms_provider">SMS Provider</Label>
          <select
            id="sms_provider"
            value={form.sms_provider}
            onChange={handleChange('sms_provider')}
            className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {SMS_PROVIDERS.map((p) => (
              <option key={p} value={p}>{p === 'none' ? 'None (disabled)' : p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
        </div>

        {form.sms_provider !== 'none' && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <SecretField id="sms_api_key" label="API Key" value={form.sms_api_key} onChange={handleChange('sms_api_key')} />
            <div className="space-y-1.5">
              <Label htmlFor="sms_sender_id">Sender ID</Label>
              <Input id="sms_sender_id" value={form.sms_sender_id} onChange={handleChange('sms_sender_id')} placeholder="MYSTORE" />
            </div>
          </div>
        )}
      </div>

      <Button onClick={handleSave} disabled={saving} className="gap-2">
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        Save Settings
      </Button>
    </div>
  );
};

export default NotificationConfigPage;

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save, AlertCircle, CheckCircle2, HardDrive, Cloud } from 'lucide-react';
import configApi from '../../../api/admin/config.api';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';

const PROVIDERS = [
  {
    id: 'local',
    label: 'Local Disk',
    description: 'Store files on the server filesystem in the /uploads directory.',
    icon: HardDrive,
  },
  {
    id: 's3',
    label: 'Amazon S3 / S3-Compatible',
    description: 'Store files in Amazon S3, Cloudflare R2, MinIO, or any S3-compatible service.',
    icon: Cloud,
  },
];

const StorageConfigPage = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    provider: 'local',
    s3_bucket: '',
    s3_region: 'us-east-1',
    s3_access_key_id: '',
    s3_secret_access_key: '',
    s3_endpoint: '',
    s3_cdn_url: '',
  });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'config', 'storage'],
    queryFn: () => configApi.getGroup('storage').then((r) => r.data.data),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (data) setForm((prev) => ({ ...prev, ...data }));
  }, [data]);

  const setField = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      await configApi.updateGroup('storage', form);
      queryClient.invalidateQueries({ queryKey: ['admin', 'config', 'storage'] });
      setStatus({ type: 'success', message: 'Storage settings saved. New uploads will use the selected provider.' });
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.error?.message || 'Failed to save.' });
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
        <h1 className="text-xl font-bold text-gray-900">Storage Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Choose where uploaded files (product images, banners, etc.) are stored.
        </p>
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

      <div className="space-y-4">
        {/* Provider selector */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Storage Provider</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {PROVIDERS.map(({ id, label, description, icon: Icon }) => (
              <label
                key={id}
                className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  form.provider === id
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="provider"
                  value={id}
                  checked={form.provider === id}
                  onChange={setField('provider')}
                  className="mt-0.5 accent-primary"
                />
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Icon size={14} className={form.provider === id ? 'text-primary' : 'text-gray-500'} />
                    <span className="text-sm font-medium text-gray-900">{label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* S3 credentials (shown only when S3 is selected) */}
        {form.provider === 's3' && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">S3 / S3-Compatible Credentials</h2>
            <p className="text-xs text-muted-foreground -mt-2">
              Works with Amazon S3, Cloudflare R2, MinIO, Backblaze B2, DigitalOcean Spaces, and any S3-compatible service.
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Bucket Name *</Label>
                <Input value={form.s3_bucket} onChange={setField('s3_bucket')} placeholder="my-store-bucket" />
              </div>
              <div className="space-y-1.5">
                <Label>Region</Label>
                <Input value={form.s3_region} onChange={setField('s3_region')} placeholder="us-east-1" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Access Key ID *</Label>
                <Input value={form.s3_access_key_id} onChange={setField('s3_access_key_id')} placeholder="AKIAIOSFODNN7EXAMPLE" />
              </div>
              <div className="space-y-1.5">
                <Label>Secret Access Key *</Label>
                <Input
                  type="password"
                  value={form.s3_secret_access_key}
                  onChange={setField('s3_secret_access_key')}
                  placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Custom Endpoint URL <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                value={form.s3_endpoint}
                onChange={setField('s3_endpoint')}
                placeholder="https://your-account.r2.cloudflarestorage.com"
              />
              <p className="text-xs text-muted-foreground">
                Leave blank for Amazon S3. Required for Cloudflare R2, MinIO, and other S3-compatible services.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>CDN / Public URL Prefix <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                value={form.s3_cdn_url}
                onChange={setField('s3_cdn_url')}
                placeholder="https://cdn.yourdomain.com"
              />
              <p className="text-xs text-muted-foreground">
                If set, uploaded file URLs will use this prefix instead of the default S3 URL. Useful for CloudFront or custom domains.
              </p>
            </div>

            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800 space-y-1">
              <p className="font-medium">Setup checklist</p>
              <ul className="list-disc list-inside space-y-0.5 text-amber-700">
                <li>Make sure your bucket allows public reads for uploaded objects.</li>
                <li>For Amazon S3: configure a bucket policy granting <code>s3:GetObject</code> to everyone.</li>
                <li>Install the AWS SDK on the server: <code className="font-mono">npm install @aws-sdk/client-s3</code></li>
              </ul>
            </div>
          </div>
        )}

        {form.provider === 'local' && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-2">Local Storage Info</h2>
            <p className="text-sm text-muted-foreground">
              Files are saved to the <code className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">uploads/</code> directory
              on the server and served at <code className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">/uploads/&lt;filename&gt;</code>.
              No additional configuration needed.
            </p>
          </div>
        )}

        <div className="flex gap-3 pb-8">
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save Storage Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StorageConfigPage;

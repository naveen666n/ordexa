import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import configApi from '../../../api/admin/config.api';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';

const FONTS = [
  'Inter, system-ui, sans-serif',
  'Roboto, sans-serif',
  'Poppins, sans-serif',
  'Open Sans, sans-serif',
  'Lato, sans-serif',
];

const ColorField = ({ label, id, value, onChange }) => (
  <div className="space-y-1.5">
    <Label htmlFor={id}>{label}</Label>
    <div className="flex items-center gap-2">
      <input
        type="color"
        id={`${id}-picker`}
        value={value || '#000000'}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-12 rounded border border-input cursor-pointer p-0.5"
      />
      <Input
        id={id}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#000000"
        className="font-mono"
      />
    </div>
  </div>
);

const ThemeConfigPage = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    primary_color: '#4F46E5',
    secondary_color: '#10B981',
    accent_color: '#F59E0B',
    background_color: '#FFFFFF',
    text_color: '#111827',
    font_family: 'Inter, system-ui, sans-serif',
  });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'config', 'theme'],
    queryFn: () => configApi.getGroup('theme').then((r) => r.data.data),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (data) setForm((prev) => ({ ...prev, ...data }));
  }, [data]);

  const setColor = (key) => (val) => setForm((prev) => ({ ...prev, [key]: val }));

  const applyTheme = (cfg) => {
    const root = document.documentElement;
    if (cfg.primary_color) root.style.setProperty('--color-primary', cfg.primary_color);
    if (cfg.secondary_color) root.style.setProperty('--color-secondary', cfg.secondary_color);
    if (cfg.accent_color) root.style.setProperty('--color-accent', cfg.accent_color);
    if (cfg.font_family) root.style.setProperty('--font-family', cfg.font_family);
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      await configApi.updateGroup('theme', form);
      applyTheme(form);
      queryClient.invalidateQueries({ queryKey: ['config', 'public'] });
      setStatus({ type: 'success', message: 'Theme settings saved and applied.' });
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.error?.message || 'Failed to save theme.' });
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
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Theme Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Customize colors and typography for your storefront.</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
          <ColorField label="Primary Color" id="primary_color" value={form.primary_color} onChange={setColor('primary_color')} />
          <ColorField label="Secondary Color" id="secondary_color" value={form.secondary_color} onChange={setColor('secondary_color')} />
          <ColorField label="Accent Color" id="accent_color" value={form.accent_color} onChange={setColor('accent_color')} />
          <ColorField label="Background Color" id="background_color" value={form.background_color} onChange={setColor('background_color')} />
          <ColorField label="Text Color" id="text_color" value={form.text_color} onChange={setColor('text_color')} />

          <div className="space-y-1.5">
            <Label htmlFor="font_family">Font Family</Label>
            <select
              id="font_family"
              value={form.font_family}
              onChange={(e) => setForm((prev) => ({ ...prev, font_family: e.target.value }))}
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {FONTS.map((f) => <option key={f} value={f}>{f.split(',')[0]}</option>)}
            </select>
          </div>

          <div className="pt-2">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save & Apply Theme
            </Button>
          </div>
        </div>

        {/* Live Preview */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">Live Preview</p>
          <div
            className="rounded-xl border border-gray-200 shadow-sm overflow-hidden"
            style={{ backgroundColor: form.background_color, fontFamily: form.font_family }}
          >
            {/* Header preview */}
            <div className="px-5 py-4" style={{ backgroundColor: form.primary_color }}>
              <p className="text-white font-semibold text-sm">Store Name</p>
              <p className="text-white/70 text-xs mt-0.5">Navigation bar</p>
            </div>

            {/* Body preview */}
            <div className="p-5" style={{ color: form.text_color }}>
              <h3 className="font-bold text-base mb-1">Hero Section</h3>
              <p className="text-sm opacity-70 mb-4">Your storefront tagline goes here.</p>
              <button
                className="text-white text-sm font-medium px-4 py-2 rounded-lg"
                style={{ backgroundColor: form.primary_color }}
              >
                Shop Now
              </button>
            </div>

            {/* Card preview */}
            <div className="px-5 pb-5">
              <div className="border rounded-lg p-4" style={{ borderColor: `${form.primary_color}30` }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Sample Product</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: form.accent_color }}
                  >
                    New
                  </span>
                </div>
                <p className="text-sm font-bold" style={{ color: form.secondary_color }}>₹999</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeConfigPage;

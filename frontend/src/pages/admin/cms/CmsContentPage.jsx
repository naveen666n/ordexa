import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import cmsApi from '../../../api/admin/cms.api';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';

const EMAIL_TEMPLATE_KEYS = [
  'order_confirmation',
  'order_shipped',
  'order_delivered',
  'order_cancelled',
  'password_reset',
];

const SectionCard = ({ title, description, children, onSave, saving, status }) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
    <div>
      <p className="text-sm font-semibold text-gray-800">{title}</p>
      {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
    </div>
    {children}
    {status && (
      <div className={`flex items-center gap-2 text-xs rounded-lg px-3 py-2 border ${
        status.type === 'success'
          ? 'text-green-700 bg-green-50 border-green-200'
          : 'text-red-600 bg-red-50 border-red-200'
      }`}>
        {status.type === 'success' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
        {status.message}
      </div>
    )}
    <Button size="sm" onClick={onSave} disabled={saving} className="gap-2">
      {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
      Save
    </Button>
  </div>
);

const CmsContentPage = () => {
  const queryClient = useQueryClient();
  const [content, setContent] = useState({
    footer_text: '',
    login_tagline: '',
    register_tagline: '',
    empty_cart_message: '',
    empty_orders_message: '',
  });
  const [selectedTemplate, setSelectedTemplate] = useState('order_confirmation');
  const [templateValues, setTemplateValues] = useState({});
  const [saving, setSaving] = useState({});
  const [statuses, setStatuses] = useState({});

  const { data: contentData, isLoading: contentLoading } = useQuery({
    queryKey: ['admin', 'cms', 'content'],
    queryFn: () => cmsApi.getSection('content').then((r) => r.data.data),
    staleTime: 30_000,
  });

  const { data: emailData, isLoading: emailLoading } = useQuery({
    queryKey: ['admin', 'cms', 'email_template'],
    queryFn: () => cmsApi.getSection('email_template').then((r) => r.data.data),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (contentData) {
      setContent((prev) => ({ ...prev, ...contentData }));
    }
  }, [contentData]);

  useEffect(() => {
    if (emailData) {
      setTemplateValues(emailData);
    }
  }, [emailData]);

  const setContentField = (key) => (e) => setContent((p) => ({ ...p, [key]: e.target.value }));

  const saveSection = async (sectionKey, section, payload) => {
    setSaving((p) => ({ ...p, [sectionKey]: true }));
    setStatuses((p) => ({ ...p, [sectionKey]: null }));
    try {
      await cmsApi.updateSection(section, payload);
      queryClient.invalidateQueries({ queryKey: ['admin', 'cms', section] });
      setStatuses((p) => ({ ...p, [sectionKey]: { type: 'success', message: 'Saved successfully.' } }));
    } catch (err) {
      setStatuses((p) => ({
        ...p,
        [sectionKey]: { type: 'error', message: err.response?.data?.error?.message || 'Failed to save.' },
      }));
    } finally {
      setSaving((p) => ({ ...p, [sectionKey]: false }));
    }
  };

  const isLoading = contentLoading || emailLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Content CMS</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Edit site content and email templates.</p>
      </div>

      {/* General Content */}
      <SectionCard
        title="Site Content"
        description="Text shown throughout the storefront."
        onSave={() => saveSection('content', 'content', content)}
        saving={saving.content}
        status={statuses.content}
      >
        <div className="space-y-3">
          {[
            { key: 'footer_text', label: 'Footer Text', placeholder: '© 2025 Store. All rights reserved.' },
            { key: 'login_tagline', label: 'Login Page Tagline', placeholder: 'Welcome back!' },
            { key: 'register_tagline', label: 'Register Page Tagline', placeholder: 'Create an account today!' },
            { key: 'empty_cart_message', label: 'Empty Cart Message', placeholder: 'Your cart is empty.' },
            { key: 'empty_orders_message', label: 'Empty Orders Message', placeholder: 'No orders yet.' },
          ].map(({ key, label, placeholder }) => (
            <div key={key} className="space-y-1.5">
              <Label className="text-xs">{label}</Label>
              <textarea
                value={content[key] || ''}
                onChange={setContentField(key)}
                placeholder={placeholder}
                rows={2}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              />
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Email Templates */}
      <SectionCard
        title="Email Templates"
        description="HTML templates sent for order notifications. Use {{variable}} placeholders."
        onSave={() => saveSection('email', 'email_template', { [selectedTemplate]: templateValues[selectedTemplate] || '' })}
        saving={saving.email}
        status={statuses.email}
      >
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Select Template</Label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {EMAIL_TEMPLATE_KEYS.map((k) => (
                <option key={k} value={k}>
                  {k.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Template HTML</Label>
            <textarea
              value={templateValues[selectedTemplate] || ''}
              onChange={(e) => setTemplateValues((p) => ({ ...p, [selectedTemplate]: e.target.value }))}
              rows={14}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs font-mono shadow-sm focus:outline-none focus:ring-1 focus:ring-ring resize-y"
              placeholder="<html>...</html>"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Available variables: {'{{customer_name}}'}, {'{{order_number}}'}, {'{{order_total}}'}, {'{{store_name}}'}, {'{{reset_url}}'}
          </p>
        </div>
      </SectionCard>
    </div>
  );
};

export default CmsContentPage;

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import cmsApi from '../../../api/admin/cms.api';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';

const SectionCard = ({ title, children, onSave, saving, status }) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
    <p className="text-sm font-semibold text-gray-800">{title}</p>
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
      Save Section
    </Button>
  </div>
);

const CmsHomePage = () => {
  const queryClient = useQueryClient();
  const [hero, setHero] = useState({ hero_title: '', hero_subtitle: '', hero_cta_text: '', hero_cta_link: '', hero_image_url: '' });
  const [promo, setPromo] = useState({ promo_strip_text: '', promo_strip_color: '#4F46E5' });
  const [banners, setBanners] = useState({ banner1_image_url: '', banner1_link: '', banner2_image_url: '', banner2_link: '' });
  const [saving, setSaving] = useState({});
  const [statuses, setStatuses] = useState({});

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'cms', 'home'],
    queryFn: () => cmsApi.getSection('home').then((r) => r.data.data),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (data) {
      setHero({
        hero_title: data.hero_title || '',
        hero_subtitle: data.hero_subtitle || '',
        hero_cta_text: data.hero_cta_text || '',
        hero_cta_link: data.hero_cta_link || '',
        hero_image_url: data.hero_image_url || '',
      });
      setPromo({
        promo_strip_text: data.promo_strip_text || '',
        promo_strip_color: data.promo_strip_color || '#4F46E5',
      });
      setBanners({
        banner1_image_url: data.banner1_image_url || '',
        banner1_link: data.banner1_link || '',
        banner2_image_url: data.banner2_image_url || '',
        banner2_link: data.banner2_link || '',
      });
    }
  }, [data]);

  const saveSection = async (sectionKey, payload) => {
    setSaving((p) => ({ ...p, [sectionKey]: true }));
    setStatuses((p) => ({ ...p, [sectionKey]: null }));
    try {
      await cmsApi.updateSection('home', payload);
      queryClient.invalidateQueries({ queryKey: ['admin', 'cms', 'home'] });
      queryClient.invalidateQueries({ queryKey: ['cms', 'home'] });
      setStatuses((p) => ({ ...p, [sectionKey]: { type: 'success', message: 'Saved successfully.' } }));
    } catch (err) {
      setStatuses((p) => ({ ...p, [sectionKey]: { type: 'error', message: err.response?.data?.error?.message || 'Failed to save.' } }));
    } finally {
      setSaving((p) => ({ ...p, [sectionKey]: false }));
    }
  };

  const setHeroField = (key) => (e) => setHero((p) => ({ ...p, [key]: e.target.value }));
  const setPromoField = (key) => (e) => setPromo((p) => ({ ...p, [key]: e.target.value }));
  const setBannerField = (key) => (e) => setBanners((p) => ({ ...p, [key]: e.target.value }));

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
        <h1 className="text-xl font-bold text-gray-900">Homepage CMS</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Edit homepage hero, promo strip, and banners.</p>
      </div>

      {/* Hero Section */}
      <SectionCard
        title="Hero Section"
        onSave={() => saveSection('hero', hero)}
        saving={saving.hero}
        status={statuses.hero}
      >
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Hero Title</Label>
            <Input value={hero.hero_title} onChange={setHeroField('hero_title')} placeholder="Welcome to Our Store" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Hero Subtitle</Label>
            <Input value={hero.hero_subtitle} onChange={setHeroField('hero_subtitle')} placeholder="Discover amazing products" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">CTA Button Text</Label>
              <Input value={hero.hero_cta_text} onChange={setHeroField('hero_cta_text')} placeholder="Shop Now" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">CTA Button Link</Label>
              <Input value={hero.hero_cta_link} onChange={setHeroField('hero_cta_link')} placeholder="/products" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Hero Image URL</Label>
            <Input value={hero.hero_image_url} onChange={setHeroField('hero_image_url')} placeholder="https://example.com/hero.jpg" />
          </div>
        </div>
      </SectionCard>

      {/* Promo Strip */}
      <SectionCard
        title="Promo Strip"
        onSave={() => saveSection('promo', promo)}
        saving={saving.promo}
        status={statuses.promo}
      >
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Promo Text</Label>
            <Input value={promo.promo_strip_text} onChange={setPromoField('promo_strip_text')} placeholder="Free shipping on orders above ₹499!" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Background Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={promo.promo_strip_color || '#4F46E5'}
                onChange={setPromoField('promo_strip_color')}
                className="h-9 w-12 rounded border border-input cursor-pointer p-0.5"
              />
              <Input
                value={promo.promo_strip_color}
                onChange={setPromoField('promo_strip_color')}
                placeholder="#4F46E5"
                className="font-mono"
              />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Banners */}
      <SectionCard
        title="Promotional Banners"
        onSave={() => saveSection('banners', banners)}
        saving={saving.banners}
        status={statuses.banners}
      >
        <div className="space-y-3">
          <p className="text-xs font-medium text-gray-600">Banner 1</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Image URL</Label>
              <Input value={banners.banner1_image_url} onChange={setBannerField('banner1_image_url')} placeholder="https://..." />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Link</Label>
              <Input value={banners.banner1_link} onChange={setBannerField('banner1_link')} placeholder="/products?category=sale" />
            </div>
          </div>
          <p className="text-xs font-medium text-gray-600 pt-1">Banner 2</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Image URL</Label>
              <Input value={banners.banner2_image_url} onChange={setBannerField('banner2_image_url')} placeholder="https://..." />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Link</Label>
              <Input value={banners.banner2_link} onChange={setBannerField('banner2_link')} placeholder="/products?category=new" />
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
};

export default CmsHomePage;

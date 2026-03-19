import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save, AlertCircle, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import cmsApi from '../../../api/admin/cms.api';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import ImageUploadField from '../../../components/admin/ImageUploadField';

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

const emptySlide = () => ({ image_url: '', link: '', title: '', subtitle: '' });

const CmsHomePage = () => {
  const queryClient = useQueryClient();
  const [hero, setHero] = useState({ hero_title: '', hero_subtitle: '', hero_cta_text: '', hero_cta_link: '' });
  const [slides, setSlides] = useState([]);
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
      });
      setSlides(Array.isArray(data.hero_slides) ? data.hero_slides : []);
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

  const addSlide = () => setSlides((p) => [...p, emptySlide()]);
  const removeSlide = (i) => setSlides((p) => p.filter((_, idx) => idx !== i));
  const updateSlideField = (i, key, val) =>
    setSlides((p) => p.map((s, idx) => (idx === i ? { ...s, [key]: val } : s)));

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
        onSave={() => saveSection('hero', { ...hero, hero_slides: slides })}
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

          {/* Slides Manager */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Hero Slides</Label>
              <button
                type="button"
                onClick={addSlide}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Plus size={11} /> Add Slide
              </button>
            </div>
            {slides.length === 0 && (
              <p className="text-xs text-muted-foreground py-2">
                No slides yet. Click "Add Slide" to add promotional images.
              </p>
            )}
            {slides.map((slide, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-3 space-y-2 bg-gray-50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-600">Slide {i + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeSlide(i)}
                    className="text-red-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <ImageUploadField
                  label="Slide Image"
                  value={slide.image_url}
                  onChange={(val) => updateSlideField(i, 'image_url', val)}
                  placeholder="https://example.com/banner.jpg"
                />
                <div className="space-y-1.5">
                  <Label className="text-xs">Product Link (redirect on click)</Label>
                  <Input
                    value={slide.link}
                    onChange={(e) => updateSlideField(i, 'link', e.target.value)}
                    placeholder="/products/product-slug"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Slide Title (optional)</Label>
                    <Input
                      value={slide.title}
                      onChange={(e) => updateSlideField(i, 'title', e.target.value)}
                      placeholder="Summer Sale"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Slide Subtitle (optional)</Label>
                    <Input
                      value={slide.subtitle}
                      onChange={(e) => updateSlideField(i, 'subtitle', e.target.value)}
                      placeholder="Up to 50% off"
                    />
                  </div>
                </div>
              </div>
            ))}
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
        <div className="space-y-4">
          <div className="space-y-3">
            <p className="text-xs font-medium text-gray-600">Banner 1</p>
            <ImageUploadField
              label="Image"
              value={banners.banner1_image_url}
              onChange={(val) => setBanners((p) => ({ ...p, banner1_image_url: val }))}
              placeholder="https://..."
            />
            <div className="space-y-1.5">
              <Label className="text-xs">Link</Label>
              <Input value={banners.banner1_link} onChange={(e) => setBanners((p) => ({ ...p, banner1_link: e.target.value }))} placeholder="/products?category=sale" />
            </div>
          </div>
          <div className="space-y-3 pt-1">
            <p className="text-xs font-medium text-gray-600">Banner 2</p>
            <ImageUploadField
              label="Image"
              value={banners.banner2_image_url}
              onChange={(val) => setBanners((p) => ({ ...p, banner2_image_url: val }))}
              placeholder="https://..."
            />
            <div className="space-y-1.5">
              <Label className="text-xs">Link</Label>
              <Input value={banners.banner2_link} onChange={(e) => setBanners((p) => ({ ...p, banner2_link: e.target.value }))} placeholder="/products?category=new" />
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
};

export default CmsHomePage;

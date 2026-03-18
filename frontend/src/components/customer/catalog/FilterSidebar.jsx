import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, SlidersHorizontal } from 'lucide-react';
import categoriesApi from '../../../api/categories.api';
import { cn } from '../../../lib/utils';
import { CACHE_TIME } from '../../../lib/constants';

const parseAttrs = (raw) => {
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
};

const ColorSwatch = ({ value, selected, onClick }) => (
  <button
    onClick={onClick}
    title={value.value}
    className={cn(
      'w-6 h-6 rounded-full border-2 transition-all',
      selected ? 'border-primary ring-2 ring-primary/30 scale-110' : 'border-gray-200 hover:border-gray-400'
    )}
    style={{ backgroundColor: value.color_hex || '#ccc' }}
  />
);

const FilterSidebar = ({ filters, onSetFilter, onResetFilters, categorySlug }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: filtersData } = useQuery({
    queryKey: ['category-filters', categorySlug],
    queryFn: () => categoriesApi.getFilters(categorySlug).then((r) => r.data.data.filters),
    enabled: !!categorySlug,
    staleTime: CACHE_TIME.FILTERS,
  });

  const attrFilters = filtersData || [];
  const currentAttrs = parseAttrs(filters.attributes);

  const toggleAttrValue = (attrSlug, valueSlug) => {
    const current = currentAttrs[attrSlug] || [];
    const next = current.includes(valueSlug)
      ? current.filter((v) => v !== valueSlug)
      : [...current, valueSlug];
    const newAttrs = { ...currentAttrs, [attrSlug]: next };
    if (newAttrs[attrSlug].length === 0) delete newAttrs[attrSlug];
    onSetFilter('attributes', Object.keys(newAttrs).length ? JSON.stringify(newAttrs) : null);
  };

  const isAttrValueSelected = (attrSlug, valueSlug) =>
    (currentAttrs[attrSlug] || []).includes(valueSlug);

  const content = (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-gray-900">Filters</h3>
        <button
          onClick={onResetFilters}
          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
        >
          Reset all
        </button>
      </div>

      {/* Price Range */}
      <div>
        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Price Range</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.min_price || ''}
            onChange={(e) => onSetFilter('min_price', e.target.value || null)}
            className="w-full h-8 px-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <span className="text-muted-foreground text-xs">–</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.max_price || ''}
            onChange={(e) => onSetFilter('max_price', e.target.value || null)}
            className="w-full h-8 px-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* In Stock toggle */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">In Stock Only</p>
        <button
          onClick={() => onSetFilter('in_stock', filters.in_stock === 'true' ? null : 'true')}
          className={cn(
            'relative inline-flex h-5 w-9 rounded-full transition-colors',
            filters.in_stock === 'true' ? 'bg-primary' : 'bg-gray-300'
          )}
        >
          <span
            className={cn(
              'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform mt-0.5',
              filters.in_stock === 'true' ? 'translate-x-4' : 'translate-x-0.5'
            )}
          />
        </button>
      </div>

      {/* Dynamic attribute filters */}
      {attrFilters.map((attr) => (
        <div key={attr.id}>
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">{attr.name}</p>
          {/* Color swatches if all values have color_hex */}
          {attr.values.every((v) => v.color_hex) ? (
            <div className="flex flex-wrap gap-2">
              {attr.values.map((v) => (
                <ColorSwatch
                  key={v.id}
                  value={v}
                  selected={isAttrValueSelected(attr.slug, v.slug)}
                  onClick={() => toggleAttrValue(attr.slug, v.slug)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {attr.values.map((v) => (
                <label key={v.id} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={isAttrValueSelected(attr.slug, v.slug)}
                    onChange={() => toggleAttrValue(attr.slug, v.slug)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900 flex-1">{v.value}</span>
                  <span className="text-xs text-muted-foreground">{v.product_count}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden flex items-center gap-2 text-sm font-medium border border-gray-200 rounded-md px-3 h-9 bg-white"
      >
        <SlidersHorizontal size={14} />
        Filters
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 inset-y-0 w-72 bg-white p-5 overflow-y-auto shadow-xl">
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X size={18} />
            </button>
            {content}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:block w-60 flex-shrink-0">
        {content}
      </div>
    </>
  );
};

export default FilterSidebar;

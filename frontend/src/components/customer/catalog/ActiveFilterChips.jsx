import { X } from 'lucide-react';

const Chip = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
    {label}
    <button onClick={onRemove} className="hover:text-primary/60">
      <X size={11} />
    </button>
  </span>
);

const ActiveFilterChips = ({ filters, filterMeta, onRemoveFilter, onClearAll }) => {
  const chips = [];

  if (filters.category) chips.push({ key: 'category', label: `Category: ${filters.category}` });
  if (filters.sort) chips.push({ key: 'sort', label: `Sort: ${filters.sort}` });
  if (filters.min_price) chips.push({ key: 'min_price', label: `Min: ₹${filters.min_price}` });
  if (filters.max_price) chips.push({ key: 'max_price', label: `Max: ₹${filters.max_price}` });
  if (filters.in_stock === 'true') chips.push({ key: 'in_stock', label: 'In Stock' });
  if (filters.featured === 'true') chips.push({ key: 'featured', label: 'Featured' });

  // Attribute chips
  if (filters.attributes) {
    try {
      const attrs = JSON.parse(filters.attributes);
      Object.entries(attrs).forEach(([attrSlug, valueSlugs]) => {
        // Find human-readable names from filterMeta
        const attr = filterMeta?.find((a) => a.slug === attrSlug);
        valueSlugs.forEach((vs) => {
          const val = attr?.values.find((v) => v.slug === vs);
          chips.push({
            key: `attr__${attrSlug}__${vs}`,
            label: `${attr?.name || attrSlug}: ${val?.value || vs}`,
          });
        });
      });
    } catch {/* invalid JSON */}
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <Chip key={chip.key} label={chip.label} onRemove={() => onRemoveFilter(chip.key)} />
      ))}
      <button
        onClick={onClearAll}
        className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
      >
        Clear all
      </button>
    </div>
  );
};

export default ActiveFilterChips;

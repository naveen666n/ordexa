import { ChevronDown } from 'lucide-react';

const SORT_OPTIONS = [
  { value: '', label: 'Relevance' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'featured', label: 'Featured' },
];

const SortDropdown = ({ value, onChange }) => (
  <div className="relative">
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value || null)}
      className="h-9 pl-3 pr-8 text-sm rounded-md border border-gray-200 bg-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
    >
      {SORT_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
    <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
  </div>
);

export default SortDropdown;

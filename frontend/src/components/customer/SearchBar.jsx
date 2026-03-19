import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import useDebounce from '../../hooks/useDebounce';
import productsApi from '../../api/products.api';
import { formatCurrency } from '../../lib/formatters';
import { getImageSrc } from '../../lib/utils';

const PLACEHOLDER_IMG = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"%3E%3Crect width="48" height="48" fill="%23f3f4f6"/%3E%3C/svg%3E';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const { data } = useQuery({
    queryKey: ['search-preview', debouncedQuery],
    queryFn: () => productsApi.search(debouncedQuery, { limit: 5 }).then((r) => r.data.data),
    enabled: debouncedQuery.length >= 2,
    staleTime: 30_000,
  });

  const results = data?.products || [];

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/catalog?q=${encodeURIComponent(query.trim())}`);
      setOpen(false);
      setQuery('');
    }
  };

  const handleSelect = (slug) => {
    navigate(`/products/${slug}`);
    setOpen(false);
    setQuery('');
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-xs">
      <form onSubmit={handleSubmit} className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search products…"
          className="w-full h-9 pl-8 pr-8 text-sm rounded-md border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); setOpen(false); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X size={13} />
          </button>
        )}
      </form>

      {open && debouncedQuery.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-gray-100 shadow-lg z-50 overflow-hidden">
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">No results for "{debouncedQuery}"</p>
          ) : (
            <>
              {results.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelect(p.slug)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 text-left transition-colors"
                >
                  <img
                    src={getImageSrc(p.primary_image_url) || PLACEHOLDER_IMG}
                    alt={p.name}
                    className="h-10 w-10 rounded object-cover flex-shrink-0 bg-gray-100"
                    onError={(e) => { e.target.src = PLACEHOLDER_IMG; }}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(p.min_price)}</p>
                  </div>
                </button>
              ))}
              <button
                onClick={handleSubmit}
                className="w-full px-3 py-2 text-xs text-primary font-medium text-center hover:bg-primary/5 border-t border-gray-100"
              >
                See all results for "{debouncedQuery}"
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;

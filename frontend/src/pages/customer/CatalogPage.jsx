import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import productsApi from '../../api/products.api';
import categoriesApi from '../../api/categories.api';
import FilterSidebar from '../../components/customer/catalog/FilterSidebar';
import ProductGrid from '../../components/customer/catalog/ProductGrid';
import SortDropdown from '../../components/customer/catalog/SortDropdown';
import ActiveFilterChips from '../../components/customer/catalog/ActiveFilterChips';
import useFilters from '../../hooks/useFilters';
import { CACHE_TIME } from '../../lib/constants';

// ─── Pagination ───────────────────────────────────────────────────────────────

const Pagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex items-center justify-center gap-1 mt-8">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="h-8 w-8 flex items-center justify-center rounded border disabled:opacity-30 hover:bg-gray-50"
      >
        <ChevronLeft size={15} />
      </button>
      {start > 1 && (
        <>
          <button onClick={() => onPageChange(1)} className="h-8 w-8 text-sm rounded border hover:bg-gray-50">1</button>
          <span className="text-muted-foreground text-sm px-1">…</span>
        </>
      )}
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`h-8 w-8 text-sm rounded border ${p === page ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-gray-50'}`}
        >
          {p}
        </button>
      ))}
      {end < totalPages && (
        <>
          <span className="text-muted-foreground text-sm px-1">…</span>
          <button onClick={() => onPageChange(totalPages)} className="h-8 w-8 text-sm rounded border hover:bg-gray-50">{totalPages}</button>
        </>
      )}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="h-8 w-8 flex items-center justify-center rounded border disabled:opacity-30 hover:bg-gray-50"
      >
        <ChevronRight size={15} />
      </button>
    </div>
  );
};

// ─── CatalogPage ──────────────────────────────────────────────────────────────

const CatalogPage = () => {
  const { getFilter, getFilters, setFilter, resetFilters, getPage } = useFilters();

  const filters = getFilters();
  const page = getPage();
  const category = getFilter('category');
  const sort = getFilter('sort');
  const isSearchMode = !!filters.q;

  const queryParams = {
    page,
    limit: 20,
    ...(category && { category }),
    ...(sort && { sort }),
    ...(filters.min_price && { min_price: filters.min_price }),
    ...(filters.max_price && { max_price: filters.max_price }),
    ...(filters.attributes && { attributes: filters.attributes }),
    ...(filters.in_stock && { in_stock: filters.in_stock }),
    ...(filters.featured && { featured: filters.featured }),
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['products', queryParams, filters.q],
    queryFn: () => {
      if (isSearchMode) {
        return productsApi.search(filters.q, { page, limit: 20 }).then((r) => r.data.data);
      }
      return productsApi.list(queryParams).then((r) => r.data.data);
    },
    staleTime: CACHE_TIME.CATALOG,
    placeholderData: (prev) => prev,
  });

  const { data: filterMeta } = useQuery({
    queryKey: ['category-filters', category],
    queryFn: () => categoriesApi.getFilters(category).then((r) => r.data.data.filters),
    enabled: !!category,
    staleTime: CACHE_TIME.FILTERS,
  });

  const products = data?.products || [];
  const pagination = data?.pagination;
  const totalPages = pagination?.total_pages || 1;
  const loading = isLoading || isFetching;

  const handleRemoveFilter = (key) => {
    if (key.startsWith('attr__')) {
      const [, attrSlug, valueSlug] = key.split('__');
      const current = filters.attributes ? JSON.parse(filters.attributes) : {};
      const next = (current[attrSlug] || []).filter((v) => v !== valueSlug);
      const newAttrs = { ...current, [attrSlug]: next };
      if (!newAttrs[attrSlug].length) delete newAttrs[attrSlug];
      setFilter('attributes', Object.keys(newAttrs).length ? JSON.stringify(newAttrs) : null);
    } else {
      setFilter(key, null);
    }
  };

  const pageTitle = isSearchMode
    ? `Search: "${filters.q}"`
    : category
      ? category.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      : 'All Products';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
        {pagination && (
          <p className="text-sm text-muted-foreground mt-1">
            {pagination.total} product{pagination.total !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      <div className="flex gap-8 items-start">
        {/* Left: filter sidebar (desktop panel + mobile drawer+button) */}
        {!isSearchMode && (
          <FilterSidebar
            filters={filters}
            onSetFilter={setFilter}
            onResetFilters={resetFilters}
            categorySlug={category}
          />
        )}

        {/* Right: main content */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <ActiveFilterChips
              filters={filters}
              filterMeta={filterMeta}
              onRemoveFilter={handleRemoveFilter}
              onClearAll={resetFilters}
            />
            <SortDropdown value={sort} onChange={(v) => setFilter('sort', v)} />
          </div>

          <ProductGrid products={products} isLoading={loading} />

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={(p) => setFilter('page', String(p))}
          />
        </div>
      </div>
    </div>
  );
};

export default CatalogPage;

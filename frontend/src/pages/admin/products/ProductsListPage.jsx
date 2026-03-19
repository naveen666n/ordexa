import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Search, Loader2, AlertCircle, Package } from 'lucide-react';
import adminProductsApi from '../../../api/admin/products.api';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Skeleton } from '../../../components/ui/skeleton';
import { formatCurrency } from '../../../lib/formatters';
import { getImageSrc } from '../../../lib/utils';

const ProductsListPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'products'],
    queryFn: () => adminProductsApi.list({ limit: 200 }).then((r) => r.data.data),
    staleTime: 30_000,
  });

  const products = data?.products ?? [];

  const filtered = search.trim()
    ? products.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.brand?.toLowerCase().includes(search.toLowerCase())
      )
    : products;

  const handleDelete = async (product) => {
    if (!window.confirm(`Deactivate "${product.name}"?`)) return;
    setError('');
    setDeletingId(product.id);
    try {
      await adminProductsApi.remove(product.id);
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to deactivate product.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{products.length} total</p>
        </div>
        <Link to="/admin/products/new">
          <Button size="sm" className="gap-1.5">
            <Plus size={15} /> New Product
          </Button>
        </Link>
      </div>

      {error && (
        <p className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
          <AlertCircle size={14} /> {error}
        </p>
      )}

      <div className="mb-4 relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-8"
          placeholder="Search by name or brand…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <Package size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">{search ? 'No products match your search.' : 'No products yet.'}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Product</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Categories</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Price range</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((product) => {
                const prices = (product.variants ?? []).map((v) => Number(v.price)).filter(Boolean);
                const minP = prices.length ? Math.min(...prices) : null;
                const maxP = prices.length ? Math.max(...prices) : null;
                const priceLabel = minP === null ? '—'
                  : minP === maxP ? formatCurrency(minP)
                  : `${formatCurrency(minP)} – ${formatCurrency(maxP)}`;
                const thumb = getImageSrc(product.images?.[0]?.url);

                return (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {thumb ? (
                          <img src={thumb} alt={product.name} className="w-10 h-10 rounded-lg object-cover border flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <Package size={14} className="text-gray-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{product.name}</p>
                          {product.brand && <p className="text-xs text-muted-foreground">{product.brand}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                      {product.categories?.map((c) => c.name).join(', ') || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{priceLabel}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                        product.is_active
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-gray-50 text-gray-500 border-gray-200'
                      }`}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {product.is_featured && (
                        <span className="ml-1.5 text-xs font-medium px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                          Featured
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <Link to={`/admin/products/${product.id}/edit`}>
                          <Button variant="outline" size="sm" className="gap-1">
                            <Pencil size={13} /> Edit
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => handleDelete(product)}
                          disabled={deletingId === product.id}
                        >
                          {deletingId === product.id
                            ? <Loader2 size={13} className="animate-spin" />
                            : <Trash2 size={13} />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ProductsListPage;

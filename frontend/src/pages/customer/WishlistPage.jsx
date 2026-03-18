import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import wishlistApi from '../../api/wishlist.api';
import cartApi from '../../api/cart.api';
import useCartStore from '../../store/cart.store';
import useUIStore from '../../store/ui.store';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { formatCurrency } from '../../lib/formatters';
import { API_BASE_URL } from '../../lib/constants';

const BACKEND_URL = API_BASE_URL.replace('/api/v1', '');
const PLACEHOLDER_IMG = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"%3E%3Crect width="120" height="120" fill="%23f3f4f6"/%3E%3C/svg%3E';

// ─── WishlistItem ─────────────────────────────────────────────────────────────

const WishlistItem = ({ item, onRemove, onAddToCart }) => {
  const { variant, product } = item;
  const imgUrl = product?.images?.[0]?.url
    ? `${BACKEND_URL}${product.images[0].url}`
    : PLACEHOLDER_IMG;

  return (
    <div className="flex gap-4 p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
      <Link to={`/products/${product?.slug}`} className="flex-shrink-0">
        <img
          src={imgUrl}
          alt={product?.name}
          className="w-24 h-24 rounded-lg object-cover bg-gray-100"
          onError={(e) => { e.target.src = PLACEHOLDER_IMG; }}
        />
      </Link>

      <div className="flex-1 min-w-0">
        {product?.brand && (
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{product.brand}</p>
        )}
        <Link to={`/products/${product?.slug}`}>
          <h3 className="text-sm font-medium text-gray-900 hover:underline line-clamp-2">
            {product?.name}
          </h3>
        </Link>
        {variant?.name && (
          <p className="text-xs text-muted-foreground mt-0.5">{variant.name}</p>
        )}
        <p className="text-sm font-semibold text-gray-900 mt-1">
          {formatCurrency(variant?.price)}
        </p>

        <div className="flex items-center gap-2 mt-3">
          <Button
            size="sm"
            onClick={() => onAddToCart(variant?.id)}
            disabled={!variant?.is_in_stock}
            className="flex items-center gap-1.5"
          >
            <ShoppingCart size={14} />
            {variant?.is_in_stock ? 'Add to Cart' : 'Out of Stock'}
          </Button>
          <button
            onClick={() => onRemove(variant?.id)}
            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
            title="Remove from wishlist"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── WishlistPage ─────────────────────────────────────────────────────────────

const WishlistPage = () => {
  const { setCart } = useCartStore();
  const { openCartDrawer } = useUIStore();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => wishlistApi.getAll().then((r) => r.data.data),
    retry: false,
  });

  const handleRemove = async (variantId) => {
    try {
      await wishlistApi.remove(variantId);
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    } catch {
      // ignore
    }
  };

  const handleAddToCart = async (variantId) => {
    if (!variantId) return;
    try {
      const res = await cartApi.addItem(variantId, 1);
      setCart(res.data.data.cart);
      openCartDrawer();
    } catch {
      // ignore
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-7 w-40 mb-6" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Heart size={48} className="mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Wishlist unavailable</h2>
        <p className="text-muted-foreground">This feature is coming soon.</p>
      </div>
    );
  }

  const items = data?.items || [];

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Heart size={48} className="mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Your wishlist is empty</h2>
        <p className="text-muted-foreground mb-6">Save items you love and come back to them later.</p>
        <Link to="/catalog"><Button>Browse Products</Button></Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        My Wishlist
        <span className="ml-2 text-base font-normal text-muted-foreground">({items.length} items)</span>
      </h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <WishlistItem
            key={item.id}
            item={item}
            onRemove={handleRemove}
            onAddToCart={handleAddToCart}
          />
        ))}
      </div>
    </div>
  );
};

export default WishlistPage;

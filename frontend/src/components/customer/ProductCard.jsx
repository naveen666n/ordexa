import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useState } from 'react';
import { formatCurrency } from '../../lib/formatters';
import { cn } from '../../lib/utils';
import useAuthStore from '../../store/auth.store';
import wishlistApi from '../../api/wishlist.api';
import { API_BASE_URL } from '../../lib/constants';

const BACKEND_URL = API_BASE_URL.replace('/api/v1', '');
const PLACEHOLDER_IMG = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"%3E%3Crect width="400" height="400" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="14" fill="%239ca3af"%3ENo Image%3C/text%3E%3C/svg%3E';

const OfferBadge = ({ minPrice, comparePrice }) => {
  if (!comparePrice || comparePrice <= minPrice) return null;
  const pct = Math.round(((comparePrice - minPrice) / comparePrice) * 100);
  return (
    <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">
      {pct}% OFF
    </span>
  );
};

const StarRating = ({ rating = 0, count = 0 }) => (
  <div className="flex items-center gap-1 text-xs text-muted-foreground">
    <span className="text-yellow-400">★</span>
    <span>{rating > 0 ? rating.toFixed(1) : '—'}</span>
    {count > 0 && <span>({count})</span>}
  </div>
);

const WishlistButton = ({ variantId, className }) => {
  const { isAuthenticated } = useAuthStore();
  const [active, setActive] = useState(false);

  const toggle = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) return;
    try {
      if (active) {
        await wishlistApi.remove(variantId);
      } else {
        await wishlistApi.add(variantId);
      }
      setActive((p) => !p);
    } catch {
      // silently fail — wishlist API may not be wired yet
    }
  };

  return (
    <button
      onClick={toggle}
      className={cn(
        'p-1.5 rounded-full bg-white/80 hover:bg-white transition-colors shadow-sm',
        className
      )}
      title={active ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Heart size={15} className={active ? 'fill-red-500 text-red-500' : 'text-gray-500'} />
    </button>
  );
};

const ProductCard = ({ product }) => {
  const {
    name, slug, brand,
    min_price, max_price, compare_price,
    primary_image_url, primary_image_alt,
    has_stock, is_featured,
    rating_avg, review_count,
    variants,
  } = product;

  // Try to get first variant id for wishlist (from detail response or listing)
  const firstVariantId = variants?.[0]?.id;

  const displayPrice = Number(min_price || 0);
  const displayCompare = Number(compare_price || max_price || 0);
  const hasMultiplePrices = min_price && max_price && Number(min_price) !== Number(max_price);
  const inStock = Number(has_stock) === 1 || has_stock === true;

  return (
    <Link
      to={`/products/${slug}`}
      className="group relative flex flex-col rounded-lg border border-gray-100 bg-white hover:shadow-md transition-shadow overflow-hidden"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <img
          src={primary_image_url ? `${BACKEND_URL}${primary_image_url}` : PLACEHOLDER_IMG}
          alt={primary_image_alt || name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { e.target.src = PLACEHOLDER_IMG; }}
        />
        <OfferBadge minPrice={displayPrice} comparePrice={displayCompare} />
        {is_featured && (
          <span className="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded">
            FEATURED
          </span>
        )}
        {firstVariantId && (
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <WishlistButton variantId={firstVariantId} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1 flex-1">
        {brand && <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{brand}</p>}
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">{name}</h3>
        <StarRating rating={rating_avg} count={review_count} />

        <div className="mt-auto pt-2 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {hasMultiplePrices ? `From ${formatCurrency(displayPrice)}` : formatCurrency(displayPrice)}
            </p>
            {displayCompare > displayPrice && (
              <p className="text-xs text-muted-foreground line-through">{formatCurrency(displayCompare)}</p>
            )}
          </div>
          {!inStock && (
            <span className="text-[10px] text-red-500 font-medium">Out of stock</span>
          )}
        </div>
      </div>
    </Link>
  );
};

export { WishlistButton, StarRating };
export default ProductCard;

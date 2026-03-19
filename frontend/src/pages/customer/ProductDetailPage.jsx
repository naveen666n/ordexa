import { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShoppingCart, AlertCircle, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import productsApi from '../../api/products.api';
import { Skeleton } from '../../components/ui/skeleton';
import { WishlistButton, StarRating } from '../../components/customer/ProductCard';
import ReviewSection from '../../components/customer/ReviewSection';
import { formatCurrency } from '../../lib/formatters';
import { cn } from '../../lib/utils';
import useCartStore from '../../store/cart.store';
import useUIStore from '../../store/ui.store';
import useAuthStore from '../../store/auth.store';
import cartApi from '../../api/cart.api';
import { getImageSrc } from '../../lib/utils';

const PLACEHOLDER_IMG = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"%3E%3Crect width="600" height="600" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="18" fill="%239ca3af"%3ENo Image%3C/text%3E%3C/svg%3E';

const makeImgSrc = (url) => getImageSrc(url) || PLACEHOLDER_IMG;

// ─── Image Gallery ────────────────────────────────────────────────────────────

const ProductImageGallery = ({ images, selectedVariantImages }) => {
  const allImages = images || [];
  const displayImages = selectedVariantImages?.length ? selectedVariantImages : allImages;
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => { setActiveIdx(0); }, [selectedVariantImages]);

  const main = displayImages[activeIdx] || displayImages[0];

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div className="aspect-square rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
        <img
          src={makeImgSrc(main?.url)}
          alt={main?.alt_text || 'Product'}
          className="w-full h-full object-cover"
          onError={(e) => { e.target.src = PLACEHOLDER_IMG; }}
        />
      </div>
      {/* Thumbnails */}
      {displayImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {displayImages.map((img, i) => (
            <button
              key={img.id || i}
              onClick={() => setActiveIdx(i)}
              className={cn(
                'flex-shrink-0 w-16 h-16 rounded-lg border-2 overflow-hidden transition-all',
                i === activeIdx ? 'border-primary' : 'border-gray-100 hover:border-gray-300'
              )}
            >
              <img
                src={makeImgSrc(img.url)}
                alt={img.alt_text || ''}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = PLACEHOLDER_IMG; }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── VariantSelector ─────────────────────────────────────────────────────────

const VariantSelector = ({ variants, selected, onSelect }) => {
  // Build attribute groups from all variants
  const attrGroups = useMemo(() => {
    const map = new Map();
    variants.forEach((v) => {
      (v.attributeValues || []).forEach((av) => {
        const attr = av.attribute;
        if (!map.has(attr.id)) map.set(attr.id, { ...attr, values: new Map() });
        map.get(attr.id).values.set(av.id, av);
      });
    });
    return Array.from(map.values()).map((a) => ({
      ...a,
      values: Array.from(a.values.values()),
    }));
  }, [variants]);

  // Check if a value is in-stock (any variant with that value + current other selections)
  const isValueAvailable = (attrId, valueId) => {
    return variants.some((v) => {
      const hasValue = v.attributeValues.some((av) => av.attribute.id === attrId && av.id === valueId);
      if (!hasValue) return false;
      // Check other current selections are also satisfied
      const otherSelections = Object.entries(selected).filter(([aId]) => Number(aId) !== attrId);
      const matchesOthers = otherSelections.every(([aId, vId]) =>
        v.attributeValues.some((av) => av.attribute.id === Number(aId) && av.id === vId)
      );
      return matchesOthers && v.is_in_stock;
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {attrGroups.map((attr) => {
        const isColor = attr.values.every((v) => v.color_hex);
        return (
          <div key={attr.id}>
            <p className="text-sm font-semibold text-gray-700 mb-2">
              {attr.name}
              {selected[attr.id] && (
                <span className="font-normal text-muted-foreground ml-2">
                  — {attr.values.find((v) => v.id === selected[attr.id])?.value}
                </span>
              )}
            </p>
            {isColor ? (
              <div className="flex flex-wrap gap-2">
                {attr.values.map((v) => {
                  const available = isValueAvailable(attr.id, v.id);
                  const sel = selected[attr.id] === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => onSelect(attr.id, v.id)}
                      title={v.value}
                      disabled={!available}
                      className={cn(
                        'w-8 h-8 rounded-full border-2 transition-all relative',
                        sel ? 'border-primary ring-2 ring-primary/40 scale-110' : 'border-gray-200 hover:border-gray-400',
                        !available && 'opacity-40 cursor-not-allowed'
                      )}
                      style={{ backgroundColor: v.color_hex }}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {attr.values.map((v) => {
                  const available = isValueAvailable(attr.id, v.id);
                  const sel = selected[attr.id] === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => onSelect(attr.id, v.id)}
                      disabled={!available}
                      className={cn(
                        'px-3 py-1.5 text-sm rounded-md border-2 font-medium transition-all',
                        sel
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-gray-200 hover:border-gray-400 text-gray-700',
                        !available && 'opacity-40 cursor-not-allowed line-through'
                      )}
                    >
                      {v.value}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── Stock Indicator ─────────────────────────────────────────────────────────

const StockIndicator = ({ variant }) => {
  if (!variant) return null;
  if (!variant.is_in_stock) {
    return (
      <div className="flex items-center gap-1.5 text-red-500 text-sm font-medium">
        <AlertCircle size={15} /> Out of Stock
      </div>
    );
  }
  if (variant.is_low_stock) {
    return (
      <div className="flex items-center gap-1.5 text-amber-500 text-sm font-medium">
        <AlertTriangle size={15} /> Only {variant.stock_quantity} left
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
      <CheckCircle2 size={15} /> In Stock
    </div>
  );
};

// ─── Loading skeleton ─────────────────────────────────────────────────────────

const DetailSkeleton = () => (
  <div className="container mx-auto px-4 py-8">
    <div className="grid md:grid-cols-2 gap-10">
      <Skeleton className="aspect-square rounded-xl" />
      <div className="space-y-4">
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  </div>
);

// ─── ProductDetailPage ────────────────────────────────────────────────────────

const ProductDetailPage = () => {
  const { slug } = useParams();
  const { setCart } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();
  const openCartDrawer = useUIStore((s) => s.openCartDrawer);
  const [qty, setQty] = useState(1);
  const [selected, setSelected] = useState({}); // { [attrId]: valueId }
  const [addedMsg, setAddedMsg] = useState('');
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartError, setCartError] = useState('');
  const [activeTab, setActiveTab] = useState('Description');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productsApi.getBySlug(slug).then((r) => r.data.data.product),
    staleTime: 5 * 60 * 1000,
  });

  const product = data;
  const variants = product?.variants || [];

  // Auto-select first variant's attributes on load
  useEffect(() => {
    if (variants.length > 0 && Object.keys(selected).length === 0) {
      const init = {};
      (variants[0].attributeValues || []).forEach((av) => {
        init[av.attribute.id] = av.id;
      });
      setSelected(init);
    }
  }, [variants]);

  // Find matching variant from selected attributes
  const selectedVariant = useMemo(() => {
    if (!variants.length || !Object.keys(selected).length) return variants[0] || null;
    return variants.find((v) =>
      Object.entries(selected).every(([attrId, valueId]) =>
        (v.attributeValues || []).some((av) => av.attribute.id === Number(attrId) && av.id === valueId)
      )
    ) || null;
  }, [variants, selected]);

  const handleSelectAttr = (attrId, valueId) => {
    setSelected((prev) => ({ ...prev, [attrId]: valueId }));
  };

  const handleAddToCart = async () => {
    if (!selectedVariant || !selectedVariant.is_in_stock) return;
    if (!isAuthenticated) {
      setCartError('Please sign in to add items to cart.');
      return;
    }
    setAddingToCart(true);
    setCartError('');
    try {
      const res = await cartApi.addItem(selectedVariant.id, qty);
      setCart(res.data.data.cart);
      openCartDrawer();
      setAddedMsg('Added to cart!');
      setTimeout(() => setAddedMsg(''), 3000);
    } catch (err) {
      setCartError(err.response?.data?.error?.message || 'Failed to add to cart.');
    } finally {
      setAddingToCart(false);
    }
  };

  if (isLoading) return <DetailSkeleton />;
  if (isError || !product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-4xl mb-3">😕</p>
        <h2 className="text-xl font-semibold text-gray-800">Product not found</h2>
        <Link to="/catalog" className="text-primary text-sm mt-3 inline-block hover:underline">Back to catalog</Link>
      </div>
    );
  }

  const price = Number(selectedVariant?.price || product.min_price || 0);
  const comparePrice = Number(selectedVariant?.compare_price || 0);
  const discount = comparePrice > price ? Math.round(((comparePrice - price) / comparePrice) * 100) : 0;
  const variantImages = selectedVariant?.images || [];
  const inStock = selectedVariant?.is_in_stock;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
        <Link to="/" className="hover:text-foreground">Home</Link>
        <span>/</span>
        <Link to="/catalog" className="hover:text-foreground">Catalog</Link>
        {product.categories?.[0] && (
          <>
            <span>/</span>
            <Link to={`/catalog?category=${product.categories[0].slug}`} className="hover:text-foreground">
              {product.categories[0].name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-foreground font-medium truncate max-w-[160px]">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
        {/* Left: Image Gallery */}
        <ProductImageGallery images={product.images} selectedVariantImages={variantImages} />

        {/* Right: Info */}
        <div className="flex flex-col gap-5">
          {/* Brand */}
          {product.brand && (
            <p className="text-xs font-semibold text-primary uppercase tracking-widest">{product.brand}</p>
          )}

          {/* Name */}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">{product.name}</h1>

          {/* Rating */}
          <StarRating rating={product.rating_avg} count={product.review_count} />

          {/* Price */}
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-gray-900">{formatCurrency(price)}</span>
            {comparePrice > price && (
              <>
                <span className="text-lg text-muted-foreground line-through">{formatCurrency(comparePrice)}</span>
                <span className="text-sm font-semibold text-red-500">{discount}% OFF</span>
              </>
            )}
          </div>

          {/* Variant selector */}
          {variants.length > 0 && (
            <VariantSelector
              variants={variants}
              selected={selected}
              onSelect={handleSelectAttr}
            />
          )}

          {/* Stock + Qty */}
          <div className="flex items-center gap-4">
            <StockIndicator variant={selectedVariant} />
          </div>

          {/* Qty picker */}
          {inStock && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Qty:</span>
              <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 text-sm font-medium"
                >−</button>
                <span className="px-4 py-1.5 text-sm font-semibold border-x border-gray-200 min-w-[2.5rem] text-center">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(10, q + 1))}
                  className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 text-sm font-medium"
                >+</button>
              </div>
            </div>
          )}

          {/* Add to cart + Wishlist */}
          <div className="flex gap-3">
            <button
              onClick={handleAddToCart}
              disabled={!inStock || !selectedVariant || addingToCart}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 h-12 rounded-xl font-semibold text-sm transition-all',
                inStock && selectedVariant && !addingToCart
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              )}
            >
              {addingToCart ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <ShoppingCart size={18} />
              )}
              {addingToCart ? 'Adding…' : inStock ? 'Add to Cart' : 'Out of Stock'}
            </button>
            {selectedVariant && <WishlistButton variantId={selectedVariant.id} className="h-12 w-12 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow" />}
          </div>

          {/* Success message */}
          {addedMsg && (
            <div className="flex items-center gap-2 text-green-600 text-sm font-medium bg-green-50 px-3 py-2 rounded-lg">
              <CheckCircle2 size={15} /> {addedMsg}
            </div>
          )}

          {/* Cart error message */}
          {cartError && (
            <div className="flex items-center gap-2 text-red-600 text-sm font-medium bg-red-50 px-3 py-2 rounded-lg">
              <AlertCircle size={15} /> {cartError}
            </div>
          )}

          {/* Tabs: Description | Reviews */}
          <div className="mt-4 border-t pt-6">
            <div className="flex gap-6 border-b mb-4">
              {[
                { key: 'Description', label: 'Description' },
                { key: 'Reviews', label: `Reviews${product.review_count > 0 ? ` (${product.review_count})` : ''}` },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={cn('pb-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                    activeTab === key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            {activeTab === 'Description' ? (
              <div className="text-sm text-gray-600 leading-relaxed">
                {product.description || <span className="text-muted-foreground italic">No description available.</span>}
              </div>
            ) : (
              <ReviewSection slug={product.slug} isLoggedIn={!!user} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;

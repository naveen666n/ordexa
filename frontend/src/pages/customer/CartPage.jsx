import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ShoppingCart, Tag, AlertCircle, ArrowRight, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import cartApi from '../../api/cart.api';
import useCartStore from '../../store/cart.store';
import useAuthStore from '../../store/auth.store';
import CartItem from '../../components/customer/CartItem';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { formatCurrency } from '../../lib/formatters';
import { cn } from '../../lib/utils';

// ─── Coupon Section ───────────────────────────────────────────────────────────

const formatCouponLabel = (c) => {
  if (c.offer_type === 'PERCENT') return `${c.discount_value}% off`;
  if (c.offer_type === 'FIXED') return `₹${c.discount_value} off`;
  if (c.offer_type === 'FREE_SHIPPING') return 'Free shipping';
  return '';
};

const CouponSection = ({ appliedCoupon, onApply, onRemove, availableCoupons = [] }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCoupons, setShowCoupons] = useState(false);

  const handleApply = async (applyCode) => {
    const c = (applyCode || code).trim().toUpperCase();
    if (!c) return;
    setError('');
    setLoading(true);
    try {
      await onApply(c);
      setCode('');
      setShowCoupons(false);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Invalid coupon code.');
    } finally {
      setLoading(false);
    }
  };

  if (appliedCoupon) {
    return (
      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <Tag size={14} className="text-green-600" />
          <span className="font-semibold text-green-700">{appliedCoupon.code}</span>
          <span className="text-green-600">applied</span>
        </div>
        <button onClick={onRemove} className="text-sm text-red-500 hover:underline">Remove</button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && handleApply()}
          placeholder="Enter coupon code"
          className="flex-1 h-10 px-4 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
        <Button onClick={() => handleApply()} disabled={loading || !code.trim()}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : 'Apply'}
        </Button>
      </div>
      {error && (
        <p className="flex items-center gap-1.5 text-sm text-red-500">
          <AlertCircle size={13} /> {error}
        </p>
      )}

      {/* Available coupons */}
      {availableCoupons.length > 0 && (
        <div>
          <button
            onClick={() => setShowCoupons((v) => !v)}
            className="flex items-center gap-1 text-xs text-primary hover:underline mt-1"
          >
            {showCoupons ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {showCoupons ? 'Hide available coupons' : `View ${availableCoupons.length} available coupon${availableCoupons.length !== 1 ? 's' : ''}`}
          </button>

          {showCoupons && (
            <div className="mt-2 space-y-2">
              {availableCoupons.map((c) => (
                <div key={c.code} className="flex items-center justify-between bg-gray-50 border border-dashed border-gray-200 rounded-lg px-3 py-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Tag size={12} className="text-primary flex-shrink-0" />
                      <span className="text-sm font-mono font-semibold text-gray-800">{c.code}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatCouponLabel(c)}
                      {c.min_order_value > 0 ? ` · Min. ₹${c.min_order_value}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => handleApply(c.code)}
                    disabled={loading}
                    className="text-xs font-medium text-primary hover:underline flex-shrink-0 ml-2"
                  >
                    Apply
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Order Summary Sidebar ────────────────────────────────────────────────────

const OrderSummary = ({ cart, summary, summaryLoading, onCheckout }) => {
  const subtotal = cart?.subtotal || 0;
  const discount = summary?.discount_amount || 0;
  const discountSource = summary?.discount_source || '';
  const shipping = summary?.shipping_amount || 0;
  const tax = summary?.tax_amount || 0;
  const total = summary?.total_amount || (subtotal - discount);

  return (
    <div className="bg-gray-50 rounded-xl border border-gray-100 p-6 space-y-4">
      <h2 className="font-semibold text-gray-900">Order Summary</h2>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span className="truncate pr-2">{discountSource || 'Discount'}</span>
            <span>−{formatCurrency(discount)}</span>
          </div>
        )}

        <div className="flex justify-between text-gray-600">
          <span>Shipping</span>
          {summaryLoading ? (
            <Skeleton className="h-4 w-12" />
          ) : (
            <span>{shipping === 0 ? <span className="text-green-600">Free</span> : formatCurrency(shipping)}</span>
          )}
        </div>

        <div className="flex justify-between text-gray-600">
          <span>Tax</span>
          {summaryLoading ? (
            <Skeleton className="h-4 w-12" />
          ) : (
            <span>{formatCurrency(tax)}</span>
          )}
        </div>
      </div>

      <div className="border-t pt-3 flex justify-between font-bold text-gray-900">
        <span>Total</span>
        {summaryLoading ? (
          <Skeleton className="h-5 w-20" />
        ) : (
          <span>{formatCurrency(total)}</span>
        )}
      </div>

      <Button className="w-full" onClick={onCheckout}>
        Proceed to Checkout <ArrowRight size={15} className="ml-1" />
      </Button>
    </div>
  );
};

// ─── CartPage ─────────────────────────────────────────────────────────────────

const CartPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { setCart } = useCartStore();
  const queryClient = useQueryClient();

  const { data: cartData, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartApi.get().then((r) => r.data.data.cart),
    enabled: isAuthenticated,
    staleTime: 0,
  });

  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['cart-summary'],
    queryFn: () => cartApi.getSummary().then((r) => r.data.data.summary),
    enabled: isAuthenticated && (cartData?.items?.length > 0),
    staleTime: 0,
  });

  const { data: couponsData } = useQuery({
    queryKey: ['available-coupons'],
    queryFn: () => cartApi.getAvailableCoupons().then((r) => r.data.data.coupons),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (cartData) setCart(cartData);
  }, [cartData, setCart]);

  const cart = cartData || { items: [], item_count: 0, subtotal: 0, applied_coupon: null };

  const refetchCart = async () => {
    const fresh = await queryClient.fetchQuery({
      queryKey: ['cart'],
      queryFn: () => cartApi.get().then((r) => r.data.data.cart),
    });
    setCart(fresh);
    // Also invalidate summary
    queryClient.invalidateQueries({ queryKey: ['cart-summary'] });
    return fresh;
  };

  const handleUpdate = async (variantId, qty) => {
    await cartApi.updateItem(variantId, qty);
    await refetchCart();
  };

  const handleRemove = async (variantId) => {
    await cartApi.removeItem(variantId);
    await refetchCart();
  };

  const handleApplyCoupon = async (code) => {
    await cartApi.applyCoupon(code);
    await refetchCart();
  };

  const handleRemoveCoupon = async () => {
    await cartApi.removeCoupon();
    await refetchCart();
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Sign in to view your cart</h2>
        <Link to="/login"><Button>Sign in</Button></Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-7 w-32 mb-8" />
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 p-4 border rounded-xl">
                <Skeleton className="w-20 h-20 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </div>
            ))}
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground mb-6">Add some items to get started.</p>
        <Link to="/catalog"><Button>Start Shopping</Button></Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        Shopping Cart
        <span className="ml-2 text-base font-normal text-muted-foreground">
          ({cart.item_count} {cart.item_count === 1 ? 'item' : 'items'})
        </span>
      </h1>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => (
            <div key={item.variant_id} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
              <CartItem
                item={item}
                onUpdate={handleUpdate}
                onRemove={handleRemove}
              />
            </div>
          ))}

          {/* Coupon */}
          <div className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
            <p className="text-sm font-medium text-gray-700 mb-3">Have a coupon?</p>
            <CouponSection
              appliedCoupon={cart.applied_coupon}
              onApply={handleApplyCoupon}
              onRemove={handleRemoveCoupon}
              availableCoupons={couponsData || []}
            />
          </div>
        </div>

        {/* Summary */}
        <div className="lg:sticky lg:top-24">
          <OrderSummary
            cart={cart}
            summary={summaryData}
            summaryLoading={summaryLoading}
            onCheckout={() => navigate('/checkout')}
          />
        </div>
      </div>
    </div>
  );
};

export default CartPage;

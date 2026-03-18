import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, ShoppingCart, Tag, AlertCircle } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import useUIStore from '../../store/ui.store';
import useCartStore from '../../store/cart.store';
import useAuthStore from '../../store/auth.store';
import cartApi from '../../api/cart.api';
import CartItem from './CartItem';
import { Button } from '../ui/button';
import { formatCurrency } from '../../lib/formatters';
import { cn } from '../../lib/utils';

// ─── Coupon Input ─────────────────────────────────────────────────────────────

const CouponInput = ({ appliedCoupon, onApply, onRemove }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    if (!code.trim()) return;
    setError('');
    setLoading(true);
    try {
      await onApply(code.trim().toUpperCase());
      setCode('');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Invalid coupon code.');
    } finally {
      setLoading(false);
    }
  };

  if (appliedCoupon) {
    return (
      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm">
        <div className="flex items-center gap-2">
          <Tag size={13} className="text-green-600" />
          <span className="font-semibold text-green-700">{appliedCoupon.code}</span>
          <span className="text-green-600 text-xs">applied</span>
        </div>
        <button onClick={onRemove} className="text-xs text-red-500 hover:underline">Remove</button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && handleApply()}
          placeholder="Coupon code"
          className="flex-1 h-9 px-3 text-sm rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
        <Button size="sm" onClick={handleApply} disabled={loading || !code.trim()}>
          {loading ? '…' : 'Apply'}
        </Button>
      </div>
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500">
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  );
};

// ─── CartDrawer ───────────────────────────────────────────────────────────────

const CartDrawer = () => {
  const { isCartDrawerOpen, closeCartDrawer } = useUIStore();
  const { isAuthenticated } = useAuthStore();
  const { setCart, itemCount } = useCartStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const overlayRef = useRef(null);

  const { data, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartApi.get().then((r) => r.data.data.cart),
    enabled: isAuthenticated && isCartDrawerOpen,
    staleTime: 0,
  });

  useEffect(() => {
    if (data) setCart(data);
  }, [data, setCart]);

  // Sync itemCount to store even when drawer is closed (for badge)
  const { data: cartBadgeData } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartApi.get().then((r) => r.data.data.cart),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
  useEffect(() => {
    if (cartBadgeData) setCart(cartBadgeData);
  }, [cartBadgeData, setCart]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') closeCartDrawer(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [closeCartDrawer]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = isCartDrawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isCartDrawerOpen]);

  const cart = data || { items: [], item_count: 0, subtotal: 0, applied_coupon: null };

  const refetchCart = async () => {
    const fresh = await queryClient.fetchQuery({
      queryKey: ['cart'],
      queryFn: () => cartApi.get().then((r) => r.data.data.cart),
    });
    setCart(fresh);
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

  const handleCheckout = () => {
    closeCartDrawer();
    navigate('/checkout');
  };

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        onClick={closeCartDrawer}
        className={cn(
          'fixed inset-0 z-40 bg-black/40 transition-opacity duration-300',
          isCartDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      />

      {/* Drawer panel */}
      <div
        className={cn(
          'fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out',
          isCartDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} />
            <h2 className="font-semibold text-gray-900">Cart</h2>
            {cart.item_count > 0 && (
              <span className="ml-1 text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5 font-bold">
                {cart.item_count}
              </span>
            )}
          </div>
          <button onClick={closeCartDrawer} className="p-1.5 rounded-md hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {!isAuthenticated ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <ShoppingCart size={40} className="text-gray-300" />
              <p className="text-sm text-muted-foreground">Sign in to view your cart</p>
              <Link to="/login" onClick={closeCartDrawer}>
                <Button size="sm">Sign in</Button>
              </Link>
            </div>
          ) : isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-16 h-16 rounded-lg bg-gray-200 flex-shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <ShoppingCart size={40} className="text-gray-300" />
              <p className="text-sm font-medium text-gray-500">Your cart is empty</p>
              <Link to="/catalog" onClick={closeCartDrawer}>
                <Button variant="outline" size="sm">Start Shopping</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.items.map((item) => (
                <CartItem
                  key={item.variant_id}
                  item={item}
                  onUpdate={handleUpdate}
                  onRemove={handleRemove}
                  compact
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer (only when items exist) */}
        {isAuthenticated && cart.items.length > 0 && (
          <div className="border-t px-4 py-4 space-y-3">
            {/* Coupon */}
            <CouponInput
              appliedCoupon={cart.applied_coupon}
              onApply={handleApplyCoupon}
              onRemove={handleRemoveCoupon}
            />

            {/* Subtotal */}
            <div className="flex justify-between text-sm font-semibold text-gray-900">
              <span>Subtotal</span>
              <span>{formatCurrency(cart.subtotal)}</span>
            </div>

            <p className="text-xs text-muted-foreground">Shipping & tax calculated at checkout</p>

            {/* Actions */}
            <div className="flex gap-2">
              <Link to="/cart" onClick={closeCartDrawer} className="flex-1">
                <Button variant="outline" className="w-full" size="sm">View Cart</Button>
              </Link>
              <Button className="flex-1" size="sm" onClick={handleCheckout}>
                Checkout
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;

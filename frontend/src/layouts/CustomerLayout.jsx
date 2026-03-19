import { useEffect, useState, useRef } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Heart, Package, ChevronDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import useAuthStore from '../store/auth.store';
import useCartStore from '../store/cart.store';
import authApi from '../api/auth.api';
import cartApi from '../api/cart.api';
import { Button } from '../components/ui/button';
import SearchBar from '../components/customer/SearchBar';
import CartDrawer from '../components/customer/CartDrawer';
import { useConfig } from '../context/ConfigContext';

const CustomerLayout = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const config = useConfig();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);
  const { itemCount, setCart } = useCartStore();

  // Sync cart from API on mount (if authenticated)
  const { data: cartData } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartApi.get().then((r) => r.data.data.cart),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (cartData) setCart(cartData);
  }, [cartData, setCart]);

  const handleLogout = () => {
    authApi.logout().catch(() => {});
    clearAuth();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          {/* Logo */}
          <Link to="/" className="font-bold text-xl text-foreground tracking-tight flex-shrink-0">
            {config?.site?.logo_url ? (
              <img src={config.site.logo_url} alt={config.site.name || 'Store'} className="h-8 object-contain" />
            ) : (
              config?.site?.name || 'Store'
            )}
          </Link>

          {/* Nav links — hidden on small screens */}
          <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-muted-foreground flex-shrink-0">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <Link to="/catalog" className="hover:text-foreground transition-colors">Shop</Link>
            {isAuthenticated && (
              <Link to="/orders" className="hover:text-foreground transition-colors flex items-center gap-1">
                <Package size={15} /> My Orders
              </Link>
            )}
          </nav>

          {/* Search bar — grows to fill available space */}
          <div className="flex-1 flex justify-center px-2">
            <SearchBar />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* My Orders — mobile quick link */}
            {isAuthenticated && (
              <Link to="/orders" className="p-2 hover:bg-accent rounded-md transition-colors md:hidden" title="My Orders">
                <Package size={20} />
              </Link>
            )}

            {/* Cart */}
            <Link to="/cart" className="relative p-2 hover:bg-accent rounded-md transition-colors">
              <ShoppingCart size={20} />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <>
                {/* Wishlist */}
                <Link to="/wishlist" className="p-2 hover:bg-accent rounded-md transition-colors hidden sm:flex">
                  <Heart size={20} />
                </Link>

                {/* User dropdown */}
                <div className="relative ml-1" ref={menuRef}>
                  <button
                    onClick={() => setMenuOpen((o) => !o)}
                    className="flex items-center gap-1.5 rounded-lg px-2 py-1 hover:bg-accent transition-colors"
                  >
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt={user.first_name} className="h-7 w-7 rounded-full object-cover" />
                    ) : (
                      <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                        {user?.first_name?.[0]?.toUpperCase() || <User size={13} />}
                      </div>
                    )}
                    <span className="text-sm font-medium text-foreground hidden sm:block">{user?.first_name}</span>
                    <ChevronDown size={13} className="text-muted-foreground hidden sm:block" />
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50">
                      <Link
                        to="/orders"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Package size={14} /> My Orders
                      </Link>
                      <Link
                        to="/wishlist"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Heart size={14} /> Wishlist
                      </Link>
                      <Link
                        to="/profile"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <User size={14} /> Profile
                      </Link>
                      <div className="border-t border-gray-100 my-1" />
                      <button
                        onClick={() => { setMenuOpen(false); handleLogout(); }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut size={14} /> Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">Sign in</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">Sign up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      {/* Cart Drawer — rendered at layout level so it's accessible from any page */}
      <CartDrawer />

      <footer className="border-t bg-white px-4 py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Store. All rights reserved.
      </footer>
    </div>
  );
};

export default CustomerLayout;

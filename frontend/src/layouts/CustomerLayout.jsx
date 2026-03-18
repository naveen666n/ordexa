import { useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Heart } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import useAuthStore from '../store/auth.store';
import useCartStore from '../store/cart.store';
import authApi from '../api/auth.api';
import cartApi from '../api/cart.api';
import { Button } from '../components/ui/button';
import SearchBar from '../components/customer/SearchBar';
import CartDrawer from '../components/customer/CartDrawer';

const CustomerLayout = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
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

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore — clear locally regardless
    }
    clearAuth();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          {/* Logo */}
          <Link to="/" className="font-bold text-xl text-foreground tracking-tight flex-shrink-0">
            Store
          </Link>

          {/* Nav links — hidden on small screens */}
          <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-muted-foreground flex-shrink-0">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <Link to="/catalog" className="hover:text-foreground transition-colors">Shop</Link>
          </nav>

          {/* Search bar — grows to fill available space */}
          <div className="flex-1 flex justify-center px-2">
            <SearchBar />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
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

                {/* User avatar + name */}
                <div className="flex items-center gap-2 ml-1">
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.first_name}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                      {user?.first_name?.[0]?.toUpperCase() || <User size={14} />}
                    </div>
                  )}
                  <Link
                    to="/profile"
                    className="text-sm font-medium text-foreground hover:underline hidden sm:block"
                  >
                    {user?.first_name}
                  </Link>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  title="Sign out"
                  className="text-muted-foreground"
                >
                  <LogOut size={16} />
                </Button>
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

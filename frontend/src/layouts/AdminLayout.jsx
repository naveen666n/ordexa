import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import useAuthStore from '../store/auth.store';
import authApi from '../api/auth.api';
import { Button } from '../components/ui/button';

const AdminLayout = () => {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = () => {
    authApi.logout().catch(() => {});
    clearAuth();
    navigate('/login', { replace: true });
  };

  const navLink = (to, label, end = false) => (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `text-sm px-3 py-2 rounded-md transition-colors ${
          isActive ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
        }`
      }
    >
      {label}
    </NavLink>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside className="w-64 bg-gray-900 text-white p-4 flex flex-col gap-1 shrink-0">
        <div className="text-lg font-semibold mb-4 px-3">Admin Panel</div>
        {navLink('/admin', 'Dashboard', true)}
        {navLink('/admin/products', 'Products')}
        {navLink('/admin/catalog/categories', 'Categories')}
        {navLink('/admin/catalog/attributes', 'Attributes')}
        {navLink('/admin/orders', 'Orders')}
        {navLink('/admin/users', 'Users')}
        {navLink('/admin/reviews', 'Reviews')}
        {navLink('/admin/discounts/coupons', 'Coupons')}
        {navLink('/admin/discounts/offers', 'Global Offers')}
        {navLink('/admin/config/general', 'Config')}
        {navLink('/admin/config/orders', 'Order Settings')}
        {navLink('/admin/config/storage', 'Storage')}
        {navLink('/admin/cms', 'CMS')}
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b px-6 py-3 flex items-center justify-between shrink-0">
          <h1 className="font-semibold text-foreground">Admin Portal</h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User size={14} />
              <span>{user?.first_name} {user?.last_name}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-1.5">
              <LogOut size={14} />
              Sign out
            </Button>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

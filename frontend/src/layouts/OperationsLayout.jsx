import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import useAuthStore from '../store/auth.store';
import authApi from '../api/auth.api';
import { Button } from '../components/ui/button';

const OperationsLayout = () => {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    clearAuth();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside className="w-56 bg-slate-800 text-white p-4 flex flex-col gap-1 shrink-0">
        <div className="text-lg font-semibold mb-4 px-2">Operations</div>
        <NavLink
          to="/operations"
          end
          className={({ isActive }) =>
            `text-sm px-3 py-2 rounded-md transition-colors ${
              isActive ? 'bg-slate-600 text-white' : 'text-slate-300 hover:bg-slate-600 hover:text-white'
            }`
          }
        >
          Orders
        </NavLink>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b px-6 py-3 flex items-center justify-between shrink-0">
          <h1 className="font-semibold">Operations Portal</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{user?.first_name} {user?.last_name}</span>
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

export default OperationsLayout;

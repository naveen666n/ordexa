import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/auth.store';
import { ROLES } from '../../lib/constants';

const GuestGuard = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated) {
    if (user?.role === ROLES.ADMIN) return <Navigate to="/admin" replace />;
    if (user?.role === ROLES.OPERATIONS) return <Navigate to="/operations" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

export default GuestGuard;

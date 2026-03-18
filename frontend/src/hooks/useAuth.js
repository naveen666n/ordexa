import useAuthStore from '../store/auth.store';
import { ROLES } from '../lib/constants';

const useAuth = () => {
  const { user, accessToken, isAuthenticated, setAuth, clearAuth, updateUser } = useAuthStore();

  const isAdmin = user?.role === ROLES.ADMIN;
  const isCustomer = user?.role === ROLES.CUSTOMER;
  const isOperations = user?.role === ROLES.OPERATIONS;

  const hasRole = (role) => user?.role === role;
  const hasAnyRole = (...roles) => roles.includes(user?.role);

  return {
    user,
    accessToken,
    isAuthenticated,
    isAdmin,
    isCustomer,
    isOperations,
    hasRole,
    hasAnyRole,
    setAuth,
    clearAuth,
    updateUser,
  };
};

export default useAuth;

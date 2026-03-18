import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/auth.store';

const RoleGuard = ({ roles, children }) => {
  const user = useAuthStore((state) => state.user);

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default RoleGuard;

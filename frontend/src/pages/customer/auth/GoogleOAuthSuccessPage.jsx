import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import useAuthStore from '../../../store/auth.store';
import authApi from '../../../api/auth.api';

/**
 * Backend redirects here: /auth/google/success?token=ACCESS_TOKEN&new_user=true|false
 *
 * Flow:
 * 1. Read token + new_user from URL params
 * 2. Set a minimal auth state so Axios interceptor can attach the token
 * 3. Call /auth/refresh-token to get the full user object (refresh cookie is already set by backend)
 * 4. Redirect based on role / registration_completed
 */
const GoogleOAuthSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuth, clearAuth } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');
    const isNewUser = searchParams.get('new_user') === 'true';

    if (!token) {
      navigate('/login?error=oauth_failed', { replace: true });
      return;
    }

    const init = async () => {
      try {
        // Decode JWT payload (no library needed — just base64)
        const parts = token.split('.');
        if (parts.length !== 3) throw new Error('bad token');
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));

        // Set a temporary auth state so Axios attaches the token on the refresh call
        setAuth(
          { id: payload.id, email: payload.email, role: payload.role, registration_completed: !isNewUser },
          token
        );

        // Fetch the full user via refresh-token endpoint (refresh cookie was set by backend redirect)
        const res = await authApi.refreshToken();
        const { user, accessToken } = res.data.data;
        setAuth(user, accessToken);

        if (!user.registration_completed) {
          navigate('/auth/complete', { replace: true });
        } else if (user.role === 'admin') {
          navigate('/admin', { replace: true });
        } else if (user.role === 'operations') {
          navigate('/operations', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } catch {
        clearAuth();
        navigate('/login?error=oauth_failed', { replace: true });
      }
    };

    init();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
};

export default GoogleOAuthSuccessPage;

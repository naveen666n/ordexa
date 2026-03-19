import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import useAuthStore from '../../../store/auth.store';
import authApi from '../../../api/auth.api';

/**
 * Backend redirects here after Google OAuth:
 *   /auth/google/success?token=ACCESS_TOKEN&new_user=true|false
 *
 * Flow:
 * 1. Read the access token from the URL query param
 * 2. Set it in the auth store so Axios attaches it as Bearer on the next call
 * 3. Call GET /auth/me (Bearer token — no cookie dependency) to get the full user object
 * 4. Update auth store with the real user and navigate based on role / registration status
 *
 * Using /auth/me instead of /auth/refresh-token avoids the SameSite cookie issue
 * that can occur in cross-port OAuth redirect flows on localhost.
 */
const GoogleOAuthSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuth, clearAuth } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      navigate('/login?error=oauth_failed', { replace: true });
      return;
    }

    const init = async () => {
      try {
        // Set a temporary auth state so Axios attaches the Bearer token on /auth/me
        setAuth({ id: null, email: null, role: null }, token);

        // Fetch the full user using the Bearer token — no cookie required
        const res = await authApi.me();
        const { user } = res.data.data;

        // Update auth store with the real user (keep the same access token)
        setAuth(user, token);

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

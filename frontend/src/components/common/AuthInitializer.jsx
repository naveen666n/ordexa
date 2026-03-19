import { useEffect, useState } from 'react';
import axios from 'axios';
import useAuthStore from '../../store/auth.store';
import { API_BASE_URL } from '../../lib/constants';

/**
 * AuthInitializer — runs once on app mount.
 *
 * The Zustand auth store is in-memory only (no localStorage persistence,
 * which is the correct security posture for JWTs). But users have a valid
 * HTTP-only refresh token cookie from their previous login.
 *
 * On mount, this component attempts a silent token refresh so that:
 *  - Hard refreshes don't log the user out
 *  - Direct navigation to /admin or /operations just works
 *
 * Children are not rendered until the initialisation is complete so that
 * guards don't flash-redirect before the refresh attempt has a chance to run.
 */
const AuthInitializer = ({ children }) => {
  const [ready, setReady] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    // Already authenticated (e.g. login happened in this session)
    if (isAuthenticated) {
      setReady(true);
      return;
    }

    // Try to refresh using the HTTP-only cookie
    axios
      .post(`${API_BASE_URL}/auth/refresh-token`, {}, { withCredentials: true })
      .then((res) => {
        const { accessToken, user } = res.data.data;
        if (accessToken && user) {
          setAuth(user, accessToken);
        }
      })
      .catch(() => {
        // No valid refresh token — user is not logged in, that's fine
      })
      .finally(() => {
        setReady(true);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return children;
};

export default AuthInitializer;

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { loadSession, type Session } from '../../lib/session';

/** Read the current session (real or demo) without subscribing. */
export function useAppSession(): Session | null {
  return loadSession();
}

/**
 * Route guard for the authenticated app area.
 * Only real sessions (with a token) enter. Demo sessions (saved offline,
 * never authenticated) are sent to login — otherwise the app shows
 * misleading "offline" cards while the server is actually reachable.
 * A real session with no network still enters; pages then show accurate
 * offline notices via their own fetch failures.
 */
export default function RequireAuth() {
  const loc = useLocation();
  const session = loadSession();
  if (!session?.token) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }
  return <Outlet />;
}

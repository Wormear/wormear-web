import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

/** localStorage key for the auth session (see src/lib/session.ts). */
export const SESSION_KEY = 'wormear-session';

/**
 * Same-tab profile-sync event. `storage` events only fire cross-tab, so
 * Profile dispatches this after a successful PATCH and listeners refetch.
 */
export const PROFILE_UPDATED_EVENT = 'app:profile-updated';

/**
 * useLiveTick: returns a counter that bumps whenever server data may be
 * stale, so fetch effects can list it as a dep and refetch realtime-ish:
 * - react-router pathname change (skips the initial mount — the mount
 *   fetch already covers it, avoiding a double fetch)
 * - tab becomes visible again (visibilitychange) or window regains focus
 * - cross-tab session change (`storage` for the wormear-session key)
 * - same-tab profile update (`app:profile-updated`, dispatched by Profile)
 * - periodic poll (default 60s) that only ticks while the tab is visible
 *
 * Full cleanup on unmount (interval + all listeners removed).
 */
export function useLiveTick(intervalMs = 60000): number {
  const { pathname } = useLocation();
  const [tick, setTick] = useState(0);
  const firstPath = useRef(true);

  useEffect(() => {
    if (firstPath.current) {
      firstPath.current = false;
      return;
    }
    setTick((t) => t + 1);
  }, [pathname]);

  useEffect(() => {
    const bump = () => setTick((t) => t + 1);
    const onVisible = () => {
      if (document.visibilityState === 'visible') bump();
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === SESSION_KEY || e.key === null) bump();
    };
    const onInterval = () => {
      if (document.visibilityState === 'visible') bump();
    };
    const id = window.setInterval(onInterval, intervalMs);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', bump);
    window.addEventListener('storage', onStorage);
    window.addEventListener(PROFILE_UPDATED_EVENT, bump);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', bump);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(PROFILE_UPDATED_EVENT, bump);
    };
  }, [intervalMs]);

  return tick;
}

/**
 * useOnlineStatus: tracks navigator.onLine via online/offline events.
 * Starts from the current value so the first render is already correct.
 */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState<boolean>(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );
  useEffect(() => {
    const goOn = () => setOnline(true);
    const goOff = () => setOnline(false);
    window.addEventListener('online', goOn);
    window.addEventListener('offline', goOff);
    return () => {
      window.removeEventListener('online', goOn);
      window.removeEventListener('offline', goOff);
    };
  }, []);
  return online;
}

import { site } from '../config/env';

const KEY = 'wormear-session';

/** Persisted session shape. `refresh` is new — old sessions without it still read fine. */
export interface Session {
  email: string;
  token: string | null;
  refresh?: string;
  at: string;
  demo?: boolean;
  [key: string]: unknown;
}

function readRaw(): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Persist email + access token + (optional) refresh token. Merges over any existing session fields. */
export function saveSession(email: string, access: string | null, refresh?: string | null): void {
  try {
    const prev = readRaw() ?? {};
    const next: Session = {
      ...(prev as object),
      email,
      token: access,
      at: new Date().toISOString(),
    } as Session;
    if (refresh === undefined) {
      // Keep a previously stored refresh (e.g. rotation not yet returned).
      if (typeof prev.refresh !== 'string') delete next.refresh;
    } else if (refresh) {
      next.refresh = refresh;
    } else {
      delete next.refresh;
    }
    if (access) {
      // A real token replaces any demo flag — this device is authenticated now.
      delete next.demo;
    }
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

/** Back-compatible read: sessions saved before refresh tokens existed ({email, token, at}) load as-is. */
export function loadSession(): Session | null {
  const raw = readRaw();
  if (!raw || typeof raw.email !== 'string') return null;
  return {
    ...raw,
    email: raw.email,
    token: typeof raw.token === 'string' ? raw.token : null,
    refresh: typeof raw.refresh === 'string' ? raw.refresh : undefined,
    at: typeof raw.at === 'string' ? raw.at : new Date(0).toISOString(),
  } as Session;
}

export function clearSession(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

interface RefreshResponse {
  access_token?: string;
  refresh_token?: string;
}

/**
 * Exchange the stored refresh token for a new pair (backend rotates).
 * Updates the stored token + refresh. Returns the new access token,
 * or null on failure (clears the session — caller should re-login).
 * Returns null without clearing when no refresh token is stored.
 */
export async function refreshAccess(): Promise<string | null> {
  const session = loadSession();
  if (!session?.refresh) return null;
  try {
    const res = await fetch(`${site.apiUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: session.refresh }),
    });
    if (!res.ok) throw new Error(`refresh failed with status ${res.status}`);
    const data = (await res.json()) as RefreshResponse;
    if (!data.access_token) throw new Error('refresh returned no access token');
    // Preserve the old refresh when the backend rotates access-only
    // (refresh_token omitted). Passing null would delete it; undefined keeps it.
    saveSession(session.email, data.access_token, data.refresh_token ?? undefined);
    return data.access_token;
  } catch {
    clearSession();
    return null;
  }
}

/**
 * fetch() with Bearer auth + one 401 → refresh → retry.
 * Returns null when there is no session at all (caller decides fallback).
 */
export async function authedFetch(url: string, init?: RequestInit): Promise<Response | null> {
  const session = loadSession();
  if (!session?.token) return null;
  const withAuth = (token: string): RequestInit => ({
    ...init,
    headers: { ...(init?.headers as Record<string, string> | undefined), Authorization: `Bearer ${token}` },
  });
  let res = await fetch(url, withAuth(session.token));
  if (res.status === 401) {
    const renewed = await refreshAccess();
    if (!renewed) return res;
    res = await fetch(url, withAuth(renewed));
  }
  return res;
}

/** Best-effort: revoke this device's refresh token, then clear locally. Offline-safe. */
export async function logout(): Promise<void> {
  const session = loadSession();
  try {
    await fetch(`${site.apiUrl}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
      },
      body: JSON.stringify(session?.refresh ? { refresh_token: session.refresh } : {}),
    });
  } catch {
    /* offline — still clear locally */
  }
  clearSession();
}
/** Best-effort: revoke ALL sessions for this user, then clear locally. Offline-safe. */
export async function logoutEverywhere(): Promise<void> {
  const session = loadSession();
  try {
    await fetch(`${site.apiUrl}/auth/logout-all`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
      },
    });
  } catch {
    /* offline — still clear locally */
  }
  clearSession();
}

export type MeRec = Record<string, unknown>;

/**
 * GET /users/me with fallback to the legacy /auth/me shape.
 * Returns null offline or when the backend rejects the session.
 */
export async function fetchMe(): Promise<MeRec | null> {
  for (const path of ['/users/me', '/auth/me']) {
    try {
      const res = await authedFetch(`${site.apiUrl}${path}`);
      if (!res) return null;
      if (res.status === 404) continue;
      if (!res.ok) return null;
      const data = (await res.json()) as unknown;
      if (typeof data === 'object' && data !== null) return data as MeRec;
      return null;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * PATCH /users/me. Returns the updated record, or null on failure
 * (caller keeps local state and shows an honest error).
 */
export async function patchMe(patch: MeRec): Promise<MeRec | null> {
  try {
    const res = await authedFetch(`${site.apiUrl}/users/me`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (!res || !res.ok) return null;
    try {
      const data = (await res.json()) as unknown;
      if (typeof data === 'object' && data !== null) return data as MeRec;
      return {};
    } catch {
      return {};
    }
  } catch {
    return null;
  }
}

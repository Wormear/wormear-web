import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { site } from '../config/env';
import { saveSession } from '../lib/session';

interface GoogleCredentialResponse {
  credential?: string;
}

interface GoogleIdConfig {
  client_id: string;
  callback: (res: GoogleCredentialResponse) => void;
}

interface GoogleAccounts {
  id: {
    initialize: (config: GoogleIdConfig) => void;
    renderButton: (el: HTMLElement, opts: Record<string, string>) => void;
    prompt: () => void;
  };
}

declare global {
  interface Window {
    google?: { accounts: GoogleAccounts };
  }
}

const GSI_SRC = 'https://accounts.google.com/gsi/client';

let gsiPromise: Promise<boolean> | null = null;

function loadGsi(): Promise<boolean> {
  if (typeof document === 'undefined') return Promise.resolve(false);
  if (window.google?.accounts?.id) return Promise.resolve(true);
  if (!gsiPromise) {
    gsiPromise = new Promise((resolve) => {
      try {
        const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`);
        if (existing) {
          existing.addEventListener('load', () => resolve(true), { once: true });
          existing.addEventListener('error', () => resolve(false), { once: true });
          return;
        }
        const script = document.createElement('script');
        script.src = GSI_SRC;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.head.appendChild(script);
      } catch {
        resolve(false);
      }
    });
  }
  return gsiPromise;
}

function emailFromIdToken(idToken: string): string {
  try {
    const part = idToken.split('.')[1] ?? '';
    const payload = JSON.parse(
      atob(part.replace(/-/g, '+').replace(/_/g, '/')),
    ) as { email?: unknown };
    return typeof payload.email === 'string' ? payload.email : '';
  } catch {
    return '';
  }
}

/**
 * Google sign-in via Google Identity Services. Best-effort and offline-safe:
 * renders a disabled setup hint when no client id is configured and shows
 * inline errors instead of crashing.
 */
export default function OAuthButtons() {
  const nav = useNavigate();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);

  const clientId = site.googleClientId;

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    setError('');

    const onCredential = async (res: GoogleCredentialResponse) => {
      const idToken = res?.credential;
      if (!idToken) {
        setError('Google sign-in failed. Please try again.');
        return;
      }
      setError('');
      try {
        const apiRes = await fetch(`${site.apiUrl}/auth/oauth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Device-Label': 'web' },
          body: JSON.stringify({ provider: 'google', id_token: idToken }),
        });
        if (!apiRes.ok) {
          let msg = 'Google sign-in failed. Please try again.';
          try {
            const err = (await apiRes.json()) as { detail?: unknown; message?: unknown };
            if (typeof err?.detail === 'string' && err.detail) msg = err.detail;
            else if (typeof err?.message === 'string' && err.message) msg = err.message;
          } catch { /* keep generic */ }
          setError(msg);
          return;
        }
        const data = (await apiRes.json()) as { access_token?: string; refresh_token?: string };
        if (!data.access_token) {
          setError('Google sign-in failed. Please try again.');
          return;
        }
        // Persist BOTH tokens (refresh optional per contract).
        saveSession(emailFromIdToken(idToken), data.access_token, data.refresh_token ?? undefined);
        nav('/app', { replace: true });
      } catch {
        setError('Google sign-in failed. Check your connection and try again.');
      }
    };

    loadGsi()
      .then((ok) => {
        if (cancelled || !ok || !window.google?.accounts?.id) {
          if (!cancelled && !ok) setError('Google sign-in is unavailable offline.');
          return;
        }
        try {
          window.google.accounts.id.initialize({ client_id: clientId, callback: onCredential });
          if (buttonRef.current) {
            window.google.accounts.id.renderButton(buttonRef.current, {
              theme: 'outline',
              size: 'large',
              shape: 'rectangular',
              width: '280',
            });
          }
          if (!cancelled) setReady(true);
        } catch {
          if (!cancelled) setError('Google sign-in failed to start. Please try again.');
        }
      })
      .catch(() => {
        if (!cancelled) setError('Google sign-in is unavailable offline.');
      });

    return () => {
      cancelled = true;
    };
  }, [clientId, nav]);

  if (!clientId) {
    return (
      <div>
        <button
          type="button"
          className="btn btn-light btn-block"
          disabled
          title="Set VITE_GOOGLE_CLIENT_ID to enable Google sign-in"
        >
          Google sign-in (setup required)
        </button>
        {error && (
          <p role="alert" className="small" style={{ color: '#b42318', fontWeight: 800, marginTop: 8 }}>
            {error}
          </p>
        )}
      </div>
    );
  }

  const promptFallback = () => {
    try {
      window.google?.accounts.id.prompt();
    } catch {
      setError('Google sign-in failed to start. Please try again.');
    }
  };

  return (
    <div>
      <div ref={buttonRef} style={{ display: 'flex', justifyContent: 'center' }} />
      {ready && (
        <button
          type="button"
          className="btn btn-light btn-block"
          style={{ marginTop: 8 }}
          onClick={promptFallback}
        >
          Continue with Google
        </button>
      )}
      {error && (
        <p role="alert" className="small" style={{ color: '#b42318', fontWeight: 800, marginTop: 8 }}>
          {error}
        </p>
      )}
    </div>
  );
}

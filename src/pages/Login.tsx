import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import TextField from '../components/TextField';
import Mascot from '../components/Mascot';
import OAuthButtons from '../components/OAuthButtons';
import { site } from '../config/env';
import { clearSession, saveSession } from '../lib/session';

interface LoginLocationState {
  from?: string;
  email?: string;
}

async function readDetail(res: Response): Promise<string | null> {
  try {
    const err = (await res.json()) as { detail?: unknown; message?: unknown };
    if (typeof err?.detail === 'string' && err.detail) return err.detail;
    if (typeof err?.message === 'string' && err.message) return err.message;
  } catch {
    /* non-JSON body — fall through to status copy */
  }
  return null;
}

export default function Login() {
  const nav = useNavigate();
  const loc = useLocation();
  const state = (loc.state as LoginLocationState | null) ?? {};
  const from = state.from ?? '/app';
  const [email, setEmail] = useState(state.email ?? '');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState(
    state.email
      ? `Password updated for ${state.email} — log in with your new password.`
      : '',
  );
  const [submitting, setSubmitting] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: { email?: string; password?: string } = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email address.';
    if (password.length === 0) errs.password = 'Enter your password.';
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSubmitting(true);
    setFormError('');
    setNotice('');
    let res: Response;
    try {
      // OAuth2 password flow.
      const form = new URLSearchParams();
      form.append('username', email);
      form.append('password', password);
      res = await fetch(`${site.apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Device-Label': 'web',
        },
        body: form.toString(),
      });
    } catch {
      // Network failure only (DNS down, offline, CORS blocked): the request
      // never reached the server, so offer local demo mode. HTTP errors are
      // handled below and never land here.
      try {
        localStorage.setItem(
          'wormear-session',
          JSON.stringify({ email, demo: true, at: new Date().toISOString() }),
        );
      } catch {
        /* ignore */
      }
      setSubmitting(false);
      setDemoMode(true);
      return;
    }
    if (!res.ok) {
      // Server answered — surface the truth, never a fake demo success.
      const detail = await readDetail(res);
      if (res.status === 401) {
        setFormError(detail ?? 'Incorrect email or password. Try again or reset your password below.');
      } else if (res.status === 422) {
        setFormError(detail ?? 'Check the highlighted fields and try again.');
      } else if (res.status === 429) {
        setFormError('Too many attempts, try again later.');
      } else {
        setFormError(detail ?? 'Something went wrong. Please try again.');
      }
      setSubmitting(false);
      return;
    }
    let data: { access_token?: string; refresh_token?: string };
    try {
      data = (await res.json()) as { access_token?: string; refresh_token?: string };
    } catch {
      setFormError('The server sent an unreadable response. Please try again.');
      setSubmitting(false);
      return;
    }
    if (!data.access_token) {
      setFormError('The server did not return a session. Please try again.');
      setSubmitting(false);
      return;
    }
    // Persist BOTH tokens (refresh optional — saveSession keeps prior when omitted).
    saveSession(email, data.access_token, data.refresh_token ?? undefined);
    setSubmitting(false);
    nav(from, { replace: true });
  };

  return (
    <main>
      <div className="page-hero songs">
        <div className="wrap-narrow center">
          <Mascot level={5} size={84} />
          <span className="feature-kicker" style={{ textAlign: 'center', marginTop: 10 }}>Welcome back</span>
          <h1 style={{ marginTop: 10 }}>Welcome <span className="accent">back.</span></h1>
          <p className="lede" style={{ margin: '10px auto 0' }}>
            Log in with your email and password. Melody keeps your streak warm.
          </p>
        </div>
      </div>
      <section className="block-tight">
        <div className="wrap-narrow">
          <div className="form-card" style={{ maxWidth: 480, margin: '0 auto' }}>
            {demoMode ? (
              <div className="center">
                <h2>Check {email}</h2>
                <p className="muted">
                  You&apos;re in demo-mode: the API is unreachable, so progress is saved on
                  this device only. Nothing was sent anywhere.
                </p>
                <p className="small muted">
                  Demo sessions can&apos;t open the dashboard (it needs a real server
                  token). Reconnect, then try again to sign in for real.
                </p>
                <div className="btn-row" style={{ justifyContent: 'center', marginTop: 16 }}>
                  <Button
                    variant="primary"
                    onClick={() => {
                      clearSession();
                      setDemoMode(false);
                    }}
                  >
                    Try again
                  </Button>
                  <Button variant="light" onClick={() => nav('/')}>
                    Back home
                  </Button>
                </div>
                <p className="small muted center" style={{ marginTop: 12 }}>
                  <button
                    type="button"
                    onClick={() => {
                      clearSession();
                      setDemoMode(false);
                      nav('/');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      fontSize: 'inherit',
                      color: 'inherit',
                    }}
                  >
                    Forget this device
                  </button>
                </p>
              </div>
            ) : (
              <form onSubmit={submit} noValidate>
                <OAuthButtons />
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }} aria-hidden="true">
                  <hr className="rule" style={{ flex: 1, margin: 0 }} />
                  <span className="small muted">or</span>
                  <hr className="rule" style={{ flex: 1, margin: 0 }} />
                </div>
                {notice ? (
                  <p role="status" className="small" style={{ fontWeight: 700, margin: '0 0 12px' }}>
                    {notice}
                  </p>
                ) : null}
                {formError ? (
                  <div role="alert" className="error-summary" style={{ marginBottom: 12 }}>
                    <p style={{ margin: 0 }}>{formError}</p>
                  </div>
                ) : null}
                <TextField
                  id="login-email"
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(v) => { setEmail(v); setFieldErrors((f) => ({ ...f, email: undefined })); }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  error={fieldErrors.email}
                />
                <TextField
                  id="login-password"
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(v) => { setPassword(v); setFieldErrors((f) => ({ ...f, password: undefined })); }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  error={fieldErrors.password}
                />
                <Button variant="primary" block size="lg" type="submit" loading={submitting}>
                  Log in
                </Button>
                <p className="small muted center" style={{ marginTop: 12 }}>
                  <Link to="/forgot-password" state={email ? { email } : undefined}>Forgot password?</Link>
                </p>
                <p className="small muted center" style={{ marginTop: 8 }}>
                  New here? <Link to="/get-started">Create a free account →</Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

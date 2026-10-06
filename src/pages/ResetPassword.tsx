import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../components/Button';
import TextField from '../components/TextField';
import Mascot from '../components/Mascot';
import { site } from '../config/env';

async function readDetail(res: Response): Promise<string | null> {
  try {
    const err = (await res.json()) as { detail?: unknown; message?: unknown };
    if (typeof err?.detail === 'string' && err.detail) return err.detail;
    if (typeof err?.message === 'string' && err.message) return err.message;
  } catch {
    /* ignore */
  }
  return null;
}

export default function ResetPassword() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const queryToken = useMemo(() => (params.get('token') ?? '').trim(), [params]);
  // Editable + prefilled so paste-from-other-device works.
  const [token, setToken] = useState(queryToken);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ token?: string; password?: string; confirm?: string }>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [doneEmail, setDoneEmail] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: { token?: string; password?: string; confirm?: string } = {};
    if (!token.trim()) errs.token = 'Paste your reset token or open the link from your email.';
    if (password.length < 6) errs.password = 'Use at least 6 characters.';
    else if (confirm.length === 0) errs.confirm = 'Repeat your new password.';
    else if (password !== confirm) errs.confirm = 'Passwords do not match.';
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSubmitting(true);
    setFormError('');
    let res: Response;
    try {
      res = await fetch(`${site.apiUrl}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Device-Label': 'web' },
        body: JSON.stringify({ token: token.trim(), new_password: password }),
      });
    } catch {
      setFormError('You appear to be offline. Reconnect and try again — nothing was changed.');
      setSubmitting(false);
      return;
    }
    if (res.ok) {
      let email = '';
      try {
        const data = (await res.json()) as { email?: unknown };
        if (typeof data?.email === 'string') email = data.email;
      } catch {
        /* message-only body — redirect without prefill */
      }
      setSubmitting(false);
      setDoneEmail(email);
      setDone(true);
      window.scrollTo({ top: 0 });
      window.setTimeout(() => {
        nav('/login', { replace: true, state: email ? { email } : undefined });
      }, 2500);
      return;
    }
    const detail = await readDetail(res);
    if (res.status === 400) {
      // Invalid / expired / weak — error card with "send a new link".
      setFormError(detail ?? 'This link is invalid or has expired.');
    } else if (res.status === 422) {
      setFormError(detail ?? 'That password is too weak — use at least 6 characters.');
    } else if (res.status === 429) {
      setFormError('Too many attempts, try again later.');
    } else {
      setFormError(detail ?? 'Something went wrong. Please try again.');
    }
    setSubmitting(false);
  };

  return (
    <main>
      <div className="page-hero songs">
        <div className="wrap-narrow center">
          <Mascot level={12} size={84} />
          <span className="feature-kicker" style={{ textAlign: 'center', marginTop: 10 }}>Reset password</span>
          <h1 style={{ marginTop: 10 }}>Choose a <span className="accent">new password.</span></h1>
        </div>
      </div>
      <section className="block-tight">
        <div className="wrap-narrow">
          <div className="form-card" style={{ maxWidth: 480, margin: '0 auto' }}>
            {done ? (
              <div className="center" role="status">
                <h2>Password updated</h2>
                <p className="muted">Password updated — log in with your new password. Taking you to log in…</p>
                <div className="btn-row" style={{ justifyContent: 'center', marginTop: 16 }}>
                  <Button to="/login" variant="primary" state={doneEmail ? { email: doneEmail } : undefined}>
                    Log in now
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={submit} noValidate>
                {!queryToken ? (
                  <div className="error-summary" style={{ marginBottom: 12 }} role="note">
                    <p style={{ margin: 0 }}>
                      No reset token in this link. Paste the token from your email below, or{' '}
                      <Link to="/forgot-password">send a new link →</Link>
                    </p>
                  </div>
                ) : null}
                {formError ? (
                  <div role="alert" className="error-summary" style={{ marginBottom: 12 }}>
                    <p style={{ margin: 0 }}>{formError}</p>
                    <p style={{ margin: '8px 0 0' }}>
                      <Link to="/forgot-password">Send a new link →</Link>
                    </p>
                  </div>
                ) : null}
                <TextField
                  id="reset-token"
                  label="Reset token"
                  value={token}
                  onChange={(v) => { setToken(v); setFieldErrors((f) => ({ ...f, token: undefined })); }}
                  placeholder="Paste from your email"
                  autoComplete="off"
                  required
                  error={fieldErrors.token}
                  hint="Prefilled when you open the email link on this device."
                />
                <TextField
                  id="reset-password"
                  label="New password"
                  type="password"
                  value={password}
                  onChange={(v) => { setPassword(v); setFieldErrors((f) => ({ ...f, password: undefined, confirm: undefined })); }}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  required
                  error={fieldErrors.password}
                />
                <TextField
                  id="reset-confirm"
                  label="Confirm new password"
                  type="password"
                  value={confirm}
                  onChange={(v) => { setConfirm(v); setFieldErrors((f) => ({ ...f, confirm: undefined })); }}
                  placeholder="Repeat your new password"
                  autoComplete="new-password"
                  required
                  error={fieldErrors.confirm}
                />
                <Button variant="primary" block size="lg" type="submit" loading={submitting}>
                  Update password
                </Button>
                <p className="small muted center" style={{ marginTop: 12 }}>
                  Link expired? <Link to="/forgot-password">Send a new link →</Link>
                </p>
                <p className="small muted center" style={{ marginTop: 8 }}>
                  <Link to="/login">Back to log in →</Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

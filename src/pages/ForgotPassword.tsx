import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Button from '../components/Button';
import TextField from '../components/TextField';
import Mascot from '../components/Mascot';
import { site } from '../config/env';

interface ForgotState {
  email?: string;
}

const SUCCESS_COPY = 'If an account exists for that email, a reset link is on its way — expires in 30 minutes.';

export default function ForgotPassword() {
  const loc = useLocation();
  const state = (loc.state as ForgotState | null) ?? {};
  const [email, setEmail] = useState(state.email ?? '');
  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Enter a valid email address.');
      return;
    }
    setEmailError(undefined);
    setFormError('');
    setSubmitting(true);
    let res: Response;
    try {
      res = await fetch(`${site.apiUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Device-Label': 'web' },
        body: JSON.stringify({ email }),
      });
    } catch {
      // Offline: honest error, never a fake success.
      setFormError('You appear to be offline. Reconnect and try again — no email was sent.');
      setSubmitting(false);
      return;
    }
    if (res.status === 429) {
      setFormError('Too many attempts, try again later.');
      setSubmitting(false);
      return;
    }
    // Backend ALWAYS returns 200 on success (anti-enumeration). Any other
    // non-429 error is a server problem — still reveal nothing, but only
    // claim success on true 2xx.
    if (!res.ok) {
      setFormError('Something went wrong. Please try again in a moment.');
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
    setSent(true);
    window.scrollTo({ top: 0 });
  };

  return (
    <main>
      <div className="page-hero songs">
        <div className="wrap-narrow center">
          <Mascot level={5} size={84} />
          <span className="feature-kicker" style={{ textAlign: 'center', marginTop: 10 }}>Reset password</span>
          <h1 style={{ marginTop: 10 }}>Forgot your <span className="accent">password?</span></h1>
          <p className="lede" style={{ margin: '10px auto 0' }}>
            Enter your email and Melody will send a reset link.
          </p>
        </div>
      </div>
      <section className="block-tight">
        <div className="wrap-narrow">
          <div className="form-card" style={{ maxWidth: 480, margin: '0 auto' }}>
            {sent ? (
              <div className="center" role="status">
                <h2>Check your inbox</h2>
                <p className="muted">{SUCCESS_COPY}</p>
                <p className="small muted">
                  Sent to <strong>{email}</strong>. Didn&apos;t arrive? Check spam, then try again in a few minutes.
                </p>
                <div className="btn-row" style={{ justifyContent: 'center', marginTop: 16 }}>
                  <Button to="/login" variant="primary" state={{ email }}>
                    Back to log in
                  </Button>
                  <Button to="/get-started" variant="light">
                    Create account
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={submit} noValidate>
                {formError ? (
                  <div role="alert" className="error-summary" style={{ marginBottom: 12 }}>
                    <p style={{ margin: 0 }}>{formError}</p>
                  </div>
                ) : null}
                <TextField
                  id="forgot-email"
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(v) => { setEmail(v); setEmailError(undefined); }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  error={emailError}
                />
                <Button variant="primary" block size="lg" type="submit" loading={submitting}>
                  Send reset link
                </Button>
                <p className="small muted center" style={{ marginTop: 12 }}>
                  Remembered it? <Link to="/login">Back to log in →</Link>
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

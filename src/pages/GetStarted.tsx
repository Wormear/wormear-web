import { useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check } from '@phosphor-icons/react';
import Button from '../components/Button';
import TextField from '../components/TextField';
import Mascot from '../components/Mascot';
import OAuthButtons from '../components/OAuthButtons';
import { site } from '../config/env';
import { saveSession } from '../lib/session';

const steps = ['Goal', 'Experience', 'Time', 'Account'] as const;

export default function GetStarted() {
  const [params] = useSearchParams();
  const preselectedPlan = params.get('plan') ?? 'free';
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<string>('Play my first song');
  const [level, setLevel] = useState<string>('Total beginner');
  const [minutes, setMinutes] = useState<number>(10);
  const [instrument, setInstrument] = useState<string>('piano');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [plan, setPlan] = useState(preselectedPlan === 'premium' ? 'premium' : 'free');
  const [done, setDone] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [formError, setFormError] = useState('');
  const [duplicateEmail, setDuplicateEmail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);

  const summary = useMemo(
    () => `${goal} · ${level} · ${minutes} min/day · ${plan === 'premium' ? 'Premium' : 'Free'}`,
    [goal, level, minutes, plan],
  );

  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const back = () => { setFieldErrors({}); setFormError(''); setDuplicateEmail(false); setStep((s) => Math.max(s - 1, 0)); };

  const finish = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: { name?: string; email?: string; password?: string } = {};
    if (name.trim().length < 2) errs.name = 'Tell Melody your first name (2+ letters).';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'That email doesn’t look right — check for @ and a domain.';
    if (password.length < 6) errs.password = 'Use at least 6 characters.';
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    setSubmitting(true);
    setFormError('');
    setDuplicateEmail(false);
    // Register against the real API. Only a network failure falls back to
    // local demo mode — validation/duplicate/server errors are shown, not swallowed.
    let created = false;
    try {
      const res = await fetch(`${site.apiUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Device-Label': 'web' },
        body: JSON.stringify({ email, password, display_name: name }),
      });
      if (res.ok) {
        const data = (await res.json()) as { access_token?: string; refresh_token?: string };
        if (data.access_token) {
          // Persist BOTH tokens (refresh optional — undefined keeps prior).
          saveSession(email, data.access_token, data.refresh_token ?? undefined);
          created = true;
        }
      } else if (res.status === 400) {
        setFieldErrors({ email: 'This email already has an account.' });
        setDuplicateEmail(true);
        setSubmitting(false);
        requestAnimationFrame(() => summaryRef.current?.focus());
        return;
      } else {
        // Server answered but refused (422 validation, 500, ...): show the
        // truth and stay on the form instead of faking a demo success.
        let msg = 'Something went wrong. Please try again.';
        try {
          const err = (await res.json()) as { detail?: unknown };
          if (typeof err?.detail === 'string' && err.detail) msg = err.detail;
          else if (res.status === 422) msg = 'Check the highlighted fields — password needs 6+ characters.';
        } catch { /* keep generic message */ }
        setFormError(msg);
        setSubmitting(false);
        requestAnimationFrame(() => summaryRef.current?.focus());
        return;
      }
    } catch { /* offline — demo continues locally */ }
    try {
      localStorage.setItem('wormear-signup', JSON.stringify({ name, email, goal, level, minutes, instrument, plan, at: new Date().toISOString() }));
    } catch { /* ignore */ }
    setFieldErrors({});
    setSubmitting(false);
    setRegistered(created);
    setDone(true);
    window.scrollTo({ top: 0 });
  };

  if (done) {
    return (
      <main>
        <div className="page-hero home"><div className="wrap-narrow center">
          <Mascot level={12} size={110} />
          <h1>Welcome, {name.split(' ')[0]}! Lesson one is ready.</h1>
          <p className="lede" style={{ margin: '12px auto 0' }}>Your 10-minute daily piano journey is ready.</p>
          <p className="lede" style={{ margin: '12px auto 0' }}>Your plan: <strong>{summary}</strong>.{' '}
            {registered
              ? <>Your account for <strong>{email}</strong> is created and you’re signed in — your progress syncs.</>
              : <>We saved it on this device only — the server was unreachable, so connect to sync your progress.</>}</p>
          <div className="card" style={{ marginTop: 20, textAlign: 'left' }}>
            <h3>Your first 10 minutes</h3>
            <ol>
              <li>Tap glowing keys — <strong>Ode to Joy, bars 1–4</strong> (~4 min).</li>
              <li>Play one round of <strong>Note Rush</strong> (~3 min).</li>
              <li>Record your take and share it (~3 min). Melody levels up.</li>
            </ol>
            <div className="btn-row">
              {registered ? (
                <Button to="/app" variant="primary">Open my dashboard</Button>
              ) : (
                <Button to="/login" variant="primary">Log in to sync</Button>
              )}
              <Button to="/songs" variant="light">Open the song library</Button>
              <Button to="/games" variant="light">Warm up with games</Button>
            </div>
          </div>
          <p style={{ marginTop: 16 }}><Link to="/support">Need help? Visit support →</Link></p>
        </div></div>
      </main>
    );
  }

  return (
    <main>
      <div className="page-hero plain">
        <div className="wrap-narrow">
          <p className="crumbs"><Link to="/">Home</Link> / <Link to="/pricing">Pricing</Link> / <span>Get started</span></p>
          <span className="feature-kicker">Get started · 60 seconds</span>
          <h1 style={{ marginTop: 10 }}>Let’s tune <span className="accent">your first week.</span></h1>
          <div className="stepper" aria-label={`Step ${step + 1} of ${steps.length}: ${steps[step]}`}>
            {steps.map((s, i) => (<span key={s} className={i <= step ? 'on' : ''} />))}
          </div>
          <p className="small muted" style={{ fontWeight: 800 }}>Step {step + 1} of {steps.length} — {steps[step]}</p>
        </div>
      </div>

      <section className="block-tight" aria-label="Signup steps">
        <div className="wrap-narrow">
          <div className="form-card">
            {step === 0 && (
              <div>
                <h2>What’s your goal?</h2>
                <div className="grid grid-2" style={{ marginTop: 14 }}>
                  {['Play my first song', 'Restart after years away', 'Help my kid learn', 'Play for family events'].map((g) => (
                    <button key={g} type="button" className="chip-btn" style={{ padding: 16, textAlign: 'left', borderRadius: 14 }} aria-pressed={goal === g} onClick={() => setGoal(g)}>
                      {goal === g ? '● ' : '○ '}{g}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {step === 1 && (
              <div>
                <h2>How much piano have you played?</h2>
                <div className="grid grid-2" style={{ marginTop: 14 }}>
                  {['Total beginner', 'I can poke out a tune', 'I read a little', 'Returning player'].map((l) => (
                    <button key={l} type="button" className="chip-btn" style={{ padding: 16, textAlign: 'left', borderRadius: 14 }} aria-pressed={level === l} onClick={() => setLevel(l)}>
                      {level === l ? '● ' : '○ '}{l}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {step === 2 && (
              <div>
                <h2>How much time daily?</h2>
                <p className="muted">Melody recommends 10 minutes. Streaks reward showing up, not grinding.</p>
                <div className="filter-row" role="group" aria-label="Minutes per day">
                  {[5, 10, 15, 20].map((m) => (
                    <button key={m} type="button" className="chip-btn" aria-pressed={minutes === m} onClick={() => setMinutes(m)}>
                      {m} min
                    </button>
                  ))}
                </div>
                <div className="field" style={{ marginTop: 18 }}>
                  <label htmlFor="gs-instrument">Instrument</label>
                  <select id="gs-instrument" className="select" value={instrument} onChange={(e) => setInstrument(e.target.value)}>
                    <option value="piano">Piano</option>
                    <option value="keyboard">Keyboard</option>
                    <option value="guitar">Guitar</option>
                    <option value="ukulele">Ukulele</option>
                    <option value="violin">Violin</option>
                  </select>
                </div>
                <h3 style={{ marginTop: 18 }}>Plan</h3>
                <div className="grid grid-2">
                  {[
                    { id: 'free', t: 'Free — start today', d: '3 songs · 2 games · $0' },
                    { id: 'premium', t: 'Premium — unlock all', d: '40+ songs · 5 games · MIDI' },
                  ].map((p) => (
                    <button key={p.id} type="button" className="chip-btn" style={{ padding: 16, textAlign: 'left', borderRadius: 14 }} aria-pressed={plan === p.id} onClick={() => setPlan(p.id)}>
                      <strong>{p.t}</strong><br /><span className="small">{p.d}</span>
                    </button>
                  ))}
                </div>
                <p className="small muted" style={{ marginTop: 10 }}>You can switch anytime. <Link to="/pricing">Compare plans →</Link></p>
              </div>
            )}
            {step === 3 && (
              <form onSubmit={finish} noValidate>
                <h2>Create your free account</h2>
                <p className="muted small">Plan summary: <strong>{summary}</strong></p>
                <OAuthButtons />
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }} aria-hidden="true">
                  <hr className="rule" style={{ flex: 1, margin: 0 }} />
                  <span className="small muted">or</span>
                  <hr className="rule" style={{ flex: 1, margin: 0 }} />
                </div>
                {Object.keys(fieldErrors).length > 0 || formError || duplicateEmail ? (
                  <div className="error-summary" ref={summaryRef} tabIndex={-1} role="alert" aria-labelledby="gs-error-heading">
                    <h2 id="gs-error-heading">Check these fields</h2>
                    <ul>
                      {fieldErrors.name && <li><a href="#gs-name">{fieldErrors.name}</a></li>}
                      {fieldErrors.email && <li><a href="#gs-email">{fieldErrors.email}</a></li>}
                      {duplicateEmail && (
                        <li>
                          <Link to="/login" state={{ email }}>Log in instead →</Link>
                          {' · '}
                          <Link to="/forgot-password" state={{ email }}>Forgot password?</Link>
                        </li>
                      )}
                      {fieldErrors.password && <li><a href="#gs-password">{fieldErrors.password}</a></li>}
                      {formError && <li>{formError}</li>}
                    </ul>
                  </div>
                ) : null}
                <TextField
                  id="gs-name"
                  label="First name"
                  value={name}
                  onChange={(v) => { setName(v); setFieldErrors((f) => ({ ...f, name: undefined })); }}
                  placeholder="Maya"
                  autoComplete="given-name"
                  required
                  error={fieldErrors.name}
                />
                <TextField
                  id="gs-email"
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
                  id="gs-password"
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(v) => { setPassword(v); setFieldErrors((f) => ({ ...f, password: undefined })); }}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  required
                  error={fieldErrors.password}
                />
                <Button variant="primary" size="lg" block type="submit" loading={submitting}>
                  {!submitting && <Check size={18} weight="bold" aria-hidden="true" />} Claim my first lesson
                </Button>
                <p className="small muted center">Free forever · No credit card · <Link to="/privacy">How we handle data</Link></p>
              </form>
            )}

            {step < 3 && (
              <div className="btn-row" style={{ marginTop: 22, justifyContent: 'space-between' }}>
                <button type="button" className="btn btn-light" onClick={back} disabled={step === 0}>
                  <ArrowLeft size={17} weight="bold" aria-hidden="true" /> Back
                </button>
                <button type="button" className="btn btn-primary" onClick={next}>
                  Continue <ArrowRight size={17} weight="bold" aria-hidden="true" />
                </button>
              </div>
            )}
            {step === 3 && (
              <div className="btn-row" style={{ marginTop: 14 }}>
                <button type="button" className="btn btn-light" onClick={back}>
                  <ArrowLeft size={17} weight="bold" aria-hidden="true" /> Back
                </button>
              </div>
            )}
          </div>
          <p className="small muted center" style={{ marginTop: 14 }}>Already have an account? <Link to="/login">Log in →</Link>{' · '}<Link to="/forgot-password">Forgot password?</Link></p>
        </div>
      </section>
    </main>
  );
}

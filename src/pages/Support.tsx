import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import TextField from '../components/TextField';
import FAQAccordion from '../components/FAQAccordion';
import { faqs } from '../data/content';

export default function Support() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('Getting started');
  const [msg, setMsg] = useState('');
  const [sent, setSent] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string; msg?: string }>({});
  const [sending, setSending] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: { name?: string; email?: string; msg?: string } = {};
    if (name.trim().length < 2) errs.name = 'Add your name so we know what to call you.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Add a valid email so we can reply.';
    if (msg.trim().length < 10) errs.msg = 'Tell us a little more (10+ characters) so we can actually help.';
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    setSending(true);
    try {
      const box = JSON.parse(localStorage.getItem('wormear-tickets') ?? '[]') as unknown[];
      box.push({ name, email, topic, msg, at: new Date().toISOString() });
      localStorage.setItem('wormear-tickets', JSON.stringify(box));
    } catch { /* ignore */ }
    setFieldErrors({});
    setSending(false);
    setSent(true);
    window.scrollTo({ top: 0 });
  };

  return (
    <main>
      <div className="page-hero plain"><div className="wrap">
        <p className="crumbs"><Link to="/">Home</Link> / <span>Support</span></p>
        <span className="feature-kicker">Support & FAQ</span>
        <h1 style={{ marginTop: 10 }}>Stuck? <span className="accent">Melody fetches help.</span></h1>
        <p className="lede">Answers in seconds, humans within a day. Start with the FAQ — 80% of questions end there.</p>
        <div className="btn-row" style={{ marginTop: 16 }}>
          <Button href="#contact" variant="dark">Contact us</Button>
          <Button to="/get-started" variant="light">Start free instead</Button>
        </div>
      </div></div>

      <section className="block-tight"><div className="wrap-narrow">
        <span className="feature-kicker">FAQ</span>
        <h2 className="accent">Frequently asked</h2>
        <FAQAccordion items={faqs} />
        <h2 id="accessibility" style={{ marginTop: 30 }}>Accessibility</h2>
        <p className="muted">Big targets (44px+), keyboard-navigable lessons, reduced-motion support, and high-contrast keys. Screen-reader labels on every game action. Need something else? Tell us below — we fix access issues first.</p>
      </div></section>

      <section id="contact" className="block-tight" style={{ background: 'var(--paper)', borderTop: '1px solid var(--line)' }}>
        <div className="wrap-narrow">
          <h2>Contact support</h2>
          {sent ? (
            <div className="card center">
              <h3>Thanks, {name.split(' ')[0]} — ticket received.</h3>
              <p className="muted">Topic: <strong>{topic}</strong>. We’ll reply to <strong>{email}</strong> within one business day. (Demo: saved on this device.)</p>
              <div className="btn-row" style={{ justifyContent: 'center', marginTop: 12 }}>
                <Button to="/songs" variant="primary">Back to learning</Button>
                <Button variant="light" onClick={() => { setSent(false); setMsg(''); }}>Send another</Button>
              </div>
            </div>
          ) : (
            <form className="form-card" onSubmit={submit} noValidate>
              {Object.keys(fieldErrors).length > 0 && (
                <div className="error-summary" ref={summaryRef} tabIndex={-1} role="alert" aria-labelledby="support-error-heading">
                  <h2 id="support-error-heading">Check these fields</h2>
                  <ul>
                    {fieldErrors.name && <li><a href="#c-name">{fieldErrors.name}</a></li>}
                    {fieldErrors.email && <li><a href="#c-email">{fieldErrors.email}</a></li>}
                    {fieldErrors.msg && <li><a href="#c-msg">{fieldErrors.msg}</a></li>}
                  </ul>
                </div>
              )}
              <div className="grid grid-2">
                <TextField id="c-name" label="Name" value={name} onChange={(v) => { setName(v); setFieldErrors((f) => ({ ...f, name: undefined })); }} placeholder="Maya" required error={fieldErrors.name} />
                <TextField id="c-email" label="Email" type="email" value={email} onChange={(v) => { setEmail(v); setFieldErrors((f) => ({ ...f, email: undefined })); }} placeholder="you@example.com" autoComplete="email" required error={fieldErrors.email} />
              </div>
              <div className="field">
                <label htmlFor="c-topic">Topic</label>
                <select id="c-topic" className="select" value={topic} onChange={(e) => setTopic(e.target.value)}>
                  <option>Getting started</option>
                  <option>Billing & plans</option>
                  <option>MIDI & devices</option>
                  <option>Kids & classroom</option>
                  <option>Something else</option>
                </select>
              </div>
              <TextField id="c-msg" label="How can we help?" multiline value={msg} onChange={(v) => { setMsg(v); setFieldErrors((f) => ({ ...f, msg: undefined })); }} placeholder="I’m stuck on…" required error={fieldErrors.msg} />
              <Button variant="primary" size="lg" block type="submit" loading={sending}>Send message</Button>
              <p className="small muted center">Prefer email? <a href="mailto:hello@wormear.example">hello@wormear.example</a></p>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}

import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <main>
      <div className="page-hero plain"><div className="wrap-narrow">
        <p className="crumbs"><Link to="/">Home</Link> / <span>Terms</span></p>
        <span className="feature-kicker">Legal</span>
        <h1 style={{ marginTop: 10 }}>Terms, <span className="accent">minus the maze.</span></h1>
        <p className="muted small">Last updated: October 2026 · Demo terms for preview</p>
      </div></div>
      <section className="block-tight"><div className="wrap-narrow prose">
        <h2>Plans</h2>
        <p>Free is free forever. Premium is $9.99/month or $59.99/year (USD), cancelable in two taps. You keep access until the period ends; XP and songs stay saved.</p>
        <h2>Fair use</h2>
        <p>One Premium subscription covers 4 family profiles. Classrooms need <Link to="/support#contact">school access</Link>. Don’t resell song arrangements — musicians deserve royalties.</p>
        <h2>Content & conduct</h2>
        <p>Recordings you share are yours. Keep performances kind — no hate, no spam. We may remove content that breaks that rule.</p>
        <h2>Questions</h2>
        <p><Link to="/support">Contact support →</Link> · <Link to="/privacy">Privacy →</Link></p>
      </div></section>
    </main>
  );
}

import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <main>
      <div className="page-hero plain"><div className="wrap-narrow">
        <p className="crumbs"><Link to="/">Home</Link> / <span>Privacy</span></p>
        <span className="feature-kicker">Legal</span>
        <h1 style={{ marginTop: 10 }}>Privacy, <span className="accent">in plain words.</span></h1>
        <p className="muted small">Last updated: October 2026 · Demo policy for the Wormear website preview</p>
      </div></div>
      <section className="block-tight"><div className="wrap-narrow prose">
        <h2>What we collect</h2>
        <p>Account basics (name, email), learning progress (XP, streaks, songs finished), and device info for MIDI support. On this marketing site, form entries are stored only in your browser’s localStorage for demo purposes — nothing leaves your device.</p>
        <h2>Kids</h2>
        <p>No chat, no ads, no behavioral tracking. Parent emails are used only for weekly progress summaries. Classrooms can request data deletion anytime via <Link to="/support#contact">support</Link>.</p>
        <h2>What we never do</h2>
        <ul>
          <li>Sell data. Ever.</li>
          <li>Pay-to-win leagues or loot mechanics.</li>
          <li>Auto-charge without a clear receipt and 2-tap cancel.</li>
        </ul>
        <h2>Your controls</h2>
        <p>Export or delete everything from the app’s Profile → Data, or email <a href="mailto:hello@wormear.example">hello@wormear.example</a>. Questions? <Link to="/support">Talk to support →</Link></p>
      </div></section>
    </main>
  );
}

import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, EnvelopeSimple, Timer, Heart } from '@phosphor-icons/react';
import Button from '../components/Button';
import Mascot from '../components/Mascot';
import FAQAccordion from '../components/FAQAccordion';

export default function Parents() {
  return (
    <main>
      <div className="page-hero home">
        <div className="wrap hero-split">
          <div className="hero-copy">
            <p className="crumbs"><Link to="/">Home</Link> / <span>Parents & teachers</span></p>
            <span className="feature-kicker">For parents & teachers</span>
            <h1>
              Practice they ask for. <span className="accent">Progress you can see.</span>
            </h1>
            <p className="hero-sub">
              Big targets, kind feedback, no fail states. Set a 5-minute goal, get a weekly email, and let
              Melody handle the reminding — so you don’t have to.
            </p>
            <div className="btn-row">
              <Button to="/get-started" variant="primary" size="lg">
                Set up a kid profile <ArrowRight size={18} weight="bold" aria-hidden="true" />
              </Button>
              <Button to="/support" variant="light" size="lg">Talk to us first</Button>
            </div>
            <div className="hero-badges">
              <span className="pill green">No ads · no chat</span>
              <span className="pill amber">5-minute goals</span>
              <span className="pill blue">Weekly emails</span>
            </div>
          </div>
          <div className="split-visual">
            <div className="mascot-wrap">
              <Mascot level={12} size={150} />
              <p className="mascot-bubble">Grown-ups get reports. Kids just get to play!</p>
            </div>
          </div>
        </div>
      </div>

      <section className="block" aria-labelledby="safety">
        <div className="wrap">
          <span className="feature-kicker">Why parents trust us</span>
          <h2 id="safety" className="accent">Safe by design, fun by default.</h2>
          <div className="grid grid-4" style={{ marginTop: 24 }}>
            {[
              { icon: ShieldCheck, t: 'Safe by design', d: 'No chat, no ads, no pay-to-win leagues. COPPA-minded, classroom-ready.' },
              { icon: Timer, t: '5-minute goals', d: 'Default goal is tiny on purpose. Consistency beats marathons.' },
              { icon: EnvelopeSimple, t: 'Weekly email', d: 'Minutes played, songs finished, streaks — in plain language.' },
              { icon: Heart, t: 'Never shaming', d: 'Retries never break streaks. Melody naps through mistakes.' },
            ].map((c, i) => (
              <article key={c.t} className={`card card-tap ${['lined', 'coral-top', 'sun-top', 'lined'][i % 4]}`}>
                <span className={`icon-chip ${['green', 'coral', 'violet', 'amber'][i % 4]}`} aria-hidden="true"><c.icon size={24} weight="duotone" /></span>
                <h3>{c.t}</h3>
                <p className="muted small" style={{ margin: 0 }}>{c.d}</p>
              </article>
            ))}
          </div>

          <div className="feature-row flip" style={{ marginTop: 30, paddingTop: 0, paddingBottom: 0 }}>
            <div className="feature-text">
              <span className="feature-kicker">For classrooms</span>
              <h2 className="accent">Classroom toolkit, free.</h2>
              <ul className="check-list">
                <li><span aria-hidden="true">✓</span><span>Printable finger-number sheets + 10-min lesson plans.</span></li>
                <li><span aria-hidden="true">✓</span><span>Group leagues: friendly, no leaderboard anxiety.</span></li>
                <li><span aria-hidden="true">✓</span><span>Works on shared iPads — tap-anywhere keys, no MIDI required.</span></li>
                <li><span aria-hidden="true">✓</span><span>Family profiles included in Premium — 1 subscription, 4 learners.</span></li>
              </ul>
              <div className="btn-row" style={{ marginTop: 16 }}>
                <Button to="/pricing" variant="primary">See family pricing</Button>
                <Button to="/support#contact" variant="light">Request school access</Button>
              </div>
            </div>
            <div className="feature-visual">
              <div className="journal" style={{ width: '100%', maxWidth: 440 }}>
                <p className="small" style={{ fontWeight: 900, margin: 0 }}>A Tuesday in the Okafor house</p>
                <p className="small muted">7:04 - Leo (7) races sister to keep Melody's streak alive. 7:12 - both done, teeth brushed. 7:30 - Mom steals iPad, finishes Ode to Joy.</p>
                <p className="small" style={{ margin: '10px 0 0' }}><Link to="/about" style={{ fontWeight: 800 }}>More family stories</Link></p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="block-tight" aria-labelledby="parent-faq" style={{ background: 'var(--paper)', borderTop: '1px solid var(--line)' }}>
        <div className="wrap-narrow">
          <span className="feature-kicker">Parent FAQ</span>
          <h2 className="accent" id="parent-faq">Asked at every PTA.</h2>
          <div style={{ marginTop: 18 }}>
            <FAQAccordion
              items={[
                { q: 'Is Wormear good for kids who’ve never touched piano?', a: 'Yes — that’s our core learner. Big targets, tap-anywhere keys, and Melody cheers every attempt. Most kids play Twinkle within a week.' },
                { q: 'How much screen time?', a: 'The default goal is 5–10 minutes. The app stops suggesting “one more game” after 20 minutes and celebrates stopping — streaks reward coming back tomorrow, not grinding today.' },
                { q: 'Do I need a piano?', a: 'No. On-screen keys work fully. When you’re ready, any 49+ key keyboard helps; MIDI adds note detection for Premium.' },
                { q: 'Can siblings share?', a: 'Yes. Premium includes 4 profiles with separate XP, streaks and Melody stages — one subscription for the whole family.' },
              ]}
            />
          </div>
          <div className="btn-row" style={{ marginTop: 18 }}>
            <Button to="/get-started" variant="dark">Create a kid profile</Button>
            <Button to="/support" variant="light">All FAQs + support</Button>
          </div>
        </div>
      </section>
    </main>
  );
}

import { Link } from 'react-router-dom';
import { ArrowRight, Ear, GameController, MusicNote, ChartLineUp } from '@phosphor-icons/react';
import Button from '../components/Button';
import Mascot from '../components/Mascot';
import { curriculumUnits, site } from '../data/content';

const principles = [
  { icon: Ear, title: 'Sound before symbols', text: 'You hear it, tap it, feel it — notation arrives only when your ears are ready. Reading grows through games, never lectures.' },
  { icon: GameController, title: 'Tiny wins beat willpower', text: 'Lessons are 5–10 minutes. Streak-safe retries mean a bad day never breaks your chain.' },
  { icon: MusicNote, title: 'Songs first, always', text: 'Every unit ends with a performance: Ode to Joy, Twinkle, Happy Birthday. You practice to perform, not to drill.' },
  { icon: ChartLineUp, title: 'Progress you can see', text: 'XP, levels and a glowing skill path show your next win. Parents get a weekly email, not a mystery.' },
];

export default function Method() {
  return (
    <main>
      <div className="page-hero home">
        <div className="wrap hero-split">
          <div className="hero-copy">
          <p className="crumbs"><Link to="/">Home</Link> / <span>Method</span></p>
          <span className="feature-kicker">Our method</span>
          <h1>
            Wish you could play? <span className="accent">You’re our favorite person.</span>
          </h1>
          <p className="hero-sub">
            {site.promise} Most methods start with notation and rules. Wormear starts with sound: tap one
            glowing key, hear music instantly, then loop{' '}
            <strong>Learn → Practice → Play → Progress → Repeat</strong> in
            10-minute wins.
          </p>
            <div className="btn-row">
            <Button to="/get-started" variant="primary" size="lg">
              Try lesson one free <ArrowRight size={18} weight="bold" aria-hidden="true" />
            </Button>
            <Button to="/songs" variant="light" size="lg">
              See what you’ll play
            </Button>
          </div>
          <div className="hero-badges">
            <span className="pill green">Sound before symbols</span>
            <span className="pill amber">10-minute wins</span>
            <span className="pill blue">Streak-safe retries</span>
          </div>
          </div>
          <div className="split-visual">
            <div style={{ display: 'grid', gap: 16, width: '100%', maxWidth: 440 }}>
              <div className="mascot-wrap">
                <Mascot level={12} size={120} />
                <p className="mascot-bubble">One glowing key. That is the whole first lesson!</p>
              </div>
              <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginTop: 0 }}>
                {[
                  ['10 min', 'default daily goal', 'tone-coral'],
                  ['2 min', 'longest explainer', 'tone-green'],
                  ['0', 'fail states for kids', 'tone-plum'],
                  ['5', 'stages from Egg to Headliner', 'tone-sun'],
                ].map(([v, l, tone]) => (
                  <article key={l} className={`stat-card ${tone}`}>
                    <span className="stat-value" style={{ fontSize: '1.7rem' }}>{v}</span>
                    <span className="stat-label">{l}</span>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="block" aria-labelledby="principles">
        <div className="wrap">
          <span className="feature-kicker">Four principles</span>
          <h2 id="principles" className="accent">Designed for quitters (lovingly).</h2>
          <p className="lede">
            70% of beginners quit in month one — usually from shame, not lack of talent. We removed the
            shame.
          </p>
          <div className="grid grid-2" style={{ marginTop: 24 }}>
            {principles.map((p, i) => (
              <article key={p.title} className={`card card-tap ${['lined', 'sun-top', 'coral-top', 'lined'][i % 4]}`}>
                <span className={`icon-chip ${['violet', 'amber', 'green', 'coral'][i % 4]}`} aria-hidden="true">
                  <p.icon size={24} weight="duotone" />
                </span>
                <h3>{p.title}</h3>
                <p className="muted" style={{ margin: 0 }}>{p.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="block-tight" aria-labelledby="path" style={{ background: 'var(--paper)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
        <div className="wrap two-col">
          <div>
            <span className="feature-kicker">The first 51 lessons</span>
            <h2 id="path" className="accent">Your path, glowing.</h2>
            <p className="lede">
              Five units take you from “finding middle C” to a full birthday performance. The path always
              shows your next 10-minute win — never a wall of locked content.
            </p>
            <div className="btn-row" style={{ marginTop: 18 }}>
              <Button to="/get-started" variant="primary">Start Unit 1 free</Button>
              <Button to="/games" variant="light">How games fit in</Button>
            </div>
            <div className="journal" style={{ marginTop: 20 }}>
              <p className="small" style={{ margin: 0 }}>
                <strong>A note from our piano lead:</strong> “We teach C-D-E on glowing keys before we ever
                say ‘quarter note’. Theory sticks when your fingers already know it.” — Ms. Ada
              </p>
            </div>
          </div>
          <div className="card">
            <div className="path">
              {curriculumUnits.map((u) => (
                <div key={u.title} className={`path-node ${u.status === 'done' ? 'done' : u.status === 'current' ? 'current' : ''}`}>
                  <span className="path-dot" aria-hidden="true">
                    {u.status === 'done' ? '✓' : u.status === 'current' ? '▶' : '·'}
                  </span>
                  <div>
                    <p style={{ margin: 0 }}>
                      <span className={`pill${u.status === 'current' ? ' amber' : u.status === 'done' ? ' green' : ' outline'}`}>
                        {u.status === 'current' ? 'You are here' : u.status === 'done' ? 'Complete' : 'Locked'}
                      </span>
                    </p>
                    <h3 style={{ margin: '8px 0 4px' }}>{u.title}</h3>
                    <p className="muted small" style={{ margin: 0 }}>{u.desc}</p>
                    <p className="small muted" style={{ margin: '4px 0 0' }}>{u.lessons} lessons · ~{(u.lessons * 8).toString()} min total</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="block" aria-labelledby="melody-method">
        <div className="wrap feature-row flip">
          <div className="feature-text">
            <span className="feature-kicker">Why it sticks</span>
            <h2 className="accent">A loop you’ll actually repeat</h2>
            <ul className="check-list">
              {[
                'Spaced repetition is hidden inside games — you review without noticing.',
                'Streak freeze protects sick days and busy weeks. Consistency beats marathons.',
                'Record & share from lesson one: perform for someone you love.',
                'MIDI support when you’re ready — any 49+ key keyboard just works.',
              ].map((t) => (
                <li key={t}><span aria-hidden="true">✓</span><span>{t}</span></li>
              ))}
            </ul>
            <div className="btn-row" style={{ marginTop: 18 }}>
              <Button to="/pricing" variant="dark">See plans</Button>
              <Button to="/parents" variant="light">For parents & teachers</Button>
            </div>
          </div>
          <div className="feature-visual">
            <div className="card center" style={{ background: 'var(--sun-tint)', borderColor: 'var(--line-strong)', width: '100%', maxWidth: 440 }}>
              <Mascot level={12} size={130} />
              <h3>Meet Melody</h3>
              <p className="muted small">
                An earthworm who wiggled out of the garden and into the piano. She celebrates every
                attempt, naps through mistakes, and evolves from Egg to Headliner as you grow.
              </p>
              <p style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                <span className="pill green">Friendly</span>
                <span className="pill blue">Energetic</span>
                <span className="pill amber">Never judgy</span>
              </p>
              <p style={{ marginTop: 14, marginBottom: 0 }}>
                <Button to="/about" variant="light" size="sm">
                  Melody's full story <ArrowRight size={15} weight="bold" aria-hidden="true" />
                </Button>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="block" style={{ paddingTop: 0 }} aria-labelledby="method-cta">
        <div className="wrap">
          <div className="cta-band">
            <h2 id="method-cta">Hear your first 8 bars today.</h2>
            <p className="lede" style={{ margin: '0 auto' }}>
              Unit 1, Lesson 1 is free forever. One glowing key. Ten minutes. Melody cheering.
            </p>
            <div className="btn-row" style={{ justifyContent: 'center', marginTop: 22 }}>
              <Button to="/get-started" variant="white" size="lg">
                Start free <ArrowRight size={18} weight="bold" aria-hidden="true" />
              </Button>
              <Button to="/songs" variant="ghost">
                <span style={{ color: '#fff' }}>Peek at songs first</span>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

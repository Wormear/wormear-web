import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, GameController, Lightning, Timer } from '@phosphor-icons/react';
import Button from '../components/Button';
import Mascot from '../components/Mascot';
import { games } from '../data/content';

export default function GamesPage() {
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [flash, setFlash] = useState<number | null>(null);

  const whack = (i: number) => {
    setScore((s) => s + 10 + combo * 2);
    setCombo((c) => c + 1);
    setFlash(i);
    window.setTimeout(() => setFlash((f) => (f === i ? null : f)), 220);
  };
  const reset = () => { setScore(0); setCombo(0); };

  return (
    <main>
      <div className="page-hero home">
        <div className="wrap hero-split">
          <div className="hero-copy">
            <p className="crumbs"><Link to="/">Home</Link> / <span>Games</span></p>
            <span className="feature-kicker">Practice games</span>
            <h1>
              Drills are dead. <span className="accent">Games ate them.</span>
            </h1>
            <p className="hero-sub">
              Five 3-minute games, each training one musical muscle. Try the 20-second Note Rush taste
              below — then play the real thing in the app.
            </p>
            <div className="btn-row">
              <Button to="/get-started" variant="primary" size="lg">
                Play free in the app <ArrowRight size={18} weight="bold" aria-hidden="true" />
              </Button>
              <Button to="/method" variant="light" size="lg">How games teach</Button>
            </div>
            <div className="hero-badges">
              <span className="pill green">3 in the MVP</span>
              <span className="pill amber">3-minute rounds</span>
              <span className="pill blue">Zero boring drills</span>
            </div>
          </div>
          <div className="split-visual">
            <div className="mascot-wrap">
              <Mascot level={12} size={150} />
              <p className="mascot-bubble">Catch me if you can! Tap fast, combo faster.</p>
            </div>
          </div>
        </div>
      </div>

      <section className="block" aria-labelledby="demo">
        <div className="wrap feature-row flip">
          <div className="feature-text">
            <span className="feature-kicker">Why games work</span>
            <h2 className="accent">One muscle per game.</h2>
            <p className="lede">
              Instant feedback, kind grading, spaced repetition — the practice science is hidden inside
              the fun.
            </p>
            <div className="btn-row" style={{ marginTop: 16 }}>
              <Button to="/songs" variant="dark">Songs you’ll unlock</Button>
              <Button to="/parents" variant="light">Safe for kids?</Button>
            </div>
          </div>
          <div className="feature-visual">
          <div className="card" style={{ background: 'var(--plum-deep-solid)', borderColor: 'var(--plum-solid)', color: '#F8F2DF' }}>
            <p style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 12px' }}>
              <span className="pill amber"><Lightning size={13} weight="fill" aria-hidden="true" /> Note Rush · demo</span>
              <span className="small" style={{ color: '#B9AEE0' }}>Score: <strong style={{ color: '#F8F2DF' }}>{score}</strong> · Combo x{combo}</span>
            </p>
            <h2 id="demo" style={{ color: '#F8F2DF' }}>Catch the glowing note.</h2>
            <p className="small" style={{ color: '#D9CFF5' }}>Tap glowing tiles as fast as you can. Combos multiply your XP — just like the real game.</p>
            <div className="grid grid-3" style={{ marginTop: 14 }}>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => whack(i)}
                  aria-label={`Catch note ${i + 1}`}
                  style={{
                    height: 72, borderRadius: 14, cursor: 'pointer',
                    border: '2px solid',
                    borderColor: flash === i ? '#FFC93C' : '#4A3670',
                    background: flash === i ? '#FFC93C' : i % 2 === 0 ? '#3B1F5C' : '#28194A',
                    color: flash === i ? '#3d2f00' : '#fff',
                    fontWeight: 900, fontSize: '1.2rem',
                    transform: flash === i ? 'scale(0.96)' : 'none',
                  }}
                >
                  ♪
                </button>
              ))}
            </div>
            <div className="btn-row" style={{ marginTop: 14 }}>
              <button type="button" className="chip-btn" onClick={reset} style={{ background: 'transparent', color: '#F8F2DF', borderColor: '#6B579E' }}>
                Reset score
              </button>
              <span className="small" style={{ color: '#B9AEE0', display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                <Timer size={15} aria-hidden="true" /> {score >= 100 ? 'Rush complete — you’d earn +120 XP!' : `${Math.max(0, 100 - score)} pts to “level up”`}
              </span>
            </div>
          </div>
          </div>
        </div>
      </section>

      <section className="block-tight" aria-labelledby="all-games" style={{ background: 'var(--paper)', borderTop: '1px solid var(--line)' }}>
        <div className="wrap">
          <span className="feature-kicker">All five games</span>
          <h2 id="all-games" className="accent">Pick your training.</h2>
          <div className="grid grid-3" style={{ marginTop: 22 }}>
            {games.map((g, i) => (
              <article key={g.name} className="card card-tap" style={{ borderTop: `5px solid ${['#3B1F5C', '#FF6B4A', '#FFC93C', '#D55236', '#B97F0A'][i % 5]}` }}>
                <span className={`icon-chip ${['violet', 'amber', 'green', 'coral', 'violet'][i % 5]}`} aria-hidden="true"><GameController size={22} weight="duotone" /></span>
                <h3 style={{ marginBottom: 4 }}>{g.name}</h3>
                <p style={{ margin: '0 0 8px' }}>
                  {g.status === 'in-mvp' ? <span className="pill green">In MVP · playable now</span> : <span className="pill amber">Full version</span>}{' '}
                  <span className="pill blue">{g.best}</span>
                </p>
                <p className="muted small" style={{ margin: 0 }}>{g.desc}</p>
                <p style={{ margin: '12px 0 0' }}>
                  <Link to="/get-started" style={{ fontWeight: 800, fontSize: '0.9rem' }}>
                    {g.status === 'in-mvp' ? 'Play this week →' : 'Get notified →'}
                  </Link>
                </p>
              </article>
            ))}
          </div>
          <div className="cta-band dark" style={{ marginTop: 28 }}>
            <h2>High score beats homework.</h2>
            <p className="lede" style={{ margin: '0 auto', color: '#D9CFF5' }}>Free plan includes Note Rush + Rhythm Garden. Premium unlocks all five.</p>
            <div className="btn-row" style={{ justifyContent: 'center', marginTop: 20 }}>
              <Button to="/get-started" variant="white">Start free</Button>
              <Button to="/pricing" variant="ghost"><span style={{ color: '#fff' }}>See Premium games</span></Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

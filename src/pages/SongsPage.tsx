import { useId, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MusicNote, Clock } from '@phosphor-icons/react';
import Button from '../components/Button';
import { songs } from '../data/content';

type Diff = 'All' | 'Starter' | 'Easy' | 'Medium';

export default function SongsPage() {
  const [filter, setFilter] = useState<Diff>('All');
  const [q, setQ] = useState('');
  const searchId = useId();
  const list = useMemo(
    () =>
      songs.filter(
        (s) =>
          (filter === 'All' || s.difficulty === filter) &&
          (q.trim() === '' || `${s.title} ${s.composer}`.toLowerCase().includes(q.toLowerCase())),
      ),
    [filter, q],
  );

  return (
    <main>
      <div className="page-hero songs">
        <div className="wrap">
          <p className="crumbs">
            <Link to="/">Home</Link> / <span>Song library</span>
          </p>
          <span className="feature-kicker">Song library · 40+ arrangements</span>
          <h1 style={{ marginTop: 12 }}>Play something you love, <span className="accent">fast.</span></h1>
          <p className="lede" style={{ marginTop: 12 }}>
            Every song lists an honest difficulty and time cost. Start with a 5-minute Starter, perform it
            tonight, then level up. New packs drop monthly for Premium.
          </p>
          <div className="btn-row" style={{ marginTop: 20 }}>
            <Button to="/get-started" variant="primary" size="lg">
              Learn Ode to Joy free <ArrowRight size={18} weight="bold" aria-hidden="true" />
            </Button>
            <Button to="/pricing" variant="light" size="lg">
              Unlock all 40+ songs
            </Button>
          </div>
        </div>
      </div>

      <section className="block" aria-labelledby="browse">
        <div className="wrap">
          <span className="feature-kicker">Start here</span>
          <h2 id="browse" className="accent" style={{ marginBottom: 6 }}>Browse starters</h2>
          <p className="muted">Showing {list.length} of {songs.length} starter songs. Full 40+ library lives in the app.</p>
          <div className="card" style={{ marginTop: 18 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'end' }}>
              <div className="field" style={{ flex: '1 1 240px', marginBottom: 0 }}>
                <label htmlFor={searchId}>Search songs</label>
                <input
                  id={searchId}
                  className="input"
                  type="search"
                  placeholder="Search title or composer…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              <div className="filter-row" role="group" aria-label="Filter by difficulty">
                {(['All', 'Starter', 'Easy', 'Medium'] as Diff[]).map((d) => (
                  <button key={d} type="button" className="chip-btn" aria-pressed={filter === d} onClick={() => setFilter(d)}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <hr className="rule" />
            {list.length === 0 ? (
              <p className="muted">
                No songs match “{q}”. <button type="button" className="chip-btn" onClick={() => { setQ(''); setFilter('All'); }}>Clear search</button>
              </p>
            ) : (
              list.map((s) => (
                <div key={s.title} className="song-row">
                  <span className="song-cover" style={{ background: s.color }} aria-hidden="true">
                    <MusicNote size={24} weight="fill" />
                  </span>
                  <div style={{ flex: 1 }}>
                    <strong>{s.title}</strong>
                    <div className="muted small" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span>{s.composer}</span>
                      <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                        <Clock size={13} aria-hidden="true" /> ~{s.minutes} min
                      </span>
                    </div>
                    <div className="bar" style={{ maxWidth: 220, marginTop: 6 }} aria-hidden="true">
                      <span style={{ width: s.difficulty === 'Starter' ? '30%' : s.difficulty === 'Easy' ? '55%' : '80%' }} />
                    </div>
                  </div>
                  <span className={`pill${s.difficulty === 'Starter' ? ' green' : s.difficulty === 'Easy' ? ' blue' : ' amber'}`}>
                    {s.difficulty}
                  </span>
                  <Link to="/get-started" className="btn btn-light btn-sm">
                    Learn it
                  </Link>
                </div>
              ))
            )}
          </div>

          <div className="grid grid-3" style={{ marginTop: 22 }}>
            {[
              { t: 'Birthday-ready pack', d: 'Happy Birthday + 4 party songs. Perform this weekend.', tag: 'Most gifted' },
              { t: 'Classical firsts', d: 'Ode to Joy, Lightly Row + simplified classics with finger numbers.', tag: 'Starter favorite' },
              { t: 'Seasonal drops', d: 'New arrangements monthly. Premium members vote on the next pack.', tag: 'Premium' },
            ].map((c, i) => (
              <article key={c.t} className={`card card-tap ${['coral-top', 'sun-top', 'lined'][i % 3]}`}>
                <span className="pill amber">{c.tag}</span>
                <h3 style={{ marginTop: 10 }}>{c.t}</h3>
                <p className="muted small" style={{ margin: 0 }}>{c.d}</p>
              </article>
            ))}
          </div>

          <div className="cta-band" style={{ marginTop: 28 }}>
            <h2>Your recital starts with Twinkle.</h2>
            <p className="lede" style={{ margin: '0 auto' }}>
              Free plan includes 3 starter songs. Premium unlocks all 40+ plus monthly drops.
            </p>
            <div className="btn-row" style={{ justifyContent: 'center', marginTop: 20 }}>
              <Button to="/get-started" variant="white">Start free</Button>
              <Button to="/pricing" variant="ghost"><span style={{ color: '#fff' }}>Compare plans</span></Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check } from '@phosphor-icons/react';
import Button from '../components/Button';
import PhoneMockup from '../components/PhoneMockup';
import Mascot from '../components/Mascot';
import StreakBadge from '../components/StreakBadge';
import XPBadge from '../components/XPBadge';
import { site, stats, footnote, songs, games, testimonials } from '../data/content';

function playTone(freq: number) {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.22, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
    window.setTimeout(() => void ctx.close(), 600);
  } catch {
    /* audio unavailable — visual feedback still works */
  }
}

const statTones = ['tone-coral', 'tone-green', 'tone-plum', 'tone-sun'];
const storyColors = ['#3B1F5C', '#C0451F', '#1D7A45'];

function initials(name: string) {
  return name.replace(/,.*$/, '').split(' ').map((w) => w[0]).slice(0, 2).join('');
}

export default function Home() {
  const [hits, setHits] = useState<number[]>([]);
  const tap = (i: number, freq: number) => {
    playTone(freq);
    setHits((h) => [...h.slice(-7), i]);
  };

  return (
    <main>
      {/* HERO — illustration left, headline right */}
      <div className="page-hero home">
        <div className="wrap hero-split">
          <div className="hero-copy">
            <h1>
              The delightfully playful way to <span className="accent">actually play piano.</span>
            </h1>
            <p className="hero-sub">
              {site.promise} Ten-minute lessons with Melody the earthworm turn spare moments into real
              songs — no piano needed to start.
            </p>
            <div className="btn-row">
              <Button to="/get-started" variant="primary" size="lg">
                Start playing free <ArrowRight size={18} weight="bold" aria-hidden="true" />
              </Button>
              <Button to="/login" variant="light" size="lg">
                I already have an account
              </Button>
            </div>
            <div className="hero-badges">
              <StreakBadge days={12} />
              <XPBadge xp="850" level={4} />
              <span className="pill green">Free forever plan</span>
            </div>
            <p className="small muted hero-fineprint">Free forever · No credit card · Ages 6 to 96</p>
          </div>
          <div className="split-visual">
            <PhoneMockup />
          </div>
        </div>
      </div>

      {/* SONG STRIP — popular first songs */}
      <nav className="song-strip" aria-label="Popular first songs">
        <div className="song-strip-inner">
          {songs.map((s) => (
            <Link key={s.title} to="/songs" className="song-chip">
              <span className="note-dot" style={{ background: s.color }} aria-hidden="true">
                {s.glyph}
              </span>
              {s.title}
              <span className="diff">{s.difficulty}</span>
            </Link>
          ))}
          <Link to="/songs" className="song-chip" aria-label="Browse all 40 plus songs">
            40+ more <ArrowRight size={15} weight="bold" aria-hidden="true" />
          </Link>
        </div>
      </nav>

      {/* FEATURE ROWS */}
      <div className="wrap">
        <section className="feature-row" aria-labelledby="feat-games">
          <div className="feature-text">
            <span className="feature-kicker">Practice games</span>
            <h2 id="feat-games" className="accent">
              Feels like an arcade game. Works like a piano teacher.
            </h2>
            <p className="lede">
              Forget dry drills and theory worksheets. Earn glowing keys, level up through competitive
              games, and unlock new songs — before you know it, you&rsquo;re playing for your family.
            </p>
            <Link to="/games" className="feature-link">
              Meet the practice games <ArrowRight size={15} weight="bold" aria-hidden="true" />
            </Link>
          </div>
          <div className="feature-visual">
            <div className="card">
              <p className="demo-caption">Try it now — tap the keys (sound on):</p>
              <div className="demo-keys" role="group" aria-label="Tap-to-play piano demo">
                {[261.6, 293.7, 329.6, 392.0, 440.0].map((f, i) => (
                  <button key={f} type="button" onClick={() => tap(i, f)} aria-label={`Play note ${i + 1}`}>
                    {['C', 'D', 'E', 'G', 'A'][i]}
                  </button>
                ))}
              </div>
              <p className="small muted demo-count" aria-live="polite">
                {hits.length > 0
                  ? `Nice — ${hits.length} note${hits.length === 1 ? '' : 's'} played. That’s XP in the real app. `
                  : 'Every correct tap earns XP and grows your streak. '}
                <Link to="/get-started">Keep going →</Link>
              </p>
            </div>
          </div>
        </section>

        <section className="feature-row flip" aria-labelledby="feat-method">
          <div className="feature-text">
            <span className="feature-kicker">Our method</span>
            <h2 id="feat-method" className="accent">
              Short loops engineered for real songs.
            </h2>
            <p className="lede">
              Our learn → practice → play → progress loop adapts to your ears, not a textbook. Theory
              arrives exactly when your fingers are ready — ten minutes at a time, songs from day one.
            </p>
            <Link to="/method" className="feature-link">
              How the method works <ArrowRight size={15} weight="bold" aria-hidden="true" />
            </Link>
          </div>
          <div className="feature-visual">
            <div className="card" style={{ padding: '10px 20px' }}>
              {songs.slice(0, 3).map((s) => (
                <div key={s.title} className="song-row">
                  <span className="song-cover" style={{ background: s.color }} aria-hidden="true">
                    {s.glyph}
                  </span>
                  <div style={{ flex: 1 }}>
                    <strong>{s.title}</strong>
                    <div className="muted small">
                      {s.composer} · about {s.minutes} min
                    </div>
                  </div>
                  <span className={`pill${s.difficulty === 'Starter' ? ' green' : ' blue'}`}>
                    {s.difficulty}
                  </span>
                </div>
              ))}
              <div style={{ padding: '14px 6px' }}>
                <Link to="/songs" className="small" style={{ fontWeight: 800 }}>
                  Browse all 40+ songs →
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="feature-row" aria-labelledby="feat-parents">
          <div className="feature-text">
            <span className="feature-kicker">For families</span>
            <h2 id="feat-parents" className="accent">
              Say goodbye to practice battles.
            </h2>
            <p className="lede">
              Kids race to keep Melody&rsquo;s streak alive — no nagging, no tears, no judgment. Big
              targets, kind feedback, and weekly progress emails keep everyone in tune.
            </p>
            <Link to="/parents" className="feature-link">
              Parent &amp; teacher guide <ArrowRight size={15} weight="bold" aria-hidden="true" />
            </Link>
          </div>
          <div className="feature-visual">
            <div style={{ display: 'grid', gap: 16, width: '100%', maxWidth: 440 }}>
              <div className="mascot-wrap">
                <Mascot level={5} size={84} />
                <p className="mascot-bubble">“Hi! I’m Melody. Tap one key with me — that’s lesson one!”</p>
              </div>
              <div className="journal">
                <p className="small" style={{ margin: 0, fontWeight: 800 }}>
                  This week in Maya&rsquo;s practice journal
                </p>
                <p className="small muted" style={{ margin: '6px 0 0' }}>
                  “Mon — Ode to Joy, 8 min. Tue — Rhythm Garden, beat my best. Wed — played Happy
                  Birthday for grandma on a video call.”
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* PREMIUM BAND */}
      <div className="wrap">
        <section className="premium-band" aria-labelledby="premium-title" style={{ margin: '24px 0 88px' }}>
          <div>
            <span className="premium-kicker">Wormear Premium</span>
            <h2 id="premium-title">Fast-track your first song with zero friction.</h2>
            <p className="lede">
              Remove all heartbreak, eliminate ads, unlock personalized practice plans — and play your
              first full song this week.
            </p>
            <ul className="premium-list">
              <li>
                <Check size={20} weight="bold" color="#FFC93C" aria-hidden="true" />
                <span>Unlimited songs &amp; games</span>
              </li>
              <li>
                <Check size={20} weight="bold" color="#FFC93C" aria-hidden="true" />
                <span>Streak freeze &amp; family profiles</span>
              </li>
              <li>
                <Check size={20} weight="bold" color="#FFC93C" aria-hidden="true" />
                <span>MIDI keyboard &amp; offline mode</span>
              </li>
              <li>
                <Check size={20} weight="bold" color="#FFC93C" aria-hidden="true" />
                <span>New songs &amp; challenges monthly</span>
              </li>
            </ul>
            <div className="btn-row">
              <Button to="/pricing" variant="sun" size="lg">
                Start free today <ArrowRight size={18} weight="bold" aria-hidden="true" />
              </Button>
            </div>
            <p className="small premium-tiny">Free forever plan · Upgrade anytime · Cancel in two taps</p>
          </div>
          <div className="premium-visual" aria-hidden="true">
            <Mascot level={12} size={220} />
            <span className="float-pill top">+120 XP</span>
            <span className="float-pill bottom">🔥 12-day streak</span>
          </div>
        </section>
      </div>

      {/* STATS */}
      <div className="wrap">
        <section className="stat-band block" aria-labelledby="stats-title" style={{ padding: '0 0 88px' }}>
          <h2 id="stats-title" className="accent">
            Real practice results, not marketing fluff.
          </h2>
          <p className="lede" style={{ margin: '0 auto' }}>
            Bite-sized lessons outperform occasional marathon sessions. Here&rsquo;s what ten playful
            minutes a day adds up to.
          </p>
          <div className="stat-grid">
            {stats.map((s, i) => (
              <article key={s.label} className={`stat-card ${statTones[i % statTones.length]}`}>
                <span className="stat-value">{s.value}</span>
                <span className="stat-label">{s.label}</span>
              </article>
            ))}
          </div>
          <p className="small muted band-footnote">{footnote}</p>
        </section>
      </div>

      {/* STORIES */}
      <div className="wrap">
        <section className="block" aria-labelledby="stories-title" style={{ paddingTop: 0 }}>
          <div className="center">
            <span className="feature-kicker" style={{ textAlign: 'center' }}>Learner stories</span>
            <h2 id="stories-title" className="accent">
              Loved by busy beginners everywhere.
            </h2>
            <p className="lede" style={{ margin: '0 auto' }}>
              From nervous restarters to proud parents — here&rsquo;s what ten playful minutes a day
              sounds like.
            </p>
          </div>
          <div className="story-grid">
            {testimonials.map((t, i) => (
              <figure key={t.name} className="story-card">
                <div className="story-head">
                  <span
                    className="avatar-disc"
                    style={{ background: storyColors[i % storyColors.length] }}
                    aria-hidden="true"
                  >
                    {initials(t.name)}
                  </span>
                  <div>
                    <div className="story-name">{t.name}</div>
                    <div className="story-role">{t.role}</div>
                  </div>
                </div>
                <span className="pill amber" style={{ alignSelf: 'flex-start' }}>
                  {t.detail}
                </span>
                <span className="story-quote-mark" aria-hidden="true">
                  &ldquo;
                </span>
                <blockquote>“{t.quote}”</blockquote>
                <figcaption className="small muted">
                  <Link to="/about" style={{ fontWeight: 800 }}>
                    More about Melody →
                  </Link>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      </div>

      {/* FINAL CTA */}
      <div className="wrap">
        <section className="final-cta" aria-labelledby="cta-title">
          <h2 id="cta-title" className="accent">
            Ready to play your first song by next month?
          </h2>
          <p className="lede">
            Join thousands of learners turning subway minutes and coffee breaks into real songs.
          </p>
          <div className="btn-row" style={{ justifyContent: 'center' }}>
            <Button to="/get-started" variant="primary" size="lg">
              Start playing free <ArrowRight size={18} weight="bold" aria-hidden="true" />
            </Button>
            <Button to="/method" variant="light" size="lg">
              How it works
            </Button>
          </div>
          <div className="final-visual" aria-hidden="true">
            <Mascot level={12} size={150} />
            <span className="float-pill top">♪ Ode to Joy</span>
            <span className="float-pill bottom">★ First recital done</span>
          </div>
          <p className="small muted">Free forever · No credit card · <Link to="/pricing">Compare plans →</Link></p>
        </section>
      </div>

      {/* GAMES TEASER — kept compact for deep-linking */}
      <div className="wrap">
        <section className="block-tight" aria-labelledby="games-teaser" style={{ paddingBottom: 72 }}>
          <div className="center" style={{ maxWidth: 640, margin: '0 auto' }}>
            <h2 id="games-teaser">
              Five tiny games. <span className="accent">Zero boring drills.</span>
            </h2>
            <p className="lede" style={{ margin: '0 auto 18px' }}>
              {games
                .slice(0, 3)
                .map((g) => g.name)
                .join(' · ')}
              , plus two more at launch. Each trains one musical muscle in under three minutes.
            </p>
            <div className="btn-row" style={{ justifyContent: 'center' }}>
              <Button to="/games" variant="dark">
                Play the games tour <ArrowRight size={17} weight="bold" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

import { Link } from 'react-router-dom';
import { ArrowRight } from '@phosphor-icons/react';
import Button from '../components/Button';
import Mascot from '../components/Mascot';
import { testimonials } from '../data/content';

const storyColors = ['#3B1F5C', '#C0451F', '#1D7A45'];

function initials(name: string) {
  return name.replace(/,.*$/, '').split(' ').map((w) => w[0]).slice(0, 2).join('');
}

export default function AboutPage() {
  return (
    <main>
      <div className="page-hero home">
        <div className="wrap hero-split">
          <div className="hero-copy">
            <p className="crumbs"><Link to="/">Home</Link> / <span>About</span></p>
            <span className="feature-kicker">About Wormear</span>
            <h1>
              We make quitters <span className="accent">into players.</span>
            </h1>
            <p className="hero-sub">
              Wormear started when our founder's daughter quit piano after 3 weeks of theory
              worksheets. We built the app we wished existed: sound first, songs first, shame never.
            </p>
            <div className="btn-row">
              <Button to="/method" variant="primary" size="lg">
                How we teach <ArrowRight size={18} weight="bold" aria-hidden="true" />
              </Button>
              <Button to="/get-started" variant="light" size="lg">Start free</Button>
            </div>
            <div className="hero-badges">
              <span className="pill green">Kid-tested</span>
              <span className="pill amber">Shame-free</span>
              <span className="pill blue">Teacher approved</span>
            </div>
          </div>
          <div className="split-visual">
            <div className="mascot-wrap">
              <Mascot level={12} size={170} />
              <p className="mascot-bubble">Small, trying, and very proud of it.</p>
            </div>
          </div>
        </div>
      </div>

      <section className="block" aria-labelledby="melody">
        <div className="wrap feature-row flip">
          <div className="feature-text">
            <span className="feature-kicker">Why a worm?</span>
            <h2 className="accent">Because worms listen with their whole body.</h2>
            <p className="lede">
              Pianists do too. Melody models the ideal learner: curious, unembarrassed, persistent.
              Kids protect her streak because she’s small and trying — and then realize they’re describing
              themselves.
            </p>
            <div className="timeline" style={{ marginTop: 22 }}>
              <article><strong>2024 — Garden era.</strong><p className="muted small" style={{ margin: '4px 0 0' }}>Paper prototypes with 12 kids. Lesson: glowing keys beat notation, 11 to 1.</p></article>
              <article><strong>2025 — MVP.</strong><p className="muted small" style={{ margin: '4px 0 0' }}>3 games, 5 starter songs, MIDI detection. 96%* reached week two in beta.</p></article>
              <article><strong>2026 — Launch.</strong><p className="muted small" style={{ margin: '4px 0 0' }}>40+ songs, family profiles, teacher toolkit. You’re reading this at the good part.</p></article>
            </div>
            <div className="btn-row" style={{ marginTop: 20 }}>
              <Button to="/method" variant="dark">How we teach</Button>
              <Button to="/get-started" variant="primary">Learn with Melody <ArrowRight size={16} weight="bold" aria-hidden="true" /></Button>
            </div>
          </div>
          <div className="feature-visual">
            <div className="card center" style={{ background: 'var(--sun-tint)', borderColor: 'var(--sun)', width: '100%', maxWidth: 440 }}>
              <Mascot level={12} size={150} />
              <p className="pill amber" style={{ marginTop: 8 }}>Melody · Egg, Hatchling, Groovy, Headliner</p>
              <h2 id="melody" style={{ marginTop: 10 }}>Melody the earthworm</h2>
              <p className="muted">
                Wiggled out of the garden, into the piano. Celebrates every attempt. Naps through
                mistakes. Grows sunglasses at Level 4 and a crown at Level 8 — if you do.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="block-tight" aria-labelledby="voices" style={{ background: 'var(--paper)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
        <div className="wrap">
          <div className="center">
            <span className="feature-kicker" style={{ textAlign: 'center' }}>Learner voices</span>
            <h2 className="accent" id="voices">Loved by restarters, kids, grandparents.</h2>
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
                <blockquote>{t.quote}</blockquote>
              </figure>
            ))}
          </div>
          <div className="cta-band" style={{ marginTop: 26 }}>
            <h2>Come as you are. Leave playing.</h2>
            <div className="btn-row" style={{ justifyContent: 'center', marginTop: 18 }}>
              <Button to="/get-started" variant="white" size="lg">Start free today</Button>
              <Button to="/support" variant="ghost"><span style={{ color: '#fff' }}>Say hello</span></Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

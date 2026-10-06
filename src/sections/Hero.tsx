import { ArrowRight, PlayCircle } from '@phosphor-icons/react';
import Button from '../components/Button';
import PhoneMockup from '../components/PhoneMockup';
import Mascot from '../components/Mascot';
import StreakBadge from '../components/StreakBadge';
import XPBadge from '../components/XPBadge';
import { site, stats, pressLogos, footnote } from '../data/content';

export default function Hero() {
  return (
    <div className="hero" id="top">
      <div className="wrap hero-grid">
        <div>
          <span className="eyebrow">Learn piano by playing · Ages 6 to 96</span>
          <h1 style={{ marginTop: 14 }}>{site.promise}</h1>
          <p className="lead">
            Wormear turns 10-minute playful lessons into real songs. Follow the glowing path with{' '}
            <strong>Melody the earthworm</strong>, earn XP, keep your streak, and play from day one —
            no boring theory first.
          </p>
          <div className="hero-badges">
            <StreakBadge days={12} />
            <XPBadge xp="850" level={4} />
            <span className="pill green">No piano needed to start</span>
          </div>
          <div className="btn-row" style={{ marginTop: 8 }}>
            <Button to="/pricing">
              Get started free <ArrowRight size={18} weight="bold" aria-hidden="true" />
            </Button>
            <Button variant="light" to="/method">
              <PlayCircle size={20} weight="fill" aria-hidden="true" /> See how it works
            </Button>
          </div>
          <div className="hero-proof" aria-label="Wormear highlights">
            {stats.map((s) => (
              <div key={s.label}>
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
          <p className="small muted" style={{ marginTop: 10 }}>{footnote}</p>
          <div className="mascot-wrap" style={{ marginTop: 14 }}>
            <Mascot level={5} size={72} />
            <p className="mascot-bubble">“Hi! I’m Melody. Tap one key with me — that’s lesson one!”</p>
          </div>
        </div>
        <PhoneMockup />
      </div>
      <div className="wrap">
        <div className="logos" aria-label="Featured in">
          {pressLogos.map((l) => (
            <span key={l} className="logo-chip">{l}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

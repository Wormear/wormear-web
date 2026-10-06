import { Link } from 'react-router-dom';
import { LogoHorizontal } from './Brand';
import { site } from '../config/env';

const cols: { title: string; links: { label: string; to: string }[] }[] = [
  {
    title: 'Learn',
    links: [
      { label: 'Our method', to: '/method' },
      { label: 'Song library', to: '/songs' },
      { label: 'Practice games', to: '/games' },
      { label: 'Pricing', to: '/pricing' },
      { label: 'Start free', to: '/get-started' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About + Melody', to: '/about' },
      { label: 'For parents', to: '/parents' },
      { label: 'Support & FAQ', to: '/support' },
      { label: 'Contact', to: '/support#contact' },
      { label: 'Log in', to: '/login' },
    ],
  },
  {
    title: 'Trust',
    links: [
      { label: 'Privacy', to: '/privacy' },
      { label: 'Terms', to: '/terms' },
      { label: 'Accessibility', to: '/support#accessibility' },
      { label: 'Status: All systems playful', to: '/support' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="site">
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <Link to="/" className="brand" aria-label="Wormear home">
              <LogoHorizontal height={30} tone="on-dark" />
            </Link>
            <p className="muted small" style={{ maxWidth: 36 }}>
              Turn people who wish they could play into people who actually play. Learn → Practice →
              Play → Progress → Repeat.
            </p>
            <p className="small">
              <Link to="/get-started" className="btn btn-dark btn-sm">
                Get started free
              </Link>
            </p>
            <p className="small muted">Free forever · No credit card · Ages 6 to 96</p>
          </div>
          {cols.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h4>{col.title}</h4>
              <ul>
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="foot-base small muted">
          <span>© 2026 Wormear · v{site.appVersion} · Made playful with Melody the earthworm.</span>
          <span style={{ display: 'flex', gap: 16 }}>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/support">Support</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}

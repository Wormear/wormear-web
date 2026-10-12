import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { List, X, Sun, Moon } from '@phosphor-icons/react';
import { useTheme } from '../theme/ThemeContext';
import { LogoHorizontal } from './Brand';
import { loadSession } from '../lib/session';

const links = [
  { to: '/method', label: 'Method' },
  { to: '/songs', label: 'Songs' },
  { to: '/games', label: 'Games' },
  { to: '/parents', label: 'Parents' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/about', label: 'About' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const { mode, toggle } = useTheme();
  const signedIn = (loadSession()?.token ?? null) !== null;
  return (
    <header className="nav">
      <div className="wrap nav-inner">
        <Link to="/" className="brand" aria-label="Wormear home">
          <LogoHorizontal height={28} tone="on-dark" />
        </Link>
        <nav className={`nav-links${open ? ' open' : ''}`} aria-label="Primary">
          {links.map((l) => (
            <NavLink
              key={l.label}
              to={l.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) => (isActive || loc.pathname === l.to ? 'active' : '')}
            >
              {l.label}
            </NavLink>
          ))}
          {open && (
            <div className="btn-row" style={{ padding: 8 }}>
              {signedIn ? (
                <Link to="/app" className="btn btn-primary btn-sm" onClick={() => setOpen(false)}>
                  Open app
                </Link>
              ) : (
                <>
                  <Link to="/login" className="btn btn-light btn-sm" onClick={() => setOpen(false)}>
                    Log in
                  </Link>
                  <Link to="/get-started" className="btn btn-sun btn-sm" onClick={() => setOpen(false)}>
                    Start free
                  </Link>
                </>
              )}
            </div>
          )}
        </nav>
        <div className="nav-cta" data-ui-actions>
          <button
            type="button"
            className="theme-toggle"
            onClick={toggle}
            aria-pressed={mode === 'dark'}
            aria-label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {mode === 'dark' ? (
              <Sun size={20} weight="bold" aria-hidden="true" />
            ) : (
              <Moon size={20} weight="bold" aria-hidden="true" />
            )}
          </button>
          {signedIn ? (
            <Link to="/app" className="btn btn-primary btn-sm">
              Open app
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">
                Log in
              </Link>
              <Link to="/get-started" className="btn btn-sun btn-sm">
                Start free
              </Link>
            </>
          )}
          <button
            className="menu-btn"
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
            title={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={20} weight="bold" /> : <List size={20} weight="bold" />}
          </button>
        </div>
      </div>
    </header>
  );
}

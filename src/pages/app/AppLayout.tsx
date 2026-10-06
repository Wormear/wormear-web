import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  ChartBar,
  Crown,
  GameController,
  GearSix,
  GraduationCap,
  Keyboard,
  MusicNotes,
  SquaresFour,
  User,
} from '@phosphor-icons/react';
import { LogoMark } from '../../components/Brand';
import UserAvatar from '../../components/UserAvatar';
import XPBadge from '../../components/XPBadge';
import StreakBadge from '../../components/StreakBadge';
import { site } from '../../config/env';
import { authedFetch, fetchMe, loadSession, logout, type MeRec } from '../../lib/session';
import { displayNameOf } from '../../lib/avatar';
import { useLiveTick } from '../../lib/live';

type Rec = Record<string, unknown>;

function num(v: unknown, fallback = 0): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

function str(v: unknown, fallback = ''): string {
  if (typeof v === 'string') return v;
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  return fallback;
}

interface Notice {
  title: string;
  when: string;
}

function relativeDay(sentAt: string): string | null {
  const t = Date.parse(sentAt);
  if (!Number.isFinite(t)) return null;
  const now = Date.now();
  const days = Math.floor((now - t) / 86400000);
  if (days < 0) return null;
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

function titleFor(pathname: string): string {
  if (pathname.startsWith('/app/learn')) return 'Learn';
  if (pathname.startsWith('/app/lessons')) return 'Lesson';
  if (pathname.startsWith('/app/setup')) return 'Setup';
  if (pathname.startsWith('/app/songs')) return 'Song library';
  if (pathname.startsWith('/app/practice') || pathname.startsWith('/app/games')) return 'Practice';
  if (pathname.startsWith('/app/history')) return 'History';
  if (pathname.startsWith('/app/assessment')) return 'Assessment';
  if (pathname.startsWith('/app/profile')) return 'Profile';
  if (pathname.startsWith('/app/settings')) return 'Settings';
  if (pathname.startsWith('/app/premium')) return 'Premium';
  if (pathname.startsWith('/app/progress')) return 'Progress';
  return 'Dashboard';
}

export default function AppLayout() {
  const nav = useNavigate();
  const loc = useLocation();
  const tick = useLiveTick();
  const [menuOpen, setMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [streak, setStreak] = useState<number | null>(null);
  const [xp, setXp] = useState<string | null>(null);
  const [level, setLevel] = useState<number | null>(null);
  const [me, setMe] = useState<MeRec | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [hasRecent, setHasRecent] = useState(false);
  const bellRef = useRef<HTMLDivElement | null>(null);

  const session = loadSession();
  const email = str(session?.email, '');
  const displayName = displayNameOf(
    {
      display_name: str(me?.display_name),
      name: str(me?.name),
      email: str(me?.email) || email,
    },
    email ? email.charAt(0).toUpperCase() : '♪',
  );
  const initial = displayName ? displayName.charAt(0).toUpperCase() : '♪';

  // Close popovers on route change.
  useEffect(() => {
    setMenuOpen(false);
    setBellOpen(false);
  }, [loc.pathname]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await fetchMe();
      if (!cancelled) setMe(data);
    })();
    return () => {
      cancelled = true;
    };
  }, [tick]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await authedFetch(`${site.apiUrl}/gamification/status`);
        if (!res || !res.ok) return;
        const data = (await res.json()) as Record<string, unknown>;
        if (cancelled) return;
        const s =
          num(data.streak_days, NaN) ||
          num((data.streak as Record<string, unknown> | undefined)?.current_days, NaN) ||
          num(data.current_streak, NaN);
        if (Number.isFinite(s)) setStreak(s);
        const xpVal = data.xp ?? data.total_xp ?? data.experience;
        if (typeof xpVal === 'number') setXp(String(xpVal));
        else if (typeof xpVal === 'string' && xpVal) setXp(xpVal);
        const lv = num(data.level, NaN);
        if (Number.isFinite(lv)) setLevel(lv);
      } catch {
        /* offline — badges stay hidden */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tick]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await authedFetch(`${site.apiUrl}/engagement/history?limit=20`);
        if (!res || !res.ok) return;
        const data = (await res.json()) as unknown;
        const list = Array.isArray(data) ? data : [];
        if (cancelled) return;
        const mapped: { title: string; day: string | null }[] = list
          .filter((x): x is Rec => typeof x === 'object' && x !== null)
          .map((x) => ({
            title: str(x.title ?? x.body ?? x.trigger, 'Update from Melody'),
            day: relativeDay(str(x.sent_at)),
          }));
        const recent = mapped.filter((m) => m.day !== null);
        setHasRecent(recent.length > 0);
        setNotices(
          recent.slice(0, 5).map((m) => ({ title: m.title, when: m.day as string })),
        );
      } catch {
        /* offline — bell stays quiet */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tick]);

  const onLogout = async () => {
    await logout();
    nav('/', { replace: true });
  };

  const railLink = ({ isActive }: { isActive: boolean }) =>
    `rail-btn${isActive ? ' active' : ''}`;

  return (
    <div className="rail-shell">
      <aside className="rail" aria-label="App sections">
        <Link to="/app" aria-label="Wormear app home" title="Dashboard" className="rail-logo">
          <LogoMark size={30} alt="Wormear app home" />
        </Link>
        <nav className="rail-nav" aria-label="App sections">
          <NavLink to="/app" end className={railLink} aria-label="Dashboard" title="Dashboard">
            <SquaresFour size={22} aria-hidden="true" />
          </NavLink>
          <NavLink to="/app/learn" className={railLink} aria-label="Learn" title="Learn">
            <GraduationCap size={22} aria-hidden="true" />
          </NavLink>
          <NavLink to="/app/practice" className={railLink} aria-label="Practice" title="Practice">
            <GameController size={22} aria-hidden="true" />
          </NavLink>
          <NavLink to="/app/songs" className={railLink} aria-label="Songs" title="Songs">
            <MusicNotes size={22} aria-hidden="true" />
          </NavLink>
          <NavLink to="/app/setup" className={railLink} aria-label="Setup" title="Keyboard & audio setup">
            <Keyboard size={22} aria-hidden="true" />
          </NavLink>
          <NavLink to="/app/progress" className={railLink} aria-label="Progress" title="Progress">
            <ChartBar size={22} aria-hidden="true" />
          </NavLink>
          <NavLink to="/app/profile" className={railLink} aria-label="Profile" title="Profile">
            <User size={22} aria-hidden="true" />
          </NavLink>
          <NavLink to="/app/settings" className={railLink} aria-label="Settings" title="Settings">
            <GearSix size={22} aria-hidden="true" />
          </NavLink>
        </nav>
        <div className="rail-bottom">
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="rail-btn"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-label="Account menu"
              title="Account"
              style={{ borderRadius: '50%', padding: 0, width: 46, height: 46 }}
            >
              <UserAvatar
                user={
                  me
                    ? {
                        avatar_url: str(me.avatar_url),
                        avatar_seed: str(me.avatar_seed),
                        display_name: displayName,
                        email,
                      }
                    : null
                }
                size={40}
                alt=""
              />
            </button>
            {menuOpen ? (
              <div className="rail-pop" role="menu" aria-label="Account">
                <p className="small muted rail-pop-email">{email || 'Signed in'}</p>
                <Link
                  to="/app/profile"
                  className="btn btn-ghost btn-sm rail-pop-link"
                  onClick={() => setMenuOpen(false)}
                >
                  Profile
                </Link>
                <Link
                  to="/app/premium"
                  className="btn btn-ghost btn-sm rail-pop-link"
                  onClick={() => setMenuOpen(false)}
                >
                  <Crown size={15} weight="fill" aria-hidden="true" /> Premium
                </Link>
                <Link
                  to="/app/progress"
                  className="btn btn-ghost btn-sm rail-pop-link"
                  onClick={() => setMenuOpen(false)}
                >
                  Progress
                </Link>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm rail-pop-link"
                  onClick={onLogout}
                >
                  Log out
                </button>
              </div>
            ) : null}
          </div>
          <span className="rail-avatar" aria-hidden="true" title={email || 'Account'}>
            {initial}
          </span>
        </div>
      </aside>

      <div className="app-body">
        <header className="app-topbar">
          <h1 className="topbar-title">{titleFor(loc.pathname)}</h1>
          <div className="topbar-badges">
            {streak !== null && streak > 0 ? <StreakBadge days={streak} /> : null}
            {xp !== null && level !== null ? <XPBadge xp={xp} level={level} /> : null}
            {level !== null ? (
              <span className="pill level-pill" aria-label={`Level ${level}`}>
                Lv {level}
              </span>
            ) : null}
            <div className="bell-wrap" ref={bellRef}>
              <button
                type="button"
                className="bell-btn"
                onClick={() => setBellOpen((v) => !v)}
                aria-expanded={bellOpen}
                aria-label={hasRecent ? 'Notifications, new updates' : 'Notifications'}
                title="Notifications"
              >
                <Bell size={19} aria-hidden="true" />
                {hasRecent ? <span className="bell-dot" aria-hidden="true" /> : null}
              </button>
              {bellOpen ? (
                <div className="bell-pop" role="menu" aria-label="Latest updates">
                  {notices.length === 0 ? (
                    <p className="small muted" style={{ margin: '4px 6px' }}>
                      Connect to sync and Melody&apos;s updates will appear here.
                    </p>
                  ) : (
                    <ul className="bell-list">
                      {notices.map((n, i) => (
                        <li key={i} className="bell-item">
                          <strong className="small">{n.title}</strong>
                          <span className="small muted">{n.when}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link
                    to="/app/progress"
                    className="btn btn-ghost btn-sm"
                    style={{ width: '100%', justifyContent: 'flex-start' }}
                    onClick={() => setBellOpen(false)}
                  >
                    View progress
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className="app-main">
          <Outlet />
        </main>

        <footer className="app-foot">
          <div className="wrap app-foot-inner">
            <span className="small muted">Melody is cheering you on — every minute counts.</span>
            <span className="small muted">v{site.appVersion}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

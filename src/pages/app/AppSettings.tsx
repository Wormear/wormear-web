import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell } from '@phosphor-icons/react';
import Button from '../../components/Button';
import { site } from '../../config/env';
import { authedFetch, logout, logoutEverywhere } from '../../lib/session';

type Rec = Record<string, unknown>;

function bool(v: unknown, fallback: boolean): boolean {
  return typeof v === 'boolean' ? v : fallback;
}
function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' && v ? v : fallback;
}
function num(v: unknown, fallback = 0): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Africa/Accra',
  'Asia/Tokyo',
];

function clampHour(h: number): number {
  if (!Number.isFinite(h)) return 0;
  return Math.min(23, Math.max(0, Math.round(h)));
}

function parseHour(v: unknown, fallback: number): number {
  if (typeof v === 'number') return clampHour(v);
  if (typeof v === 'string') {
    const n = Number.parseInt(v.split(':')[0] ?? '', 10);
    return Number.isFinite(n) ? clampHour(n) : fallback;
  }
  return fallback;
}

/**
 * Settings: notification prefs (server-only — the web has no local nudges),
 * daily goal stepper, and account actions. Everything offline-safe with
 * revert-on-failure, following the mobile SettingsScreen contract.
 */
export default function AppSettings() {
  const nav = useNavigate();
  const [push, setPush] = useState(true);
  const [emailPref, setEmailPref] = useState(false);
  const [digest, setDigest] = useState(true);
  const [timezone, setTimezone] = useState('UTC');
  const [quietStart, setQuietStart] = useState(22);
  const [quietEnd, setQuietEnd] = useState(7);
  const [goal, setGoal] = useState(10);
  const [synced, setSynced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [prefsRes, goalRes] = await Promise.all([
          authedFetch(`${site.apiUrl}/engagement/prefs`),
          authedFetch(`${site.apiUrl}/users/me`),
        ]);
        if (cancelled) return;
        if (prefsRes?.ok) {
          const p = (await prefsRes.json()) as Rec;
          setPush(bool(p.push_enabled, true));
          setEmailPref(bool(p.email_enabled, false));
          setDigest(bool(p.weekly_digest, true));
          const tz = str(p.timezone);
          if (tz) setTimezone(tz);
          setQuietStart(parseHour(p.quiet_start, 22));
          setQuietEnd(parseHour(p.quiet_end, 7));
        }
        if (goalRes?.ok) {
          const m = (await goalRes.json()) as Rec;
          const g = num(m.daily_goal_minutes ?? m.goal_minutes, NaN);
          if (Number.isFinite(g) && g > 0) setGoal(Math.min(120, Math.max(1, Math.round(g))));
        }
        if (prefsRes?.ok || goalRes?.ok) setSynced(true);
      } catch {
        /* offline — defaults stand */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function persistPrefs(patch: Rec, revert: () => void) {
    setSaving(true);
    try {
      const res = await authedFetch(`${site.apiUrl}/engagement/prefs`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res?.ok) revert();
      else setSynced(true);
    } catch {
      revert();
    } finally {
      setSaving(false);
    }
  }

  async function persistGoal(next: number) {
    const prev = goal;
    setGoal(next);
    setSaving(true);
    try {
      const res = await authedFetch(`${site.apiUrl}/users/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daily_goal_minutes: next }),
      });
      if (!res?.ok) {
        setGoal(prev);
        setNotice('Could not save your daily goal. Check your connection.');
      } else {
        setSynced(true);
      }
    } catch {
      setGoal(prev);
      setNotice('Could not save your daily goal. Check your connection.');
    } finally {
      setSaving(false);
    }
  }

  function togglePush(v: boolean) {
    const prev = push;
    setPush(v);
    void persistPrefs({ push_enabled: v }, () => setPush(prev));
  }
  function toggleEmail(v: boolean) {
    const prev = emailPref;
    setEmailPref(v);
    void persistPrefs({ email_enabled: v }, () => setEmailPref(prev));
  }
  function toggleDigest(v: boolean) {
    const prev = digest;
    setDigest(v);
    void persistPrefs({ weekly_digest: v }, () => setDigest(prev));
  }
  function changeTimezone(tz: string) {
    const prev = timezone;
    setTimezone(tz);
    void persistPrefs({ timezone: tz }, () => setTimezone(prev));
  }
  function changeQuiet(which: 'start' | 'end', delta: number) {
    if (which === 'start') {
      const prev = quietStart;
      const next = clampHour(prev + delta);
      setQuietStart(next);
      void persistPrefs({ quiet_start: next }, () => setQuietStart(prev));
    } else {
      const prev = quietEnd;
      const next = clampHour(prev + delta);
      setQuietEnd(next);
      void persistPrefs({ quiet_end: next }, () => setQuietEnd(prev));
    }
  }

  async function onLogout() {
    await logout();
    nav('/', { replace: true });
  }
  async function onLogoutEverywhere() {
    await logoutEverywhere();
    nav('/', { replace: true });
  }

  return (
    <div className="wrap-narrow" style={{ paddingTop: 28, paddingBottom: 48 }}>
      <p className="crumbs">
        <Link to="/app">Dashboard</Link> / <span>Settings</span>
      </p>
      <p className="kicker">Settings · tune the experience</p>
      <h1 style={{ marginTop: 6 }}>Make it yours.</h1>

      <div className="card" style={{ marginTop: 18 }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bell size={20} aria-hidden="true" /> Notifications
        </h3>
        <p className="small muted" style={{ marginTop: 0 }}>
          {synced ? 'Synced with your account.' : 'Showing defaults — syncs when online.'}
          {saving ? ' Saving…' : ''}
        </p>
        <Row label="Push notifications" value={push} onChange={togglePush} />
        <Row label="Email notifications" value={emailPref} onChange={toggleEmail} />
        <Row label="Weekly digest" value={digest} onChange={toggleDigest} />

        <p className="kicker" style={{ marginTop: 16 }}>Quiet hours</p>
        <HourStepper label="Start" hour={quietStart} onMinus={() => changeQuiet('start', -1)} onPlus={() => changeQuiet('start', 1)} />
        <HourStepper label="End" hour={quietEnd} onMinus={() => changeQuiet('end', -1)} onPlus={() => changeQuiet('end', 1)} />
        <p className="small muted">Melody stays silent {quietStart}:00 – {quietEnd}:00.</p>

        <p className="kicker" style={{ marginTop: 16 }}>Timezone</p>
        <div className="filter-row" style={{ marginTop: 8 }}>
          {TIMEZONES.map((tz) => (
            <button
              key={tz}
              type="button"
              className="chip-btn"
              aria-pressed={tz === timezone}
              onClick={() => changeTimezone(tz)}
            >
              {tz}
            </button>
          ))}
        </div>
        <p className="small muted" style={{ marginTop: 10 }}>
          The web has no on-device nudges — these prefs tune the emails and pushes Melody sends from the server.
        </p>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <h3>Daily goal</h3>
        <p className="small muted" style={{ marginTop: 0 }}>Ten focused minutes beats an hour of noodling.</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
          <button type="button" className="btn btn-light btn-sm" onClick={() => void persistGoal(clampGoal(goal - 5))} aria-label="Decrease daily goal" disabled={goal <= 5}>
            −
          </button>
          <strong aria-label={`Daily goal ${goal} minutes`}>{goal} min/day</strong>
          <button type="button" className="btn btn-light btn-sm" onClick={() => void persistGoal(clampGoal(goal + 5))} aria-label="Increase daily goal" disabled={goal >= 60}>
            +
          </button>
        </div>
        {notice ? (
          <p role="alert" className="small" style={{ color: '#b42318', fontWeight: 800, marginTop: 10 }}>{notice}</p>
        ) : null}
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <h3>Account</h3>
        <div className="btn-row" style={{ marginTop: 8 }}>
          <Button to="/app/profile" variant="light" size="sm">Edit profile</Button>
          <button type="button" className="btn btn-light btn-sm" onClick={() => void onLogout()}>Log out</button>
          <button type="button" className="btn btn-light btn-sm" onClick={() => void onLogoutEverywhere()}>Log out everywhere</button>
        </div>
        <p className="small muted" style={{ marginTop: 12 }}>
          “Log out everywhere” revokes every device signed in as you. App version v{site.appVersion}.
        </p>
        <p className="small" style={{ marginTop: 8, borderLeft: '4px solid var(--coral)', paddingLeft: 12 }}>
          <strong>Danger zone:</strong> there is no self-serve delete on the web yet — to erase your
          account, email support from your sign-in address and Melody will handle it personally.
        </p>
      </div>
    </div>
  );
}

function clampGoal(g: number): number {
  return Math.min(60, Math.max(5, g));
}

function Row({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px dashed var(--line)' }}>
      <span style={{ fontWeight: 700 }}>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label={label}
        onClick={() => onChange(!value)}
        className="chip-btn"
        aria-pressed={value}
      >
        {value ? 'On' : 'Off'}
      </button>
    </div>
  );
}

function HourStepper({ label, hour, onMinus, onPlus }: { label: string; hour: number; onMinus: () => void; onPlus: () => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
      <span>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button type="button" className="btn btn-light btn-sm" onClick={onMinus} aria-label={`Decrease ${label} hour`}>−</button>
        <strong aria-label={`${label} hour ${hour}`} style={{ minWidth: 52, textAlign: 'center' }}>{hour}:00</strong>
        <button type="button" className="btn btn-light btn-sm" onClick={onPlus} aria-label={`Increase ${label} hour`}>+</button>
      </div>
    </div>
  );
}

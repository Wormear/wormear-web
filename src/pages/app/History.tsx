import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/Button';
import { site } from '../../config/env';
import { authedFetch } from '../../lib/session';
import { useLiveTick } from '../../lib/live';

type Rec = Record<string, unknown>;

function str(v: unknown, fallback = ''): string {
  if (typeof v === 'string') return v;
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  return fallback;
}
function num(v: unknown, fallback = 0): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}
function arr(v: unknown): Rec[] {
  return Array.isArray(v) ? v.filter((x): x is Rec => typeof x === 'object' && x !== null) : [];
}

interface Row {
  kind: string;
  accuracy: number | null;
  xp: number;
  minutes: number;
  when: string;
}

function toRow(r: Rec): Row {
  const durationSec = num(r.duration_sec ?? r.duration_seconds ?? r.seconds);
  return {
    kind: str(r.kind ?? r.game ?? r.title, 'Practice'),
    accuracy: Number.isFinite(num(r.accuracy, NaN)) ? num(r.accuracy) : null,
    xp: num(r.xp_earned ?? r.xp ?? r.xp_awarded),
    minutes: durationSec > 0 ? durationSec / 60 : num(r.duration_min ?? r.minutes),
    when: str(r.finished_at ?? r.completed_at ?? r.created_at ?? r.date),
  };
}

function prettyKind(k: string): string {
  const t = k.replace(/_/g, ' ').toLowerCase();
  return t.replace(/\b\w/g, (c) => c.toUpperCase());
}

function prettyDate(when: string): string {
  if (!when) return 'Unknown date';
  const t = Date.parse(when);
  if (!Number.isFinite(t)) return when;
  const days = Math.floor((Date.now() - t) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Practice history: GET /practice/history list with totals + CSS bars.
 * Offline-safe; links back to the practice hub when empty.
 */
export default function History() {
  const tick = useLiveTick();
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await authedFetch(`${site.apiUrl}/practice/history`);
        if (!res) {
          if (!cancelled) {
            setOffline(true);
            setLoading(false);
          }
          return;
        }
        if (!res.ok) {
          if (!cancelled) setLoading(false);
          return;
        }
        const data = (await res.json()) as unknown;
        if (cancelled) return;
        const list = Array.isArray(data)
          ? data
          : arr((data as Rec).sessions ?? (data as Rec).items ?? (data as Rec).history);
        setRows(list.map(toRow));
        setLoading(false);
      } catch {
        if (!cancelled) {
          setOffline(true);
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tick]);

  const totalXp = rows.reduce((a, r) => a + r.xp, 0);
  const totalMin = rows.reduce((a, r) => a + r.minutes, 0);
  const maxXp = rows.reduce((m, r) => Math.max(m, r.xp), 0);

  return (
    <div className="wrap-narrow" style={{ paddingTop: 28, paddingBottom: 48 }}>
      <p className="crumbs">
        <Link to="/app">Dashboard</Link> / <Link to="/app/practice">Practice</Link> / <span>History</span>
      </p>
      <p className="kicker">Practice history</p>
      <h1 style={{ marginTop: 6 }}>Every rep, on record.</h1>

      {loading ? (
        <div className="card" role="status" aria-label="Loading history" style={{ marginTop: 18 }}>
          <p className="muted">Digging up your sessions…</p>
        </div>
      ) : offline && rows.length === 0 ? (
        <div className="card" role="status" style={{ marginTop: 18 }}>
          <strong>You&apos;re offline — connect to sync.</strong>
          <p className="muted small" style={{ margin: '6px 0 0' }}>Session history lives on the server. Nothing was invented.</p>
          <div className="btn-row" style={{ marginTop: 12 }}>
            <Button to="/app/practice" variant="primary" size="sm">Practice now</Button>
          </div>
        </div>
      ) : rows.length === 0 ? (
        <div className="card" style={{ marginTop: 18 }}>
          <h3>No sessions yet</h3>
          <p className="muted small">Play your first game and it will show up here.</p>
          <div className="btn-row" style={{ marginTop: 12 }}>
            <Button to="/app/practice" variant="primary" size="sm">Practice now</Button>
          </div>
        </div>
      ) : (
        <>
          <p style={{ marginTop: 14 }}>
            <span className="pill">{rows.length} sessions</span>{' '}
            <span className="pill xp-pill">+{Math.round(totalXp)} XP</span>{' '}
            <span className="pill">{Math.round(totalMin)} min</span>
          </p>
          <ol style={{ listStyle: 'none', padding: 0, margin: '14px 0 0', display: 'grid', gap: 10 }}>
            {rows.map((r, i) => (
              <li key={i} className="card" style={{ padding: '14px 18px' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <strong>{prettyKind(r.kind)}</strong>
                  <span className="small muted">{prettyDate(r.when)}</span>
                  <span className="pill xp-pill" style={{ marginLeft: 'auto' }}>+{Math.round(r.xp)} XP</span>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 8 }}>
                  <span className="bar" style={{ flex: 1 }} role="img" aria-label={`${prettyKind(r.kind)}: ${Math.round(r.xp)} XP`}>
                    <span style={{ width: `${maxXp > 0 ? Math.max(4, (r.xp / maxXp) * 100) : 4}%` }} />
                  </span>
                </div>
                <p className="small muted" style={{ margin: '6px 0 0' }}>
                  {r.accuracy !== null ? `${Math.round(r.accuracy <= 1 ? r.accuracy * 100 : r.accuracy)}% accuracy · ` : ''}
                  {r.minutes > 0 ? `${Math.round(r.minutes)} min` : 'Quick session'}
                </p>
              </li>
            ))}
          </ol>
          <div className="btn-row" style={{ marginTop: 18 }}>
            <Button to="/app/practice" variant="primary" size="sm">Practice more</Button>
            <Button to="/app/progress" variant="light" size="sm">Full progress</Button>
          </div>
        </>
      )}
    </div>
  );
}

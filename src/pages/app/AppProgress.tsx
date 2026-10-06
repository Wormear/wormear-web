import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Lock, Medal } from '@phosphor-icons/react';
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

async function getJson(path: string): Promise<Rec | null> {
  try {
    const res = await authedFetch(`${site.apiUrl}${path}`);
    if (!res || !res.ok) return null;
    try {
      const data = (await res.json()) as unknown;
      if (typeof data === 'object' && data !== null) return data as Rec;
      return null;
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}

function fmtMinutes(m: number): string {
  if (!Number.isFinite(m) || m <= 0) return '0 min';
  if (m < 60) return `${Math.round(m)} min`;
  const h = Math.floor(m / 60);
  const rest = Math.round(m % 60);
  return rest > 0 ? `${h}h ${rest}m` : `${h}h`;
}

export default function AppProgress() {
  const tick = useLiveTick();
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [summary, setSummary] = useState<Rec | null>(null);
  const [history, setHistory] = useState<Rec[]>([]);
  const [milestones, setMilestones] = useState<Rec[]>([]);
  const [achievements, setAchievements] = useState<Rec[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [sum, hist, ms, ach] = await Promise.all([
        getJson('/progress/summary'),
        getJson('/progress/history?days=30'),
        getJson('/milestones'),
        getJson('/achievements'),
      ]);
      if (cancelled) return;
      setSummary(sum);
      setHistory(hist ? arr(hist.history ?? hist.days ?? hist.items) : []);
      setMilestones(ms ? arr(ms.milestones ?? ms.items ?? ms) : []);
      setAchievements(ach ? arr(ach.achievements ?? ach.items ?? ach) : []);
      setOffline(!sum && !hist && !ms && !ach);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [tick]);

  const practiceMin = num(
    summary?.practice_time_min ?? summary?.practice_minutes ?? summary?.minutes_practiced ?? summary?.total_minutes,
  );
  const accuracy = num(summary?.accuracy_avg ?? summary?.accuracy ?? summary?.avg_accuracy, NaN);
  const historySessions = history.reduce((a, d) => a + num(d.sessions ?? d.session_count), 0);
  const sessions = num(
    summary?.sessions ?? summary?.session_count ?? summary?.total_sessions,
    historySessions,
  );
  const songsDone = num(summary?.songs_completed ?? summary?.songs ?? summary?.songs_finished);
  const records = summary?.records ?? summary?.personal_bests;
  const recordList = arr(records);

  const maxDay = history.reduce((m, d) => Math.max(m, num(d.minutes ?? d.practice_minutes ?? d.value)), 0);
  const achieved = milestones.filter((m) => m.achieved === true || m.completed === true || m.unlocked === true);
  const upcoming = milestones.filter((m) => !(m.achieved === true || m.completed === true || m.unlocked === true));
  const unlocked = achievements.filter((a) => a.unlocked === true || a.achieved === true || a.earned === true);
  const locked = achievements.filter((a) => !(a.unlocked === true || a.achieved === true || a.earned === true));

  return (
    <div className="wrap" style={{ paddingTop: 28, paddingBottom: 48 }}>
      <p className="crumbs">
        <Link to="/app">Dashboard</Link> / <span>Progress</span>
      </p>
      <p className="kicker">Progress · proof you&apos;re growing</p>
      <h1 style={{ marginTop: 6 }}>Look how far you&apos;ve come.</h1>
      <p className="lede">Melody counts every minute, every retry, every brave share. Here is the evidence.</p>

      {offline && !loading ? (
        <div className="card" role="status" style={{ borderLeft: '5px solid var(--sun-deep)', marginTop: 18 }}>
          <strong>You&apos;re offline — connect to sync.</strong>
          <p className="muted small" style={{ margin: '6px 0 0' }}>
            Progress lives on the server, so these cards are empty for now. Nothing was invented.
          </p>
        </div>
      ) : null}

      {loading ? (
        <div className="card" role="status" aria-label="Loading progress" style={{ marginTop: 18 }}>
          <p className="muted">Adding up your wins…</p>
        </div>
      ) : (
        <>
          <div className="grid grid-4" style={{ marginTop: 18 }}>
            <div className="card stat-card tone-plum"><span className="stat-value">{fmtMinutes(practiceMin)}</span><span className="stat-label">Practice time</span></div>
            <div className="card stat-card tone-sun"><span className="stat-value">{Number.isFinite(accuracy) ? `${Math.round(accuracy)}%` : '—'}</span><span className="stat-label">Accuracy</span></div>
            <div className="card stat-card tone-coral"><span className="stat-value">{sessions || '—'}</span><span className="stat-label">Sessions</span></div>
            <div className="card stat-card tone-green"><span className="stat-value">{songsDone || '—'}</span><span className="stat-label">Songs finished</span></div>
          </div>

          {recordList.length > 0 ? (
            <div className="card" style={{ marginTop: 18 }}>
              <h3>Personal records</h3>
              <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
                {recordList.slice(0, 6).map((r, i) => (
                  <li key={i} className="small">
                    <strong>{str(r.title ?? r.name ?? r.label, 'Record')}</strong>
                    {str(r.value ?? r.detail) ? <span className="muted"> — {str(r.value ?? r.detail)}</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="card" style={{ marginTop: 18 }}>
            <h3>Last 30 days</h3>
            {history.length === 0 ? (
              <p className="muted small">No practice days synced yet. Play one song and this chart comes alive.</p>
            ) : (
              <ol style={{ listStyle: 'none', padding: 0, margin: '12px 0 0', display: 'grid', gap: 8 }}>
                {history.slice(-30).map((d, i) => {
                  const mins = num(d.minutes ?? d.practice_minutes ?? d.value);
                  const label = str(d.date ?? d.day ?? d.label, `Day ${i + 1}`);
                  const pct = maxDay > 0 ? Math.min(100, (mins / maxDay) * 100) : 0;
                  return (
                    <li key={i} style={{ display: 'grid', gridTemplateColumns: '86px 1fr 64px', gap: 10, alignItems: 'center' }}>
                      <span className="small muted">{label}</span>
                      <span className="bar" role="img" aria-label={`${label}: ${Math.round(mins)} minutes`}>
                        <span style={{ width: `${pct}%` }} />
                      </span>
                      <span className="small" style={{ textAlign: 'right', fontWeight: 800 }}>{Math.round(mins)}m</span>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>

          <div className="grid grid-2" style={{ marginTop: 18 }}>
            <div className="card">
              <h3>Milestones</h3>
              {milestones.length === 0 ? (
                <p className="muted small">Milestones will appear here once synced.</p>
              ) : (
                <>
                  {achieved.length > 0 ? (
                    <div className="timeline" style={{ marginTop: 12 }}>
                      {achieved.map((m, i) => (
                        <article key={str(m.id, `a-${i}`)}>
                          <strong className="small">{str(m.title ?? m.name, 'Milestone')}</strong>
                          {str(m.achieved_at ?? m.date) ? (
                            <p className="small muted" style={{ margin: '2px 0 0' }}>{str(m.achieved_at ?? m.date)}</p>
                          ) : null}
                        </article>
                      ))}
                    </div>
                  ) : null}
                  {upcoming.length > 0 ? (
                    <>
                      <p className="small muted" style={{ marginTop: achieved.length > 0 ? 16 : 8, fontWeight: 800 }}>Up next</p>
                      <ul className="small" style={{ margin: '6px 0 0', paddingLeft: 20 }}>
                        {upcoming.slice(0, 5).map((m, i) => (
                          <li key={str(m.id, `u-${i}`)}>
                            <strong>{str(m.title ?? m.name, 'Milestone')}</strong>
                            {str(m.description) ? <span className="muted"> — {str(m.description)}</span> : null}
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                </>
              )}
            </div>

            <div className="card" id="achievements">
              <h3>Achievements</h3>
              {achievements.length === 0 ? (
                <p className="muted small">Badges will appear here once synced.</p>
              ) : (
                <>
                  {unlocked.length > 0 ? (
                    <div className="grid grid-2" style={{ marginTop: 12 }}>
                      {unlocked.map((a, i) => (
                        <div key={str(a.id, `un-${i}`)} className="card" style={{ padding: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
                          <Medal size={22} weight="fill" aria-hidden="true" style={{ color: 'var(--sun-deep)', flex: 'none' }} />
                          <div>
                            <strong className="small">{str(a.title ?? a.name, 'Achievement')}</strong>
                            {str(a.description) ? <p className="small muted" style={{ margin: 0 }}>{str(a.description)}</p> : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {locked.length > 0 ? (
                    <>
                      <p className="small muted" style={{ marginTop: unlocked.length > 0 ? 16 : 8, fontWeight: 800 }}>Still locked</p>
                      <ul className="small" style={{ margin: '6px 0 0', paddingLeft: 20 }}>
                        {locked.slice(0, 5).map((a, i) => (
                          <li key={str(a.id, `lo-${i}`)}>
                            <Lock size={13} weight="bold" aria-hidden="true" />{' '}
                            <strong>{str(a.title ?? a.name, 'Achievement')}</strong>
                            {str(a.hint ?? a.how_to_unlock ?? a.description) ? (
                              <span className="muted"> — {str(a.hint ?? a.how_to_unlock ?? a.description)}</span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                </>
              )}
            </div>
          </div>

          <div className="btn-row" style={{ marginTop: 18 }}>
            <Button to="/app" variant="light" size="sm"><Check size={15} weight="bold" aria-hidden="true" /> Back to today&apos;s plan</Button>
            <Button to="/app/history" variant="ghost" size="sm">Practice history</Button>
          </div>
        </>
      )}
    </div>
  );
}

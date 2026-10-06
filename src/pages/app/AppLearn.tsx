import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Lock, Play } from '@phosphor-icons/react';
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
function rec(v: unknown): Rec | null {
  return typeof v === 'object' && v !== null ? (v as Rec) : null;
}
function arr(v: unknown): Rec[] {
  return Array.isArray(v) ? v.filter((x): x is Rec => typeof x === 'object' && x !== null) : [];
}

type SkillState = 'done' | 'current' | 'locked';

/**
 * Resolves a skill to its first lesson (by order_index) and navigates to
 * the lesson player. Fetches on click so the list stays light.
 */
function SkillStartButton({ skillId }: { skillId: string }) {
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function start() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const res = await authedFetch(`${site.apiUrl}/lessons?skill_id=${encodeURIComponent(skillId)}`);
      if (!res) {
        setError('You are offline — reconnect to start this lesson.');
        return;
      }
      if (!res.ok) {
        setError('Could not load this lesson. Please try again.');
        return;
      }
      const list = (await res.json()) as unknown;
      const lessons = Array.isArray(list) ? list : [];
      const first = lessons
        .filter((l): l is Rec => typeof l === 'object' && l !== null)
        .sort((a, b) => num(a.order_index, 0) - num(b.order_index, 0))[0];
      const lessonId = first ? str(first.id ?? first.lesson_id) : '';
      if (!lessonId) {
        setError('No lessons in this skill yet.');
        return;
      }
      nav(`/app/lessons/${encodeURIComponent(lessonId)}`);
    } catch {
      setError('You are offline — reconnect to start this lesson.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="btn-row" style={{ marginTop: 12 }}>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => void start()} disabled={busy}>
          <Play size={15} weight="fill" aria-hidden="true" /> {busy ? 'Loading…' : 'Start lesson'}
        </button>
      </div>
      {error ? (
        <p role="alert" className="small" style={{ color: '#b42318', fontWeight: 800, marginTop: 8 }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function skillLevel(skill: Rec): string {
  const raw = str(skill.level ?? (skill.content as Rec | undefined)?.level ?? skill.difficulty).toLowerCase();
  if (raw.includes('intermediate')) return 'Intermediate';
  if (raw.includes('advanced')) return 'Advanced';
  return 'Beginner';
}

function skillWhy(skill: Rec): string {
  const content = rec(skill.content);
  const teaching = content ? arr(content.teaching) : [];
  if (teaching.length > 0) {
    const first = teaching[0];
    const point = str(first.point);
    const why = str(first.why);
    if (point || why) return [point, why].filter(Boolean).join(' — ');
  }
  return str(skill.why ?? skill.why_it_matters ?? content?.why);
}

function skillState(skill: Rec, index: number, firstOpen: number): SkillState {
  const raw = str(skill.status ?? skill.state).toLowerCase();
  if (raw === 'done' || raw === 'completed' || raw === 'mastered') return 'done';
  if (raw === 'current' || raw === 'active' || raw === 'next' || raw === 'unlocked') return 'current';
  if (raw === 'locked') return 'locked';
  if (skill.completed === true || num(skill.mastery, NaN) >= 90) return 'done';
  return index <= firstOpen ? 'current' : 'locked';
}

export default function AppLearn() {
  const tick = useLiveTick();
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [stages, setStages] = useState<Rec[]>([]);
  const [pathTitle, setPathTitle] = useState('');
  const [levelFilter, setLevelFilter] = useState<'All' | 'Beginner' | 'Intermediate' | 'Advanced'>('All');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await authedFetch(`${site.apiUrl}/paths?instrument=piano`);
        if (!res || !res.ok) {
          if (!cancelled) {
            setOffline(!res);
            setLoading(false);
          }
          return;
        }
        const data = (await res.json()) as Rec;
        if (cancelled) return;
        const list = arr(data.stages ?? data.items ?? data.paths);
        setStages(list);
        setPathTitle(str(data.title ?? data.name));
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

  return (
    <div className="wrap" style={{ paddingTop: 28, paddingBottom: 48 }}>
      <p className="crumbs">
        <Link to="/app">Dashboard</Link> / <span>Learn</span>
      </p>
      <p className="kicker">Learn · piano path</p>
      <h1 style={{ marginTop: 6 }}>One stage at a time.</h1>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }} aria-label="Instruments">
        <span className="pill plum">🎹 Piano · active</span>
        <span className="pill outline" title="Coming soon">🎸 Guitar · soon</span>
        <span className="pill outline" title="Coming soon">🥁 Drums · soon</span>
        <span className="pill outline" title="Coming soon">🎤 Voice · soon</span>
      </div>
      <p className="lede">
        {pathTitle || 'Melody ordered every skill so each one unlocks the next.'} Finish the glowing
        skill to unlock what follows — no skipping, no overwhelm.{' '}
        <Link to="/app/assessment">Retake the 30-second assessment</Link> anytime to re-tune your starting point.
        No piano? <Link to="/app/setup">Set up computer keys in 30 seconds</Link>.
      </p>
      <div className="filter-row" role="group" aria-label="Filter by level" style={{ marginTop: 12 }}>
        {(['All', 'Beginner', 'Intermediate', 'Advanced'] as const).map((lv) => (
          <button key={lv} type="button" className="chip-btn" aria-pressed={levelFilter === lv} onClick={() => setLevelFilter(lv)}>
            {lv}
          </button>
        ))}
      </div>
      {!loading && stages.length > 0 ? (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          <span className="pill">
            {stages.flatMap((s) => arr(s.skills ?? s.lessons ?? s.items)).filter((s) => skillState(s, 0, 1) === 'done').length}
            {' / '}
            {stages.flatMap((s) => arr(s.skills ?? s.lessons ?? s.items)).length} skills complete
          </span>
          <span className="pill outline">{stages.length} stages</span>
        </div>
      ) : null}

      {offline && !loading ? (
        <div className="card" role="status" style={{ borderLeft: '5px solid var(--sun-deep)', marginTop: 18 }}>
          <strong>You&apos;re offline — connect to sync.</strong>
          <p className="muted small" style={{ margin: '6px 0 0' }}>
            Your learning path lives on the server. Reconnect and Melody will lay it out again.
          </p>
        </div>
      ) : null}

      {loading ? (
        <div className="card" role="status" aria-label="Loading learning path" style={{ marginTop: 18 }}>
          <p className="muted">Finding your place on the path…</p>
        </div>
      ) : stages.length === 0 ? (
        <div className="card" style={{ marginTop: 18 }}>
          <h3>No stages yet</h3>
          <p className="muted small">
            {offline
              ? 'We could not reach the server, so there is nothing to show yet.'
              : 'Your path is still being tuned. Check back after your first session.'}
          </p>
          <div className="btn-row" style={{ marginTop: 12 }}>
            <Button to="/app" variant="light" size="sm">Back to dashboard</Button>
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 8 }}>
          {stages.map((stage, si) => {
            const skills = arr(stage.skills ?? stage.lessons ?? stage.items);
            const firstOpen = Math.max(
              0,
              skills.findIndex((s) => {
                const r = str(s.status ?? s.state).toLowerCase();
                return r !== 'locked' && s.completed !== true;
              }),
            );
            const pct = Number.isFinite(num(stage.percent_complete, NaN))
              ? num(stage.percent_complete)
              : Number.isFinite(num(stage.progress, NaN))
                ? num(stage.progress)
                : null;
            return (
              <section key={str(stage.id, `stage-${si}`)} aria-label={str(stage.title ?? stage.name, `Stage ${si + 1}`)} style={{ marginTop: 22 }}>
                <div className="card sun-top">
                  <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
                    <span className="pill">Stage {si + 1}</span>
                    <h2 style={{ margin: 0, fontSize: '1.3rem' }}>{str(stage.title ?? stage.name, `Stage ${si + 1}`)}</h2>
                  </div>
                  {str(stage.description) ? <p className="muted small" style={{ margin: '8px 0 0' }}>{str(stage.description)}</p> : null}
                  {pct !== null ? (
                    <div style={{ marginTop: 10 }}>
                      <div className="bar" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={`${str(stage.title ?? stage.name, 'Stage')} progress`}>
                        <span style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
                      </div>
                      <p className="small muted" style={{ margin: '6px 0 0' }}>{Math.round(pct)}% complete</p>
                    </div>
                  ) : null}
                </div>

                {skills.length === 0 ? (
                  <p className="small muted" style={{ margin: '12px 0 0 4px' }}>
                    Skills for this stage will appear here once synced.
                  </p>
                ) : (
                  <ol className="path" style={{ listStyle: 'none', padding: 0 }}>
                    {skills
                      .map((skill, ki) => ({ skill, ki }))
                      .filter(({ skill }) => levelFilter === 'All' || skillLevel(skill) === levelFilter)
                      .map(({ skill, ki }) => {
                      const state: SkillState = skillState(skill, ki, firstOpen);
                      const mastery = num(skill.mastery, NaN);
                      const lessonTitles = arr(skill.lessons ?? skill.lesson_titles);
                      const why = skillWhy(skill);
                      const lv = skillLevel(skill);
                      return (
                        <li key={str(skill.id, `skill-${si}-${ki}`)} className={`path-node ${state}`}>
                          <span className="path-dot" aria-hidden="true">
                            {state === 'done' ? (
                              <Check size={22} weight="bold" />
                            ) : state === 'current' ? (
                              <Play size={22} weight="fill" />
                            ) : (
                              <Lock size={20} weight="bold" />
                            )}
                          </span>
                          <div className="card" style={{ padding: '16px 20px' }}>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                              <strong>{str(skill.name ?? skill.title, `Skill ${ki + 1}`)}</strong>
                              <span className={`pill${state === 'done' ? ' green' : state === 'current' ? ' amber' : ''}`}>
                                {state === 'done' ? 'Completed' : state === 'current' ? 'Up next' : 'Locked'}
                                {Number.isFinite(mastery) ? ` · ${Math.round(mastery)}%` : ''} · {lv}
                              </span>
                            </div>
                            {why ? (
                              <p className="small" style={{ margin: '6px 0 0' }}><em>Why this matters:</em> {why}</p>
                            ) : null}
                            {str(skill.description) ? (
                              <p className="muted small" style={{ margin: '6px 0 0' }}>{str(skill.description)}</p>
                            ) : null}
                            {Number.isFinite(mastery) ? (
                              <div className="bar" style={{ marginTop: 10 }} role="progressbar" aria-valuenow={Math.round(mastery)} aria-valuemin={0} aria-valuemax={100} aria-label={`${str(skill.name ?? skill.title, 'Skill')} mastery`}>
                                <span style={{ width: `${Math.min(100, Math.max(0, mastery))}%` }} />
                              </div>
                            ) : null}
                            {lessonTitles.length > 0 ? (
                              <ul className="small muted" style={{ margin: '8px 0 0', paddingLeft: 18 }}>
                                {lessonTitles.slice(0, 4).map((l, li) => (
                                  <li key={li}>{str(l.title ?? l.name ?? l)}</li>
                                ))}
                              </ul>
                            ) : null}
                            {state === 'current' ? (
                              <SkillStartButton skillId={str(skill.id ?? skill.skill_id)} />
                            ) : null}
                            {state === 'locked' ? (
                              <p className="small muted" style={{ margin: '8px 0 0' }}>
                                Finish the skill above to unlock this one.
                              </p>
                            ) : null}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}

                {rec(stage.checkpoint) ? (
                  <p className="small" style={{ margin: '4px 0 0 4px' }}>
                    <span className="pill plum">Checkpoint · {str(rec(stage.checkpoint)?.title ?? rec(stage.checkpoint)?.name, 'Play-through')}</span>
                  </p>
                ) : null}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

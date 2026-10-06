import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Lock, Medal, Play, Target } from '@phosphor-icons/react';
import Button from '../../components/Button';
import Mascot from '../../components/Mascot';
import { MascotImg } from '../../components/Brand';
import UserAvatar from '../../components/UserAvatar';
import LeaderboardPanel from './LeaderboardPanel';
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

async function getJson(path: string): Promise<{ data: Rec | null; offline: boolean }> {
  try {
    const res = await authedFetch(`${site.apiUrl}${path}`);
    if (!res) return { data: null, offline: true };
    if (!res.ok) return { data: null, offline: false };
    try {
      const data = (await res.json()) as Rec;
      return { data, offline: false };
    } catch {
      return { data: null, offline: false };
    }
  } catch {
    return { data: null, offline: true };
  }
}

function greetingFor(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/** Stages from either PathOut ({stages:[{name,progress_pct,skills}]}) or legacy shapes. */
function getStages(paths: Rec | null): Rec[] {
  if (!paths) return [];
  return arr(paths.stages ?? paths.items ?? paths.paths);
}
function stageName(s: Rec, i: number): string {
  return str(s.title ?? s.name, `Stage ${i + 1}`);
}
function stagePct(s: Rec): number | null {
  for (const k of ['progress_pct', 'percent_complete', 'progress']) {
    const v = num(s[k], NaN);
    if (Number.isFinite(v)) return v;
  }
  return null;
}
function stageSkills(s: Rec): Rec[] {
  return arr(s.skills ?? s.lessons ?? s.items);
}
function skillDone(s: Rec): boolean {
  const raw = str(s.status ?? s.state).toLowerCase();
  if (raw === 'done' || raw === 'completed' || raw === 'mastered') return true;
  if (s.completed === true) return true;
  return Number.isFinite(num(s.mastery, NaN)) && num(s.mastery) >= 90;
}

/** Month ticks for the activity chart: unique consecutive months, oldest → newest. */
function monthTicks(days: { label: string; time: number | null }[]): string[] {
  const out: string[] = [];
  let last = '';
  for (const d of days) {
    if (d.time === null) continue;
    const m = new Date(d.time).toLocaleString(undefined, { month: 'short' });
    if (m !== last) {
      out.push(m);
      last = m;
    }
  }
  return out.slice(-6);
}

export default function Dashboard() {
  const tick = useLiveTick();
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [me, setMe] = useState<Rec | null>(null);
  const [engagement, setEngagement] = useState<Rec | null>(null);
  const [today, setToday] = useState<Rec | null>(null);
  const [summary, setSummary] = useState<Rec | null>(null);
  const [gam, setGam] = useState<Rec | null>(null);
  const [paths, setPaths] = useState<Rec | null>(null);
  const [milestones, setMilestones] = useState<Rec[]>([]);
  const [achievements, setAchievements] = useState<Rec[]>([]);
  const [history, setHistory] = useState<Rec[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [meR, engR, todayR, sumR, gamR, pathsR, msR, achR, histR] = await Promise.all([
        getJson('/auth/me'),
        getJson('/engagement/status'),
        getJson('/recommendations/today'),
        getJson('/progress/summary'),
        getJson('/gamification/status'),
        getJson('/paths?instrument=piano'),
        getJson('/milestones'),
        getJson('/achievements'),
        getJson('/progress/history?days=30'),
      ]);
      if (cancelled) return;
      setMe(meR.data);
      setEngagement(engR.data);
      setToday(todayR.data);
      setSummary(sumR.data);
      setGam(gamR.data);
      setPaths(pathsR.data);
      setMilestones(msR.data ? arr(msR.data.milestones ?? msR.data.items ?? msR.data) : []);
      setAchievements(achR.data ? arr(achR.data.achievements ?? achR.data.items ?? achR.data) : []);
      setHistory(histR.data ? arr(histR.data.history ?? histR.data.days ?? histR.data.items) : []);
      setOffline(
        [meR, engR, todayR, sumR, gamR, pathsR, msR, achR, histR].every((r) => r.data === null),
      );
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [tick]);

  const displayName =
    str(me?.display_name) || str(me?.name) || str(me?.email).split('@')[0] || 'player';
  const greeting = `${greetingFor(new Date().getHours())}, ${displayName}`;

  const atRisk = engagement?.at_risk === true;
  const todayMin = num(engagement?.today_minutes ?? engagement?.minutes_today);
  const goalMin = num(engagement?.goal_minutes ?? engagement?.daily_goal_minutes, 10);

  const lesson = rec(today?.next_lesson ?? today?.lesson ?? today?.todays_lesson);
  const weakSkill = rec(today?.weak_skill_practice ?? today?.weak_skill ?? today?.weakest_skill);
  const continueSong = rec(today?.continue_song ?? today?.song ?? today?.resume_song);

  const level = Number.isFinite(num(gam?.level, NaN)) ? num(gam?.level) : 1;

  // Path stats from stages + skills.
  const stages = getStages(paths);
  const pcts = stages.map(stagePct).filter((p): p is number => p !== null);
  const pathPct = pcts.length > 0 ? pcts.reduce((a, b) => a + b, 0) / pcts.length : 0;
  const allSkills = stages.flatMap(stageSkills);
  const skillsDone = allSkills.filter(skillDone).length;
  const chips = stages.map((s, i) => stageName(s, i)).filter(Boolean);

  const upcoming = milestones.filter(
    (m) => !(m.achieved === true || m.completed === true || m.unlocked === true),
  );

  const lessonTitle = lesson ? str(lesson.title ?? lesson.name, "Today's lesson") : '';
  const lessonId = lesson ? str(lesson.lesson_id ?? lesson.id) : '';
  const lessonMeta =
    lesson != null
      ? [str(lesson.skill ?? lesson.skill_name), lesson.duration_minutes != null || lesson.duration_min != null ? `${num(lesson.duration_minutes ?? lesson.duration_min)} min` : '']
          .filter(Boolean)
          .join(' · ')
      : '';
  const lessonXp = lesson != null ? num(lesson.xp ?? lesson.xp_reward, NaN) : NaN;
  const songTitle = continueSong ? str(continueSong.title ?? continueSong.name, 'A song you started') : '';
  const songArtist = continueSong ? str(continueSong.artist ?? continueSong.composer) : '';
  const songId = continueSong ? str(continueSong.id ?? continueSong.song_id) : '';
  const weakName = weakSkill ? str(weakSkill.name ?? weakSkill.skill ?? weakSkill.title, 'A wobbly skill') : '';
  const weakPct = weakSkill != null && Number.isFinite(num(weakSkill.mastery, NaN)) ? num(weakSkill.mastery) : null;

  const days = history.slice(-30).map((d, i) => {
    const mins = num(d.minutes ?? d.practice_minutes ?? d.value);
    const label = str(d.date ?? d.day ?? d.label, `Day ${i + 1}`);
    const t = Date.parse(label);
    return { mins, label, time: Number.isFinite(t) ? t : null };
  });
  const maxDay = days.reduce((m, d) => Math.max(m, d.mins), 0);
  const ticks = monthTicks(days);
  const totalMin = num(
    summary?.practice_time_min ?? summary?.practice_minutes ?? summary?.minutes_practiced ?? summary?.total_minutes,
  );

  const unlocked = achievements.filter((a) => a.unlocked === true || a.achieved === true || a.earned === true);
  const locked = achievements.filter((a) => !(a.unlocked === true || a.achieved === true || a.earned === true));
  const badgeRow = (unlocked.length > 0 ? unlocked : locked).slice(0, 4);

  return (
    <div className="wrap dash" style={{ paddingTop: 28, paddingBottom: 48 }}>
      {offline && !loading ? (
        <div className="card" role="status" style={{ borderLeft: '5px solid var(--sun-deep)', marginBottom: 18 }}>
          <strong>You&apos;re offline — connect to sync.</strong>
          <p className="muted small" style={{ margin: '6px 0 0' }}>
            Melody saved nothing yet. Your practice still counts — it will sync when you reconnect.
          </p>
        </div>
      ) : null}

      {loading ? (
        <div className="card" role="status" aria-label="Loading your dashboard">
          <p className="muted">Tuning your dashboard…</p>
        </div>
      ) : (
        <>
          <div className="dash-hello">
            <Mascot size={60} />
            <UserAvatar
              user={{
                avatar_url: str(me?.avatar_url),
                avatar_seed: str(me?.avatar_seed),
                display_name: displayName,
                email: str(me?.email),
              }}
              size={60}
              alt={`${displayName}'s avatar`}
            />
            <div>
              <p className="kicker">What should I do today?</p>
              <h2 className="dash-greeting">{greeting}.</h2>
              <p className="lede small" style={{ margin: '6px 0 0' }}>
                Ten focused minutes beats an hour of noodling. Melody picked the highest-impact next step.
              </p>
            </div>
          </div>

          {atRisk ? (
            <div
              className="card"
              role="alert"
              style={{ marginTop: 18, borderLeft: '5px solid var(--coral)', background: 'var(--coral-tint)' }}
            >
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Flame size={20} weight="fill" aria-hidden="true" /> Your streak is getting chilly.
              </h3>
              <p className="muted" style={{ margin: '0 0 12px' }}>
                {str(
                  engagement?.at_risk_reason ?? engagement?.message,
                  'One short session today keeps the flame alive. Even five minutes counts.',
                )}
              </p>
              <Button to="/app/learn" variant="coral" size="sm">
                <Play size={16} weight="fill" aria-hidden="true" /> Rescue my streak
              </Button>
            </div>
          ) : null}

          <div className="dash-stats" role="list" aria-label="Today at a glance">
            <div className="dash-stat tint-plum" role="listitem">
              <span className="dash-stat-label">Path completed</span>
              <span className="dash-stat-value">{Math.round(pathPct)}%</span>
              <div className="bar dash-mini-bar" role="progressbar" aria-valuenow={Math.round(pathPct)} aria-valuemin={0} aria-valuemax={100} aria-label="Path completed">
                <span style={{ width: `${Math.min(100, Math.max(0, pathPct))}%` }} />
              </div>
            </div>
            <div className="dash-stat tint-coral" role="listitem">
              <span className="dash-stat-label">Lessons complete</span>
              <span className="dash-stat-value">
                {skillsDone}<span className="dash-stat-total">/{allSkills.length}</span>
              </span>
              <span className="small muted">
                {allSkills.length === 0 ? 'Sync to count your skills.' : 'Skills mastered on your path.'}
              </span>
            </div>
            <div className="dash-stat tint-sun" role="listitem">
              <span className="dash-stat-label">Practiced today</span>
              <span className="dash-stat-value">
                {Math.round(todayMin)}<span className="dash-stat-total">/{goalMin > 0 ? goalMin : 10} min</span>
              </span>
              <div className="bar dash-mini-bar" role="progressbar" aria-valuenow={Math.round(todayMin)} aria-valuemin={0} aria-valuemax={goalMin > 0 ? goalMin : 10} aria-label="Minutes practiced today">
                <span style={{ width: `${Math.min(100, (todayMin / (goalMin > 0 ? goalMin : 10)) * 100)}%` }} />
              </div>
            </div>
          </div>

          <div className="dash-cols">
            <div className="dash-col">
              {chips.length > 0 ? (
                <section aria-label="Skill categories">
                  <div className="chip-row" role="list">
                    {chips.slice(0, 6).map((c) => (
                      <Link key={c} to="/app/learn" className="dash-chip" role="listitem" title={`${c} — open learning path`}>
                        {c}
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}

              <section aria-label="Continue learning">
                <h2 className="dash-section-title">Continue learning</h2>
                <div className="course-stack">
                  <article className="course-card">
                    <div className="course-art" aria-hidden="true">
                      <MascotImg size={64} alt="" />
                    </div>
                    <div className="course-body">
                      <p className="kicker">Today&apos;s lesson</p>
                      {lesson ? (
                        <>
                          <h3>{lessonTitle}</h3>
                          {lessonMeta ? <p className="small muted">{lessonMeta}</p> : null}
                          <div className="course-pills">
                            <span className="pill xp-pill">
                              {Number.isFinite(lessonXp) && lessonXp > 0 ? `+${Math.round(lessonXp)} XP` : 'XP inside'}
                            </span>
                          </div>
                          <Button
                            to={lessonId ? `/app/lessons/${encodeURIComponent(lessonId)}` : '/app/learn'}
                            variant="primary"
                            size="sm"
                          >
                            <Play size={15} weight="fill" aria-hidden="true" /> Start
                          </Button>
                        </>
                      ) : (
                        <>
                          <h3>Warm up with a song</h3>
                          <p className="small muted">Connect to sync and Melody will pick your perfect next lesson. New here? The 30-second assessment tunes your starting point.</p>
                          <div className="btn-row" style={{ marginTop: 4 }}>
                            <Button to="/app/songs" variant="light" size="sm">Browse songs</Button>
                            <Button to="/app/assessment" variant="ghost" size="sm">Take the assessment</Button>
                          </div>
                        </>
                      )}
                    </div>
                  </article>

                  <article className="course-card">
                    <div className="course-art tone-2" aria-hidden="true">
                      <MascotImg size={64} alt="" />
                    </div>
                    <div className="course-body">
                      <p className="kicker">Keep playing</p>
                      {continueSong ? (
                        <>
                          <h3>{songTitle}</h3>
                          {songArtist ? <p className="small muted">{songArtist}</p> : null}
                          <div className="course-pills">
                            <span className="pill xp-pill">Song XP</span>
                          </div>
                          {songId ? (
                            <Button to={`/app/songs/${songId}`} variant="dark" size="sm">
                              <Play size={15} weight="fill" aria-hidden="true" /> Start
                            </Button>
                          ) : (
                            <Button to="/app/songs" variant="dark" size="sm">
                              <Play size={15} weight="fill" aria-hidden="true" /> Start
                            </Button>
                          )}
                        </>
                      ) : (
                        <>
                          <h3>Pick your first song</h3>
                          <p className="small muted">Short, joyful, and built for total beginners. Or play a game — it counts too.</p>
                          <div className="btn-row" style={{ marginTop: 4 }}>
                            <Button to="/app/songs" variant="dark" size="sm">Find a song</Button>
                            <Button to="/app/practice" variant="ghost" size="sm">Play a game</Button>
                          </div>
                        </>
                      )}
                    </div>
                  </article>

                  {weakSkill ? (
                    <article className="course-card">
                      <div className="course-art tone-3" aria-hidden="true">
                        <MascotImg size={64} alt="" />
                      </div>
                      <div className="course-body">
                        <p className="kicker">Fix one wobble</p>
                        <h3>{weakName}</h3>
                        {weakPct !== null ? (
                          <div className="bar dash-mini-bar" role="progressbar" aria-valuenow={Math.round(weakPct)} aria-valuemin={0} aria-valuemax={100} aria-label={`${weakName} mastery`}>
                            <span style={{ width: `${Math.min(100, Math.max(0, weakPct))}%` }} />
                          </div>
                        ) : null}
                        <div className="course-pills">
                          <span className="pill">{weakPct !== null ? `${Math.round(weakPct)}% mastery` : 'Quick win'}</span>
                        </div>
                        <Button to="/app/learn" variant="sun" size="sm">Practice it</Button>
                      </div>
                    </article>
                  ) : null}
                </div>
              </section>
            </div>

            <div className="dash-col">
              <section className="dash-panel" aria-label="Activity">
                <div className="dash-panel-head">
                  <h2 className="dash-panel-title">Activity</h2>
                  <span className="small muted">
                    {totalMin > 0 ? `${Math.round(totalMin)} min total · ` : ''}Last 30 days
                  </span>
                </div>
                {days.length === 0 ? (
                  <p className="muted small">No practice days synced yet. Play one song and this chart comes alive.</p>
                ) : (
                  <>
                    <div
                      className="activity-bars"
                      role="img"
                      aria-label={`Practice minutes, last ${days.length} days. Best day ${Math.round(maxDay)} minutes.`}
                    >
                      {days.map((d, i) => (
                        <span
                          key={i}
                          className="activity-bar"
                          title={`${d.label}: ${Math.round(d.mins)} min`}
                          style={{ height: `${maxDay > 0 ? Math.max(4, (d.mins / maxDay) * 100) : 4}%` }}
                        />
                      ))}
                    </div>
                    <div className="activity-ticks" aria-hidden="true">
                      {ticks.map((t) => (
                        <span key={t}>{t}</span>
                      ))}
                    </div>
                  </>
                )}
              </section>

              <section className="dash-panel" aria-label="Badges">
                <div className="dash-panel-head">
                  <h2 className="dash-panel-title">Badges</h2>
                  <Link to="/app/progress" className="dash-view-all">View all</Link>
                </div>
                {achievements.length === 0 ? (
                  <p className="muted small">Badges will appear here once synced.</p>
                ) : (
                  <ul className="badge-row">
                    {badgeRow.map((a, i) => {
                      const got = a.unlocked === true || a.achieved === true || a.earned === true;
                      return (
                        <li key={str(a.id, `b-${i}`)} className={`badge-chip${got ? '' : ' locked'}`}>
                          {got ? (
                            <Medal size={20} weight="fill" aria-hidden="true" />
                          ) : (
                            <Lock size={18} weight="bold" aria-hidden="true" />
                          )}
                          <span>{str(a.title ?? a.name, 'Badge')}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              <section className="dash-panel" aria-label="Challenges">
                <div className="dash-panel-head">
                  <h2 className="dash-panel-title">Challenges</h2>
                </div>
                <ul className="challenge-list">
                  {upcoming.slice(0, 3).map((m, i) => {
                    const reward = num(m.xp_reward ?? m.xp, NaN);
                    return (
                      <li key={str(m.id, `c-${i}`)} className="challenge-row">
                        <Target size={18} aria-hidden="true" />
                        <span className="challenge-name">
                          <strong>{str(m.title ?? m.name ?? m.code, 'Milestone')}</strong>
                          {str(m.message ?? m.description) ? (
                            <span className="small muted"> — {str(m.message ?? m.description)}</span>
                          ) : null}
                        </span>
                        {Number.isFinite(reward) && reward > 0 ? (
                          <span className="pill xp-pill">+{Math.round(reward)} XP</span>
                        ) : null}
                      </li>
                    );
                  })}
                  <li className="challenge-row">
                    <Flame size={18} weight="fill" aria-hidden="true" />
                    <span className="challenge-name">
                      <strong>Daily goal</strong>
                      <span className="small muted"> — {Math.round(todayMin)}/{goalMin > 0 ? goalMin : 10} min today</span>
                    </span>
                    <span className="pill">
                      {todayMin >= (goalMin > 0 ? goalMin : 10) ? 'Done' : `${Math.max(0, Math.round((goalMin > 0 ? goalMin : 10) - todayMin))} min left`}
                    </span>
                  </li>
                </ul>
                {upcoming.length === 0 ? (
                  <p className="muted small" style={{ marginTop: 8 }}>
                    Milestones will appear here once synced.
                  </p>
                ) : null}
              </section>

              <p className="small muted">
                <Link to="/app/progress">See your full progress →</Link>
              </p>
            </div>

            <div className="dash-col dash-rail">
              <LeaderboardPanel youName={displayName} youLevel={level} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

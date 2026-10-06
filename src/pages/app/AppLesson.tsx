import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Flame, Keyboard, PianoKeys, Stop } from '@phosphor-icons/react';
import Button from '../../components/Button';
import Mascot from '../../components/Mascot';
import PianoKeyboard from '../../components/PianoKeyboard';
import KeymapSettings from '../../components/KeymapSettings';
import { site } from '../../config/env';
import { authedFetch } from '../../lib/session';
import { resultShareText, shareText } from '../../lib/share';
import { invertMapping, isOctaveKey, loadMapping, loadOctaveShift, saveOctaveShift, shiftMapping, codeLabel } from '../../lib/keymap';
import { pianoClick } from '../../lib/music';
import { submitAttempt, type AttemptResult } from '../../lib/practice';

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

interface ExerciseNote {
  note: string;
  beats: number;
  finger?: number | string;
}
interface Exercise {
  id: string;
  title: string;
  hand: string;
  bpm: number;
  counts_in: number;
  expected: ExerciseNote[];
}

function parseExercises(content: Rec): Exercise[] {
  return arr(content.exercises).map((e, i) => ({
    id: str(e.id, `exercise-${i}`),
    title: str(e.title ?? e.name, `Exercise ${i + 1}`),
    hand: str(e.hand ?? (content.hand as string) ?? 'right', 'right'),
    bpm: num(e.bpm ?? content.bpm, 80),
    counts_in: num(e.counts_in ?? e.count_in, 4),
    expected: arr(e.expected ?? e.notes)
      .map((n) => {
        if (typeof n === 'string') return { note: n, beats: 1 as number, finger: undefined as number | string | undefined };
        return {
          note: str((n as Rec).note ?? (n as Rec).name ?? (n as Rec).pitch),
          beats: num((n as Rec).beats ?? (n as Rec).dur, 1),
          finger: (n as Rec).finger as number | string | undefined,
        };
      })
      .filter((n) => n.note),
  })).filter((e) => e.expected.length > 0);
}

const SEEN_HINT = 'wormear-seen-keyboard-hint';

/**
 * Lesson runner: teaching steps → keyboard-setup hint (first visit) →
 * scored exercise mode (count-in → play glowing targets via piano or
 * computer keys → auto-submit → per-note feedback) → complete with the
 * measured accuracy → celebration. Offline attempts show an honest
 * "reconnect to grade & save" notice — nothing is faked.
 */
export default function AppLesson() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [lesson, setLesson] = useState<Rec | null>(null);
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<'steps' | 'setup' | 'exercise' | 'done'>('steps');
  const [exIndex, setExIndex] = useState(0);
  const [showMapping, setShowMapping] = useState(false);

  // Attempt state
  const [countIn, setCountIn] = useState(0);
  const [started, setStarted] = useState(false);
  const [performed, setPerformed] = useState<{ note: string; at_ms: number }[]>([]);
  const [activeNotes, setActiveNotes] = useState<string[]>([]);
  const [grading, setGrading] = useState(false);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [gradeOffline, setGradeOffline] = useState(false);
  const [notice, setNotice] = useState('');
  const [completeResult, setCompleteResult] = useState<Rec | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareNote, setShareNote] = useState('');

  const startedAt = useRef<number>(Date.now());
  const countTimer = useRef<number[]>([]);
  const attemptStart = useRef<number>(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await authedFetch(`${site.apiUrl}/lessons/${encodeURIComponent(id ?? '')}`);
        if (!res) {
          if (!cancelled) { setOffline(true); setLoading(false); }
          return;
        }
        if (!res.ok) {
          if (!cancelled) {
            setNotice(res.status === 404 ? 'That lesson does not exist.' : 'Could not load this lesson.');
            setLoading(false);
          }
          return;
        }
        const data = (await res.json()) as Rec;
        if (!cancelled) { setLesson(data); setLoading(false); }
      } catch {
        if (!cancelled) { setOffline(true); setLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => () => { countTimer.current.forEach((t) => window.clearTimeout(t)); }, []);

  const content = (lesson?.content as Rec | undefined) ?? {};
  const rawSteps = arr(content.steps).map((s) => str(s.text ?? s.label ?? s.title ?? s));
  const steps = rawSteps.filter(Boolean);
  const displaySteps = steps.length > 0
    ? steps
    : [str(lesson?.title, 'Lesson'), str(lesson?.subtitle)].filter(Boolean);
  const title = str(lesson?.title, 'Lesson');
  const subtitle = str(lesson?.subtitle);
  const xpReward = num(lesson?.xp_reward, 0);
  const durationMin = num(lesson?.duration_min, 0);
  const level = str(content.level ?? lesson?.level);
  const teaching = arr(content.teaching);
  const keyPoints = arr(content.key_points ?? content.keyPoints).map((k) => str(k.point ?? k.text ?? k)).filter(Boolean);
  const practiceTips = arr(content.practice_tips ?? content.practiceTips).map((k) => str(k.point ?? k.text ?? k)).filter(Boolean);
  const exercises = useMemo(() => parseExercises(content), [lesson]);
  const exercise = exercises[exIndex];

  const fingerMap = useMemo(() => {
    const m: Record<string, number | string> = {};
    (exercise?.expected ?? []).forEach((n) => {
      if (n.finger !== undefined && !(n.note in m)) m[n.note] = n.finger;
    });
    return m;
  }, [exercise]);

  const keyLabels = useMemo(() => {
    const inv = invertMapping(loadMapping());
    const out: Record<string, string> = {};
    for (const [note, code] of Object.entries(inv)) out[note] = codeLabel(code);
    return out;
  }, [phase, showMapping]);

  // Next expected note index = performed count clamped.
  const targetNotes = exercise && started && !result
    ? [exercise.expected[Math.min(performed.length, exercise.expected.length - 1)].note]
    : [];

  function beginExercise() {
    setPerformed([]);
    setResult(null);
    setGradeOffline(false);
    setStarted(false);
    const beats = Math.max(0, exercise?.counts_in ?? 4);
    const bpm = Math.max(40, Math.min(200, exercise?.bpm ?? 80));
    const interval = 60000 / bpm;
    setCountIn(beats);
    countTimer.current.forEach((t) => window.clearTimeout(t));
    countTimer.current = [];
    if (beats === 0) {
      attemptStart.current = performance.now();
      setStarted(true);
      return;
    }
    for (let i = 0; i < beats; i += 1) {
      countTimer.current.push(window.setTimeout(() => {
        pianoClick(i === 0);
        setCountIn(beats - i - 1);
        if (i === beats - 1) {
          attemptStart.current = performance.now();
          setStarted(true);
        }
      }, i * interval));
    }
  }

  useEffect(() => {
    if (phase === 'exercise' && exercise) beginExercise();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, exIndex]);

  const handleNote = useCallback((note: string) => {
    if (!exercise || !started || result || grading) return;
    setActiveNotes((a) => [...a.slice(-5), note]);
    window.setTimeout(() => {
      setActiveNotes((a) => a.filter((n) => n !== note));
    }, 450);
    setPerformed((prev) => {
      const at = attemptStart.current ? performance.now() - attemptStart.current : prev.length * 400;
      const next = [...prev, { note, at_ms: Math.round(at) }];
      // Auto-submit when the last expected note has been played.
      if (next.length >= exercise.expected.length) {
        window.setTimeout(() => void gradeAttempt(next), 350);
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise, started, result, grading]);

  // Computer-key input.
  useEffect(() => {
    if (phase !== 'exercise') return;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      if (isOctaveKey(e.code)) {
        if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
          const cur = loadOctaveShift();
          const next = e.code === 'ArrowLeft' ? Math.max(-2, cur - 1) : Math.min(2, cur + 1);
          saveOctaveShift(next);
        }
        return;
      }
      const map = shiftMapping(loadMapping(), loadOctaveShift());
      const note = map[e.code];
      if (note) {
        e.preventDefault();
        handleNote(note);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, handleNote, started]);

  async function gradeAttempt(perf: { note: string; at_ms: number }[]) {
    if (!exercise || grading || result) return;
    setGrading(true);
    const res = await submitAttempt({
      expected: exercise.expected.map((e) => ({ note: e.note, beats: e.beats })),
      performed: perf,
      exercise_ref: exercise.id,
      tempo_bpm: exercise.bpm,
    });
    setGrading(false);
    if (!res) {
      setGradeOffline(true);
      return;
    }
    setResult(res);
  }

  async function complete(accuracy: number) {
    setSubmitting(true);
    setNotice('');
    const durationSec = Math.max(0, Math.round((Date.now() - startedAt.current) / 1000));
    try {
      const res = await authedFetch(`${site.apiUrl}/lessons/${encodeURIComponent(id ?? '')}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accuracy, duration_sec: durationSec }),
      });
      if (!res) {
        setNotice('You are offline — this lesson was not marked complete. Reconnect to sync.');
        return;
      }
      if (!res.ok) {
        setNotice('Could not save this lesson. Please try again.');
        return;
      }
      setCompleteResult((await res.json()) as Rec);
      setPhase('done');
      window.scrollTo({ top: 0 });
    } catch {
      setNotice('You are offline — this lesson was not marked complete. Reconnect to sync.');
    } finally {
      setSubmitting(false);
    }
  }

  function goExercises() {
    try {
      const seen = localStorage.getItem(SEEN_HINT) === '1';
      if (!seen) {
        setPhase('setup');
        return;
      }
    } catch { /* ignore */ }
    if (exercises.length > 0) {
      setPhase('exercise');
    } else {
      // No scored exercises in this lesson: fall back to self-rating below.
      setPhase('exercise');
    }
  }

  const newMilestones = arr(completeResult?.new_milestones ?? completeResult?.milestones);
  const newlyUnlocked = arr(completeResult?.newly_unlocked ?? completeResult?.achievements).map((a) =>
    str(a.code ?? a.name ?? a),
  );

  async function shareLesson() {
    setSharing(true);
    setShareNote('');
    const outcome = await shareText(title, resultShareText(`the lesson “${title}”`, 100, num(completeResult?.xp_awarded ?? completeResult?.xp)));
    setShareNote(outcome === 'shared' ? 'Shared. Go brag.' : outcome === 'copied' ? 'Copied — paste it anywhere.' : 'Sharing is unavailable on this device.');
    setSharing(false);
  }

  if (loading) {
    return (
      <div className="wrap-narrow" style={{ paddingTop: 28, paddingBottom: 48 }}>
        <div className="card" role="status" aria-label="Loading lesson"><p className="muted">Tuning your lesson…</p></div>
      </div>
    );
  }
  if (offline || !lesson) {
    return (
      <div className="wrap-narrow" style={{ paddingTop: 28, paddingBottom: 48 }}>
        <p className="crumbs"><Link to="/app">Dashboard</Link> / <Link to="/app/learn">Learn</Link> / <span>{title}</span></p>
        <div className="card" role="status">
          <Mascot size={72} />
          <h1 style={{ marginTop: 10 }}>{notice || 'Lesson unavailable offline.'}</h1>
          <p className="muted">Connect to sync, then start your lesson from Learn.</p>
          <div className="btn-row" style={{ marginTop: 16 }}><Button to="/app/learn" variant="primary">Back to Learn</Button></div>
        </div>
      </div>
    );
  }

  if (phase === 'done' && completeResult) {
    return (
      <div className="wrap-narrow" style={{ paddingTop: 28, paddingBottom: 48 }}>
        <div className="card center">
          <Mascot size={96} />
          <p className="kicker" style={{ marginTop: 12 }}>Lesson complete</p>
          <h1 style={{ marginTop: 6 }}>Nice playing.</h1>
          <div className="btn-row" style={{ justifyContent: 'center', marginTop: 12 }}>
            <span className="pill xp-pill">+{num(completeResult.xp_awarded ?? completeResult.xp)} XP</span>
            {completeResult.leveled_up === true ? <span className="pill">Level {num(completeResult.new_level ?? completeResult.level)}!</span> : null}
            {Number.isFinite(num(completeResult.streak, NaN)) && num(completeResult.streak) > 0 ? (
              <span className="pill"><Flame size={14} weight="fill" aria-hidden="true" /> {num(completeResult.streak)}-day streak</span>
            ) : null}
          </div>
          {newlyUnlocked.length > 0 ? <p className="small" style={{ marginTop: 12 }}><strong>Achievement{newlyUnlocked.length > 1 ? 's' : ''}:</strong> {newlyUnlocked.join(', ')}</p> : null}
          {newMilestones.length > 0 ? (
            <div style={{ marginTop: 8 }}>{newMilestones.map((m, i) => (
              <p className="small" key={i} style={{ margin: '4px 0' }}><strong>Milestone:</strong> {str(m.name ?? m.code, 'Milestone reached')}{str(m.message) ? ` — ${str(m.message)}` : ''}</p>
            ))}</div>
          ) : null}
          <div className="btn-row" style={{ justifyContent: 'center', marginTop: 20 }}>
            <Button to="/app/learn" variant="primary">Keep learning</Button>
            <button type="button" className="btn btn-light btn-sm" onClick={() => void shareLesson()} disabled={sharing}>{sharing ? 'Sharing…' : 'Share result'}</button>
            <Button to="/app" variant="light">Dashboard</Button>
          </div>
          {shareNote ? <p role="status" className="small" style={{ marginTop: 10, fontWeight: 700 }}>{shareNote}</p> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="wrap-narrow" style={{ paddingTop: 28, paddingBottom: 48 }}>
      <p className="crumbs"><Link to="/app">Dashboard</Link> / <Link to="/app/learn">Learn</Link> / <span>{title}</span></p>

      {phase === 'steps' ? (
        <div className="card">
          <p className="kicker">Lesson · Step {Math.min(step + 1, displaySteps.length)} of {displaySteps.length}</p>
          <h1 style={{ marginTop: 8 }}>{title}</h1>
          {subtitle ? <p className="lede muted">{subtitle}</p> : null}
          {level ? <p style={{ marginTop: 8 }}><span className="pill amber">{level}</span></p> : null}
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }} aria-hidden="true">
            {displaySteps.map((_, i) => (
              <span key={i} style={{ flex: 1, height: 6, borderRadius: 999, background: i <= step ? 'var(--coral)' : 'var(--line)' }} />
            ))}
          </div>
          <div style={{ marginTop: 20, padding: '28px 22px', borderRadius: 16, background: 'var(--cloud, var(--sun-tint))', fontSize: '1.25rem', lineHeight: 1.6, textAlign: 'center' }} role="status" aria-label={`Step ${step + 1}: ${displaySteps[step]}`}>
            {displaySteps[step]}
          </div>
          <p className="small muted center" style={{ marginTop: 10 }}>
            {xpReward > 0 ? `Worth ${xpReward} XP` : ''} {durationMin > 0 ? `· ~${durationMin} min` : ''}
          </p>
          <div className="btn-row" style={{ justifyContent: 'space-between', marginTop: 20 }}>
            <button type="button" className="btn btn-light" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
              <ArrowLeft size={17} weight="bold" aria-hidden="true" /> Back
            </button>
            {step < displaySteps.length - 1 ? (
              <button type="button" className="btn btn-primary" onClick={() => setStep((s) => s + 1)}>
                Next <ArrowRight size={17} weight="bold" aria-hidden="true" />
              </button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={goExercises}>
                <PianoKeys size={17} weight="bold" aria-hidden="true" /> Start playing
              </button>
            )}
          </div>
          {teaching.length > 0 && step === displaySteps.length - 1 ? (
            <div style={{ marginTop: 18 }}>
              <h3>Why this works</h3>
              <ul className="small" style={{ paddingLeft: 18, margin: '6px 0 0' }}>
                {teaching.slice(0, 4).map((t, i) => (
                  <li key={i} style={{ marginBottom: 4 }}><strong>{str(t.point, '')}</strong>{str(t.why) ? ` — ${str(t.why)}` : ''}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {notice ? <p role="alert" className="small" style={{ color: '#b42318', fontWeight: 800, marginTop: 14 }}>{notice}</p> : null}
        </div>
      ) : null}

      {phase === 'setup' ? (
        <div className="card">
          <p className="kicker"><Keyboard size={15} aria-hidden="true" /> No piano? No problem</p>
          <h1 style={{ marginTop: 8 }}>Play with your computer keys</h1>
          <p className="lede muted">Your keyboard is a real instrument here. Home row plays C4–C5 — the glowing keys below show you where.</p>
          <div className="btn-row" style={{ marginTop: 12 }}>
            <button type="button" className="btn btn-light btn-sm" onClick={() => setShowMapping((v) => !v)} aria-expanded={showMapping}>
              {showMapping ? 'Hide mapping' : 'Show mapping'}
            </button>
            <Link className="btn btn-ghost btn-sm" to="/app/setup">Full setup guide</Link>
          </div>
          {showMapping ? <div style={{ marginTop: 12 }}><KeymapSettings /></div> : null}
          {(keyPoints.length > 0 || practiceTips.length > 0) ? (
            <div className="grid grid-2" style={{ marginTop: 16 }}>
              {keyPoints.length > 0 ? (
                <div><h3>Key points</h3><ul className="small" style={{ paddingLeft: 18 }}>{keyPoints.slice(0, 4).map((k, i) => <li key={i}>{k}</li>)}</ul></div>
              ) : null}
              {practiceTips.length > 0 ? (
                <div><h3>Practice tips</h3><ul className="small" style={{ paddingLeft: 18 }}>{practiceTips.slice(0, 4).map((k, i) => <li key={i}>{k}</li>)}</ul></div>
              ) : null}
            </div>
          ) : null}
          <div className="btn-row" style={{ justifyContent: 'space-between', marginTop: 20 }}>
            <button type="button" className="btn btn-light" onClick={() => setPhase('steps')}><ArrowLeft size={17} weight="bold" aria-hidden="true" /> Review</button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                try { localStorage.setItem(SEEN_HINT, '1'); } catch { /* ignore */ }
                setPhase('exercise');
              }}
            >
              {exercises.length > 0 ? `Play exercise 1 of ${exercises.length}` : 'I practiced it'} <ArrowRight size={17} weight="bold" aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : null}

      {phase === 'exercise' ? (
        <div style={{ display: 'grid', gap: 16 }}>
          <div className="card">
            <p className="kicker">Exercise {exercises.length > 0 ? `${Math.min(exIndex + 1, exercises.length)} of ${exercises.length}` : '· self-check'}</p>
            <h1 style={{ marginTop: 8 }}>{exercise?.title ?? title}</h1>
            {exercise ? (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                <span className="pill">{exercise.hand} hand</span>
                <span className="pill blue">{exercise.bpm} BPM</span>
                <span className="pill outline">{exercise.expected.length} notes</span>
                <Link className="pill outline" to="/app/setup" title="Keyboard & audio setup">Setup</Link>
              </div>
            ) : (
              <p className="muted">This lesson has no scored exercises yet — rate yourself honestly below.</p>
            )}

            {exercise ? (
              <>
                {/* Expected strip */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 14 }} aria-label="Notes to play">
                  {exercise.expected.map((n, i) => {
                    const done = i < performed.length;
                    const current = i === Math.min(performed.length, exercise.expected.length - 1) && !result;
                    return (
                      <span
                        key={i}
                        className="pill"
                        style={done ? { background: 'var(--plum)', color: '#fff', borderColor: 'var(--plum-deep)' } : current ? { background: 'var(--coral)', color: '#fff', borderColor: 'var(--coral)' } : undefined}
                      >
                        {n.note}{typeof n.finger !== 'undefined' ? ` · ${n.finger}` : ''}
                      </span>
                    );
                  })}
                </div>

                {countIn > 0 && !started ? (
                  <div className="card" role="status" style={{ marginTop: 14, textAlign: 'center', background: 'var(--sun-tint)' }} aria-label={`Count in ${countIn}`}>
                    <strong style={{ fontSize: '2rem' }}>{countIn}</strong>
                    <p className="small muted" style={{ margin: 0 }}>Get ready… {exercise.bpm} BPM</p>
                  </div>
                ) : null}

                <div style={{ marginTop: 14 }}>
                  <PianoKeyboard
                    onNote={(n) => handleNote(n)}
                    targetNotes={targetNotes}
                    fingerMap={fingerMap}
                    activeNotes={activeNotes}
                    keyLabels={keyLabels}
                    disabled={!started || grading || !!result}
                  />
                </div>

                <div className="btn-row" style={{ marginTop: 12 }}>
                  {!result ? (
                    <>
                      <button type="button" className="btn btn-light btn-sm" onClick={() => beginExercise()} disabled={!started && countIn > 0}>
                        Restart
                      </button>
                      <button
                        type="button"
                        className="btn btn-light btn-sm"
                        disabled={performed.length === 0 || grading}
                        onClick={() => void gradeAttempt(performed)}
                      >
                        <Stop size={15} weight="fill" aria-hidden="true" /> {grading ? 'Grading…' : `Stop & grade (${performed.length}/${exercise.expected.length})`}
                      </button>
                    </>
                  ) : null}
                </div>

                {gradeOffline ? (
                  <div className="card" role="alert" style={{ marginTop: 12, borderLeft: '5px solid var(--sun-deep)' }}>
                    <strong>Reconnect to grade &amp; save.</strong>
                    <p className="small muted" style={{ margin: '6px 0 0' }}>
                      You played {performed.length} notes — grading needs the server, and we will not guess your score. Reconnect, then press Stop &amp; grade again.
                    </p>
                    <div className="btn-row" style={{ marginTop: 10 }}>
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => void gradeAttempt(performed)} disabled={grading}>
                        {grading ? 'Grading…' : 'Retry grading'}
                      </button>
                      <button type="button" className="btn btn-light btn-sm" onClick={() => { setPerformed([]); setGradeOffline(false); beginExercise(); }}>Replay</button>
                    </div>
                  </div>
                ) : null}

                {result ? (
                  <div style={{ marginTop: 14 }} role="status" aria-label="Attempt feedback">
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span
                        aria-hidden="true"
                        style={{
                          width: 64, height: 64, borderRadius: '50%', flex: 'none',
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 900, color: '#fff',
                          background: result.passed ? 'var(--success, #1D7A45)' : 'var(--coral)',
                        }}
                      >
                        {Math.round(result.accuracy_pct)}%
                      </span>
                      <div>
                        <strong>{result.passed ? 'Passed — Melody heard that.' : 'Good rep — once more with feeling.'}</strong>
                        <p className="small muted" style={{ margin: 0 }}>
                          Score {Math.round(result.score)} · {result.correct} correct, {result.wrong} wrong, {result.missed} missed, {result.extra} extra
                          {result.timing_avg_ms !== null ? ` · avg timing ${Math.round(result.timing_avg_ms)}ms` : ''}
                          {result.xp_awarded > 0 ? ` · +${result.xp_awarded} XP` : ''}
                        </p>
                      </div>
                    </div>
                    {result.per_note.length > 0 ? (
                      <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0', display: 'grid', gap: 6 }}>
                        {result.per_note.map((p, i) => {
                          const ok = /correct|pass|good|ok/i.test(p.status) || (p.expected && p.played === p.expected && !/wrong|miss|extra/i.test(p.status));
                          return (
                            <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'baseline', border: '1px solid var(--line)', borderRadius: 10, padding: '8px 12px' }}>
                              <span aria-hidden="true">{ok ? '✅' : '❌'}</span>
                              <span className="small"><strong>{p.expected || `step ${p.index + 1}`}</strong>{p.played && p.played !== p.expected ? ` — you played ${p.played}` : ''}</span>
                              {p.timing_ms !== null ? <span className="small muted">{p.timing_ms >= 0 ? '+' : ''}{Math.round(p.timing_ms)}ms</span> : null}
                              {p.feedback ? <span className="small muted">{p.feedback}</span> : null}
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}
                    <div className="btn-row" style={{ marginTop: 14 }}>
                      <button type="button" className="btn btn-light" onClick={() => { setPerformed([]); setResult(null); setGradeOffline(false); beginExercise(); }}>
                        Retry exercise
                      </button>
                      {exIndex < exercises.length - 1 ? (
                        <button type="button" className="btn btn-primary" onClick={() => { setExIndex((i) => i + 1); setPerformed([]); setResult(null); setGradeOffline(false); }}>
                          Next exercise <ArrowRight size={17} weight="bold" aria-hidden="true" />
                        </button>
                      ) : (
                        <button type="button" className="btn btn-primary" onClick={() => void complete(Math.round(result.accuracy_pct))} disabled={submitting}>
                          <Check size={17} weight="bold" aria-hidden="true" /> {submitting ? 'Saving…' : `Complete lesson (${Math.round(result.accuracy_pct)}%)`}
                        </button>
                      )}
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              <div style={{ marginTop: 16 }}>
                <h2 style={{ fontSize: '1.1rem', margin: '0 0 4px' }}>How did it go?</h2>
                <p className="small muted" style={{ marginTop: 0 }}>Honest answers tune your path. Melody never judges.</p>
                <div className="grid grid-2" style={{ marginTop: 12 }}>
                  {[
                    { label: 'Nailed it', hint: 'Clean and confident', accuracy: 100 },
                    { label: 'Pretty good', hint: 'A few wobbles', accuracy: 80 },
                    { label: 'Rough', hint: 'I showed up — that counts', accuracy: 60 },
                  ].map((r) => (
                    <button key={r.label} type="button" className="chip-btn" style={{ padding: 16, textAlign: 'left', borderRadius: 14 }} disabled={submitting} onClick={() => void complete(r.accuracy)}>
                      <strong>{r.label}</strong><br /><span className="small muted">{r.hint}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {exercise && exercises.length > 1 ? (
            <div className="btn-row">
              {exercises.map((e, i) => (
                <button
                  key={e.id}
                  type="button"
                  className="chip-btn"
                  aria-pressed={i === exIndex}
                  onClick={() => { setExIndex(i); setPerformed([]); setResult(null); setGradeOffline(false); }}
                >
                  {i + 1}. {e.title}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {notice ? <p role="alert" className="small" style={{ color: '#b42318', fontWeight: 800, marginTop: 14 }}>{notice}</p> : null}
    </div>
  );
}

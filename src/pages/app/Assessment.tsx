import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Ear } from '@phosphor-icons/react';
import Button from '../../components/Button';
import Mascot from '../../components/Mascot';
import { site } from '../../config/env';
import { authedFetch } from '../../lib/session';
import { playChordName, playNoteName, playTone } from '../../lib/music';

const NOTE_TARGETS = ['C', 'G'];
const CHORD_OPTIONS = ['C', 'F', 'G'];
const RHYTHM_TAPS = 4;
const BEAT_MS = 60000 / 90;

function pick<T>(xs: T[]): T {
  return xs[Math.floor(Math.random() * xs.length)];
}

/**
 * 5-tap skill assessment: 2 note taps + 2 rhythm taps + 1 chord pick.
 * Recommends daily minutes + a starting skill, PATCHes daily_goal_minutes
 * best-effort. Pure client-side — always completable offline.
 */
export default function Assessment() {
  const [step, setStep] = useState(0);
  const [hits, setHits] = useState(0);
  const [noteTarget, setNoteTarget] = useState(() => pick(NOTE_TARGETS));
  const [chordTarget] = useState(() => pick(CHORD_OPTIONS));
  const [beatZero, setBeatZero] = useState(0);
  const [rhythmHits, setRhythmHits] = useState(0);
  const [rhythmCount, setRhythmCount] = useState(0);
  const [saved, setSaved] = useState<boolean | null>(null);
  const timers = useRef<number[]>([]);

  const done = step >= 5;

  function noteTap(n: string) {
    if (done || step > 1) return;
    if (n === NOTE_TARGETS[step]) {
      setHits((h) => h + 1);
      playTone(660, 0.25);
    } else {
      playTone(160, 0.3);
    }
    setNoteTarget(pick(NOTE_TARGETS));
    setStep((s) => s + 1);
  }

  function startRhythm() {
    const t0 = performance.now() + 1200;
    setBeatZero(t0);
    for (let i = 0; i < RHYTHM_TAPS; i += 1) {
      timers.current.push(
        window.setTimeout(() => playTone(880, 0.09), Math.max(0, t0 - performance.now() + i * BEAT_MS)),
      );
    }
  }

  function rhythmTap() {
    if (done || (step !== 2 && step !== 3) || beatZero === 0) return;
    const rel = performance.now() - beatZero;
    if (rel < -BEAT_MS / 2) return;
    const err = Math.min(rel % BEAT_MS, BEAT_MS - (rel % BEAT_MS));
    const good = err < 150;
    if (good) {
      setHits((h) => h + (step === 2 ? 1 : 0));
      setRhythmHits((h) => h + 1);
      playTone(660, 0.12);
    } else {
      playTone(160, 0.15);
    }
    const count = rhythmCount + 1;
    setRhythmCount(count);
    if (step === 2) {
      if (count >= 2) {
        setRhythmCount(0);
        setBeatZero(0);
        setStep(3);
      }
    } else if (count >= 2) {
      timers.current.forEach((t) => window.clearTimeout(t));
      persistGoal();
      setStep(5);
    }
  }

  function chordPick(c: string) {
    if (done || step !== 4) return;
    if (c === chordTarget) {
      setHits((h) => h + 1);
      playTone(660, 0.25);
    } else {
      playTone(160, 0.3);
    }
    persistGoal();
    setStep(5);
  }

  async function persistGoal() {
    const minutes = hits >= 4 ? 20 : hits >= 2 ? 10 : 5;
    try {
      const res = await authedFetch(`${site.apiUrl}/users/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daily_goal_minutes: minutes }),
      });
      setSaved(!!res?.ok);
    } catch {
      setSaved(false);
    }
  }

  const minutes = hits >= 4 ? 20 : hits >= 2 ? 10 : 5;
  const verdict =
    hits >= 4
      ? { title: 'Natural!', skill: 'First Melody', body: 'Your ears are sharp. We will start you at First Melody.' }
      : hits >= 2
        ? { title: 'Great start!', skill: 'Rhythm + Melody basics', body: 'Solid instincts. Rhythm and melody basics it is.' }
        : { title: 'Fresh ears — perfect!', skill: 'The very beginning', body: 'Everyone starts somewhere, and the fun way is the best way.' };

  return (
    <div className="wrap-narrow" style={{ paddingTop: 28, paddingBottom: 48 }}>
      <p className="crumbs">
        <Link to="/app">Dashboard</Link> / <span>Assessment</span>
      </p>
      <p className="kicker">Setup · 30 seconds</p>
      <h1 style={{ marginTop: 6 }}>Show Melody your ears.</h1>
      {!done ? (
        <p className="lede">Five quick taps so Melody knows where to start you. Tap {Math.min(step + 1, 5)} of 5 · {hits} correct so far.</p>
      ) : null}

      <div className="card" style={{ marginTop: 18 }}>
        {!done ? (
          <>
            <div className="stepper" aria-hidden="true">
              {[0, 1, 2, 3, 4].map((i) => (
                <span key={i} className={i <= step ? 'on' : ''} />
              ))}
            </div>
            {step <= 1 ? (
              <div className="center">
                <p style={{ fontWeight: 900 }}>Tap the {NOTE_TARGETS[step]} key ({step + 1} of 2 note taps)</p>
                <div className="btn-row" style={{ justifyContent: 'center', marginTop: 8 }}>
                  <button type="button" className="btn btn-sun btn-sm" onClick={() => playNoteName(noteTarget, 0.6)}>
                    <Ear size={15} weight="fill" aria-hidden="true" /> Hear it
                  </button>
                </div>
                <div className="demo-keys" style={{ marginTop: 14 }} role="group" aria-label="Piano keys">
                  {['C', 'D', 'E', 'F', 'G', 'A', 'B'].map((n) => (
                    <button key={n} type="button" onClick={() => noteTap(n)} aria-label={`Play ${n}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            {step === 2 || step === 3 ? (
              <div className="center">
                <p style={{ fontWeight: 900 }}>
                  {step === 2 ? 'Rhythm tap 1 of 2' : 'Rhythm tap 2 of 2'} — tap on the beep ({rhythmHits} on-beat so far)
                </p>
                {beatZero === 0 ? (
                  <button type="button" className="btn btn-primary btn-sm" onClick={startRhythm}>Start the beat</button>
                ) : (
                  <button type="button" className="btn btn-coral btn-lg" style={{ width: '100%', minHeight: 88 }} onClick={rhythmTap}>
                    TAP
                  </button>
                )}
              </div>
            ) : null}
            {step === 4 ? (
              <div className="center">
                <p style={{ fontWeight: 900 }}>Last one — which chord is this?</p>
                <div className="btn-row" style={{ justifyContent: 'center', marginTop: 8 }}>
                  <button type="button" className="btn btn-sun btn-sm" onClick={() => playChordName(chordTarget, 1.4)}>
                    <Ear size={15} weight="fill" aria-hidden="true" /> Hear the chord
                  </button>
                </div>
                <div className="filter-row" style={{ justifyContent: 'center', marginTop: 14 }}>
                  {CHORD_OPTIONS.map((c) => (
                    <button key={c} type="button" className="chip-btn" onClick={() => chordPick(c)}>{c}</button>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <div className="center">
            <Mascot size={96} />
            <h2 style={{ marginTop: 12 }}>{verdict.title}</h2>
            <p className="muted">{verdict.body}</p>
            <div className="btn-row" style={{ justifyContent: 'center', marginTop: 12 }}>
              <span className="pill xp-pill">{minutes} min/day recommended</span>
              <span className="pill">Start: {verdict.skill}</span>
            </div>
            {saved === false ? (
              <p className="small muted" style={{ marginTop: 8 }}>
                Could not save that goal to your account (offline?) — your recommendation above still stands.
              </p>
            ) : null}
            <div className="btn-row" style={{ justifyContent: 'center', marginTop: 20 }}>
              <Button to="/app/learn" variant="primary">
                Start learning <ArrowRight size={16} weight="bold" aria-hidden="true" />
              </Button>
              <Button to="/app" variant="light">Dashboard</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

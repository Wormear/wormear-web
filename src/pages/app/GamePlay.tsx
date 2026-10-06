import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Ear, HandTap, Play } from '@phosphor-icons/react';
import Button from '../../components/Button';
import Mascot from '../../components/Mascot';
import { playChordName, playNoteName, playTone } from '../../lib/music';
import { finishPracticeSession, startPracticeSession, type PracticeKind } from '../../lib/practice';
import { resultShareText, shareText } from '../../lib/share';

type GameKey = 'note-rush' | 'rhythm' | 'chord';

const META: Record<GameKey, { title: string; kind: PracticeKind; blurb: string }> = {
  'note-rush': { title: 'Note Rush', kind: 'note_rush', blurb: 'Hear a note, tap the matching piano key. 10 rounds.' },
  rhythm: { title: 'Rhythm Tap', kind: 'rhythm_tap', blurb: 'Tap exactly on the 90bpm beat. 8 taps.' },
  chord: { title: 'Chord Challenge', kind: 'chord_challenge', blurb: 'Hear a triad, name that chord. 6 rounds.' },
};

function isGameKey(k: string | undefined): k is GameKey {
  return k === 'note-rush' || k === 'rhythm' || k === 'chord';
}

const WHITE_KEYS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const CHORDS = ['C', 'F', 'G', 'Am'];
const NOTE_ROUNDS = 10;
const RHYTHM_TAPS = 8;
const CHORD_ROUNDS = 6;
const BPM = 90;
const BEAT_MS = 60000 / BPM;

function pick<T>(xs: T[]): T {
  return xs[Math.floor(Math.random() * xs.length)];
}

/**
 * Playable practice games with real scoring + session start/finish → XP.
 * Instrument fixed to piano. Offline: fully playable locally; the
 * completion post shows a "not saved" notice instead of failing.
 */
export default function GamePlay() {
  const { kind } = useParams<{ kind: string }>();
  if (!isGameKey(kind)) {
    return (
      <div className="wrap-narrow" style={{ paddingTop: 28, paddingBottom: 48 }}>
        <div className="card" role="status">
          <h1>Unknown game.</h1>
          <p className="muted">Melody only knows three games so far.</p>
          <div className="btn-row" style={{ marginTop: 12 }}>
            <Button to="/app/practice" variant="primary" size="sm">Back to practice</Button>
          </div>
        </div>
      </div>
    );
  }
  return <Game key={kind} game={kind} meta={META[kind]} />;
}

function Game({ game, meta }: { game: GameKey; meta: { title: string; kind: PracticeKind; blurb: string } }) {
  const [phase, setPhase] = useState<'intro' | 'play' | 'done'>('intro');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [saved, setSaved] = useState<boolean | null>(null);
  const [xp, setXp] = useState(0);
  const [shareNote, setShareNote] = useState('');
  const [sharing, setSharing] = useState(false);
  const startedAt = useRef(0);

  // Per-game state (only the active game's slice is used).
  const [target, setTarget] = useState(() => pick(WHITE_KEYS));
  const [round, setRound] = useState(1);
  const [hits, setHits] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [score, setScore] = useState(0);
  const [taps, setTaps] = useState<number[]>([]);
  const [beatZero, setBeatZero] = useState(0);
  const [chordIdx, setChordIdx] = useState(0);
  const [chordTarget, setChordTarget] = useState(() => pick(CHORDS));
  const beatTimers = useRef<number[]>([]);

  const noteAccuracy = round <= 1 ? 1 : hits / (round - 1);
  const rhythmAccuracy = taps.length === 0 ? 1 : taps.filter((e) => e < 120).length / taps.length;
  const chordAccuracy = chordIdx === 0 ? 1 : hits / chordIdx;

  useEffect(() => {
    return () => {
      beatTimers.current.forEach((t) => window.clearTimeout(t));
      beatTimers.current = [];
    };
  }, []);

  async function begin() {
    startedAt.current = Date.now();
    setPhase('play');
    const id = await startPracticeSession(meta.kind);
    setSessionId(id);
  }

  async function finish(accuracy: number, localXp: number) {
    const durationSec = Math.max(1, Math.round((Date.now() - startedAt.current) / 1000));
    beatTimers.current.forEach((t) => window.clearTimeout(t));
    beatTimers.current = [];
    if (!sessionId) {
      setXp(localXp);
      setSaved(false);
      setPhase('done');
      window.scrollTo({ top: 0 });
      return;
    }
    const earned = await finishPracticeSession(sessionId, accuracy, durationSec);
    setXp(earned ?? localXp);
    setSaved(earned !== null);
    setPhase('done');
    window.scrollTo({ top: 0 });
  }

  async function onShare(accuracy: number) {
    setSharing(true);
    setShareNote('');
    const outcome = await shareText(meta.title, resultShareText(meta.title, accuracy * 100, xp));
    setShareNote(outcome === 'shared' ? 'Shared. Go brag.' : outcome === 'copied' ? 'Copied — paste it anywhere.' : 'Sharing is unavailable on this device.');
    setSharing(false);
  }

  // ---- Note Rush ----
  function noteTap(n: string) {
    if (phase !== 'play') return;
    const correct = n === target;
    if (correct) {
      const c = combo + 1;
      setCombo(c);
      setMaxCombo((m) => Math.max(m, c));
      setScore((s) => s + 10 + c * 2);
      setHits((h) => h + 1);
      playTone(660, 0.25);
    } else {
      setCombo(0);
      playTone(160, 0.3);
    }
    if (round >= NOTE_ROUNDS) {
      const acc = (hits + (correct ? 1 : 0)) / NOTE_ROUNDS;
      const localXp = 20 + maxCombo * 2 + Math.round(acc * 30);
      void finish(acc, localXp);
    } else {
      setRound((r) => r + 1);
      setTarget(pick(WHITE_KEYS));
    }
  }

  // ---- Rhythm Tap ----
  function startBeats() {
    const t0 = performance.now() + 1200;
    setBeatZero(t0);
    for (let i = 0; i < RHYTHM_TAPS; i += 1) {
      const delay = t0 - performance.now() + i * BEAT_MS;
      beatTimers.current.push(
        window.setTimeout(() => playTone(i === 0 ? 990 : 880, 0.09), Math.max(0, delay)),
      );
    }
  }

  function rhythmTap() {
    if (phase !== 'play' || beatZero === 0) return;
    const now = performance.now();
    if (now < beatZero - BEAT_MS / 2) return; // too early — ignore, not a miss
    const rel = now - beatZero;
    const err = Math.min(rel % BEAT_MS, BEAT_MS - (rel % BEAT_MS));
    const good = err < 120;
    if (good) playTone(660, 0.12);
    else playTone(160, 0.15);
    const next = [...taps, err];
    setTaps(next);
    if (good) setScore((s) => s + Math.max(5, 20 - Math.round(err / 10)));
    if (next.length >= RHYTHM_TAPS) {
      const acc = next.filter((e) => e < 120).length / next.length;
      void finish(acc, 20 + Math.round(acc * 40));
    }
  }

  // ---- Chord Challenge ----
  function chordPick(c: string) {
    if (phase !== 'play') return;
    const correct = c === chordTarget;
    if (correct) {
      setScore((s) => s + 30);
      setHits((h) => h + 1);
      playTone(660, 0.25);
    } else {
      playTone(160, 0.3);
    }
    if (chordIdx + 1 >= CHORD_ROUNDS) {
      const acc = (hits + (correct ? 1 : 0)) / CHORD_ROUNDS;
      setChordIdx(CHORD_ROUNDS);
      void finish(acc, 30 + (hits + (correct ? 1 : 0)) * 20);
    } else {
      setChordIdx((i) => i + 1);
      setChordTarget(pick(CHORDS));
    }
  }

  const accuracy = game === 'note-rush' ? noteAccuracy : game === 'rhythm' ? rhythmAccuracy : chordAccuracy;
  const best =
    game === 'note-rush'
      ? `Best combo x${maxCombo}`
      : game === 'rhythm'
        ? taps.length > 0
          ? `Avg error ${Math.round(taps.reduce((a, b) => a + b, 0) / taps.length)}ms`
          : 'No taps yet'
        : `${hits}/${Math.max(1, chordIdx)} chords clean`;

  return (
    <div className="wrap-narrow" style={{ paddingTop: 28, paddingBottom: 48 }}>
      <p className="crumbs">
        <Link to="/app">Dashboard</Link> / <Link to="/app/practice">Practice</Link> / <span>{meta.title}</span>
      </p>

      {phase === 'intro' ? (
        <div className="card center">
          <Mascot size={96} />
          <p className="kicker" style={{ marginTop: 12 }}>Practice game · piano</p>
          <h1 style={{ marginTop: 6 }}>{meta.title}</h1>
          <p className="lede" style={{ margin: '0 auto' }}>{meta.blurb} Piano sound is synthesized on-device — no downloads, works offline.</p>
          <div className="btn-row" style={{ justifyContent: 'center', marginTop: 20 }}>
            <button type="button" className="btn btn-primary" onClick={() => void begin()}>
              <Play size={17} weight="fill" aria-hidden="true" /> Start
            </button>
            <Button to="/app/practice" variant="light">All games</Button>
          </div>
        </div>
      ) : phase === 'play' ? (
        <div className="card">
          <p className="kicker">{meta.title} · Score {score} · Combo x{game === 'chord' ? hits : combo}</p>
          <div className="bar" role="progressbar" aria-valuenow={Math.round(accuracy * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Accuracy" style={{ marginTop: 10 }}>
            <span style={{ width: `${Math.round(accuracy * 100)}%` }} />
          </div>

          {game === 'note-rush' ? (
            <div style={{ marginTop: 18 }}>
              <p className="center" style={{ fontWeight: 900 }}>Round {Math.min(round, NOTE_ROUNDS)}/{NOTE_ROUNDS} · {hits} correct</p>
              <div className="btn-row" style={{ justifyContent: 'center', marginTop: 8 }}>
                <button type="button" className="btn btn-sun btn-sm" onClick={() => playNoteName(target, 0.6)}>
                  <Ear size={15} weight="fill" aria-hidden="true" /> Hear it
                </button>
              </div>
              <div className="demo-keys" style={{ marginTop: 16 }} role="group" aria-label="Piano keys C to B">
                {WHITE_KEYS.map((n) => (
                  <button key={n} type="button" onClick={() => noteTap(n)} aria-label={`Play ${n}`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {game === 'rhythm' ? (
            <div style={{ marginTop: 18 }} className="center">
              <p style={{ fontWeight: 900 }}>Tap {Math.min(taps.length + 1, RHYTHM_TAPS)}/{RHYTHM_TAPS} — on the beep</p>
              {beatZero === 0 ? (
                <button type="button" className="btn btn-primary" onClick={startBeats}>
                  <Play size={17} weight="fill" aria-hidden="true" /> Start the beat
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-coral btn-lg"
                  style={{ width: '100%', minHeight: 96, fontSize: '1.3rem' }}
                  onClick={rhythmTap}
                >
                  <HandTap size={24} aria-hidden="true" /> TAP
                </button>
              )}
              <p className="small muted" style={{ marginTop: 10 }}>Within 120ms of the beat counts as on-beat.</p>
            </div>
          ) : null}

          {game === 'chord' ? (
            <div style={{ marginTop: 18 }} className="center">
              <p style={{ fontWeight: 900 }}>Chord {Math.min(chordIdx + 1, CHORD_ROUNDS)}/{CHORD_ROUNDS} · {hits} correct</p>
              <div className="btn-row" style={{ justifyContent: 'center', marginTop: 8 }}>
                <button type="button" className="btn btn-sun btn-sm" onClick={() => playChordName(chordTarget, 1.4)}>
                  <Ear size={15} weight="fill" aria-hidden="true" /> Hear the chord
                </button>
              </div>
              <div className="filter-row" style={{ justifyContent: 'center', marginTop: 14 }}>
                {CHORDS.map((c) => (
                  <button key={c} type="button" className="chip-btn" style={{ fontSize: '1.1rem', padding: '14px 26px' }} onClick={() => chordPick(c)}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="card center">
          <Mascot size={96} />
          <p className="kicker" style={{ marginTop: 12 }}>{meta.title} — done!</p>
          <h1 style={{ marginTop: 6 }}>
            {accuracy >= 0.8 ? 'Superstar! Encore!' : accuracy >= 0.5 ? 'Great groove!' : 'Good reps — again!'}
          </h1>
          <div className="btn-row" style={{ justifyContent: 'center', marginTop: 12 }}>
            <span className="pill xp-pill">+{xp} XP</span>
            <span className="pill green">{Math.round(accuracy * 100)}% accuracy</span>
            <span className="pill">{best}</span>
          </div>
          {saved === false ? (
            <p role="status" className="small muted" style={{ marginTop: 12 }}>
              You are offline — this score was not saved to your account. Reconnect and play again to bank the XP.
            </p>
          ) : null}
          <div className="btn-row" style={{ justifyContent: 'center', marginTop: 20 }}>
            <button type="button" className="btn btn-light btn-sm" onClick={() => void onShare(accuracy)} disabled={sharing}>
              {sharing ? 'Sharing…' : 'Share result'}
            </button>
            <Button to="/app/practice" variant="primary" size="sm">Practice more</Button>
            <Button to="/app" variant="ghost" size="sm">Dashboard</Button>
          </div>
          {shareNote ? (
            <p role="status" className="small" style={{ marginTop: 10, fontWeight: 700 }}>{shareNote}</p>
          ) : null}
        </div>
      )}
    </div>
  );
}

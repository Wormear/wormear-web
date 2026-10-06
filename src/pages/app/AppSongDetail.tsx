import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, Play, Stop } from '@phosphor-icons/react';
import Button from '../../components/Button';
import SectionPlayer from '../../components/SectionPlayer';
import PianoKeyboard from '../../components/PianoKeyboard';
import { site } from '../../config/env';
import { authedFetch } from '../../lib/session';
import { useLiveTick } from '../../lib/live';
import { resultShareText, shareText } from '../../lib/share';
import { invertMapping, isOctaveKey, loadMapping, loadOctaveShift, saveOctaveShift, shiftMapping, codeLabel } from '../../lib/keymap';
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

type Mode = 'Learn' | 'Practice' | 'Perform';
type Hand = 'right' | 'left' | 'both';

const MODE_TEMPO: Record<Mode, number> = { Learn: 50, Practice: 75, Perform: 100 };

function sectionNotes(sec: Rec): string[] {
  if (Array.isArray(sec.practice_notes)) {
    return sec.practice_notes
      .map((n) => (typeof n === 'string' ? n : str((n as Rec).note ?? (n as Rec).name ?? (n as Rec).pitch)))
      .filter(Boolean);
  }
  const raw = Array.isArray(sec.notes) ? sec.notes : [];
  return raw
    .map((n) => (typeof n === 'string' ? n : str((n as Rec).note ?? (n as Rec).name ?? (n as Rec).pitch)))
    .filter(Boolean);
}

/**
 * Per-section practice: Learn (slow follow-along, wait-for-correct-key, no
 * score) / Practice (75% + metronome, scored) / Perform (100% both hands,
 * scored). Wrong keys in Learn give a gentle shake + hint; scoring always
 * goes through POST /practice/attempts with honest offline copy.
 */
function SectionPractice({
  songId,
  sectionId,
  label,
  notes,
  bpm,
  hand,
  onDone,
}: {
  songId: string;
  sectionId: string;
  label: string;
  notes: string[];
  bpm: number;
  hand: Hand;
  onDone: () => void;
}) {
  const [mode, setMode] = useState<Mode>('Learn');
  const [followIndex, setFollowIndex] = useState(0);
  const [shake, setShake] = useState(0);
  const [hint, setHint] = useState('');
  const [performed, setPerformed] = useState<{ note: string; at_ms: number }[]>([]);
  const [active, setActive] = useState<string[]>([]);
  const [grading, setGrading] = useState(false);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [gradeOffline, setGradeOffline] = useState(false);
  const startRef = useRef(0);

  const tempoPct = MODE_TEMPO[mode];
  const effectiveBpm = Math.max(30, Math.round((bpm * tempoPct) / 100));
  const scored = mode !== 'Learn';

  const keyLabels = (() => {
    const inv = invertMapping(loadMapping());
    const out: Record<string, string> = {};
    for (const [note, code] of Object.entries(inv)) out[note] = codeLabel(code);
    return out;
  })();

  useEffect(() => {
    setFollowIndex(0);
    setPerformed([]);
    setResult(null);
    setGradeOffline(false);
    setHint('');
    startRef.current = 0;
  }, [mode, notes.join('|')]);

  function flash(note: string) {
    setActive((a) => [...a.slice(-5), note]);
    window.setTimeout(() => setActive((a) => a.filter((n) => n !== note)), 450);
  }

  function play(note: string) {
    flash(note);
    const at = startRef.current ? performance.now() - startRef.current : performed.length * 400;
    if (!startRef.current) startRef.current = performance.now();

    if (!scored) {
      // Learn mode: wait for the correct key.
      const expected = notes[followIndex];
      if (!expected) return;
      if (note === expected) {
        setFollowIndex((i) => i + 1);
        setHint('');
      } else {
        setShake((s) => s + 1);
        setHint(`Almost — listen for ${expected}, then find it. You played ${note}.`);
      }
      return;
    }
    setPerformed((prev) => {
      const next = [...prev, { note, at_ms: Math.round(at) }];
      if (next.length >= notes.length) {
        window.setTimeout(() => void grade(next), 350);
      }
      return next;
    });
  }

  // Computer-key input (letters + octave shift).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (isOctaveKey(e.code)) {
        if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
          const cur = loadOctaveShift();
          saveOctaveShift(e.code === 'ArrowLeft' ? Math.max(-2, cur - 1) : Math.min(2, cur + 1));
        }
        return;
      }
      const note = shiftMapping(loadMapping(), loadOctaveShift())[e.code];
      if (note) {
        e.preventDefault();
        play(note);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [followIndex, performed.length, scored, notes.join('|')]);

  async function grade(perf: { note: string; at_ms: number }[]) {
    if (grading || result) return;
    setGrading(true);
    const res = await submitAttempt({
      expected: notes.map((n) => ({ note: n, beats: 1 })),
      performed: perf,
      exercise_ref: `${songId}:${sectionId}:${mode.toLowerCase()}`,
      tempo_bpm: effectiveBpm,
    });
    setGrading(false);
    if (!res) {
      setGradeOffline(true);
      return;
    }
    setResult(res);
  }

  const learnTarget = !scored && followIndex < notes.length ? [notes[followIndex]] : [];
  const practiceTarget = scored && !result && performed.length < notes.length ? [notes[performed.length]] : [];
  const learnDone = !scored && notes.length > 0 && followIndex >= notes.length;

  return (
    <div style={{ marginTop: 10 }}>
      <div className="filter-row" role="tablist" aria-label={`${label} practice mode`}>
        {(['Learn', 'Practice', 'Perform'] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            className="chip-btn"
            aria-pressed={mode === m}
            onClick={() => setMode(m)}
            title={m === 'Learn' ? 'Slow follow-along, no score' : m === 'Practice' ? '75% tempo, scored' : 'Full tempo both hands, scored'}
          >
            {m} · {MODE_TEMPO[m]}%
          </button>
        ))}
        <span className="pill blue">{effectiveBpm} BPM · {hand} hand</span>
      </div>

      {mode === 'Learn' ? (
        <p className="small muted" style={{ margin: '8px 0 0' }}>
          Follow-along: play the glowing note to advance. No score — just ears and fingers.
        </p>
      ) : (
        <p className="small muted" style={{ margin: '8px 0 0' }}>
          {mode === 'Practice' ? 'Practice tempo with a steady pulse — Stop & grade when you finish the line.' : 'Showtime: full tempo, both hands. Scored like a recital.'}
        </p>
      )}

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }} aria-label={`${label} notes`}>
        {notes.map((n, i) => {
          const done = scored ? i < performed.length : i < followIndex;
          const current = scored
            ? i === performed.length && !result
            : i === followIndex && !learnDone;
          return (
            <span
              key={i}
              className="pill"
              style={done ? { background: 'var(--plum)', color: '#fff', borderColor: 'var(--plum-deep)' } : current ? { background: 'var(--coral)', color: '#fff', borderColor: 'var(--coral)' } : undefined}
            >
              {n}
            </span>
          );
        })}
      </div>

      <div style={shake ? { animation: 'none' } : undefined} key={shake} aria-live="polite">
        {hint ? <p className="small" role="status" style={{ fontWeight: 800, margin: '8px 0 0' }}>{hint}</p> : null}
      </div>

      <div style={{ marginTop: 10 }}>
        <PianoKeyboard
          onNote={play}
          targetNotes={[...learnTarget, ...practiceTarget]}
          activeNotes={active}
          keyLabels={keyLabels}
          disabled={grading || !!result || learnDone}
          compact
        />
      </div>

      <div className="btn-row" style={{ marginTop: 10 }}>
        <SectionPlayer notes={notes} bpm={effectiveBpm} chord="" label={`${label} ${mode} demo`} />
        {scored ? (
          <>
            <button type="button" className="btn btn-light btn-sm" onClick={() => { setPerformed([]); setResult(null); setGradeOffline(false); startRef.current = 0; }}>
              Restart
            </button>
            {!result ? (
              <button type="button" className="btn btn-light btn-sm" disabled={performed.length === 0 || grading} onClick={() => void grade(performed)}>
                <Stop size={15} weight="fill" aria-hidden="true" /> {grading ? 'Grading…' : `Stop & grade (${performed.length}/${notes.length})`}
              </button>
            ) : null}
          </>
        ) : learnDone ? (
          <span className="pill green" role="status">Line learned — try Practice mode.</span>
        ) : (
          <button type="button" className="btn btn-light btn-sm" onClick={() => { setFollowIndex(0); setHint(''); }}>
            Restart line
          </button>
        )}
        <Button variant="light" size="sm" onClick={onDone}>Mark section complete</Button>
      </div>

      {gradeOffline ? (
        <p role="alert" className="small" style={{ color: '#b42318', fontWeight: 800 }}>
          Reconnect to grade &amp; save — scoring needs the server.{' '}
          <button type="button" className="btn btn-primary btn-sm" onClick={() => void grade(performed)} disabled={grading}>
            {grading ? 'Grading…' : 'Retry grading'}
          </button>
        </p>
      ) : null}

      {result ? (
        <div style={{ marginTop: 10 }} role="status" aria-label={`${label} attempt result`}>
          <span className="pill" style={result.passed ? { background: '#DFF5E6', color: '#146c39', borderColor: '#A9DFC0' } : undefined}>
            {Math.round(result.accuracy_pct)}% · {result.correct}✓ {result.wrong}✗ {result.missed} missed
            {result.timing_avg_ms !== null ? ` · ${Math.round(result.timing_avg_ms)}ms avg` : ''}
            {result.xp_awarded > 0 ? ` · +${result.xp_awarded} XP` : ''}
          </span>
          {result.per_note.slice(0, 8).map((p, i) => (
            <p className="small muted" key={i} style={{ margin: '4px 0 0' }}>
              {p.expected}: {p.played === p.expected ? '✅' : `❌ (played ${p.played || '—'})`}
              {p.timing_ms !== null ? ` ${p.timing_ms >= 0 ? '+' : ''}${Math.round(p.timing_ms)}ms` : ''}
              {p.feedback ? ` — ${p.feedback}` : ''}
            </p>
          ))}
          <div className="btn-row" style={{ marginTop: 8 }}>
            <button type="button" className="btn btn-light btn-sm" onClick={() => { setPerformed([]); setResult(null); setGradeOffline(false); startRef.current = 0; }}>
              Retry {mode.toLowerCase()}
            </button>
          </div>
        </div>
      ) : null}

      {learnDone ? (
        <div className="btn-row" style={{ marginTop: 8 }}>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setMode('Practice')}>
            <Play size={15} weight="fill" aria-hidden="true" /> Step up to Practice
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function AppSongDetail() {
  const { id } = useParams<{ id: string }>();
  const tick = useLiveTick();
  const reqId = useRef(0);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [song, setSong] = useState<Rec | null>(null);
  const [completing, setCompleting] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [sharing, setSharing] = useState(false);
  const [shareNote, setShareNote] = useState('');
  const [hand, setHand] = useState<Hand>('right');
  const [tempoPct, setTempoPct] = useState(75);

  const fetchSong = useCallback(async () => {
    if (!id) return;
    const my = reqId.current + 1;
    reqId.current = my;
    const stale = () => my !== reqId.current;
    setLoading(true);
    setNotice('');
    try {
      const res = await authedFetch(
        `${site.apiUrl}/songs/${encodeURIComponent(id)}?hand=${hand}&tempo_pct=${tempoPct}`,
      );
      if (stale()) return;
      if (!res || !res.ok) {
        // Fall back to the unfiltered endpoint so older backends still work.
        try {
          const plain = await authedFetch(`${site.apiUrl}/songs/${encodeURIComponent(id)}`);
          if (stale()) return;
          if (!plain || !plain.ok) {
            setOffline(!plain);
            setSong(null);
            setLoading(false);
            return;
          }
          const data = (await plain.json()) as Rec;
          if (stale()) return;
          setSong(typeof data.song === 'object' && data.song !== null ? (data.song as Rec) : data);
          setOffline(false);
          setLoading(false);
          return;
        } catch {
          if (stale()) return;
          setOffline(!res);
          setSong(null);
          setLoading(false);
          return;
        }
      }
      const data = (await res.json()) as Rec;
      if (stale()) return;
      const rec = (typeof data.song === 'object' && data.song !== null ? (data.song as Rec) : data);
      setSong(rec);
      setOffline(false);
      setLoading(false);
    } catch {
      if (stale()) return;
      setOffline(true);
      setSong(null);
      setLoading(false);
    }
  }, [id, tick, hand, tempoPct]);

  useEffect(() => {
    void fetchSong();
  }, [fetchSong]);

  const completeSection = async (sectionId: string) => {
    if (!id || !sectionId) return;
    setCompleting(sectionId);
    setNotice('');
    try {
      const res = await authedFetch(
        `${site.apiUrl}/songs/${encodeURIComponent(id)}/sections/${encodeURIComponent(sectionId)}/complete`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) },
      );
      if (!res) {
        setNotice('You are offline — this section was not marked complete. Reconnect to sync.');
        setCompleting(null);
        return;
      }
      if (!res.ok) {
        setNotice('Could not save that yet. Try again in a moment.');
        setCompleting(null);
        return;
      }
      await fetchSong();
      setNotice('Nice — section complete. Melody heard that.');
    } catch {
      setNotice('You are offline — this section was not marked complete. Reconnect to sync.');
    } finally {
      setCompleting(null);
    }
  };

  const title = song ? str(song.title ?? song.name, 'Song') : 'Song';

  async function shareSong() {
    const acc = num(song?.best_accuracy ?? song?.accuracy, NaN);
    setSharing(true);
    setShareNote('');
    const outcome = await shareText(
      title,
      resultShareText(`“${title}”`, Number.isFinite(acc) ? acc : 100, 0),
    );
    setShareNote(outcome === 'shared' ? 'Shared. Go brag.' : outcome === 'copied' ? 'Copied — paste it anywhere.' : 'Sharing is unavailable on this device.');
    setSharing(false);
  }
  const artist = song ? str(song.artist ?? song.composer) : '';
  const difficulty = song ? str(song.difficulty ?? song.level) : '';
  const bpm = song ? num(song.bpm ?? song.tempo ?? song.effective_bpm, 90) : 90;
  const sections = song ? arr(song.sections) : [];
  const bestAccuracy = song ? num(song.best_accuracy ?? song.accuracy, NaN) : NaN;
  const bestScore = song ? song.best_score ?? song.score : undefined;

  return (
    <div className="wrap" style={{ paddingTop: 28, paddingBottom: 48 }}>
      <p className="crumbs">
        <Link to="/app">Dashboard</Link> / <Link to="/app/songs">Songs</Link> / <span>{loading ? '…' : title}</span>
      </p>

      {loading ? (
        <div className="card" role="status" aria-label="Loading song">
          <p className="muted">Opening the sheet music…</p>
        </div>
      ) : !song ? (
        <div className="card" role="status">
          <strong>You&apos;re offline — connect to sync.</strong>
          <p className="muted small" style={{ margin: '6px 0 0' }}>
            This song&apos;s sections live on the server. Nothing was faked — reconnect to see them.
          </p>
          <div className="btn-row" style={{ marginTop: 12 }}>
            <Button to="/app/songs" variant="light" size="sm">Back to songs</Button>
          </div>
        </div>
      ) : (
        <>
          <p className="kicker">Song · piano</p>
          <h1 style={{ marginTop: 6 }}>{title}</h1>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            {artist ? <span className="pill">{artist}</span> : null}
            {difficulty ? <span className="pill amber">{difficulty}</span> : null}
            {Number.isFinite(bestAccuracy) ? <span className="pill green">Best accuracy {Math.round(bestAccuracy)}%</span> : null}
            {typeof bestScore === 'number' || typeof bestScore === 'string' ? (
              <span className="pill blue">Best score {String(bestScore)}</span>
            ) : null}
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <h3 style={{ marginTop: 0 }}>Hands &amp; tempo</h3>
            <p className="small muted" style={{ marginTop: 0 }}>Refetches the arrangement from the server — older servers ignore the filters and still play.</p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div className="filter-row" role="group" aria-label="Hand">
                {(['right', 'left', 'both'] as Hand[]).map((h) => (
                  <button key={h} type="button" className="chip-btn" aria-pressed={hand === h} onClick={() => setHand(h)}>
                    {h === 'both' ? 'Both hands' : h === 'right' ? 'Right hand' : 'Left hand'}
                  </button>
                ))}
              </div>
              <div className="filter-row" role="group" aria-label="Tempo percent">
                {[50, 75, 100].map((t) => (
                  <button key={t} type="button" className="chip-btn" aria-pressed={tempoPct === t} onClick={() => setTempoPct(t)}>
                    {t}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {(offline || notice) && (
            <div className="card" role="status" style={{ borderLeft: '5px solid var(--sun-deep)', marginTop: 16 }}>
              <p className="small" style={{ margin: 0 }}>
                {notice || 'You are offline — completions will not save until you reconnect.'}
              </p>
              {!notice.startsWith('You are offline') && !offline ? (
                <div className="btn-row" style={{ marginTop: 10 }}>
                  <button type="button" className="btn btn-light btn-sm" onClick={() => void shareSong()} disabled={sharing}>
                    {sharing ? 'Sharing…' : 'Share result'}
                  </button>
                </div>
              ) : null}
              {shareNote ? (
                <p role="status" className="small" style={{ margin: '8px 0 0', fontWeight: 700 }}>{shareNote}</p>
              ) : null}
            </div>
          )}

          <div className="card" style={{ marginTop: 18 }}>
            <h3>Sections</h3>
            {sections.length === 0 ? (
              <p className="muted small">Sections for this song will appear here once synced.</p>
            ) : (
              <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {sections.map((sec, i) => {
                  const sid = str(sec.id ?? sec.section_id, `section-${i}`);
                  const label = str(sec.label ?? sec.title ?? sec.name, `Section ${num(sec.order, i + 1)}`);
                  const done = sec.completed === true || sec.done === true || sec.complete === true;
                  const notes = sectionNotes(sec);
                  const chordRaw = sec.chord as Rec | string | undefined;
                  const chord = typeof chordRaw === 'string' ? chordRaw : str((chordRaw as Rec)?.chord ?? (chordRaw as Rec)?.name);
                  const effBpm = num(sec.effective_bpm ?? sec.bpm, bpm);
                  return (
                    <li key={sid} className="song-row" style={{ gap: 12, alignItems: 'flex-start' }}>
                      <span
                        aria-hidden="true"
                        style={{
                          width: 30, height: 30, borderRadius: '50%', flex: 'none',
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          background: done ? 'var(--plum)' : 'var(--paper)',
                          color: done ? '#fff' : 'var(--plum)',
                          border: '2px solid var(--plum)',
                          fontWeight: 900, fontSize: '0.8rem', marginTop: 2,
                        }}
                      >
                        {done ? <Check size={15} weight="bold" /> : num(sec.order, i + 1)}
                      </span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <strong>{label}</strong>
                        {done ? <span className="pill green" style={{ marginLeft: 8 }}>Done</span> : null}
                        {notes.length === 0 && chord ? (
                          <SectionPlayer notes={[]} bpm={effBpm} chord={chord} label={label} />
                        ) : (
                          <SectionPractice
                            songId={str(id)}
                            sectionId={sid}
                            label={label}
                            notes={notes}
                            bpm={effBpm}
                            hand={hand}
                            onDone={() => { if (!done) void completeSection(sid); }}
                          />
                        )}
                      </span>
                      {!done && notes.length === 0 ? (
                        <Button variant="light" size="sm" onClick={() => void completeSection(sid)} loading={completing === sid}>
                          Mark section complete
                        </Button>
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </>
      )}
    </div>
  );
}

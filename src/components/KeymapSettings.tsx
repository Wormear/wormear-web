import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowCounterClockwise } from '@phosphor-icons/react';
import {
  codeLabel,
  defaultMap,
  invertMapping,
  isOctaveKey,
  loadMapping,
  loadOctaveShift,
  saveMapping,
  saveOctaveShift,
  shiftMapping,
  type KeyMapping,
} from '../lib/keymap';
import { pianoPlay } from '../lib/music';

interface Props {
  /** Called whenever a mapped computer key (or the test area) plays a note. */
  onPlay?: (note: string) => void;
  compact?: boolean;
}

/**
 * Visual computer-key ↔ piano-note table with per-key remap capture,
 * octave indicator + shift, reset-to-defaults, and a press-to-test area.
 * Persists to localStorage ('wormear-keymap').
 */
export default function KeymapSettings({ onPlay, compact = false }: Props) {
  const [base, setBase] = useState<KeyMapping>(() => loadMapping());
  const [octave, setOctave] = useState<number>(() => loadOctaveShift());
  const [capturing, setCapturing] = useState<string | null>(null);
  const [conflict, setConflict] = useState('');
  const [lastPlayed, setLastPlayed] = useState('');

  const effective = useMemo(() => shiftMapping(base, octave), [base, octave]);
  const rows = useMemo(() => {
    const inv = invertMapping(base);
    return Object.entries(inv).map(([note, code]) => ({
      note,
      code,
      shifted: effective[code] ?? note,
      label: codeLabel(code),
    }));
  }, [base, effective]);

  useEffect(() => {
    saveMapping(base);
  }, [base]);
  useEffect(() => {
    saveOctaveShift(octave);
  }, [octave]);

  // Capture mode: next keydown assigns to the pending note (conflict-swap).
  useEffect(() => {
    if (!capturing) return;
    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const code = e.code;
      if (isOctaveKey(code)) {
        setConflict('Arrow keys and Z/X are reserved for octave shift — pick another key.');
        return;
      }
      setBase((prev) => {
        const next: KeyMapping = { ...prev };
        // Conflict-swap: the key's old note takes this key's old code.
        const oldCode = Object.entries(prev).find(([, n]) => n === capturing)?.[0];
        const displacedNote = prev[code];
        if (oldCode) delete next[oldCode];
        if (displacedNote && oldCode) next[oldCode] = displacedNote;
        next[code] = capturing;
        return next;
      });
      setConflict('');
      setCapturing(null);
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [capturing]);

  function play(note: string) {
    pianoPlay(note);
    setLastPlayed(note);
    onPlay?.(note);
  }

  return (
    <div aria-label="Computer keyboard mapping">
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <span className="pill">Octave shift {octave >= 0 ? `+${octave}` : octave}</span>
        <div className="btn-row tight" role="group" aria-label="Octave shift">
          <button
            type="button"
            className="btn btn-light btn-sm"
            onClick={() => setOctave((o) => Math.max(-2, o - 1))}
            disabled={octave <= -2}
            aria-label="Octave down"
          >
            <ArrowLeft size={15} weight="bold" aria-hidden="true" /> Z / ←
          </button>
          <button
            type="button"
            className="btn btn-light btn-sm"
            onClick={() => setOctave((o) => Math.min(2, o + 1))}
            disabled={octave >= 2}
            aria-label="Octave up"
          >
            X / → <ArrowRight size={15} weight="bold" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setBase(defaultMap());
              setOctave(0);
              setConflict('');
            }}
          >
            <ArrowCounterClockwise size={15} aria-hidden="true" /> Reset defaults
          </button>
        </div>
      </div>

      {!compact ? (
        <p className="small muted" style={{ margin: '8px 0 0' }}>
          Home row plays C4–C5 chromatically (black keys on W E T Y U, then O P); O L P ; &apos;
          extend to C♯5–F5. Click <strong>Remap</strong> on any row, then press a key.
        </p>
      ) : null}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: 8,
          marginTop: 12,
        }}
      >
        {rows.map((r) => (
          <div
            key={r.note}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              border: '1px solid var(--line)',
              borderRadius: 12,
              padding: '8px 10px',
              background: capturing === r.note ? 'var(--sun-tint)' : 'var(--paper)',
            }}
          >
            <button
              type="button"
              className="chip-btn"
              style={{ padding: '6px 10px', minHeight: 34 }}
              onClick={() => play(octave !== 0 ? r.shifted : r.note)}
              aria-label={`Test note ${r.note}`}
              title={`Play ${r.note}`}
            >
              {r.note}
            </button>
            <kbd
              style={{
                fontWeight: 900,
                fontSize: '0.8rem',
                background: 'var(--sun-tint)',
                border: '1px solid var(--line-strong)',
                borderRadius: 6,
                padding: '2px 8px',
              }}
            >
              {r.label}
            </kbd>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ marginLeft: 'auto', padding: '6px 8px' }}
              onClick={() => {
                setConflict('');
                setCapturing((c) => (c === r.note ? null : r.note));
              }}
              aria-label={`Remap ${r.note}, currently ${r.label}`}
            >
              {capturing === r.note ? 'Press a key…' : 'Remap'}
            </button>
          </div>
        ))}
      </div>

      {capturing ? (
        <p role="status" className="small" style={{ marginTop: 10, fontWeight: 800 }}>
          Press a key for {capturing}… (Esc cancels)
        </p>
      ) : null}
      {conflict ? (
        <p role="alert" className="small" style={{ color: '#b42318', fontWeight: 800 }}>
          {conflict}
        </p>
      ) : null}

      <div
        tabIndex={0}
        role="group"
        aria-label="Test area: focus here and press mapped keys to play"
        onKeyDown={(e) => {
          if (capturing) return;
          if (e.code === 'ArrowLeft' || e.code === 'KeyZ') {
            e.preventDefault();
            setOctave((o) => Math.max(-2, o - 1));
            return;
          }
          if (e.code === 'ArrowRight' || e.code === 'KeyX') {
            e.preventDefault();
            setOctave((o) => Math.min(2, o + 1));
            return;
          }
          const note = effective[e.code];
          if (note) {
            e.preventDefault();
            play(note);
          }
        }}
        style={{
          marginTop: 12,
          border: '2px dashed var(--line-strong)',
          borderRadius: 14,
          padding: 16,
          textAlign: 'center',
          background: 'var(--cloud, var(--sun-tint))',
        }}
      >
        <strong>Test area</strong>
        <p className="small muted" style={{ margin: '4px 0 0' }}>
          Click here, then press A W S E D F T G Y H U J K…{' '}
          {lastPlayed ? (
            <span className="pill" style={{ marginLeft: 6 }} role="status">
              ♪ {lastPlayed}
            </span>
          ) : (
            'you will hear each note.'
          )}
        </p>
      </div>
    </div>
  );
}

/** Escape cancels an in-progress remap capture. */
export function useCancelCaptureOnEscape(capturing: boolean, cancel: () => void): void {
  useEffect(() => {
    if (!capturing) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancel();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [capturing, cancel]);
}

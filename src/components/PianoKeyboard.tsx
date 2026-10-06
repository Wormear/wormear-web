import { useMemo } from 'react';
import { PIANO_RANGE, isBlackKey, pianoPlay } from '../lib/music';

interface Props {
  onNote: (note: string) => void;
  /** Notes the learner should play right now — glowing target ring. */
  targetNotes?: string[];
  /** note → finger number badge (1–5). */
  fingerMap?: Record<string, number | string>;
  /** Notes currently sounding — pressed highlight. */
  activeNotes?: string[];
  /** note → computer-key label shown on the key (from KeymapSettings). */
  keyLabels?: Record<string, string>;
  disabled?: boolean;
  muted?: boolean;
  compact?: boolean;
}

function normalize(note: string): string {
  return note.trim().replace('♯', '#').replace('♭', 'b');
}

/**
 * Two-octave (C4–B5) piano rendered in CSS. Mouse / touch / click plays
 * through the shared PianoSynth singleton. Target notes glow with a ring
 * + finger badge; sounding notes light amber.
 */
export default function PianoKeyboard({
  onNote,
  targetNotes = [],
  fingerMap = {},
  activeNotes = [],
  keyLabels = {},
  disabled = false,
  muted = false,
  compact = false,
}: Props) {
  const targets = useMemo(() => new Set(targetNotes.map(normalize)), [targetNotes]);
  const active = useMemo(() => new Set(activeNotes.map(normalize)), [activeNotes]);

  const whites = useMemo(() => PIANO_RANGE.filter((n) => !isBlackKey(n)), []);
  // Black-key horizontal position: fraction across the whites row.
  const blackLeft = useMemo(() => {
    const map: Record<string, number> = {};
    let wi = 0;
    for (const n of PIANO_RANGE) {
      if (!isBlackKey(n)) {
        wi += 1;
      } else {
        map[n] = (wi / whites.length) * 100;
      }
    }
    return map;
  }, [whites.length]);

  function press(note: string) {
    if (disabled) return;
    if (!muted) pianoPlay(note);
    onNote(note);
  }

  const whiteH = compact ? 120 : 168;
  const blackH = compact ? 72 : 100;

  return (
    <div
      role="group"
      aria-label="Two-octave piano keyboard, C4 to B5. Click keys or use your computer keyboard."
      style={{
        position: 'relative',
        borderRadius: 18,
        padding: compact ? 10 : 14,
        background: 'linear-gradient(180deg, var(--plum-solid) 0%, var(--plum-deep-solid) 100%)',
        border: '2px solid var(--plum-deep-solid)',
        boxShadow: 'var(--shadow-card)',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <div style={{ display: 'flex', gap: 4, position: 'relative' }}>
        {whites.map((note) => {
          const n = normalize(note);
          const isTarget = targets.has(n);
          const isActive = active.has(n);
          const finger = fingerMap[note] ?? fingerMap[n];
          const label = keyLabels[note] ?? keyLabels[n];
          return (
            <button
              key={note}
              type="button"
              disabled={disabled}
              onPointerDown={(e) => {
                e.preventDefault();
                press(note);
              }}
              aria-label={`Piano key ${note}${isTarget ? ', target note' : ''}${finger ? `, finger ${finger}` : ''}${label ? `, computer key ${label}` : ''}`}
              style={{
                flex: 1,
                height: whiteH,
                borderRadius: '0 0 10px 10px',
                border: isTarget ? '3px solid var(--coral)' : '2px solid var(--line-strong)',
                background: isActive ? 'var(--sun)' : '#FFFEF6',
                color: 'var(--plum-deep-solid)',
                fontWeight: 900,
                fontSize: '0.72rem',
                cursor: disabled ? 'not-allowed' : 'pointer',
                position: 'relative',
                boxShadow: isTarget
                  ? '0 0 0 3px rgba(255,107,74,0.45), 0 4px 0 var(--coral-deep)'
                  : '0 3px 0 var(--line-strong)',
                transform: isActive ? 'translateY(2px)' : undefined,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingBottom: 8,
                gap: 3,
                touchAction: 'none',
              }}
            >
              {isTarget && finger !== undefined ? (
                <span
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    top: 8,
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    background: 'var(--coral)',
                    color: '#fff',
                    fontSize: '0.8rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 0 3px rgba(255,107,74,0.35)',
                  }}
                >
                  {String(finger)}
                </span>
              ) : null}
              <span aria-hidden="true">{note.replace('4', '₄').replace('5', '₅')}</span>
              {label ? (
                <kbd
                  aria-hidden="true"
                  style={{
                    fontSize: '0.66rem',
                    fontWeight: 800,
                    background: 'var(--sun-tint)',
                    border: '1px solid var(--line-strong)',
                    borderRadius: 6,
                    padding: '1px 6px',
                  }}
                >
                  {label}
                </kbd>
              ) : null}
            </button>
          );
        })}
        {PIANO_RANGE.filter((n) => isBlackKey(n)).map((note) => {
          const n = normalize(note);
          const isTarget = targets.has(n);
          const isActive = active.has(n);
          const finger = fingerMap[note] ?? fingerMap[n];
          const label = keyLabels[note] ?? keyLabels[n];
          return (
            <button
              key={note}
              type="button"
              disabled={disabled}
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                press(note);
              }}
              aria-label={`Piano key ${note}${isTarget ? ', target note' : ''}${finger ? `, finger ${finger}` : ''}`}
              style={{
                position: 'absolute',
                left: `calc(${blackLeft[note] ?? 0}% - 3.2%)`,
                top: 0,
                width: '6.4%',
                height: blackH,
                borderRadius: '0 0 8px 8px',
                border: isTarget ? '2px solid var(--coral)' : '2px solid #140D2B',
                background: isActive ? 'var(--sun)' : '#241B45',
                color: isActive ? '#28194A' : '#F8F2DF',
                fontWeight: 800,
                fontSize: '0.62rem',
                cursor: disabled ? 'not-allowed' : 'pointer',
                zIndex: 2,
                boxShadow: isTarget ? '0 0 0 3px rgba(255,107,74,0.5)' : '0 3px 0 #140D2B',
                transform: isActive ? 'translateY(2px)' : undefined,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingBottom: 6,
                gap: 2,
                touchAction: 'none',
              }}
            >
              {isTarget && finger !== undefined ? (
                <span
                  aria-hidden="true"
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: 'var(--coral)',
                    color: '#fff',
                    fontSize: '0.68rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {String(finger)}
                </span>
              ) : null}
              {label ? (
                <kbd
                  aria-hidden="true"
                  style={{
                    fontSize: '0.6rem',
                    fontWeight: 800,
                    background: 'rgba(255,255,255,0.14)',
                    border: '1px solid rgba(255,255,255,0.35)',
                    borderRadius: 5,
                    padding: '0 4px',
                  }}
                >
                  {label}
                </kbd>
              ) : null}
            </button>
          );
        })}
      </div>
      <p className="small" style={{ margin: '8px 2px 0', color: '#D9CFF5', fontWeight: 700 }}>
        C4 – B5 · glowing keys are your next notes{Object.keys(fingerMap).length > 0 ? ' · numbered badges are finger hints' : ''}
      </p>
    </div>
  );
}

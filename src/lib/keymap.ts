/**
 * Computer-keyboard → piano-note mapping.
 * Default layout (documented in the Setup page + KeymapSettings):
 *   Home row, chromatic C4–C5:
 *     A→C4  W→C#4  S→D4  E→D#4  D→E4  F→F4
 *     T→F#4 G→G4  Y→G#4  H→A4  U→A#4 J→B4  K→C5
 *   Upper extension (C#5–F5):
 *     O→C#5 L→D5  P→D#5  Semicolon→E5  Quote→F5
 * Octave shift (applies to the whole map):
 *   ArrowLeft / ArrowRight — octave down / up (also Z / X as alt).
 *   Digit1–Digit8 jump to a fixed octave offset when available.
 * Space is intentionally unmapped (page scroll).
 * Codes are KeyboardEvent.code values so layouts stay stable (KeyA, …).
 */

/** code (e.code) → note name ("C4"). */
export type KeyMapping = Record<string, string>;

export const BASE_OCTAVE = 4;
export const MIN_OCTAVE_SHIFT = -2;
export const MAX_OCTAVE_SHIFT = 2;

const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/** Base chromatic spelling starting at C of the given octave. */
export function chromaticFrom(octave: number, count: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const name = CHROMATIC[i % 12];
    out.push(`${name}${octave + Math.floor(i / 12)}`);
  }
  return out;
}

/** Canonical default map at octave shift 0 (notes C4–F5). */
export function defaultMap(): KeyMapping {
  return {
    KeyA: 'C4',
    KeyW: 'C#4',
    KeyS: 'D4',
    KeyE: 'D#4',
    KeyD: 'E4',
    KeyF: 'F4',
    KeyT: 'F#4',
    KeyG: 'G4',
    KeyY: 'G#4',
    KeyH: 'A4',
    KeyU: 'A#4',
    KeyJ: 'B4',
    KeyK: 'C5',
    KeyO: 'C#5',
    KeyL: 'D5',
    KeyP: 'D#5',
    Semicolon: 'E5',
    Quote: 'F5',
  };
}

const STORE_KEY = 'wormear-keymap';
const OCT_KEY = 'wormear-keymap-octave';

function shiftNote(note: string, semitones: number): string {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(note.trim());
  if (!m || semitones === 0) return note;
  const base: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const semi = base[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  const midi = 12 * (parseInt(m[3], 10) + 1) + semi + semitones;
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const oct = Math.floor(midi / 12) - 1;
  return `${names[((midi % 12) + 12) % 12]}${oct}`;
}

/** Apply an octave shift to every note in a mapping. */
export function shiftMapping(map: KeyMapping, octaveShift: number): KeyMapping {
  if (octaveShift === 0) return { ...map };
  const out: KeyMapping = {};
  for (const [code, note] of Object.entries(map)) out[code] = shiftNote(note, octaveShift * 12);
  return out;
}

/** note → code reverse lookup (first code wins). */
export function invertMapping(map: KeyMapping): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [code, note] of Object.entries(map)) {
    if (!(note in out)) out[note] = code;
  }
  return out;
}

export function loadMapping(): KeyMapping {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaultMap();
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== 'object' || parsed === null) return defaultMap();
    const out: KeyMapping = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === 'string' && /^[A-G][#b]?\d$/.test(v)) out[k] = v;
    }
    return Object.keys(out).length > 0 ? out : defaultMap();
  } catch {
    return defaultMap();
  }
}

export function saveMapping(map: KeyMapping): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function loadOctaveShift(): number {
  try {
    const raw = localStorage.getItem(OCT_KEY);
    const n = raw === null ? 0 : parseInt(raw, 10);
    if (!Number.isFinite(n)) return 0;
    return Math.min(MAX_OCTAVE_SHIFT, Math.max(MIN_OCTAVE_SHIFT, n));
  } catch {
    return 0;
  }
}

export function saveOctaveShift(n: number): void {
  try {
    localStorage.setItem(OCT_KEY, String(n));
  } catch {
    /* ignore */
  }
}

/** Human label for an e.code ("KeyA" → "A", "Semicolon" → ";"). */
export function codeLabel(code: string): string {
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  const special: Record<string, string> = {
    Semicolon: ';',
    Quote: "'",
    Comma: ',',
    Period: '.',
    Slash: '/',
    BracketLeft: '[',
    BracketRight: ']',
    Minus: '-',
    Equal: '=',
    Space: 'Space',
    ArrowLeft: '←',
    ArrowRight: '→',
    ArrowUp: '↑',
    ArrowDown: '↓',
  };
  return special[code] ?? code;
}

/** Is this key reserved for octave control (never remappable to a note)? */
export function isOctaveKey(code: string): boolean {
  return (
    code === 'ArrowLeft' ||
    code === 'ArrowRight' ||
    code === 'KeyZ' ||
    code === 'KeyX'
  );
}

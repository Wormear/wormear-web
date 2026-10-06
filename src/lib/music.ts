/**
 * Shared WebAudio music primitives for practice games and the assessment.
 * noteFrequency / chordFrequencies mirror the SectionPlayer contract so game
 * audio and song audio never drift apart; SectionPlayer re-exports from here.
 */

const SEMIS: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

/** "E" | "F#4" | "Bb3" → frequency. Bare names default to octave 4. "R" = rest. */
export function noteFrequency(name: string): number | null {
  const m = /^([A-Ga-g])([#b♯♭]?)(\d)?$/.exec(name.trim());
  if (!m) return null;
  if (/^r$/i.test(name.trim())) return null;
  const base = SEMIS[m[1].toUpperCase()];
  const acc = m[2] === '#' || m[2] === '♯' ? 1 : m[2] === 'b' || m[2] === '♭' ? -1 : 0;
  const octave = m[3] !== undefined ? parseInt(m[3], 10) : 4;
  const midi = 12 * (octave + 1) + base + acc;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** "C" → major triad frequencies (root + major 3rd + 5th), octave 4. Minor when suffixed with m. */
export function chordFrequencies(name: string): number[] {
  const m = /^([A-Ga-g])([#b♯♭]?)(m|min)?(\d)?$/i.exec(name.trim());
  if (!m) return [];
  const base = SEMIS[m[1].toUpperCase()];
  const acc = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0;
  const minor = !!m[3];
  const octave = m[4] !== undefined ? parseInt(m[4], 10) : 4;
  const root = 12 * (octave + 1) + base + acc;
  const third = root + (minor ? 3 : 4);
  return [root, third, root + 7].map((midi) => 440 * Math.pow(2, (midi - 69) / 12));
}

function ensureCtx(): AudioContext | null {
  try {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    const ctx = new AC();
    if (ctx.state === 'suspended') {
      void ctx.resume().catch(() => undefined);
    }
    return ctx;
  } catch {
    return null;
  }
}

function tone(ctx: AudioContext, freq: number, at: number, dur: number, peak = 0.22): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, at);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(peak, at + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(at);
  osc.stop(at + dur + 0.05);
}

/** Fire-and-forget single note. Safe to call from click handlers; silent when audio is unavailable. */
export function playTone(freq: number, dur = 0.5, peak = 0.22): void {
  const ctx = ensureCtx();
  if (!ctx) return;
  tone(ctx, freq, ctx.currentTime + 0.01, dur, peak);
  window.setTimeout(() => {
    void ctx.close().catch(() => undefined);
  }, Math.max(600, dur * 1000 + 400));
}

/** Fire-and-forget triad block (all three notes together). */
export function playChord(freqs: number[], dur = 1.2): void {
  const ctx = ensureCtx();
  if (!ctx || freqs.length === 0) return;
  const at = ctx.currentTime + 0.01;
  freqs.forEach((f) => tone(ctx, f, at, dur, 0.14));
  window.setTimeout(() => {
    void ctx.close().catch(() => undefined);
  }, Math.max(800, dur * 1000 + 400));
}

/** Play a note name ("C", "F#4"). No-op for rests/unknown names. */
export function playNoteName(name: string, dur = 0.5): void {
  const freq = noteFrequency(name);
  if (freq !== null) playTone(freq, dur);
}

/** Play a chord name ("C", "Am"). No-op for unknown names. */
export function playChordName(name: string, dur = 1.2): void {
  const freqs = chordFrequencies(name);
  if (freqs.length > 0) playChord(freqs, dur);
}

/* ------------------------------------------------------------------ */
/* PianoSynth: resume-on-gesture AudioContext singleton for the         */
/* on-screen + computer-key piano. Triangle tone w/ envelope through  */
/* a shared master gain (mute supported). Reused by PianoKeyboard,     */
/* KeymapSettings, lesson runner and song practice — never duplicate.  */
/* ------------------------------------------------------------------ */

let pianoCtx: AudioContext | null = null;
let pianoMaster: GainNode | null = null;
let pianoMuted = false;

function pianoEnsureCtx(): AudioContext | null {
  try {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    if (!pianoCtx || pianoCtx.state === 'closed') {
      pianoCtx = new AC();
      pianoMaster = pianoCtx.createGain();
      pianoMaster.gain.value = pianoMuted ? 0 : 0.9;
      pianoMaster.connect(pianoCtx.destination);
    }
    if (pianoCtx.state === 'suspended') {
      void pianoCtx.resume().catch(() => undefined);
    }
    return pianoCtx;
  } catch {
    return null;
  }
}

/** Piano voice: triangle + fast attack, natural decay. Must be called from a user gesture at least once. */
export function pianoPlay(note: string, dur = 0.6, peak = 0.25): void {
  const freq = noteFrequency(note);
  if (freq === null) return;
  const ctx = pianoEnsureCtx();
  if (!ctx || !pianoMaster) return;
  const at = ctx.currentTime + 0.01;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, at);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), at + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(gain).connect(pianoMaster);
  osc.start(at);
  osc.stop(at + dur + 0.05);
}

export function pianoSetMuted(muted: boolean): void {
  pianoMuted = muted;
  if (pianoMaster && pianoCtx) {
    pianoMaster.gain.setTargetAtTime(muted ? 0 : 0.9, pianoCtx.currentTime, 0.01);
  }
}

export function pianoIsMuted(): boolean {
  return pianoMuted;
}

/** Short metronome click at ~2kHz for count-ins. */
export function pianoClick(accent = false): void {
  const ctx = pianoEnsureCtx();
  if (!ctx || !pianoMaster) return;
  const at = ctx.currentTime + 0.01;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(accent ? 2000 : 1500, at);
  gain.gain.setValueAtTime(accent ? 0.12 : 0.08, at);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.07);
  osc.connect(gain).connect(pianoMaster);
  osc.start(at);
  osc.stop(at + 0.1);
}

/** All 24 semitones C4–B5 in order. Useful for rendering the keyboard. */
export const PIANO_RANGE: string[] = (() => {
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const out: string[] = [];
  for (let oct = 4; oct <= 5; oct += 1) {
    for (const n of names) out.push(`${n}${oct}`);
  }
  return out;
})();

export function isBlackKey(note: string): boolean {
  return note.includes('#') || note.includes('b') || note.includes('♯') || note.includes('♭');
}

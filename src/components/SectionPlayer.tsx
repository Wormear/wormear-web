import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from '@phosphor-icons/react';
import { chordFrequencies, noteFrequency } from '../lib/music';

export { chordFrequencies, noteFrequency };

interface Props {
  notes: string[];
  bpm?: number;
  chord?: string;
  label: string;
}

/**
 * Plays a song section with the Web Audio API: melody notes in sequence
 * (highlighted as they sound) plus the section chord as a block.
 * No dependencies, no network — pure client-side playback.
 */
export default function SectionPlayer({ notes, bpm = 90, chord = '', label }: Props) {
  const [playing, setPlaying] = useState(false);
  const [active, setActive] = useState(-1);
  const ctxRef = useRef<AudioContext | null>(null);
  const stopRef = useRef(false);

  useEffect(() => {
    return () => {
      stopRef.current = true;
      if (ctxRef.current) {
        void ctxRef.current.close().catch(() => undefined);
        ctxRef.current = null;
      }
    };
  }, []);

  function ensureCtx(): AudioContext | null {
    try {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      if (!ctxRef.current || ctxRef.current.state === 'closed') {
        ctxRef.current = new AC();
      }
      if (ctxRef.current.state === 'suspended') {
        void ctxRef.current.resume().catch(() => undefined);
      }
      return ctxRef.current;
    } catch {
      return null;
    }
  }

  function tone(ctx: AudioContext, freq: number, at: number, dur: number, peak = 0.22) {
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

  async function playMelody() {
    const ctx = ensureCtx();
    if (!ctx || notes.length === 0) return;
    stopRef.current = false;
    setPlaying(true);
    const step = (60 / Math.max(40, Math.min(200, bpm))) * 0.5;
    for (let i = 0; i < notes.length; i += 1) {
      if (stopRef.current) break;
      setActive(i);
      const freq = noteFrequency(notes[i]);
      if (freq !== null) {
        tone(ctx, freq, ctx.currentTime + 0.01, step * 1.8);
      }
      await new Promise((r) => setTimeout(r, step * 1000));
    }
    setActive(-1);
    setPlaying(false);
  }

  function playChord() {
    const ctx = ensureCtx();
    const freqs = chord ? chordFrequencies(chord) : [];
    if (!ctx || freqs.length === 0) return;
    const at = ctx.currentTime + 0.01;
    freqs.forEach((f) => tone(ctx, f, at, 1.4, 0.14));
  }

  function stop() {
    stopRef.current = true;
    setPlaying(false);
    setActive(-1);
  }

  if (notes.length === 0 && !chord) return null;

  return (
    <div style={{ marginTop: 10 }}>
      {notes.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }} aria-label={`${label} notes`}>
          {notes.map((n, i) => (
            <span
              key={i}
              className="pill"
              style={
                i === active
                  ? { background: 'var(--coral)', color: '#fff', borderColor: 'var(--coral)' }
                  : undefined
              }
            >
              {n}
            </span>
          ))}
        </div>
      ) : null}
      <div className="btn-row" style={{ marginTop: 10 }}>
        {notes.length > 0 ? (
          playing ? (
            <button type="button" className="btn btn-light btn-sm" onClick={stop} aria-label={`Stop ${label}`}>
              <Pause size={15} weight="fill" aria-hidden="true" /> Stop
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => void playMelody()}
              aria-label={`Play ${label}`}
            >
              <Play size={15} weight="fill" aria-hidden="true" /> Play
            </button>
          )
        ) : null}
        {chord ? (
          <button
            type="button"
            className="btn btn-light btn-sm"
            onClick={playChord}
            aria-label={`Play ${chord} chord`}
            title={`${chord} chord`}
          >
            {chord} chord
          </button>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Tiny autocorrelation pitch detector for the Practice Setup mic test.
 * getUserMedia + AnalyserNode feed float samples here; we report the
 * closest note name ("we hear: E4") or null when too quiet / unclear.
 * Permission-gated by the caller with honest denial copy.
 */

const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function freqToNote(freq: number): string {
  const midi = Math.round(69 + 12 * Math.log2(freq / 440));
  const name = NAMES[((midi % 12) + 12) % 12];
  const oct = Math.floor(midi / 12) - 1;
  return `${name}${oct}`;
}

/** Autocorrelation fundamental estimate. Returns Hz or null. */
export function detectPitch(samples: Float32Array, sampleRate: number): number | null {
  const n = samples.length;
  let rms = 0;
  for (let i = 0; i < n; i += 1) rms += samples[i] * samples[i];
  rms = Math.sqrt(rms / n);
  if (rms < 0.015) return null; // too quiet

  // Trim to the loudest window centre to reduce edge noise.
  let bestLag = -1;
  let bestCorr = 0;
  const minLag = Math.floor(sampleRate / 880); // top ~ G#5
  const maxLag = Math.min(n - 2, Math.floor(sampleRate / 60)); // bottom ~ B1
  // Normalise by zero-lag energy.
  let energy = 0;
  for (let i = 0; i < n; i += 1) energy += samples[i] * samples[i];
  if (energy <= 0) return null;
  for (let lag = minLag; lag <= maxLag; lag += 1) {
    let corr = 0;
    for (let i = 0; i < n - lag; i += 1) corr += samples[i] * samples[i + lag];
    corr /= energy;
    if (corr > bestCorr) {
      bestCorr = corr;
      bestLag = lag;
    }
  }
  if (bestLag <= 0 || bestCorr < 0.35) return null;
  // Parabolic interpolation around the peak for a steadier readout.
  return sampleRate / bestLag;
}

export function detectNote(samples: Float32Array, sampleRate: number): { freq: number; note: string } | null {
  const freq = detectPitch(samples, sampleRate);
  if (freq === null || !Number.isFinite(freq)) return null;
  return { freq, note: freqToNote(freq) };
}

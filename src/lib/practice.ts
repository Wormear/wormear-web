/** Practice-session API helpers: start on begin, finish on complete. Offline-safe. */

import { site } from '../config/env';
import { authedFetch } from './session';

export type PracticeKind = 'note_rush' | 'rhythm_tap' | 'chord_challenge';

export interface AttemptNote {
  note: string;
  beats?: number;
  at_ms?: number;
}

export interface AttemptResult {
  score: number;
  correct: number;
  wrong: number;
  missed: number;
  extra: number;
  timing_avg_ms: number | null;
  accuracy_pct: number;
  passed: boolean;
  xp_awarded: number;
  newly_unlocked: string[];
  new_milestones: Record<string, unknown>[];
  per_note: {
    index: number;
    expected: string;
    played: string;
    status: string;
    timing_ms: number | null;
    feedback: string;
  }[];
  raw: Record<string, unknown>;
}

/**
 * POST /practice/attempts — scored grading for lesson exercises and song
 * sections. Returns null when offline/unauthorised so callers can show
 * an honest "reconnect to grade & save" notice instead of fake scores.
 */
export async function submitAttempt(args: {
  expected: { note: string; beats?: number }[];
  performed: { note: string; at_ms: number }[];
  exercise_ref?: string;
  tempo_bpm?: number;
}): Promise<AttemptResult | null> {
  try {
    const res = await authedFetch(`${site.apiUrl}/practice/attempts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exercise_ref: args.exercise_ref,
        expected: args.expected.map((e) => ({ note: e.note, beats: e.beats ?? 1 })),
        performed: args.performed,
        tempo_bpm: args.tempo_bpm,
      }),
    });
    if (!res || !res.ok) return null;
    const data = (await res.json()) as Record<string, unknown>;
    const num = (v: unknown, fb = 0): number =>
      typeof v === 'number' && Number.isFinite(v) ? v : fb;
    const perRaw = Array.isArray(data.per_note) ? data.per_note : [];
    return {
      score: num(data.score),
      correct: num(data.correct),
      wrong: num(data.wrong),
      missed: num(data.missed),
      extra: num(data.extra),
      timing_avg_ms:
        typeof data.timing_avg_ms === 'number' ? data.timing_avg_ms : null,
      accuracy_pct: num(
        data.accuracy_pct ?? data.accuracy,
        perRaw.length > 0 ? 0 : 0,
      ),
      passed: data.passed === true,
      xp_awarded: num(data.xp_awarded ?? data.xp),
      newly_unlocked: Array.isArray(data.newly_unlocked)
        ? data.newly_unlocked.map((x) => String((x as Record<string, unknown>)?.code ?? (x as Record<string, unknown>)?.name ?? x))
        : [],
      new_milestones: Array.isArray(data.new_milestones)
        ? (data.new_milestones as Record<string, unknown>[])
        : [],
      per_note: perRaw
        .filter((x): x is Record<string, unknown> => typeof x === 'object' && x !== null)
        .map((p, i) => ({
          index: num(p.index, i),
          expected: String(p.expected ?? ''),
          played: String(p.played ?? p.play ?? ''),
          status: String(p.status ?? ''),
          timing_ms: typeof p.timing_ms === 'number' ? p.timing_ms : null,
          feedback: String(p.feedback ?? p.hint ?? ''),
        })),
      raw: data,
    };
  } catch {
    return null;
  }
}

interface IdShape {
  id?: unknown;
}

function strId(v: unknown): string | null {
  return typeof v === 'string' && v ? v : null;
}

/** POST /practice/sessions. Returns the session id, or null when offline/unauthorised. */
export async function startPracticeSession(kind: PracticeKind): Promise<string | null> {
  try {
    const res = await authedFetch(`${site.apiUrl}/practice/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instrument_code: 'piano', kind }),
    });
    if (!res || !res.ok) return null;
    const data = (await res.json()) as IdShape;
    return strId(data.id);
  } catch {
    return null;
  }
}

interface FinishShape {
  xp_earned?: unknown;
  xp?: unknown;
}

/**
 * PATCH /practice/sessions/{id}/finish.
 * Returns xp_earned, or null when the completion could not be saved
 * (caller shows a "not saved" notice and keeps the local score).
 */
export async function finishPracticeSession(
  sessionId: string,
  accuracy: number,
  durationSec: number,
): Promise<number | null> {
  try {
    const res = await authedFetch(
      `${site.apiUrl}/practice/sessions/${encodeURIComponent(sessionId)}/finish`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accuracy, duration_sec: durationSec }),
      },
    );
    if (!res || !res.ok) return null;
    const data = (await res.json()) as FinishShape;
    const xp =
      typeof data.xp_earned === 'number'
        ? data.xp_earned
        : typeof data.xp === 'number'
          ? data.xp
          : null;
    return typeof xp === 'number' && Number.isFinite(xp) ? xp : null;
  } catch {
    return null;
  }
}

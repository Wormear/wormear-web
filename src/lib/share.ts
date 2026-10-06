/** Web Share with clipboard fallback. Returns how the share resolved. */

export type ShareOutcome = 'shared' | 'copied' | 'failed';

/** Share text via navigator.share when available, else copy to clipboard. */
export async function shareText(title: string, text: string, url?: string): Promise<ShareOutcome> {
  const payload: ShareData = { title, text };
  if (url) payload.url = url;
  try {
    const nav = navigator as Navigator & {
      share?: (data: ShareData) => Promise<void>;
      canShare?: (data: ShareData) => boolean;
    };
    if (typeof nav.share === 'function' && (!nav.canShare || nav.canShare(payload))) {
      await nav.share(payload);
      return 'shared';
    }
  } catch {
    // User dismissed the sheet or share failed — fall through to clipboard.
  }
  try {
    const full = url ? `${text} ${url}` : text;
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(full);
      return 'copied';
    }
  } catch {
    /* clipboard unavailable */
  }
  return 'failed';
}

/** One-liner result copy for game/lesson/song celebrations. */
export function resultShareText(
  what: string,
  accuracyPct: number,
  xp: number,
): string {
  return `I just finished ${what} on Wormear with ${Math.round(accuracyPct)}% accuracy and +${xp} XP. Melody the earthworm is proud.`;
}

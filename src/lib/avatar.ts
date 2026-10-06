/** Navii avatar helpers — shared by every surface that shows a user face. */

export interface AvatarUser {
  avatar_url?: string | null;
  avatar_seed?: string | null;
  display_name?: string | null;
  name?: string | null;
  email?: string | null;
}

function clampSize(n: number): number {
  if (!Number.isFinite(n)) return 96;
  return Math.min(1024, Math.max(16, Math.round(n)));
}

/** Canonical Navii URL for a seed. Size clamped to the 16–1024 range. */
export function naviiUrl(seed: string, size = 96): string {
  const s = seed && seed.trim() ? seed.trim() : 'melody';
  return `https://api.navii.dev/avatar/${encodeURIComponent(s)}?size=${clampSize(size)}`;
}

/**
 * Resolve the best avatar image URL for a user:
 * custom upload (avatar_url) wins, otherwise Navii(avatar_seed).
 * Returns null when neither exists (caller renders an initial/LogoMark tile).
 */
export function resolveAvatar(user: AvatarUser | null | undefined, size = 96): string | null {
  if (!user) return null;
  if (typeof user.avatar_url === 'string' && user.avatar_url.trim()) {
    return user.avatar_url.trim();
  }
  const seed =
    (typeof user.avatar_seed === 'string' && user.avatar_seed.trim()
      ? user.avatar_seed.trim()
      : '') ||
    (typeof user.display_name === 'string' && user.display_name.trim()
      ? user.display_name.trim()
      : '') ||
    (typeof user.email === 'string' && user.email.trim() ? user.email.trim() : '');
  if (!seed) return null;
  return naviiUrl(seed, size);
}

/** Display name with the same fallbacks used across the app. */
export function displayNameOf(user: AvatarUser | null | undefined, fallback = 'player'): string {
  if (!user) return fallback;
  const d =
    (typeof user.display_name === 'string' && user.display_name.trim()
      ? user.display_name.trim()
      : '') ||
    (typeof user.name === 'string' && user.name.trim() ? user.name.trim() : '') ||
    (typeof user.email === 'string' && user.email.trim()
      ? user.email.trim().split('@')[0]
      : '');
  return d || fallback;
}

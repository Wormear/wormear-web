import { useState } from 'react';
import { LogoMark } from './Brand';
import { resolveAvatar, type AvatarUser } from '../lib/avatar';

interface UserAvatarProps {
  user: AvatarUser | null | undefined;
  size?: number;
  alt?: string;
}

/**
 * Signed-in user's face: custom upload wins, otherwise Navii(seed).
 * Falls back to the Wormear LogoMark when no avatar resolves or the
 * image fails to load. Decorative by default (alt="").
 */
export default function UserAvatar({ user, size = 40, alt = '' }: UserAvatarProps) {
  const [failed, setFailed] = useState(false);
  const url = failed ? null : resolveAvatar(user, size);
  if (!url) {
    return (
      <span
        aria-hidden={alt ? undefined : 'true'}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--sun-tint)',
          border: '2px solid var(--line-strong)',
          flex: 'none',
        }}
      >
        <LogoMark size={Math.max(16, Math.round(size * 0.6))} alt={alt} />
      </span>
    );
  }
  return (
    <img
      src={url}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        objectFit: 'cover',
        background: 'var(--sun-tint)',
        border: '2px solid var(--line-strong)',
        flex: 'none',
      }}
    />
  );
}

import { Lightning } from '@phosphor-icons/react';

export default function XPBadge({ xp, level }: { xp: string; level: number }) {
  return (
    <span className="xp-badge" aria-label={`Level ${level}, ${xp} experience points`}>
      <span className="dot" aria-hidden="true" />
      Lv {level}
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <Lightning size={15} weight="fill" aria-hidden="true" /> {xp} XP
      </span>
    </span>
  );
}

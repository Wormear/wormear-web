import { Flame } from '@phosphor-icons/react';

export default function StreakBadge({ days }: { days: number }) {
  return (
    <span className="streak-badge" aria-label={`${days} day streak`}>
      <Flame size={16} weight="fill" className="flame" aria-hidden="true" />
      {days}-day streak
    </span>
  );
}

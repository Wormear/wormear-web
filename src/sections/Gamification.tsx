import { Lightning, Flame, Bug, Trophy } from '@phosphor-icons/react';
import Section from '../components/Section';
import StreakBadge from '../components/StreakBadge';
import XPBadge from '../components/XPBadge';
import { gamification } from '../data/content';

const icons: Record<string, typeof Lightning> = { Lightning, Flame, Bug, Trophy };

export default function Gamification() {
  return (
    <Section
      id="gamification"
      eyebrow="Gamification"
      title="Practice that feels like play"
      lead="Duolingo-style motivation, 100% original Wormear charm. Small daily goals, kind grading, and a worm who celebrates every attempt."
    >
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
        <XPBadge xp="1,240" level={5} />
        <StreakBadge days={12} />
        <span className="pill amber">Daily goal · 10 min</span>
        <span className="pill green">Streak freeze ready</span>
      </div>
      <div className="grid grid-4">
        {gamification.map((g) => {
          const Icon = icons[g.icon] ?? Lightning;
          return (
            <article key={g.title} className="card">
              <span className="icon-chip" aria-hidden="true"><Icon size={24} weight="duotone" /></span>
              <h3>{g.title}</h3>
              <p className="muted small" style={{ margin: 0 }}>{g.text}</p>
            </article>
          );
        })}
      </div>
    </Section>
  );
}

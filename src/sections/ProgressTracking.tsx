import { ChartLineUp, CalendarCheck, Medal } from '@phosphor-icons/react';
import Section from '../components/Section';

const cards = [
  { icon: ChartLineUp, title: 'See every win', text: 'XP curves, accuracy by hand, rhythm scores. Weekly recaps show exactly what improved — and what to play next.' },
  { icon: CalendarCheck, title: 'Goals that flex', text: 'Set 5, 10 or 20 minutes. Busy day? Half-goal keeps the streak alive. Pause anytime without losing history.' },
  { icon: Medal, title: 'Share-worthy moments', text: 'First full song, perfect week, 30-day streak — each unlocks a card to share with family or your teacher.' },
];

export default function ProgressTracking() {
  return (
    <Section
      id="progress"
      eyebrow="Progress tracking"
      title="Motivation you can measure"
      lead="Parents, teachers and self-learners all see the same honest dashboard: time played, notes nailed, and the next milestone."
    >
      <div className="grid grid-3">
        {cards.map((c) => (
          <article key={c.title} className="card">
            <span className="icon-chip" aria-hidden="true"><c.icon size={24} weight="duotone" /></span>
            <h3>{c.title}</h3>
            <p className="muted small" style={{ margin: 0 }}>{c.text}</p>
          </article>
        ))}
      </div>
      <div className="card" style={{ marginTop: 18 }}>
        <strong>Sample week</strong>
        <div className="grid grid-4" style={{ marginTop: 12 }}>
          {[
            { d: 'Mon', v: '80%', n: 80 }, { d: 'Tue', v: '45%', n: 45 },
            { d: 'Wed', v: '100%', n: 100 }, { d: 'Thu', v: '60%', n: 60 },
          ].map((b) => (
            <div key={b.d}>
              <div className="small" style={{ fontWeight: 800 }}>{b.d} · {b.v} of goal</div>
              <div className="bar" role="progressbar" aria-valuenow={b.n} aria-valuemin={0} aria-valuemax={100} aria-label={`${b.d} goal ${b.v}`}>
                <span style={{ width: b.v }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

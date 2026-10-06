import { BookOpen, Target, MusicNote, TrendUp } from '@phosphor-icons/react';
import Section from '../components/Section';
import { howItWorks, site } from '../data/content';

const icons: Record<string, typeof BookOpen> = { BookOpen, Target, MusicNote, TrendUp };

export default function HowItWorks() {
  return (
    <Section
      id="how"
      eyebrow="How it works"
      title="Learn → Practice → Play → Progress → Repeat"
      lead={site.promise + ' Every loop takes about 10 minutes: learn a tiny idea, play it in a game, perform it in a song, and watch Melody level up.'}
    >
      <div className="grid grid-4">
        {howItWorks.map((s) => {
          const Icon = icons[s.icon] ?? BookOpen;
          return (
            <article key={s.title} className="card">
              <span className="icon-chip" aria-hidden="true"><Icon size={24} weight="duotone" /></span>
              <p className="pill" style={{ margin: '0 0 8px' }}>Step {s.step}</p>
              <h3>{s.title}</h3>
              <p className="muted small" style={{ margin: 0 }}>{s.text}</p>
            </article>
          );
        })}
      </div>
    </Section>
  );
}

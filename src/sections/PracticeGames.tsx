import { GameController } from '@phosphor-icons/react';
import Section from '../components/Section';
import { games } from '../data/content';

export default function PracticeGames() {
  return (
    <Section
      id="games"
      eyebrow="Practice games"
      title="Five tiny games, zero boring drills"
      lead="Each game trains one musical muscle in under 3 minutes. Three ship in the MVP; two arrive with the full launch."
    >
      <div className="grid grid-3">
        {games.map((g) => (
          <article key={g.name} className="card">
            <span className="icon-chip" aria-hidden="true"><GameController size={24} weight="duotone" /></span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0 }}>{g.name}</h3>
            </div>
            <div style={{ margin: '8px 0' }}>
              {g.status === 'in-mvp' ? (
                <span className="pill green">In MVP · playable now</span>
              ) : (
                <span className="pill amber">Coming in full version</span>
              )}{' '}
              <span className="pill blue">Best for: {g.best}</span>
            </div>
            <p className="muted small" style={{ margin: 0 }}>{g.desc}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}

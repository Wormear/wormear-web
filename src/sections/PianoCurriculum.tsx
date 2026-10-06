import Section from '../components/Section';
import SkillPath from '../components/SkillPath';
import Mascot from '../components/Mascot';

export default function PianoCurriculum() {
  return (
    <Section
      id="curriculum"
      eyebrow="Piano curriculum"
      title="A winding path, not a textbook"
      lead="Five friendly units take you from middle C to full two-hand songs. The path always shows one clear next step — finish it in 10 minutes and earn your stars."
    >
      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <SkillPath />
        <div className="card" style={{ background: 'var(--sun-tint)', borderColor: 'var(--line-strong)' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Mascot level={9} size={76} />
            <div>
              <strong>Melody evolves as you do</strong>
              <p className="muted small" style={{ margin: '4px 0 0' }}>
                Egg → Hatchling (Lv 4) → Groovy (Lv 8) → Headliner (Lv 12). New scarves, shades and
                stage glow mark real milestones.
              </p>
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <div className="small" style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
              <span>Path completion</span><span>68%</span>
            </div>
            <div className="bar" role="progressbar" aria-valuenow={68} aria-valuemin={0} aria-valuemax={100} aria-label="Curriculum completion">
              <span style={{ width: '68%' }} />
            </div>
            <p className="small muted" style={{ marginBottom: 0 }}>Text + icon, never color alone — locked units show a lock icon and “Locked” label.</p>
          </div>
        </div>
      </div>
    </Section>
  );
}

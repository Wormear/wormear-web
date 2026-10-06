import { PianoKeys, Guitar, SpeakerHigh, Microphone } from '@phosphor-icons/react';
import Section from '../components/Section';
import { instruments } from '../data/content';

const icons: Record<string, typeof PianoKeys> = { Piano: PianoKeys, Guitar, Drums: SpeakerHigh, Vocals: Microphone };

export default function InstrumentsFuture() {
  return (
    <Section
      id="instruments"
      eyebrow="Beyond piano"
      title="Piano now, band later"
      lead="We nail one instrument first. Guitar, drums and vocals reuse the same Learn → Practice → Play loop — join the waitlist inside the app."
    >
      <div className="grid grid-4">
        {instruments.map((i) => {
          const Icon = icons[i.name] ?? PianoKeys;
          return (
            <article key={i.name} className="card">
              <span className="icon-chip" aria-hidden="true"><Icon size={24} weight="duotone" /></span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>{i.name}</h3>
              </div>
              <div style={{ margin: '8px 0' }}>
                {i.live ? <span className="pill green">{i.status}</span> : <span className="pill">{i.status}</span>}
              </div>
              <p className="muted small" style={{ margin: 0 }}>{i.text}</p>
            </article>
          );
        })}
      </div>
    </Section>
  );
}

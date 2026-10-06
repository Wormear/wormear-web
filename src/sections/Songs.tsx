import { MusicNote } from '@phosphor-icons/react';
import Section from '../components/Section';
import { songs } from '../data/content';

export default function Songs() {
  return (
    <Section
      id="songs"
      eyebrow="Song library"
      title="Real songs from lesson one"
      lead="No endless exercises. You perform recognizable melodies immediately, with difficulty pills and time estimates so practice always fits your day."
    >
      <div className="card" style={{ padding: '10px 20px' }}>
        {songs.map((s) => (
          <div key={s.title} className="song-row">
            <span className="song-cover" style={{ background: s.color }} aria-hidden="true">
              <MusicNote size={24} weight="fill" />
            </span>
            <div style={{ flex: 1 }}>
              <strong>{s.title}</strong>
              <div className="muted small">{s.composer} · about {s.minutes} min</div>
            </div>
            <span className={`pill${s.difficulty === 'Starter' ? ' green' : s.difficulty === 'Easy' ? ' blue' : ' amber'}`}>
              {s.difficulty}
            </span>
          </div>
        ))}
      </div>
      <p className="small muted">Plus 35 more arrangements at launch — pop, classical, birthday-ready and seasonal packs.</p>
    </Section>
  );
}

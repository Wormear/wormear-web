import { Check, Lock, Play } from '@phosphor-icons/react';
import { curriculumUnits } from '../data/content';

export default function SkillPath() {
  return (
    <ol className="path" style={{ listStyle: 'none', padding: 0 }}>
      {curriculumUnits.map((u) => (
        <li key={u.title} className={`path-node ${u.status}`}>
          <span className="path-dot" aria-hidden="true">
            {u.status === 'done' ? <Check size={22} weight="bold" /> : u.status === 'current' ? <Play size={22} weight="fill" /> : <Lock size={20} weight="bold" />}
          </span>
          <div className="card" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <strong>{u.title}</strong>
              <span className={`pill${u.status === 'done' ? ' green' : u.status === 'current' ? ' amber' : ''}`}>
                {u.status === 'done' ? 'Completed' : u.status === 'current' ? 'Up next' : 'Locked'} · {u.lessons} lessons
              </span>
            </div>
            <p className="muted small" style={{ margin: '6px 0 0' }}>{u.desc}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

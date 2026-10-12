import { Flame, Lightning, Star } from '@phosphor-icons/react';
import Mascot from './Mascot';

export default function PhoneMockup() {
  return (
    <div className="phone-stage" role="img" aria-label="Phone preview of the Wormear app">
      <div className="float-card float-xp">
        <Lightning size={18} weight="fill" color="#3B1F5C" aria-hidden="true" /> +120 XP
      </div>
      <div className="phone">
        <div className="phone-screen">
          <div className="phone-top">
            <div className="streak-row">
              <span className="pill amber">
                <Flame size={14} weight="fill" aria-hidden="true" /> 12-day streak
              </span>
              <span className="pill blue">Lv 4 · 850 XP</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Mascot level={5} size={58} />
              <div>
                <strong style={{ display: 'block' }}>Nice, you’re back!</strong>
                <span className="small" style={{ opacity: 0.9 }}>Melody saved your spot in Ode to Joy.</span>
              </div>
            </div>
          </div>
          <div className="lesson-card">
            <span className="pill green">Today · 8 min</span>
            <strong style={{ display: 'block', marginTop: 8 }}>Right-Hand Melodies · L3</strong>
            <span className="small muted">Tap the glowing keys with the beat.</span>
            <div className="bar" style={{ marginTop: 10 }} role="progressbar" aria-valuenow={65} aria-valuemin={0} aria-valuemax={100} aria-label="Lesson progress">
              <span style={{ width: '65%' }} />
            </div>
          </div>
          <div className="keys" aria-hidden="true">
            <span className="key" /><span className="key black" /><span className="key" />
            <span className="key lit" /><span className="key black" /><span className="key" />
            <span className="key" /><span className="key lit" />
          </div>
          <div style={{ margin: '2px 14px 16px', display: 'flex', gap: 8 }}>
            <span className="pill"><Star size={13} weight="fill" aria-hidden="true" /> Perfect x4</span>
            <span className="pill blue">Rhythm 92%</span>
          </div>
        </div>
      </div>
      <div className="float-card float-streak">
        <Flame size={18} weight="fill" color="#FF6B4A" aria-hidden="true" /> Streak saved!
      </div>
    </div>
  );
}

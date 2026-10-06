import { Link } from 'react-router-dom';
import { ClockCounterClockwise, Guitar, Metronome, MusicNote } from '@phosphor-icons/react';
import Button from '../../components/Button';

/**
 * Practice hub: three playable games (MVP) + history link.
 * Mirrors the mobile PracticeHubScreen cards and copy.
 */
export default function PracticeHub() {
  return (
    <div className="wrap" style={{ paddingTop: 28, paddingBottom: 48 }}>
      <p className="crumbs">
        <Link to="/app">Dashboard</Link> / <span>Practice</span>
      </p>
      <p className="kicker">Practice games</p>
      <h1 style={{ marginTop: 6 }}>Five tiny games. Zero boring drills.</h1>
      <p className="lede">Short, fun reps with instant scoring on real piano sound. Pick one!</p>
      <p style={{ marginTop: 12 }}>
        <span className="pill green">3 playable now</span>
      </p>

      <div className="grid grid-3" style={{ marginTop: 18 }}>
        <div className="card sun-top">
          <span className="icon-chip"><MusicNote size={24} weight="fill" aria-hidden="true" /></span>
          <h3>Note Rush</h3>
          <p className="small muted">Hear a note, tap the matching key. 10 rounds — build combos, chase accuracy.</p>
          <div className="btn-row" style={{ marginTop: 12 }}>
            <Button to="/app/games/note-rush" variant="primary" size="sm">Play Note Rush</Button>
          </div>
        </div>
        <div className="card coral-top">
          <span className="icon-chip coral"><Metronome size={24} weight="fill" aria-hidden="true" /></span>
          <h3>Rhythm Tap</h3>
          <p className="small muted">Tap exactly on the 90bpm beat. 8 taps — timing score included.</p>
          <div className="btn-row" style={{ marginTop: 12 }}>
            <Button to="/app/games/rhythm" variant="light" size="sm">Play Rhythm</Button>
          </div>
        </div>
        <div className="card lined">
          <span className="icon-chip amber"><Guitar size={24} weight="fill" aria-hidden="true" /></span>
          <h3>Chord Challenge</h3>
          <p className="small muted">Hear a triad, name that chord. C · F · G · Am recognition.</p>
          <div className="btn-row" style={{ marginTop: 12 }}>
            <Button to="/app/games/chord" variant="sun" size="sm">Play Chords</Button>
          </div>
        </div>
      </div>

      <div className="btn-row" style={{ marginTop: 18 }}>
        <Button to="/app/history" variant="ghost" size="sm">
          <ClockCounterClockwise size={16} aria-hidden="true" /> Practice history
        </Button>
      </div>
    </div>
  );
}

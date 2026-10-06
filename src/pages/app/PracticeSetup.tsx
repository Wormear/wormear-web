import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ComputerTower, Guitar, Microphone, PianoKeys, Plugs, WarningCircle } from '@phosphor-icons/react';
import KeymapSettings from '../../components/KeymapSettings';
import PianoKeyboard from '../../components/PianoKeyboard';
import { detectNote } from '../../lib/pitch';
import { site } from '../../config/env';
import { loadSession } from '../../lib/session';

type Status = 'idle' | 'ok' | 'fail';

/** Live connection checklist dots: audio engine, API reachability, auth. */
function useConnectionChecks(): { audio: Status; api: Status; auth: Status } {
  const [audio, setAudio] = useState<Status>('idle');
  const [api, setApi] = useState<Status>('idle');
  const [auth, setAuth] = useState<Status>('idle');
  useEffect(() => {
    try {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      setAudio(AC ? 'ok' : 'fail');
    } catch {
      setAudio('fail');
    }
    try {
      // Real session = stored access token. Demo/offline shells without a
      // token must not light the "signed in" dot (RequireAuth agrees).
      setAuth(loadSession()?.token ? 'ok' : 'fail');
    } catch {
      setAuth('fail');
    }
    let cancelled = false;
    (async () => {
      try {
        // Public endpoint — no Bearer needed, so plain fetch (not authedFetch) is correct here.
        const res = await fetch(`${site.apiUrl}/theory/reference`, { method: 'GET' });
        if (!cancelled) setApi(res.ok ? 'ok' : 'fail');
      } catch {
        if (!cancelled) setApi('fail');
      }
    })();
    const t = window.setTimeout(() => {
      if (!cancelled) setApi((a) => (a === 'idle' ? 'fail' : a));
    }, 6000);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, []);
  return { audio, api, auth };
}

function Dot({ s }: { s: Status }) {
  const color = s === 'ok' ? '#1D7A45' : s === 'fail' ? '#B3371F' : '#B9AEE0';
  const label = s === 'ok' ? 'live' : s === 'fail' ? 'issue' : 'checking';
  return (
    <span aria-label={label} title={label} style={{ width: 12, height: 12, borderRadius: '50%', background: color, display: 'inline-block', flex: 'none' }} />
  );
}

/** Mic pitch test: permission-gated analyser + autocorrelation readout. */
function MicTest() {
  const [state, setState] = useState<'idle' | 'asking' | 'live' | 'denied' | 'error'>('idle');
  const [heard, setHeard] = useState('');
  const [level, setLevel] = useState(0);
  const raf = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);

  function stop() {
    cancelAnimationFrame(raf.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setState('idle');
  }

  async function start() {
    setState('asking');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false } });
      streamRef.current = stream;
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 4096;
      src.connect(analyser);
      const buf = new Float32Array(analyser.fftSize);
      setState('live');
      const loop = () => {
        analyser.getFloatTimeDomainData(buf);
        let peak = 0;
        for (let i = 0; i < buf.length; i += 1) peak = Math.max(peak, Math.abs(buf[i]));
        setLevel(Math.min(1, peak * 3));
        const found = detectNote(buf, ctx.sampleRate);
        setHeard(found ? `${found.note} (${Math.round(found.freq)} Hz)` : '');
        raf.current = requestAnimationFrame(loop);
      };
      loop();
    } catch (err) {
      if (err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'SecurityError')) {
        setState('denied');
      } else {
        setState('error');
      }
    }
  }

  useEffect(() => () => {
    cancelAnimationFrame(raf.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  return (
    <div>
      {state === 'live' ? (
        <div role="status" aria-label={heard ? `Microphone hears ${heard}` : 'Listening'}>
          <p style={{ margin: '8px 0' }}>
            <span className="pill green">Listening…</span>{' '}
            {heard ? <strong>we hear: {heard}</strong> : <span className="muted small">play a note on your piano…</span>}
          </p>
          <div className="bar" aria-hidden="true"><span style={{ width: `${Math.round(level * 100)}%` }} /></div>
          <div className="btn-row" style={{ marginTop: 10 }}>
            <button type="button" className="btn btn-light btn-sm" onClick={stop}>Stop mic</button>
          </div>
        </div>
      ) : (
        <div className="btn-row" style={{ marginTop: 8 }}>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => void start()} disabled={state === 'asking'}>
            <Microphone size={15} weight="fill" aria-hidden="true" /> {state === 'asking' ? 'Asking…' : 'Test my microphone'}
          </button>
        </div>
      )}
      {state === 'denied' ? (
        <p role="alert" className="small" style={{ color: '#b42318', fontWeight: 800 }}>
          Microphone blocked. Click the lock icon in your browser&apos;s address bar → allow microphone for this site → try again.
          Nothing is recorded or uploaded — pitch is detected on your device.
        </p>
      ) : null}
      {state === 'error' ? (
        <p role="alert" className="small" style={{ color: '#b42318', fontWeight: 800 }}>
          Could not open the microphone on this device. Computer keys (above) work with zero setup.
        </p>
      ) : null}
      <p className="small muted" style={{ margin: '8px 0 0' }}>
        Honest note: mic listening shows you what we hear, but grading by microphone is not supported yet —
        lessons and songs are graded from the on-screen piano and computer keys.
      </p>
    </div>
  );
}

/** Web MIDI probe: list inputs + live note display, with fallback copy. */
function MidiTest() {
  const [support, setSupport] = useState<'checking' | 'yes' | 'no'>('checking');
  const [inputs, setInputs] = useState<string[]>([]);
  const [last, setLast] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const nav = navigator as Navigator & { requestMIDIAccess?: (opts?: { sysex?: boolean }) => Promise<{ inputs: Map<string, { name?: string | null; onmidimessage: ((e: { data?: Uint8Array | number[] }) => void) | null }> }> };
    if (!nav.requestMIDIAccess) {
      setSupport('no');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const access = await nav.requestMIDIAccess();
        if (cancelled) return;
        setSupport('yes');
        const names: string[] = [];
        access.inputs.forEach((port, key) => {
          names.push(port.name || `MIDI input ${key.slice(0, 6)}`);
          port.onmidimessage = (e) => {
            const d = e.data;
            if (!d || d.length < 3) return;
            const [status, pitch, vel] = [d[0], d[1], d[2]];
            if ((status & 0xf0) === 0x90 && vel > 0) {
              const names12 = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
              setLast(`${names12[pitch % 12]}${Math.floor(pitch / 12) - 1}`);
            }
          };
        });
        setInputs(names);
      } catch {
        if (!cancelled) {
          setSupport('no');
          setError('MIDI access was blocked by the browser.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (support === 'checking') return <p className="muted small">Checking for Web MIDI…</p>;
  if (support === 'no') {
    return (
      <div>
        <p className="small"><strong>Web MIDI is not available in this browser.</strong></p>
        <p className="small muted" style={{ marginTop: 4 }}>
          {error || 'Use Chrome or Edge on desktop for plug-and-play MIDI.'} Any USB keyboard with a
          “USB-MIDI” or “class-compliant” logo works — no drivers on modern systems. Until then,
          computer keys above are fully graded.
        </p>
      </div>
    );
  }
  return (
    <div>
      {inputs.length === 0 ? (
        <p className="small">MIDI is ready — plug in a keyboard and it will appear here.</p>
      ) : (
        <ul className="small" style={{ paddingLeft: 18, margin: '6px 0' }}>
          {inputs.map((n, i) => <li key={i}>{n}</li>)}
        </ul>
      )}
      {last ? <p role="status"><span className="pill">♪ {last}</span></p> : null}
      <p className="small muted">Live MIDI notes light up here. Full MIDI-graded lessons are coming — today the on-screen piano plays the sound.</p>
    </div>
  );
}

/**
 * /app/setup — honest capability cards for every input method with live
 * test widgets, plus troubleshooting and a connection checklist.
 */
export default function PracticeSetup() {
  const conn = useConnectionChecks();
  const [played, setPlayed] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'No sound?',
      a: 'Click any piano key once (browsers require a click before audio starts). Check the tab is not muted, raise device volume, and if you use Bluetooth headphones, try wired — Bluetooth adds delay. The Audio dot below should be green.',
    },
    {
      q: 'Wrong notes from computer keys?',
      a: 'Remap any key in the Computer keys card (click Remap → press a key). Arrow keys and Z/X always shift octaves and cannot be remapped. The octave-shift pill shows where you are — reset to +0 if melodies sound an octave off.',
    },
    {
      q: 'Latency — notes feel late?',
      a: 'Close other tabs using audio, prefer wired headphones, and keep the browser window focused. WebAudio itself adds only ~20ms; most perceived lag is Bluetooth or background load.',
    },
    {
      q: 'Attempts will not grade?',
      a: 'Grading runs on the server (POST /practice/attempts), so offline attempts show “reconnect to grade & save” instead of a fake score. Reconnect and press Stop & grade again — your played notes are kept.',
    },
  ];

  return (
    <div className="wrap" style={{ paddingTop: 28, paddingBottom: 48 }}>
      <p className="crumbs"><Link to="/app">Dashboard</Link> / <span>Setup</span></p>
      <p className="kicker">Practice setup · no piano required</p>
      <h1 style={{ marginTop: 6 }}>Three ways to play. Pick one.</h1>
      <p className="lede">Computer keys are fully graded today. Microphone and MIDI are honest test benches — they show what we hear, not grades (yet).</p>

      <div className="grid grid-2" style={{ marginTop: 18 }}>
        <div className="card coral-top">
          <p className="kicker"><ComputerTower size={15} aria-hidden="true" /> Recommended</p>
          <h3>Computer keys</h3>
          <p className="small muted" style={{ marginTop: 0 }}>
            Zero setup, fully graded in lessons and songs. Home row = C4–C5 chromatic; arrows or Z/X shift octaves.
          </p>
          <KeymapSettings onPlay={(n) => setPlayed(n)} />
          {played ? <p className="small" role="status" style={{ fontWeight: 800 }}>Last played: {played}</p> : null}
        </div>

        <div className="card sun-top">
          <p className="kicker"><PianoKeys size={15} aria-hidden="true" /> Always available</p>
          <h3>On-screen piano</h3>
          <p className="small muted" style={{ marginTop: 0 }}>
            Two octaves (C4–B5), mouse or touch. Glowing keys are your next notes; numbered badges are finger hints.
          </p>
          <PianoKeyboard onNote={(n) => setPlayed(n)} compact />
          {played ? <p className="small" role="status" style={{ fontWeight: 800 }}>Last played: {played}</p> : null}
        </div>

        <div className="card lined">
          <p className="kicker"><Microphone size={15} aria-hidden="true" /> Test bench</p>
          <h3>Physical piano via microphone</h3>
          <p className="small muted" style={{ marginTop: 0 }}>
            We detect pitch on your device with autocorrelation. Nothing is recorded or uploaded.
          </p>
          <MicTest />
        </div>

        <div className="card lined">
          <p className="kicker"><Plugs size={15} aria-hidden="true" /> Test bench</p>
          <h3>MIDI keyboard</h3>
          <p className="small muted" style={{ marginTop: 0 }}>
            Chrome / Edge on desktop support Web MIDI. Other browsers do not (Safari, Firefox, most mobile).
          </p>
          <MidiTest />
        </div>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <h3><Guitar size={18} aria-hidden="true" /> What to buy (only if you want hardware)</h3>
        <ul className="small" style={{ paddingLeft: 18, margin: '6px 0 0' }}>
          <li>Any 25+ key USB-MIDI controller labelled “class-compliant” — works without drivers.</li>
          <li>For acoustic pianos: any phone/laptop mic works for the test above; grading stays on computer keys.</li>
          <li>You do not need anything to start — the first three lessons are designed for computer keys.</li>
        </ul>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <h3>Troubleshooting</h3>
        {faqs.map((f, i) => (
          <div className="faq-item" key={i} style={{ marginTop: 8 }}>
            <button type="button" className="faq-q" aria-expanded={openFaq === i} onClick={() => setOpenFaq((o) => (o === i ? null : i))}>
              {f.q} <span aria-hidden="true">{openFaq === i ? '−' : '+'}</span>
            </button>
            {openFaq === i ? <p className="faq-a small">{f.a}</p> : null}
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <h3>Test your connection</h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0', display: 'grid', gap: 8 }}>
          <li style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Dot s={conn.audio} />
            <span className="small"><strong>Audio engine</strong> <span className="muted">— {conn.audio === 'ok' ? 'your browser can play piano sound.' : conn.audio === 'fail' ? 'no WebAudio — try Chrome or Edge.' : 'checking…'}</span></span>
          </li>
          <li style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Dot s={conn.api} />
            <span className="small"><strong>Server</strong> <span className="muted">— {conn.api === 'ok' ? 'grading and sync are live.' : conn.api === 'fail' ? 'unreachable — lessons still playable, grading waits for reconnect.' : 'checking…'}</span></span>
          </li>
          <li style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Dot s={conn.auth} />
            <span className="small"><strong>Signed in</strong> <span className="muted">— {conn.auth === 'ok' ? 'progress will save.' : 'no local session — log in to save XP.'}</span></span>
          </li>
        </ul>
        <div className="btn-row" style={{ marginTop: 12 }}>
          <Link className="btn btn-primary btn-sm" to="/app/learn">Back to Learn</Link>
          {conn.audio !== 'ok' || conn.api !== 'ok' ? (
            <span className="pill amber" role="status"><WarningCircle size={14} aria-hidden="true" /> Something needs attention above</span>
          ) : (
            <span className="pill green" role="status"><CheckCircle size={14} aria-hidden="true" /> All systems go</span>
          )}
        </div>
      </div>
    </div>
  );
}

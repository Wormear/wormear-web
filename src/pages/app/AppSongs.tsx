import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/Button';
import { site } from '../../config/env';
import { authedFetch } from '../../lib/session';
import { useLiveTick } from '../../lib/live';

type Rec = Record<string, unknown>;

function str(v: unknown, fallback = ''): string {
  if (typeof v === 'string') return v;
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  return fallback;
}
function arr(v: unknown): Rec[] {
  return Array.isArray(v) ? v.filter((x): x is Rec => typeof x === 'object' && x !== null) : [];
}

const COVERS = ['var(--plum)', 'var(--coral)', '#7A5B00', '#146c39', '#5C4B8A'];

export default function AppSongs() {
  const tick = useLiveTick();
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [songs, setSongs] = useState<Rec[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await authedFetch(`${site.apiUrl}/songs?instrument=piano`);
        if (!res || !res.ok) {
          if (!cancelled) {
            setOffline(!res);
            setLoading(false);
          }
          return;
        }
        const data = (await res.json()) as Rec | Rec[];
        const list = Array.isArray(data) ? arr(data) : arr((data as Rec).songs ?? (data as Rec).items);
        if (!cancelled) {
          setSongs(list);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setOffline(true);
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tick]);

  return (
    <div className="wrap" style={{ paddingTop: 28, paddingBottom: 48 }}>
      <p className="crumbs">
        <Link to="/app">Dashboard</Link> / <span>Songs</span>
      </p>
      <p className="kicker">Songs · piano</p>
      <h1 style={{ marginTop: 6 }}>Songs that fit in ten minutes.</h1>
      <p className="lede">Every song is arranged for small hands and short sessions — pick one and play it badly, then play it better.</p>

      <div className="filter-row" style={{ marginTop: 14 }} role="group" aria-label="Instrument filter">
        <span className="chip-btn" aria-pressed="true" style={{ cursor: 'default' }}>Piano</span>
        {!loading && songs.length > 0 ? (
          <span className="pill" style={{ alignSelf: 'center' }}>{songs.length} songs · 10-minute fits</span>
        ) : null}
      </div>

      {offline && !loading ? (
        <div className="card" role="status" style={{ borderLeft: '5px solid var(--sun-deep)', marginTop: 18 }}>
          <strong>You&apos;re offline — connect to sync.</strong>
          <p className="muted small" style={{ margin: '6px 0 0' }}>
            The song library lives on the server, so there is nothing to list yet. Your downloaded progress is safe.
          </p>
        </div>
      ) : null}

      {loading ? (
        <div className="card" role="status" aria-label="Loading songs" style={{ marginTop: 18 }}>
          <p className="muted">Opening the songbook…</p>
        </div>
      ) : songs.length === 0 ? (
        <div className="card" style={{ marginTop: 18 }}>
          <h3>No songs to show</h3>
          <p className="muted small">
            {offline ? 'Reconnect and Melody will lay out the whole library.' : 'New arrangements land every week — check back soon.'}
          </p>
          <div className="btn-row" style={{ marginTop: 12 }}>
            <Button to="/app" variant="light" size="sm">Back to dashboard</Button>
          </div>
        </div>
      ) : (
        <div className="card" style={{ marginTop: 18, paddingTop: 8, paddingBottom: 8 }}>
          {songs.map((song, i) => {
            const id = str(song.id ?? song.song_id);
            const title = str(song.title ?? song.name, 'Untitled song');
            const artist = str(song.artist ?? song.composer);
            const diff = str(song.difficulty ?? song.level);
            const body = (
              <>
                <span className="song-cover" aria-hidden="true" style={{ background: COVERS[i % COVERS.length] }}>
                  ♪
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ display: 'block' }}>{title}</strong>
                  {artist ? <span className="small muted">{artist}</span> : null}
                </span>
                {diff ? <span className="pill">{diff}</span> : null}
              </>
            );
            return (
              <div key={id || `song-${i}`} className="song-row">
                {id ? (
                  <Link to={`/app/songs/${encodeURIComponent(id)}`} style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, textDecoration: 'none', color: 'inherit' }}>
                    {body}
                  </Link>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>{body}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

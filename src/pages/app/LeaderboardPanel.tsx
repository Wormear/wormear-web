import { useEffect, useState } from 'react';
import { Crown } from '@phosphor-icons/react';
import { LogoMark } from '../../components/Brand';
import UserAvatar from '../../components/UserAvatar';
import { site } from '../../config/env';
import { authedFetch, fetchMe, type MeRec } from '../../lib/session';
import { useLiveTick } from '../../lib/live';

type Rec = Record<string, unknown>;

function str(v: unknown, fallback = ''): string {
  if (typeof v === 'string') return v;
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  return fallback;
}
function num(v: unknown, fallback = 0): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}
function arr(v: unknown): Rec[] {
  return Array.isArray(v) ? v.filter((x): x is Rec => typeof x === 'object' && x !== null) : [];
}

interface Entry {
  rank: number;
  name: string;
  level: number | null;
  xp: number;
  streak: number;
  isYou: boolean;
}

function toEntry(r: Rec): Entry {
  return {
    rank: num(r.rank ?? r.position, 0),
    name: str(r.display_name ?? r.name, 'Player'),
    level: typeof r.level === 'number' && Number.isFinite(r.level) ? r.level : null,
    xp: num(r.total_xp ?? r.xp),
    streak: num(r.current_streak ?? r.streak_days),
    isYou: r.is_you === true || r.isYou === true,
  };
}

interface LeaderboardPanelProps {
  youName?: string;
  youLevel?: number | null;
}

/**
 * Leaderboard panel: podium top-3 + rows #4+, highlighted "you" row.
 * Self-fetching, offline-safe. UserAvatar for the signed-in user only
 * (entries carry no seed) — LogoMark/initial tiles for everyone else.
 */
export default function LeaderboardPanel({ youName, youLevel }: LeaderboardPanelProps) {
  const tick = useLiveTick();
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [yourRank, setYourRank] = useState<number | null>(null);
  const [yourXp, setYourXp] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [me, setMe] = useState<MeRec | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await fetchMe();
      if (!cancelled) setMe(data);
    })();
    return () => {
      cancelled = true;
    };
  }, [tick]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await authedFetch(`${site.apiUrl}/leaderboard?limit=10`);
        if (!res || !res.ok) {
          if (!cancelled) {
            setOffline(!res);
            setLoading(false);
          }
          return;
        }
        const data = (await res.json()) as Rec;
        if (cancelled) return;
        setEntries(arr(data.entries).map(toEntry));
        const yr = data.your_rank;
        setYourRank(typeof yr === 'number' && Number.isFinite(yr) ? yr : null);
        setYourXp(num(data.your_xp));
        setTotalPlayers(num(data.total_players));
        setLoading(false);
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

  const youInList = entries.some((e) => e.isYou);
  const rows = entries.filter((e) => e.rank > 3);
  const podium = entries.filter((e) => e.rank <= 3).sort((a, b) => a.rank - b.rank);
  const showYouAppend = !youInList && yourRank !== null && yourRank > 3;
  const youAvatar = {
    avatar_url: str(me?.avatar_url),
    avatar_seed: str(me?.avatar_seed),
    display_name: youName ?? str(me?.display_name),
    email: str(me?.email),
  };

  return (
    <section className="dash-panel lb-panel" aria-label="Leaderboard">
      <div className="dash-panel-head">
        <h2 className="dash-panel-title">Leaderboard</h2>
        {totalPlayers > 0 ? <span className="pill">{totalPlayers} players</span> : null}
      </div>

      {loading ? (
        <p className="muted small" role="status">
          Gathering the rankings…
        </p>
      ) : offline && entries.length === 0 ? (
        <p className="muted small" role="status">
          You&apos;re offline — connect to sync and see where you stand.
        </p>
      ) : entries.length === 0 ? (
        <p className="muted small" role="status">
          Rankings appear here once players log practice.
        </p>
      ) : (
        <>
          {podium.length > 0 ? (
            <div className="lb-podium">
              {podium.map((e) => (
                <div
                  key={e.rank}
                  className={`lb-card${e.rank === 1 ? ' lb-first' : e.rank === 2 ? ' lb-second' : ' lb-third'}${e.isYou ? ' lb-you' : ''}`}
                >
                  <span className="lb-crown" aria-hidden="true">
                    {e.rank === 1 ? <Crown size={18} weight="fill" /> : `#${e.rank}`}
                  </span>
                  {e.isYou ? (
                    <UserAvatar user={youAvatar} size={40} alt="Your avatar" />
                  ) : (
                    <LogoMark size={32} alt="" />
                  )}
                  <strong className="lb-name">{e.isYou ? `${e.name} (you)` : e.name}</strong>
                  <span className="pill lb-xp">{e.xp.toLocaleString()} XP</span>
                  <span className="small muted">
                    {e.level !== null ? `Lv ${e.level}` : ''}{e.level !== null && e.streak > 0 ? ' · ' : ''}{e.streak > 0 ? `${e.streak}-day streak` : ''}
                  </span>
                </div>
              ))}
            </div>
          ) : null}

          <ol className="lb-rows">
            {rows.map((e) => (
              <li key={e.rank} className={`lb-row${e.isYou ? ' lb-you' : ''}`}>
                <span className="lb-rank" aria-label={`Rank ${e.rank}`}>
                  #{e.rank}
                </span>
                {e.isYou ? (
                  <UserAvatar user={youAvatar} size={32} alt="Your avatar" />
                ) : (
                  <LogoMark size={26} alt="" />
                )}
                <span className="lb-row-name">{e.isYou ? `${e.name} (you)` : e.name}</span>
                <span className="pill lb-xp">{e.xp.toLocaleString()} XP</span>
              </li>
            ))}
            {showYouAppend && yourRank !== null ? (
              <li className="lb-row lb-you">
                <span className="lb-rank" aria-label={`Your rank ${yourRank}`}>
                  #{yourRank}
                </span>
                <UserAvatar user={youAvatar} size={32} alt="Your avatar" />
                <span className="lb-row-name">{youName || 'You'} (you)</span>
                <span className="pill lb-xp">{yourXp.toLocaleString()} XP</span>
              </li>
            ) : null}
          </ol>

          {yourRank !== null && yourRank > 0 ? (
            <p className="small muted lb-foot">
              You rank #{yourRank}{totalPlayers > 0 ? ` of ${totalPlayers} players` : ''}.
              {youLevel !== null && youLevel !== undefined ? ` · Level ${youLevel}` : ''}
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}

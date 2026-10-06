import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Crown } from '@phosphor-icons/react';
import Button from '../../components/Button';
import Mascot from '../../components/Mascot';
import { site } from '../../config/env';
import { authedFetch } from '../../lib/session';

type Rec = Record<string, unknown>;

function str(v: unknown, fallback = ''): string {
  if (typeof v === 'string') return v;
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  return fallback;
}
function arr(v: unknown): Rec[] {
  return Array.isArray(v) ? v.filter((x): x is Rec => typeof x === 'object' && x !== null) : [];
}

const PERKS = [
  'Unlimited songs & lessons',
  'Personal 10-min daily plan',
  'Weak-skill auto drills',
  'Streak freeze & family plan',
];

interface Plan {
  id: string;
  name: string;
  price: string;
}

/**
 * Premium: plans from GET /subscriptions (mock fallback to the mobile
 * paywall copy), mock checkout via POST /subscriptions/checkout.
 * No charge in MVP — the card says so honestly.
 */
export default function Premium() {
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([{ id: 'monthly', name: 'Monthly', price: '$7.99/mo' }]);
  const [premium, setPremium] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await authedFetch(`${site.apiUrl}/subscriptions`);
        if (!res) {
          if (!cancelled) {
            setOffline(true);
            setLoading(false);
          }
          return;
        }
        if (res.ok) {
          const data = (await res.json()) as unknown;
          const rec = (typeof data === 'object' && data !== null ? (data as Rec) : {}) as Rec;
          const rawPlans = arr(rec.plans ?? rec.tiers);
          if (rawPlans.length > 0) {
            setPlans(
              rawPlans.map((p, i) => ({
                id: str(p.id ?? p.code, `plan-${i}`),
                name: str(p.name ?? p.title, 'Plan'),
                price: str(p.price_display ?? p.price, '$7.99/mo'),
              })),
            );
          }
          const cur = rec.current ?? rec.subscription;
          if (typeof cur === 'object' && cur !== null) {
            const c = cur as Rec;
            setPremium(c.status === 'active' || c.premium === true || c.trial === true);
          } else if (rec.premium === true || rec.is_premium === true) {
            setPremium(true);
          }
        }
        if (!cancelled) setLoading(false);
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
  }, []);

  async function checkout(planId: string) {
    setCheckingOut(true);
    setNotice('');
    try {
      const res = await authedFetch(`${site.apiUrl}/subscriptions/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      });
      if (!res) {
        setNotice('You are offline — checkout needs a connection. Nothing was charged.');
        return;
      }
      if (!res.ok) {
        setNotice('Checkout hiccup. Try again in a moment — nothing was charged.');
        return;
      }
      setPremium(true);
      setNotice('Welcome to Premium. Mock checkout — no charge in MVP.');
      window.scrollTo({ top: 0 });
    } catch {
      setNotice('You are offline — checkout needs a connection. Nothing was charged.');
    } finally {
      setCheckingOut(false);
    }
  }

  return (
    <div className="wrap-narrow" style={{ paddingTop: 28, paddingBottom: 48 }}>
      <p className="crumbs">
        <Link to="/app">Dashboard</Link> / <span>Premium</span>
      </p>

      {loading ? (
        <div className="card" role="status" aria-label="Loading subscription">
          <p className="muted">Checking your plan…</p>
        </div>
      ) : premium ? (
        <div className="card center" style={{ borderTop: '5px solid var(--sun)' }}>
          <Mascot size={96} />
          <p className="kicker" style={{ marginTop: 12 }}>Wormear Premium · active</p>
          <h1 style={{ marginTop: 6 }}>You are Premium.</h1>
          <p className="lede" style={{ margin: '0 auto' }}>Unlimited songs, personal plans, streak protection — the full Melody treatment.</p>
          {notice ? (
            <p role="status" className="small" style={{ marginTop: 10, fontWeight: 700 }}>{notice}</p>
          ) : null}
          <div className="btn-row" style={{ justifyContent: 'center', marginTop: 20 }}>
            <Button to="/app/songs" variant="primary">Play unlimited songs</Button>
            <Button to="/app" variant="light">Dashboard</Button>
          </div>
        </div>
      ) : (
        <>
          <p className="kicker">Premium · cancel anytime</p>
          <div className="premium-band" style={{ marginTop: 14 }} role="region" aria-label="Wormear Premium">
            <div>
              <p className="premium-kicker">WORMEAR PREMIUM</p>
              <h2>Fast-track your first song with zero friction.</h2>
              <p className="lede">Unlimited songs, personal plans, streak protection. Mock checkout — no charge in MVP.</p>
              <ul className="premium-list">
                {PERKS.map((p) => (
                  <li key={p}>
                    <Check size={18} weight="bold" aria-hidden="true" style={{ color: 'var(--sun)', flex: 'none', marginTop: 2 }} />
                    {p}
                  </li>
                ))}
              </ul>
              {offline ? (
                <p className="premium-tiny" role="status">You are offline — plans below are the standard offer; checkout needs a connection.</p>
              ) : null}
            </div>
            <div>
              {plans.map((p) => (
                <div key={p.id} className="card" style={{ marginBottom: 12 }}>
                  <p className="kicker">{p.name}</p>
                  <p className="price">{p.price} <small>cancel anytime</small></p>
                  <div className="btn-row" style={{ marginTop: 12 }}>
                    <button
                      type="button"
                      className="btn btn-sun"
                      disabled={checkingOut}
                      onClick={() => void checkout(p.id)}
                    >
                      <Crown size={17} weight="fill" aria-hidden="true" /> {checkingOut ? 'Working…' : 'Start free trial'}
                    </button>
                  </div>
                  <p className="small muted" style={{ margin: '8px 0 0' }}>Free forever plan · Upgrade anytime</p>
                </div>
              ))}
              {notice ? (
                <p role="alert" className="small" style={{ color: '#FFC93C', fontWeight: 800 }}>{notice}</p>
              ) : null}
              <Button to="/app" variant="white" size="sm">Maybe later</Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

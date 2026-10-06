import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check } from '@phosphor-icons/react';
import Button from '../components/Button';
import FAQAccordion from '../components/FAQAccordion';
import { plans, faqs } from '../data/content';

export default function PricingPage() {
  const [yearly, setYearly] = useState(true);
  const nav = useNavigate();

  const choose = (id: string) => {
    try {
      localStorage.setItem('wormear-plan', JSON.stringify({ id, yearly, at: new Date().toISOString() }));
    } catch { /* ignore */ }
    nav(`/get-started?plan=${id}&billing=${yearly ? 'yearly' : 'monthly'}`);
  };

  return (
    <main>
      <div className="page-hero pricing-hero">
        <div className="wrap center">
          <p className="crumbs" style={{ justifyContent: 'center' }}><Link to="/">Home</Link> / <span>Pricing</span></p>
          <span className="feature-kicker" style={{ textAlign: 'center' }}>Pricing</span>
          <h1 style={{ marginTop: 12 }}>Free to start. <span className="accent">Premium when you’re hooked.</span></h1>
          <p className="lede" style={{ margin: '12px auto 0' }}>
            Start free forever. Upgrade for unlimited songs, MIDI support and streak protection. Cancel
            anytime — your XP stays saved.
          </p>
          <div className="billing-toggle" role="group" aria-label="Billing period">
            <button type="button" aria-pressed={!yearly} onClick={() => setYearly(false)}>Monthly</button>
            <button type="button" aria-pressed={yearly} onClick={() => setYearly(true)}>Yearly · save 50%</button>
          </div>
        </div>
      </div>

      <section className="block" aria-labelledby="plans">
        <div className="wrap">
          <span className="feature-kicker" style={{ textAlign: 'center' }}>Two plans</span>
          <h2 id="plans" className="center accent">Pick your tempo</h2>
          <p className="lede center" style={{ margin: '0 auto' }}>
            Start free, upgrade when practice becomes the best part of your day.
          </p>
          <div className="grid grid-2" style={{ textAlign: 'left', maxWidth: 880, margin: '24px auto 0' }}>
            {plans.map((p) => {
              const price = yearly ? p.yearly : p.monthly;
              const per = p.monthly === 0 ? 'free forever' : yearly ? '/ year' : '/ month';
              const popular = 'popular' in p && Boolean(p.popular);
              return (
                <article key={p.id} className={`card${popular ? ' plan-pop' : ''}`}>
                  {popular ? <span className="pill amber" style={{ marginBottom: 10 }}>Most popular · family included</span> : <span className="pill outline" style={{ marginBottom: 10 }}>Start here</span>}
                  <h3 style={{ fontSize: '1.35rem' }}>{p.name}</h3>
                  <p className="muted small">{p.blurb}</p>
                  <p className="price">${price.toFixed(2)} <small>{per}</small></p>
                  {popular && yearly && (
                    <p className="small muted" style={{ margin: '0 0 6px' }}>${(p.yearly / 12).toFixed(2)}/month billed annually · USD</p>
                  )}
                  <ul className="check-list">
                    {p.features.map((f) => (
                      <li key={f}><Check size={18} weight="bold" color={popular ? 'var(--plum)' : '#1d9e56'} aria-hidden="true" /><span>{f}</span></li>
                    ))}
                  </ul>
                  <Button variant={popular ? 'primary' : 'light'} block size="lg" onClick={() => choose(p.id)}>
                    {p.cta} <ArrowRight size={17} weight="bold" aria-hidden="true" />
                  </Button>
                  <p className="small muted center" style={{ margin: '10px 0 0' }}>
                    {p.id === 'free' ? 'No credit card needed' : 'Cancel in 2 taps · Keep XP forever'}
                  </p>
                </article>
              );
            })}
          </div>

          <div style={{ maxWidth: 880, margin: '26px auto 0' }}>
            <h3>Compare, honestly</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="compare-table">
                <thead><tr><th scope="col">What you get</th><th scope="col">Free</th><th scope="col">Premium</th></tr></thead>
                <tbody>
                  {[
                    ['Starter path + daily game', '✓', '✓ unlimited'],
                    ['Song library', '3 songs', '40+ + monthly drops'],
                    ['Practice games', '2 games', 'All 5 incl. Song Mode'],
                    ['MIDI keyboard + offline', '—', '✓'],
                    ['Streak freeze + family profiles (4)', '—', '✓'],
                    ['Melody evolution', 'Egg stage', 'To Headliner'],
                  ].map(([f, a, b]) => (
                    <tr key={f}><th scope="row">{f}</th><td>{a}</td><td><strong>{b}</strong></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="small muted">Yearly Premium = ${(plans[1].yearly / 12).toFixed(2)}/month billed annually. Prices in USD. Classrooms: <Link to="/support#contact">ask about school access →</Link></p>
          </div>

          <div className="wrap-narrow" style={{ padding: 0, marginTop: 30 }}>
            <span className="feature-kicker">Fair questions</span>
            <h2 className="accent">Fair questions, straight answers.</h2>
            <FAQAccordion items={faqs.slice(4, 6).concat(faqs.slice(0, 2))} />
            <p style={{ marginTop: 14 }}><Link to="/support" style={{ fontWeight: 800 }}>All FAQs + contact support →</Link></p>
          </div>
        </div>
      </section>

      <div className="wrap">
        <section className="final-cta" aria-labelledby="pricing-cta">
          <h2 id="pricing-cta" className="accent">
            Still deciding? Start free today.
          </h2>
          <p className="lede">
            Your first song is 10 minutes away. Upgrade only when practice becomes the best part of
            your day.
          </p>
          <div className="btn-row" style={{ justifyContent: 'center' }}>
            <Button variant="primary" size="lg" onClick={() => choose('premium')}>
              Go Premium <ArrowRight size={18} weight="bold" aria-hidden="true" />
            </Button>
            <Button variant="light" size="lg" onClick={() => choose('free')}>
              Start free
            </Button>
          </div>
          <p className="small muted">Cancel in two taps · Keep your XP forever</p>
        </section>
      </div>
    </main>
  );
}

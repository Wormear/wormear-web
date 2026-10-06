import { useState } from 'react';
import Section from '../components/Section';
import PricingCard from '../components/PricingCard';
import { plans } from '../data/content';

export default function Pricing({ compact = false }: { compact?: boolean }) {
  const [yearly, setYearly] = useState(true);
  return (
    <Section
      id="pricing"
      eyebrow="Pricing"
      title="Free to start. Premium when you’re hooked."
      lead="Start free forever. Upgrade for unlimited songs, MIDI support and streak protection. Cancel anytime — your XP stays saved."
      centered
    >
      <div className="billing-toggle" role="group" aria-label="Billing period">
        <button type="button" aria-pressed={!yearly} onClick={() => setYearly(false)}>Monthly</button>
        <button type="button" aria-pressed={yearly} onClick={() => setYearly(true)}>Yearly · save 50%</button>
      </div>
      <div className="grid grid-2" style={{ textAlign: 'left', maxWidth: 860, margin: '0 auto' }}>
        {plans.map((p) => (
          <PricingCard
            key={p.id}
            name={p.name}
            price={yearly ? p.yearly : p.monthly}
            per={p.monthly === 0 ? 'free forever' : yearly ? '/ year' : '/ month'}
            blurb={p.blurb}
            cta={p.cta}
            features={p.features}
            popular={'popular' in p && Boolean(p.popular)}
          />
        ))}
      </div>
      {!compact ? (
        <p className="small muted" style={{ marginTop: 16 }}>
          Yearly Premium = ${(plans[1].yearly / 12).toFixed(2)}/month billed annually. Family profiles included. Prices in USD.
        </p>
      ) : null}
    </Section>
  );
}

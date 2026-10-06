import { Check, Crown } from '@phosphor-icons/react';
import Button from './Button';

interface PricingCardProps {
  name: string;
  price: number;
  per: string;
  blurb: string;
  cta: string;
  features: string[];
  popular?: boolean;
}

export default function PricingCard({ name, price, per, blurb, cta, features, popular = false }: PricingCardProps) {
  return (
    <article className={`card${popular ? ' plan-pop' : ''}`} aria-label={`${name} plan`}>
      {popular ? (
        <span className="pill amber" style={{ marginBottom: 10 }}>
          <Crown size={14} weight="fill" aria-hidden="true" /> Most popular
        </span>
      ) : null}
      <h3 style={{ fontSize: '1.3rem' }}>{name}</h3>
      <p className="muted small">{blurb}</p>
      <p className="price">
        ${price.toFixed(2)} <small>{per}</small>
      </p>
      <ul className="check-list">
        {features.map((f) => (
          <li key={f}>
            <Check size={18} weight="bold" color={popular ? '#3B1F5C' : '#1D9E56'} aria-hidden="true" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Button to={popular ? '/get-started?plan=premium' : '/get-started?plan=free'} variant={popular ? 'primary' : 'light'} block>
        {cta}
      </Button>
    </article>
  );
}

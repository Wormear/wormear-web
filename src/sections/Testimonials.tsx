import Section from '../components/Section';
import TestimonialCard from '../components/TestimonialCard';
import { testimonials } from '../data/content';

export default function Testimonials() {
  return (
    <Section
      id="stories"
      eyebrow="Stories"
      title="Wish-they-could-players, now playing"
      lead="From nervous restarters to proud parents — here’s what ten playful minutes a day sounds like."
    >
      <div className="grid grid-3">
        {testimonials.map((t) => (
          <TestimonialCard key={t.name} {...t} />
        ))}
      </div>
    </Section>
  );
}

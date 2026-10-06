import Section from '../components/Section';
import FAQAccordion from '../components/FAQAccordion';
import { faqs } from '../data/content';

export default function FAQ() {
  return (
    <Section
      id="faq"
      eyebrow="FAQ"
      title="Questions? Melody answers."
      lead="Everything beginners ask before their first 10 minutes."
    >
      <div style={{ maxWidth: 760 }}>
        <FAQAccordion items={faqs} />
      </div>
    </Section>
  );
}

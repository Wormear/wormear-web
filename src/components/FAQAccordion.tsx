import { useState } from 'react';
import { CaretDown } from '@phosphor-icons/react';

interface FAQAccordionProps {
  items: { q: string; a: string }[];
}

export default function FAQAccordion({ items }: FAQAccordionProps) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div>
      {items.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={f.q} className="faq-item">
            <button
              className="faq-q"
              aria-expanded={isOpen}
              aria-controls={`faq-a-${i}`}
              onClick={() => setOpen(isOpen ? null : i)}
            >
              {f.q}
              <CaretDown size={20} weight="bold" style={{ transform: isOpen ? 'rotate(180deg)' : undefined, flex: 'none' }} aria-hidden="true" />
            </button>
            {isOpen ? (
              <div id={`faq-a-${i}`} className="faq-a">
                {f.a}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

import type { ReactNode } from 'react';

interface SectionProps {
  id?: string;
  eyebrow?: string;
  title?: string;
  lead?: string;
  centered?: boolean;
  children: ReactNode;
}

export default function Section({ id, eyebrow, title, lead, centered = false, children }: SectionProps) {
  return (
    <section id={id} className="block" aria-labelledby={id ? `${id}-title` : undefined}>
      <div className={`wrap${centered ? ' center' : ''}`}>
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        {title ? <h2 id={id ? `${id}-title` : undefined} style={{ marginTop: 12 }}>{title}</h2> : null}
        {lead ? <p className="lead" data-ui-content>{lead}</p> : null}
        <div style={{ marginTop: 26 }} data-ui-stack>{children}</div>
      </div>
    </section>
  );
}

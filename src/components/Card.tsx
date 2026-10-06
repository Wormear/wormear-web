import type { ReactNode } from 'react';

interface CardProps {
  title?: string;
  children: ReactNode;
  pop?: boolean;
}

export default function Card({ title, children, pop = false }: CardProps) {
  return (
    <article className={`card${pop ? ' plan-pop' : ''}`}>
      {title ? <h3>{title}</h3> : null}
      {children}
    </article>
  );
}

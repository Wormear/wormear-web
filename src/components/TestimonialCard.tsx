interface TestimonialCardProps {
  name: string;
  role: string;
  quote: string;
  detail: string;
}

export default function TestimonialCard({ name, role, quote, detail }: TestimonialCardProps) {
  return (
    <figure className="card" style={{ margin: 0 }}>
      <div className="stars" role="img" aria-label="Rated 5 out of 5 stars">★★★★★</div>
      <blockquote style={{ margin: '12px 0', fontWeight: 600 }}>“{quote}”</blockquote>
      <figcaption>
        <strong>{name}</strong>
        <div className="muted small">{role}</div>
        <div style={{ marginTop: 8 }}><span className="pill blue">{detail}</span></div>
      </figcaption>
    </figure>
  );
}

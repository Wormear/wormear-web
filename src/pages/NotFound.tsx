import Button from '../components/Button';
import Mascot from '../components/Mascot';

export default function NotFound() {
  return (
    <main>
      <section className="final-cta" aria-labelledby="missing-title"><div className="wrap-narrow">
        <span className="feature-kicker" style={{ textAlign: 'center' }}>Lost & found</span>
        <h1 id="missing-title">Melody wiggled <span className="accent">off the path.</span></h1>
        <p className="lede">That page does not exist (or it moved). Let’s get you back to music.</p>
        <div className="btn-row" style={{ justifyContent: 'center', marginTop: 20 }}>
          <Button to="/" variant="primary" size="lg">Back home</Button>
          <Button to="/songs" variant="light" size="lg">Browse songs</Button>
          <Button to="/support" variant="ghost">Get help</Button>
        </div>
        <div className="final-visual" aria-hidden="true">
          <Mascot level={2} size={130} />
          <span className="float-pill top">? Wrong turn</span>
          <span className="float-pill bottom">Back to the music</span>
        </div>
      </div></section>
    </main>
  );
}

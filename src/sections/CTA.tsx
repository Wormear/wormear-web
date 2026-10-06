import { ArrowRight } from '@phosphor-icons/react';
import Button from '../components/Button';
import Mascot from '../components/Mascot';

export default function CTA({ title = 'Your first song is 10 minutes away.' }: { title?: string }) {
  return (
    <section className="block" aria-labelledby="cta-title" style={{ paddingTop: 20 }}>
      <div className="wrap">
        <div className="cta-band">
          <Mascot level={12} size={84} />
          <h2 id="cta-title" style={{ marginTop: 12 }}>{title}</h2>
          <p className="lede" style={{ margin: '0 auto', color: '#d9d4ff' }}>
            Join free today. Keep your streak, grow Melody, and turn “I wish I could play” into
            “listen to this!”.
          </p>
          <div className="btn-row" style={{ justifyContent: 'center', marginTop: 22 }}>
            <Button variant="white" to="/get-started">
              Start playing free <ArrowRight size={18} weight="bold" aria-hidden="true" />
            </Button>
            <Button variant="ghost" to="/method">
              <span style={{ color: '#fff' }}>How it works</span>
            </Button>
          </div>
          <p className="small" style={{ marginTop: 14, color: '#bfb8ff' }}>Free forever · No credit card · Cancel anytime</p>
        </div>
      </div>
    </section>
  );
}

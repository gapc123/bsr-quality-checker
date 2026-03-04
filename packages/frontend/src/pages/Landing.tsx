import { Link } from 'react-router-dom';
import { SignedIn } from '@clerk/clerk-react';
import AttleeLogo from '../components/AttleeLogo';

export default function Landing() {
  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh' }}>
      {/* Fixed Nav */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: 'var(--cream)',
        borderBottom: '1px solid var(--beige)',
        padding: '0 48px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <AttleeLogo size={32} showWordmark={true} color="#0F1923" />
        </Link>

        <ul style={{
          display: 'flex',
          gap: '36px',
          listStyle: 'none',
          alignItems: 'center'
        }}>
          <li><a href="#how" style={navLinkStyle}>How it works</a></li>
          <li><a href="#who" style={navLinkStyle}>For consultants</a></li>
          <li><Link to="/security" style={navLinkStyle}>Security</Link></li>
          <SignedIn>
            <li><Link to="/clients" style={{...navLinkStyle, background: 'var(--navy)', color: 'var(--cream)', opacity: 1, padding: '10px 20px', fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase'}}>Dashboard</Link></li>
          </SignedIn>
          <li><a href="mailto:george@attlee.ai" style={{...navLinkStyle, background: 'var(--navy)', color: 'var(--cream)', opacity: 1, padding: '10px 20px', fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase'}}>Request access</a></li>
        </ul>
      </nav>

      {/* Hero */}
      <div style={{
        padding: '160px 48px 100px',
        maxWidth: '1600px',
        margin: '0 auto'
      }}>
        <p className="eyebrow" style={{ marginBottom: '28px' }}>
          BSR Gateway 2 · AI Compliance Checker
        </p>
        <h1 style={{
          fontFamily: 'DM Sans, sans-serif',
          fontWeight: 200,
          fontSize: 'clamp(42px, 6vw, 80px)',
          lineHeight: 1.05,
          letterSpacing: '-0.03em',
          color: 'var(--navy)',
          maxWidth: '820px',
          marginBottom: '32px'
        }}>
          Know if your submission<br />will pass <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--gold)' }}>before</em> you submit.
        </h1>
        <p style={{
          fontSize: '17px',
          fontWeight: 300,
          color: 'var(--muted)',
          maxWidth: '480px',
          lineHeight: 1.7,
          marginBottom: '48px'
        }}>
          75% of Gateway 2 applications are rejected first time. Attlee checks your full pack against every BSR requirement in 5 minutes — and tells you exactly what to fix.
        </p>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <a href="mailto:george@attlee.ai" className="btn-primary">Request early access</a>
          <a href="#how" className="btn-ghost">See how it works →</a>
        </div>
      </div>

      {/* Stat Bar */}
      <div style={{
        background: 'var(--navy)',
        padding: '40px 48px',
        display: 'flex',
        gap: 0,
        justifyContent: 'center'
      }}>
        <StatItem num="75" unit="%" label="of submissions rejected first time" />
        <StatItem num="22" unit="wk" label="average BSR review time" />
        <StatItem num="5" unit="min" label="Attlee full pack analysis" />
        <StatItem num="55" unit="+" label="proprietary BSR checks" />
      </div>

      {/* How It Works */}
      <div id="how" className="section">
        <p className="section-eyebrow">How it works</p>
        <h2 className="section-title">From document pack to submission-ready in minutes.</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '2px'
        }}>
          <StepCard
            num="01"
            title="Upload your pack"
            description="Drop in your full Gateway 2 submission — fire strategy, structural reports, MEP specs, drawings. Any format."
            variant="white"
          />
          <StepCard
            num="02"
            title="Get your readiness score"
            description="Attlee runs 55+ proprietary checks across every document in under 5 minutes. Gaps, inconsistencies, missing requirements — all flagged."
            variant="navy"
          />
          <StepCard
            num="03"
            title="Fix and submit"
            description="Review AI-drafted amendments for each gap. Accept the ones that work, brief your consultants on the rest. Download a submission-ready pack."
            variant="white"
          />
        </div>
      </div>

      {/* Score Visual */}
      <div style={{ background: 'var(--beige)', padding: '100px 48px' }}>
        <div style={{
          maxWidth: '1600px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '80px',
          alignItems: 'center'
        }}>
          <ScoreCard />
          <div>
            <p className="section-eyebrow">The output</p>
            <h2 className="section-title">A clear picture of exactly where you stand.</h2>
            <p style={{
              fontSize: '15px',
              color: 'var(--muted)',
              lineHeight: 1.8,
              fontWeight: 300,
              marginBottom: '32px'
            }}>
              Every check mapped to a specific BSR requirement. Every gap with a proposed fix. Every decision traceable to source — so you can submit with confidence, not crossed fingers.
            </p>
            <SignedIn>
              <Link to="/assess" className="btn-primary">Try it now</Link>
            </SignedIn>
          </div>
        </div>
      </div>

      {/* Who It's For */}
      <div id="who" style={{ background: 'var(--navy)', padding: '100px 48px' }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
          <p className="section-eyebrow">Who it's for</p>
          <h2 className="section-title" style={{ color: 'var(--cream)', marginBottom: '56px' }}>
            Built for everyone with skin in the game.
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '2px'
          }}>
            <WhoCard
              icon={<DesignerIcon />}
              title="Principal Designers"
              description="Validate your submission before it goes in. Protect your professional reputation and your client's programme."
            />
            <WhoCard
              icon={<HousingIcon />}
              title="Housing Associations"
              description="Know your submission is strong before weeks of BSR review. Protect your programme, your funding, your pipeline."
            />
            <WhoCard
              icon={<ConsultantIcon />}
              title="Fire Consultants"
              description="Run a cross-document sense check before your strategy goes into the pack. Catch the inconsistencies before the BSR does."
            />
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{
        padding: '120px 48px',
        textAlign: 'center',
        maxWidth: '900px',
        margin: '0 auto'
      }}>
        <h2 style={{
          fontFamily: 'DM Sans, sans-serif',
          fontWeight: 200,
          fontSize: 'clamp(32px, 5vw, 58px)',
          letterSpacing: '-0.03em',
          lineHeight: 1.1,
          marginBottom: '24px',
          color: 'var(--navy)'
        }}>
          Ready to stop guessing<br />and start <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>knowing?</em>
        </h2>
        <p style={{
          color: 'var(--muted)',
          fontSize: '16px',
          fontWeight: 300,
          marginBottom: '40px',
          lineHeight: 1.7
        }}>
          Attlee is in private beta. We're working with a small number of housing associations and consultancies ahead of full launch.
        </p>
        <a href="mailto:george@attlee.ai" className="btn-primary">Request early access</a>
      </div>

      {/* Footer */}
      <footer style={{
        background: 'var(--navy)',
        padding: '40px 48px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <AttleeLogo size={20} showWordmark={true} color="rgba(255,255,255,0.3)" />
        <p style={{
          fontSize: '11px',
          color: 'rgba(255,255,255,0.2)',
          letterSpacing: '0.06em'
        }}>
          © 2026 Attlee AI Ltd · Getting Britain Building
        </p>
      </footer>
    </div>
  );
}

// Styles
const navLinkStyle: React.CSSProperties = {
  fontSize: '13px',
  letterSpacing: '0.04em',
  color: 'var(--navy)',
  textDecoration: 'none',
  opacity: 0.6,
  transition: 'opacity 0.2s'
};

// Components
function StatItem({ num, unit, label }: { num: string; unit: string; label: string }) {
  return (
    <div style={{
      flex: 1,
      maxWidth: '260px',
      padding: '0 40px',
      borderRight: '1px solid rgba(255,255,255,0.08)'
    }}>
      <div style={{
        fontFamily: 'DM Sans, sans-serif',
        fontWeight: 200,
        fontSize: '44px',
        color: 'var(--cream)',
        letterSpacing: '-0.03em',
        lineHeight: 1,
        marginBottom: '6px'
      }}>
        {num}<span style={{ color: 'var(--gold)' }}>{unit}</span>
      </div>
      <div style={{
        fontSize: '11px',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.35)',
        fontWeight: 400
      }}>
        {label}
      </div>
    </div>
  );
}

function StepCard({ num, title, description, variant }: {
  num: string;
  title: string;
  description: string;
  variant: 'white' | 'navy';
}) {
  return (
    <div style={{
      background: variant === 'navy' ? 'var(--navy)' : 'var(--white)',
      padding: '40px 36px'
    }}>
      <div style={{
        fontFamily: 'DM Sans, sans-serif',
        fontWeight: 200,
        fontSize: '13px',
        letterSpacing: '0.1em',
        color: 'var(--gold)',
        marginBottom: '32px'
      }}>
        {num}
      </div>
      <h3 style={{
        fontFamily: 'DM Sans, sans-serif',
        fontWeight: 300,
        fontSize: '22px',
        letterSpacing: '-0.01em',
        marginBottom: '14px',
        color: variant === 'navy' ? 'var(--cream)' : 'var(--navy)'
      }}>
        {title}
      </h3>
      <p style={{
        fontSize: '14px',
        color: variant === 'navy' ? 'rgba(242,241,238,0.5)' : 'var(--muted)',
        lineHeight: 1.7,
        fontWeight: 300
      }}>
        {description}
      </p>
    </div>
  );
}

function ScoreCard() {
  return (
    <div style={{
      background: 'var(--white)',
      padding: '48px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '40px'
      }}>
        <div>
          <div style={{
            fontSize: '11px',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--muted)'
          }}>
            Readiness Score
          </div>
          <div style={{ fontSize: '11px', color: '#bbb', marginTop: '4px' }}>
            Riverside Tower — GW2 Pack v3
          </div>
        </div>
        <div style={{
          fontFamily: 'DM Sans, sans-serif',
          fontWeight: 200,
          fontSize: '52px',
          color: 'var(--navy)',
          letterSpacing: '-0.04em',
          lineHeight: 1
        }}>
          75<span style={{ color: 'var(--gold)', fontSize: '24px' }}>%</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <CheckRow name="Fire Strategy presence" status="pass" />
        <CheckRow name="Sprinkler system — 18m+" status="pass" />
        <CheckRow name="Evacuation strategy detail" status="warn" />
        <CheckRow name="Height consistency across docs" status="fail" muted />
        <CheckRow name="External wall fire rating" status="fail" muted />
        <CheckRow name="Structural report present" status="pass" />
      </div>
    </div>
  );
}

function CheckRow({ name, status, muted }: {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  muted?: boolean;
}) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 0',
      borderBottom: '1px solid var(--beige)',
      fontSize: '13px'
    }}>
      <span style={{
        color: muted ? 'var(--muted)' : 'var(--navy)',
        fontWeight: muted ? 300 : 400
      }}>
        {name}
      </span>
      <span className={`pill ${status}`}>
        {status === 'warn' ? 'Partial' : status === 'pass' ? 'Pass' : 'Fail'}
      </span>
    </div>
  );
}

function WhoCard({ icon, title, description }: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      padding: '36px 32px',
      border: '1px solid rgba(255,255,255,0.06)'
    }}>
      <div style={{ width: '36px', height: '36px', marginBottom: '24px' }}>
        {icon}
      </div>
      <h4 style={{
        fontFamily: 'DM Sans, sans-serif',
        fontWeight: 300,
        fontSize: '18px',
        color: 'var(--cream)',
        marginBottom: '10px',
        letterSpacing: '-0.01em'
      }}>
        {title}
      </h4>
      <p style={{
        fontSize: '13px',
        color: 'rgba(242,241,238,0.4)',
        lineHeight: 1.7,
        fontWeight: 300
      }}>
        {description}
      </p>
    </div>
  );
}

// Icons
function DesignerIcon() {
  return (
    <svg viewBox="0 0 36 36" fill="none" width="36" height="36">
      <rect x="4" y="10" width="28" height="22" stroke="#C4A882" strokeWidth="2" fill="none"/>
      <polyline points="4,10 18,2 32,10" stroke="#C4A882" strokeWidth="2" fill="none"/>
    </svg>
  );
}

function HousingIcon() {
  return (
    <svg viewBox="0 0 36 36" fill="none" width="36" height="36">
      <circle cx="18" cy="18" r="14" stroke="#C4A882" strokeWidth="2" fill="none"/>
      <polyline points="11,18 16,23 25,13" stroke="#C4A882" strokeWidth="2" fill="none" strokeLinecap="square"/>
    </svg>
  );
}

function ConsultantIcon() {
  return (
    <svg viewBox="0 0 36 36" fill="none" width="36" height="36">
      <rect x="2" y="8" width="32" height="24" stroke="#C4A882" strokeWidth="2" fill="none"/>
      <line x1="9" y1="16" x2="27" y2="16" stroke="#C4A882" strokeWidth="2"/>
      <line x1="9" y1="22" x2="20" y2="22" stroke="#C4A882" strokeWidth="2"/>
    </svg>
  );
}

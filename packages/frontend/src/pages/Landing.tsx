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
            <li><Link to="/clients" style={{...navLinkStyle, background: 'var(--navy)', color: 'var(--cream)', opacity: 1, padding: '12px 24px', fontSize: '15px', letterSpacing: '0.08em', textTransform: 'uppercase'}}>Dashboard</Link></li>
          </SignedIn>
          <li><a href="mailto:george@attlee.ai" style={{...navLinkStyle, background: 'var(--navy)', color: 'var(--cream)', opacity: 1, padding: '12px 24px', fontSize: '15px', letterSpacing: '0.08em', textTransform: 'uppercase'}}>Request access</a></li>
        </ul>
      </nav>

      {/* Hero */}
      <div style={{
        padding: '160px 5% 100px',
        maxWidth: '100%',
        margin: '0 auto',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <p className="eyebrow" style={{ marginBottom: '28px' }}>
          Expert Gateway 2 Review · AI-Accelerated
        </p>
        <h1 style={{
          fontFamily: 'DM Sans, sans-serif',
          fontWeight: 200,
          fontSize: 'clamp(52px, 7vw, 96px)',
          lineHeight: 1.05,
          letterSpacing: '-0.03em',
          color: 'var(--navy)',
          maxWidth: '1200px',
          marginBottom: '32px'
        }}>
          Expert consultants review your pack<br />in <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--gold)' }}>1 week,</em> not 4 weeks.
        </h1>
        <p style={{
          fontSize: '22px',
          fontWeight: 300,
          color: 'var(--muted)',
          maxWidth: '900px',
          lineHeight: 1.7,
          marginBottom: '48px'
        }}>
          75% of Gateway 2 applications are rejected first time. Our expert consultants use AI to review your full pack in 5 minutes, then verify every finding by hand. You get an expert-signed report in 1 week — not generic AI output, but professional consultancy with AI acceleration.
        </p>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', justifyContent: 'center' }}>
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

      {/* Why Deterministic Rules */}
      <div style={{ padding: '100px 5%', background: 'var(--white)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p className="section-eyebrow" style={{ textAlign: 'center' }}>Why Deterministic Rules Matter</p>
          <p style={{
            textAlign: 'center',
            fontSize: '17px',
            color: 'var(--muted)',
            marginBottom: '20px',
            fontWeight: 300
          }}>
            Speed of AI, certainty of deterministic rules
          </p>
          <h2 className="section-title" style={{ textAlign: 'center', margin: '0 auto 16px', maxWidth: '900px' }}>
            You can't be <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>probably</em> compliant.
          </h2>
          <p style={{
            textAlign: 'center',
            fontSize: '20px',
            color: 'var(--navy)',
            marginBottom: '48px',
            fontWeight: 300,
            maxWidth: '800px',
            margin: '0 auto 48px'
          }}>
            AI is probabilistic. Building regulations are not.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '48px', marginBottom: '64px' }}>
            <div style={{ padding: '40px', background: '#FDF0EE', border: '2px solid #a04040' }}>
              <h3 style={{
                fontFamily: 'DM Sans, sans-serif',
                fontWeight: 300,
                fontSize: '24px',
                color: '#a04040',
                marginBottom: '16px'
              }}>
                ❌ Pure AI Approach (ChatGPT/Claude)
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li style={{ fontSize: '17px', color: 'var(--muted)', lineHeight: 1.6 }}>
                  <strong>Probabilistic outputs:</strong> Same input can produce different answers each time
                </li>
                <li style={{ fontSize: '17px', color: 'var(--muted)', lineHeight: 1.6 }}>
                  <strong>Hallucinations:</strong> Invents BSR requirements that don't exist
                </li>
                <li style={{ fontSize: '17px', color: 'var(--muted)', lineHeight: 1.6 }}>
                  <strong>No traceability:</strong> Can't cite specific regulation clauses
                </li>
                <li style={{ fontSize: '17px', color: 'var(--muted)', lineHeight: 1.6 }}>
                  <strong>Legally indefensible:</strong> BSR won't accept "AI said so"
                </li>
              </ul>
            </div>

            <div style={{ padding: '40px', background: '#e8f2e8', border: '2px solid #2d6a2d' }}>
              <h3 style={{
                fontFamily: 'DM Sans, sans-serif',
                fontWeight: 300,
                fontSize: '24px',
                color: '#2d6a2d',
                marginBottom: '16px'
              }}>
                ✓ Attlee's Deterministic + AI Approach
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li style={{ fontSize: '17px', color: 'var(--muted)', lineHeight: 1.6 }}>
                  <strong>Deterministic rules:</strong> 55 fixed checks that always work the same way
                </li>
                <li style={{ fontSize: '17px', color: 'var(--muted)', lineHeight: 1.6 }}>
                  <strong>AI for extraction:</strong> Uses AI only to find data in documents (fast)
                </li>
                <li style={{ fontSize: '17px', color: 'var(--muted)', lineHeight: 1.6 }}>
                  <strong>Expert verification:</strong> Every finding reviewed by qualified consultants
                </li>
                <li style={{ fontSize: '17px', color: 'var(--muted)', lineHeight: 1.6 }}>
                  <strong>Traceable & defensible:</strong> Every gap linked to specific BSR regulation
                </li>
              </ul>
            </div>
          </div>

          <div style={{
            background: 'var(--navy)',
            padding: '40px',
            textAlign: 'center',
            border: '2px solid var(--gold)'
          }}>
            <p style={{
              fontSize: '20px',
              fontFamily: 'DM Sans, sans-serif',
              fontWeight: 300,
              color: 'var(--cream)',
              lineHeight: 1.6,
              maxWidth: '900px',
              margin: '0 auto'
            }}>
              <strong style={{ color: 'var(--gold)' }}>What this means:</strong> AI models are inherently probabilistic — they generate responses based on statistical patterns, not fixed logic. For BSR compliance, you need deterministic outcomes: the same submission checked twice must produce the same result. We use deterministic rules to check compliance (reliable, traceable), and AI only to extract data from documents (where speed matters, not legal certainty).
            </p>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div id="how" style={{ padding: '100px 5%' }}>
        <p className="section-eyebrow">How it works</p>
        <h2 className="section-title">Expert review in 1 week — AI does the heavy lifting in 5 minutes, our consultants verify everything.</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '2px'
        }}>
          <StepCard
            num="01"
            title="You submit your pack"
            description="Secure upload of your full Gateway 2 submission — fire strategy, structural reports, MEP specs, drawings. We handle it from here."
            variant="white"
          />
          <StepCard
            num="02"
            title="AI + human review"
            description="Our AI reviews all 55+ BSR checks in 5 minutes. Then our expert consultants verify every finding, draft amendments, and sign off the report."
            variant="navy"
          />
          <StepCard
            num="03"
            title="1-week delivery"
            description="You receive an expert-signed report with actionable amendments. Not AI output — professional consultancy accelerated by AI."
            variant="white"
          />
        </div>
      </div>

      {/* Score Visual */}
      <div style={{ background: 'var(--beige)', padding: '100px 5%' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '80px',
          alignItems: 'center'
        }}>
          <ScoreCard />
          <div>
            <p className="section-eyebrow">Expert-verified output</p>
            <h2 className="section-title">Professional consultant reports — delivered in 1 week, not 4.</h2>
            <p style={{
              fontSize: '15px',
              color: 'var(--muted)',
              lineHeight: 1.8,
              fontWeight: 300,
              marginBottom: '32px'
            }}>
              AI identifies every BSR requirement gap in 5 minutes. Our expert consultants verify each finding by hand, draft professional amendments, and sign off the final report. Every gap traced to BSR source. Every decision validated by an expert. This isn't ChatGPT output — it's professional consultancy, accelerated by AI.
            </p>
            <a href="mailto:george@attlee.ai" className="btn-primary">Request consultation</a>
          </div>
        </div>
      </div>

      {/* Who It's For */}
      <div id="who" style={{ background: 'var(--navy)', padding: '100px 5%' }}>
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

      {/* CTA */}
      <div style={{
        padding: '120px 5%',
        textAlign: 'center'
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
  fontSize: '16px',
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
        fontSize: '54px',
        color: 'var(--cream)',
        letterSpacing: '-0.03em',
        lineHeight: 1,
        marginBottom: '6px'
      }}>
        {num}<span style={{ color: 'var(--gold)' }}>{unit}</span>
      </div>
      <div style={{
        fontSize: '14px',
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
        fontSize: '16px',
        letterSpacing: '0.1em',
        color: 'var(--gold)',
        marginBottom: '32px'
      }}>
        {num}
      </div>
      <h3 style={{
        fontFamily: 'DM Sans, sans-serif',
        fontWeight: 300,
        fontSize: '28px',
        letterSpacing: '-0.01em',
        marginBottom: '14px',
        color: variant === 'navy' ? 'var(--cream)' : 'var(--navy)'
      }}>
        {title}
      </h3>
      <p style={{
        fontSize: '17px',
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

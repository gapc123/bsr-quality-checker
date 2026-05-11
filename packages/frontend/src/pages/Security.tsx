import { useState } from 'react';
import { Link } from 'react-router-dom';
import AttleeLogo from '../components/AttleeLogo';

type AccordionSection = 'claude' | 'soc2' | 'data-retention' | 'infrastructure' | 'access' | null;

export default function Security() {
  const [expandedSection, setExpandedSection] = useState<AccordionSection>('claude');

  const toggleSection = (section: AccordionSection) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div style={{ background: 'var(--ink-1)', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(17,18,22,0.85)',
        backdropFilter: 'blur(12px)'
      }}>
        <div style={{ padding: '16px 5%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link to="/" style={{ textDecoration: 'none' }}>
              <AttleeLogo size={32} showWordmark={true} />
            </Link>

            <nav style={{ display: 'flex', alignItems: 'center', gap: '36px' }}>
              <Link to="/" style={navLinkStyle}>Home</Link>
              <Link to="/security" style={{...navLinkStyle, opacity: 1, fontWeight: 400}}>Security</Link>
              <a href="mailto:george@attlee.ai" style={{...navLinkStyle, background: 'var(--flame)', color: 'var(--ink-0)', opacity: 1, padding: '10px 20px', fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', borderRadius: '999px'}}>Contact us</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section style={{
        padding: '120px 5% 80px',
        background: 'var(--ink-1)',
        textAlign: 'center'
      }}>
        <p className="eyebrow" style={{ marginBottom: '28px' }}>Data Security & Compliance</p>
        <h1 style={{
          fontFamily: 'var(--font-sans)',
          fontWeight: 200,
          fontSize: 'clamp(38px, 5vw, 68px)',
          lineHeight: 1.1,
          letterSpacing: '-0.03em',
          color: 'var(--type-hi)',
          margin: '0 auto 32px',
          maxWidth: '1000px'
        }}>
          Enterprise-grade security.<br />
          Your documents <em style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400, color: 'var(--flame-soft)' }}>never</em> train AI models.
        </h1>
        <p style={{
          fontSize: '17px',
          fontWeight: 300,
          color: 'var(--type-mid)',
          maxWidth: '700px',
          lineHeight: 1.7,
          margin: '0 auto'
        }}>
          Your building safety documents are processed exclusively via Anthropic's Claude API — a SOC 2 Type II and ISO 27001 certified platform. Your data is never used to train AI models.
        </p>
      </section>

      {/* Trust Badges */}
      <section style={{
        padding: '60px 5%',
        background: 'var(--ink-3)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        borderBottom: '1px solid rgba(255,255,255,0.08)'
      }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '60px'
        }}>
          <TrustBadge
            title="SOC 2 Type II"
            subtitle="Anthropic (Claude API)"
            icon="🛡️"
          />
          <TrustBadge
            title="ISO 27001"
            subtitle="Anthropic (Claude API)"
            icon="🔒"
          />
          <TrustBadge
            title="UK Data Residency"
            subtitle="GDPR compliant"
            icon="📍"
          />
          <TrustBadge
            title="Zero Training"
            subtitle="Never used for AI models"
            icon="🚫"
          />
        </div>
      </section>

      {/* Main Content */}
      <section style={{ padding: '100px 5%', background: 'var(--ink-2)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h2 style={{
            fontFamily: 'var(--font-sans)',
            fontWeight: 200,
            fontSize: 'clamp(28px, 4vw, 42px)',
            letterSpacing: '-0.02em',
            color: 'var(--type-hi)',
            marginBottom: '64px',
            textAlign: 'center'
          }}>
            How we protect your data
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Accordion
              title="We use Claude API (Anthropic) — not ChatGPT"
              isExpanded={expandedSection === 'claude'}
              onToggle={() => toggleSection('claude')}
            >
              <div style={{ padding: '32px', background: 'var(--ink-3)' }}>
                <p style={{ fontSize: '15px', color: 'var(--type-hi)', fontWeight: 400, marginBottom: '24px' }}>
                  Why Claude API specifically protects your data:
                </p>
                <div style={{ display: 'grid', gap: '16px' }}>
                  <SecurityPoint text="Anthropic holds SOC 2 Type II and ISO 27001 certifications — independently audited security controls" />
                  <SecurityPoint text="Your data is NEVER used to train AI models — Anthropic excludes API customers from training" />
                  <SecurityPoint text="30-day data retention at Anthropic — processed data is automatically deleted" />
                  <SecurityPoint text="No third-party data sharing — Anthropic never sells customer data" />
                  <SecurityPoint text="Enterprise-grade infrastructure — same Anthropic platform used by Fortune 500 companies" />
                </div>
                <div style={{
                  marginTop: '24px',
                  padding: '16px',
                  background: 'var(--ink-2)',
                  border: '1px solid var(--flame)'
                }}>
                  <p style={{ fontSize: '13px', color: 'var(--type-mid)' }}>
                    <strong style={{ color: 'var(--flame)' }}>Learn more:</strong>{' '}
                    <a
                      href="https://www.anthropic.com/security"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--type-hi)', textDecoration: 'underline' }}
                    >
                      Anthropic Security Documentation
                    </a>
                  </p>
                </div>
              </div>
            </Accordion>

            <Accordion
              title="SOC 2 Type II & ISO 27001 — Anthropic's Certifications"
              isExpanded={expandedSection === 'soc2'}
              onToggle={() => toggleSection('soc2')}
            >
              <div style={{ padding: '32px', background: 'var(--ink-3)' }}>
                <p style={{ fontSize: '14px', color: 'var(--flame-soft)', marginBottom: '20px', lineHeight: 1.6 }}>
                  These certifications are held by <strong>Anthropic</strong>, the company behind Claude AI. Attlee uses Anthropic's Claude API, meaning your data is processed on their certified infrastructure. Attlee itself is not independently certified under SOC 2 or ISO 27001.
                </p>
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontFamily: 'var(--font-sans)', fontWeight: 300, fontSize: '16px', color: 'var(--type-hi)', marginBottom: '8px' }}>
                    Anthropic SOC 2 Type II
                  </h4>
                  <p style={{ fontSize: '14px', color: 'var(--type-mid)', lineHeight: 1.7 }}>
                    SOC 2 Type II is an independent audit framework covering security, availability, processing integrity, confidentiality, and privacy. Anthropic's Type II certification means their controls are tested continuously, not just at a point in time.
                  </p>
                </div>
                <div>
                  <h4 style={{ fontFamily: 'var(--font-sans)', fontWeight: 300, fontSize: '16px', color: 'var(--type-hi)', marginBottom: '8px' }}>
                    Anthropic ISO 27001
                  </h4>
                  <p style={{ fontSize: '14px', color: 'var(--type-mid)', lineHeight: 1.7 }}>
                    ISO 27001 is the international standard for information security management systems. Anthropic holds this certification, covering the infrastructure on which your documents are processed.
                  </p>
                </div>
              </div>
            </Accordion>

            <Accordion
              title="Data Retention & Deletion"
              isExpanded={expandedSection === 'data-retention'}
              onToggle={() => toggleSection('data-retention')}
            >
              <div style={{ padding: '32px', background: 'var(--ink-3)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                  <div style={{ padding: '20px', background: 'var(--ink-2)' }}>
                    <h5 style={{ fontFamily: 'var(--font-sans)', fontWeight: 300, fontSize: '15px', color: 'var(--type-hi)', marginBottom: '12px' }}>
                      Anthropic Claude API
                    </h5>
                    <p style={{ fontSize: '13px', color: 'var(--type-mid)', lineHeight: 1.6 }}>
                      Documents sent to Claude API are retained for 30 days for abuse monitoring, then automatically deleted. They are never used for model training.
                    </p>
                  </div>
                  <div style={{ padding: '20px', background: 'var(--ink-2)' }}>
                    <h5 style={{ fontFamily: 'var(--font-sans)', fontWeight: 300, fontSize: '15px', color: 'var(--type-hi)', marginBottom: '12px' }}>
                      Our Database
                    </h5>
                    <p style={{ fontSize: '13px', color: 'var(--type-mid)', lineHeight: 1.6 }}>
                      Your submission data is retained for the duration of your project. Request deletion anytime — we will permanently remove all data within 7 days.
                    </p>
                  </div>
                </div>
              </div>
            </Accordion>

            <Accordion
              title="Infrastructure & Application Security"
              isExpanded={expandedSection === 'infrastructure'}
              onToggle={() => toggleSection('infrastructure')}
            >
              <div style={{ padding: '32px', background: 'var(--ink-3)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
                  <SecurityFeature title="Secure Authentication" description="Clerk enterprise authentication with MFA support" />
                  <SecurityFeature title="HTTPS / TLS 1.3" description="All data encrypted in transit" />
                  <SecurityFeature title="Encrypted Database" description="PostgreSQL with encryption at rest" />
                  <SecurityFeature title="Environment Isolation" description="API keys secured as environment variables" />
                  <SecurityFeature title="Regular Updates" description="Automated security patch management" />
                  <SecurityFeature title="24/7 Monitoring" description="Uptime and anomaly detection" />
                </div>
              </div>
            </Accordion>

            <Accordion
              title="Access Controls & Permissions"
              isExpanded={expandedSection === 'access'}
              onToggle={() => toggleSection('access')}
            >
              <div style={{ padding: '32px', background: 'var(--ink-3)' }}>
                <div style={{ display: 'grid', gap: '16px' }}>
                  <SecurityPoint text="Role-based access control (RBAC) — users only see their assigned clients" />
                  <SecurityPoint text="Multi-factor authentication (MFA) — available for all accounts" />
                  <SecurityPoint text="Audit logging — all document access and modifications logged" />
                  <SecurityPoint text="Principle of least privilege — engineering access is limited and time-boxed" />
                  <SecurityPoint text="Client isolation — your data is logically separated from other clients" />
                </div>
              </div>
            </Accordion>
          </div>

          {/* Summary */}
          <div style={{
            marginTop: '80px',
            padding: '48px',
            background: 'var(--ink-0)',
            textAlign: 'center',
            border: '1px solid var(--flame)'
          }}>
            <p style={{
              fontSize: '18px',
              fontFamily: 'var(--font-sans)',
              fontWeight: 300,
              color: 'var(--type-hi)',
              marginBottom: '16px'
            }}>
              Enterprise-grade AI security from Anthropic, combined with professional data handling practices.
            </p>
            <p style={{ fontSize: '14px', color: 'rgba(242,241,238,0.5)' }}>
              Questions about our security? Contact us at{' '}
              <a href="mailto:george@attlee.ai" style={{ color: 'var(--flame)', textDecoration: 'underline' }}>
                george@attlee.ai
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        background: 'var(--ink-0)',
        padding: '40px 5%',
        borderTop: '1px solid rgba(255,255,255,0.08)'
      }}>
        <div style={{
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
            © 2026 Attlee AI Ltd · Get Britain Building
          </p>
        </div>
      </footer>
    </div>
  );
}

// Styles
const navLinkStyle: React.CSSProperties = {
  fontSize: '13px',
  letterSpacing: '0.04em',
  color: 'var(--type-hi)',
  textDecoration: 'none',
  opacity: 0.6,
  transition: 'opacity 0.2s'
};

// Components
function TrustBadge({ title, subtitle, icon }: { title: string; subtitle: string; icon: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{ fontSize: '36px' }}>{icon}</div>
      <div>
        <p style={{ color: 'var(--type-hi)', fontSize: '15px', fontWeight: 400, marginBottom: '4px' }}>{title}</p>
        <p style={{ color: 'rgba(242,241,238,0.4)', fontSize: '12px' }}>{subtitle}</p>
      </div>
    </div>
  );
}

function SecurityPoint({ text }: { text: string }) {
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
      <span style={{ color: 'var(--flame)', fontSize: '18px', flexShrink: 0 }}>✓</span>
      <p style={{ fontSize: '14px', color: 'var(--type-mid)', lineHeight: 1.6 }}>{text}</p>
    </div>
  );
}

function SecurityFeature({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h5 style={{ fontFamily: 'var(--font-sans)', fontWeight: 300, fontSize: '14px', color: 'var(--type-hi)', marginBottom: '8px' }}>
        {title}
      </h5>
      <p style={{ fontSize: '13px', color: 'var(--type-mid)', lineHeight: 1.6 }}>
        {description}
      </p>
    </div>
  );
}

interface AccordionProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function Accordion({ title, isExpanded, onToggle, children }: AccordionProps) {
  return (
    <div style={{
      background: isExpanded ? 'var(--ink-3)' : 'var(--ink-2)',
      border: isExpanded ? '1px solid var(--flame)' : '1px solid rgba(255,255,255,0.08)',
      transition: 'all 0.2s'
    }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px 32px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          transition: 'background 0.2s'
        }}
      >
        <h3 style={{
          fontFamily: 'var(--font-sans)',
          fontWeight: 300,
          fontSize: '18px',
          color: 'var(--type-hi)',
          textAlign: 'left'
        }}>
          {title}
        </h3>
        <span style={{
          fontSize: '24px',
          color: 'var(--flame)',
          transition: 'transform 0.2s',
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
        }}>
          ↓
        </span>
      </button>
      {isExpanded && children}
    </div>
  );
}

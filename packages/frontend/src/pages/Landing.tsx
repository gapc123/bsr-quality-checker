import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SignedIn } from '@clerk/clerk-react';
import AttleeLogo from '../components/AttleeLogo';

type HowTab = 'overview' | 'upload' | 'analysis' | 'delivery';

export default function Landing() {
  const [activeHowTab, setActiveHowTab] = useState<HowTab>('overview');
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
          Expert Gateway 2 Review · AI + Proprietary Deterministic Rules
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
          75% of Gateway 2 applications are rejected first time. AI drafts findings in 5 minutes within our closed-tenancy system, proprietary deterministic rules validate consistency, then expert consultants verify every finding by hand. You get an expert-signed report in 1 week — not raw AI output, but AI validated by deterministic rules and professional experts.
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
                ✓ Attlee's Approach: Deterministic Rules + AI
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li style={{ fontSize: '17px', color: 'var(--muted)', lineHeight: 1.6 }}>
                  <strong>AI drafts findings:</strong> Rapid analysis across documents in closed-tenancy architecture
                </li>
                <li style={{ fontSize: '17px', color: 'var(--muted)', lineHeight: 1.6 }}>
                  <strong>Proprietary rules validate:</strong> 55 deterministic checks layered over AI ensure consistency
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
              <strong style={{ color: 'var(--gold)' }}>What this means:</strong> AI models are inherently probabilistic — they generate responses based on statistical patterns, not fixed logic. For BSR compliance, you need deterministic outcomes. AI drafts findings across your documents at speed within our closed-tenancy system, then our proprietary deterministic rules validate every output for consistency and accuracy. We've built an architecture where AI does the first draft and deterministic logic ensures reliability.
            </p>
          </div>
        </div>
      </div>

      {/* How It Works - Interactive Tabbed Section */}
      <div id="how" style={{ padding: '100px 5%', background: 'var(--white)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <p className="section-eyebrow" style={{ textAlign: 'center' }}>How it works</p>
          <h2 className="section-title" style={{ textAlign: 'center', marginBottom: '48px' }}>
            Expert review in 1 week — AI drafts in 5 minutes, proprietary deterministic rules validate, consultants verify everything.
          </h2>

          {/* Tab Navigation */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '48px',
            flexWrap: 'wrap'
          }}>
            <HowTabButton
              active={activeHowTab === 'overview'}
              onClick={() => setActiveHowTab('overview')}
            >
              Overview
            </HowTabButton>
            <HowTabButton
              active={activeHowTab === 'upload'}
              onClick={() => setActiveHowTab('upload')}
              number="01"
            >
              Secure Upload
            </HowTabButton>
            <HowTabButton
              active={activeHowTab === 'analysis'}
              onClick={() => setActiveHowTab('analysis')}
              number="02"
            >
              AI + Expert Analysis
            </HowTabButton>
            <HowTabButton
              active={activeHowTab === 'delivery'}
              onClick={() => setActiveHowTab('delivery')}
              number="03"
            >
              1-Week Delivery
            </HowTabButton>
          </div>

          {/* Tab Content */}
          <div style={{
            background: 'var(--cream)',
            border: '2px solid var(--beige)',
            padding: '48px',
            minHeight: '400px'
          }}>
            {activeHowTab === 'overview' && (
              <div>
                <h3 style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '28px',
                  fontWeight: 200,
                  color: 'var(--navy)',
                  marginBottom: '24px',
                  letterSpacing: '-0.02em'
                }}>
                  Three steps from submission to expert-verified report
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '32px',
                  marginTop: '40px'
                }}>
                  <div style={{ padding: '32px', background: 'var(--white)', border: '1px solid var(--beige)' }}>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '14px',
                      letterSpacing: '0.15em',
                      color: 'var(--gold)',
                      marginBottom: '16px',
                      fontWeight: 400
                    }}>
                      01 — UPLOAD
                    </div>
                    <h4 style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '20px',
                      fontWeight: 300,
                      color: 'var(--navy)',
                      marginBottom: '12px'
                    }}>
                      You submit your pack
                    </h4>
                    <p style={{ fontSize: '15px', color: 'var(--muted)', lineHeight: 1.7 }}>
                      Secure upload of your full Gateway 2 submission — fire strategy, structural reports, MEP specs, drawings.
                    </p>
                  </div>
                  <div style={{ padding: '32px', background: 'var(--navy)', border: '1px solid var(--navy)' }}>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '14px',
                      letterSpacing: '0.15em',
                      color: 'var(--gold)',
                      marginBottom: '16px',
                      fontWeight: 400
                    }}>
                      02 — ANALYSIS
                    </div>
                    <h4 style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '20px',
                      fontWeight: 300,
                      color: 'var(--cream)',
                      marginBottom: '12px'
                    }}>
                      AI + expert review
                    </h4>
                    <p style={{ fontSize: '15px', color: 'rgba(242,241,238,0.7)', lineHeight: 1.7 }}>
                      AI drafts findings in 5 minutes within our closed-tenancy system. 55+ proprietary deterministic rules validate outputs. Expert consultants verify every finding.
                    </p>
                  </div>
                  <div style={{ padding: '32px', background: 'var(--white)', border: '1px solid var(--beige)' }}>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '14px',
                      letterSpacing: '0.15em',
                      color: 'var(--gold)',
                      marginBottom: '16px',
                      fontWeight: 400
                    }}>
                      03 — DELIVERY
                    </div>
                    <h4 style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '20px',
                      fontWeight: 300,
                      color: 'var(--navy)',
                      marginBottom: '12px'
                    }}>
                      1-week turnaround
                    </h4>
                    <p style={{ fontSize: '15px', color: 'var(--muted)', lineHeight: 1.7 }}>
                      Expert-signed report with actionable amendments. Professional consultancy accelerated by AI.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeHowTab === 'upload' && (
              <div>
                <div style={{ display: 'flex', gap: '48px', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '14px',
                      letterSpacing: '0.15em',
                      color: 'var(--gold)',
                      marginBottom: '16px',
                      fontWeight: 400
                    }}>
                      STEP 01 — SECURE UPLOAD
                    </div>
                    <h3 style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '32px',
                      fontWeight: 200,
                      color: 'var(--navy)',
                      marginBottom: '24px',
                      letterSpacing: '-0.02em'
                    }}>
                      Submit your Gateway 2 pack securely
                    </h3>
                    <p style={{ fontSize: '17px', color: 'var(--muted)', lineHeight: 1.8, marginBottom: '32px' }}>
                      Upload your complete submission pack through our SOC 2 compliant platform. We accept all standard Gateway 2 documents including fire strategies, structural reports, MEP specifications, and architectural drawings.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <span style={{ color: 'var(--gold)', fontSize: '20px', marginTop: '2px' }}>✓</span>
                        <div>
                          <strong style={{ color: 'var(--navy)', fontSize: '15px', fontWeight: 500 }}>SOC 2 Type II certified</strong>
                          <p style={{ fontSize: '14px', color: 'var(--muted)', marginTop: '4px' }}>
                            Your documents are protected by enterprise-grade security with independent audits
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <span style={{ color: 'var(--gold)', fontSize: '20px', marginTop: '2px' }}>✓</span>
                        <div>
                          <strong style={{ color: 'var(--navy)', fontSize: '15px', fontWeight: 500 }}>UK data residency</strong>
                          <p style={{ fontSize: '14px', color: 'var(--muted)', marginTop: '4px' }}>
                            All data processed and stored within the UK, fully GDPR compliant
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <span style={{ color: 'var(--gold)', fontSize: '20px', marginTop: '2px' }}>✓</span>
                        <div>
                          <strong style={{ color: 'var(--navy)', fontSize: '15px', fontWeight: 500 }}>Encrypted transmission</strong>
                          <p style={{ fontSize: '14px', color: 'var(--muted)', marginTop: '4px' }}>
                            TLS 1.3 encryption for all file transfers, encrypted storage at rest
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{
                    flex: 1,
                    background: 'var(--navy)',
                    padding: '40px',
                    border: '1px solid var(--gold)'
                  }}>
                    <h4 style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '18px',
                      fontWeight: 300,
                      color: 'var(--cream)',
                      marginBottom: '20px'
                    }}>
                      Typical submission includes:
                    </h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {[
                        'Fire strategy report',
                        'Structural engineer report',
                        'MEP specifications',
                        'Architectural drawings',
                        'Construction details',
                        'Material specifications',
                        'Compliance statements'
                      ].map((item, i) => (
                        <li key={i} style={{
                          fontSize: '15px',
                          color: 'rgba(242,241,238,0.8)',
                          marginBottom: '12px',
                          paddingLeft: '24px',
                          position: 'relative'
                        }}>
                          <span style={{
                            position: 'absolute',
                            left: 0,
                            color: 'var(--gold)'
                          }}>→</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeHowTab === 'analysis' && (
              <div>
                <div style={{ display: 'flex', gap: '48px', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '14px',
                      letterSpacing: '0.15em',
                      color: 'var(--gold)',
                      marginBottom: '16px',
                      fontWeight: 400
                    }}>
                      STEP 02 — AI + EXPERT ANALYSIS
                    </div>
                    <h3 style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '32px',
                      fontWeight: 200,
                      color: 'var(--navy)',
                      marginBottom: '24px',
                      letterSpacing: '-0.02em'
                    }}>
                      AI drafts → Proprietary rules validate → Expert verification
                    </h3>
                    <p style={{ fontSize: '17px', color: 'var(--muted)', lineHeight: 1.8, marginBottom: '32px' }}>
                      Our closed-tenancy system combines three layers: AI drafts findings across your 500+ page pack in minutes, 55+ proprietary deterministic rules validate every output for consistency, then expert consultants verify each finding by hand. Not raw AI output — AI validated by deterministic rules and expert review.
                    </p>

                    <div style={{ background: 'var(--beige)', padding: '24px', marginBottom: '24px', border: '1px solid var(--gold)' }}>
                      <h4 style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '16px',
                        fontWeight: 400,
                        color: 'var(--navy)',
                        marginBottom: '16px'
                      }}>
                        Why this three-layer approach?
                      </h4>
                      <div style={{ display: 'grid', gap: '16px' }}>
                        <div>
                          <strong style={{ color: 'var(--navy)', fontSize: '14px' }}>Layer 1: AI Drafting (Closed Tenancy)</strong>
                          <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px', lineHeight: 1.6 }}>
                            AI analyzes your documents and drafts findings at speed within our secure closed-tenancy architecture.
                          </p>
                        </div>
                        <div>
                          <strong style={{ color: 'var(--navy)', fontSize: '14px' }}>Layer 2: Proprietary Deterministic Validation</strong>
                          <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px', lineHeight: 1.6 }}>
                            55+ proprietary fixed rules validate AI outputs for consistency. Same input = same result, every time.
                          </p>
                        </div>
                        <div>
                          <strong style={{ color: 'var(--navy)', fontSize: '14px' }}>Layer 3: Expert Verification</strong>
                          <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px', lineHeight: 1.6 }}>
                            Qualified consultants review every finding, draft amendments, and sign off the report.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '16px' }}>
                      <div style={{ flex: 1, background: 'var(--white)', padding: '20px', border: '1px solid var(--beige)' }}>
                        <div style={{ fontSize: '32px', fontFamily: 'DM Sans, sans-serif', fontWeight: 200, color: 'var(--navy)', marginBottom: '8px' }}>
                          55+
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                          Proprietary BSR checks
                        </div>
                      </div>
                      <div style={{ flex: 1, background: 'var(--white)', padding: '20px', border: '1px solid var(--beige)' }}>
                        <div style={{ fontSize: '32px', fontFamily: 'DM Sans, sans-serif', fontWeight: 200, color: 'var(--navy)', marginBottom: '8px' }}>
                          5min
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                          AI analysis time
                        </div>
                      </div>
                      <div style={{ flex: 1, background: 'var(--white)', padding: '20px', border: '1px solid var(--beige)' }}>
                        <div style={{ fontSize: '32px', fontFamily: 'DM Sans, sans-serif', fontWeight: 200, color: 'var(--navy)', marginBottom: '8px' }}>
                          100%
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                          Expert verified
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeHowTab === 'delivery' && (
              <div>
                <div style={{ display: 'flex', gap: '48px', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '14px',
                      letterSpacing: '0.15em',
                      color: 'var(--gold)',
                      marginBottom: '16px',
                      fontWeight: 400
                    }}>
                      STEP 03 — 1-WEEK DELIVERY
                    </div>
                    <h3 style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '32px',
                      fontWeight: 200,
                      color: 'var(--navy)',
                      marginBottom: '24px',
                      letterSpacing: '-0.02em'
                    }}>
                      Expert-signed readiness report in 1 week
                    </h3>
                    <p style={{ fontSize: '17px', color: 'var(--muted)', lineHeight: 1.8, marginBottom: '32px' }}>
                      You receive a comprehensive, expert-signed report that identifies every gap, provides actionable amendments, and traces every finding to the specific BSR regulation. This isn't ChatGPT output — it's professional consultancy, accelerated by AI.
                    </p>

                    <div style={{ marginBottom: '32px' }}>
                      <h4 style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '18px',
                        fontWeight: 300,
                        color: 'var(--navy)',
                        marginBottom: '20px'
                      }}>
                        Your report includes:
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {[
                          { title: 'Executive summary', desc: 'Overall readiness score and critical issues requiring immediate attention' },
                          { title: 'Detailed gap analysis', desc: '55+ criteria assessed with pass/fail status and specific evidence citations' },
                          { title: 'Actionable amendments', desc: 'Precise changes needed for each gap, drafted by expert consultants' },
                          { title: 'BSR traceability', desc: 'Every finding linked to specific regulation clause with page references' },
                          { title: 'Expert sign-off', desc: 'Report signed by qualified consultant — legally defensible documentation' }
                        ].map((item, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                            <span style={{ color: 'var(--gold)', fontSize: '20px', marginTop: '2px' }}>✓</span>
                            <div>
                              <strong style={{ color: 'var(--navy)', fontSize: '15px', fontWeight: 500 }}>{item.title}</strong>
                              <p style={{ fontSize: '14px', color: 'var(--muted)', marginTop: '4px' }}>
                                {item.desc}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    flex: 1,
                    background: 'var(--navy)',
                    padding: '40px',
                    border: '1px solid var(--gold)'
                  }}>
                    <h4 style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '18px',
                      fontWeight: 300,
                      color: 'var(--cream)',
                      marginBottom: '20px'
                    }}>
                      Timeline comparison
                    </h4>
                    <div style={{ marginBottom: '32px' }}>
                      <div style={{ fontSize: '13px', color: 'rgba(242,241,238,0.5)', marginBottom: '8px', letterSpacing: '0.08em' }}>
                        TRADITIONAL CONSULTANTS
                      </div>
                      <div style={{ fontSize: '36px', fontFamily: 'DM Sans, sans-serif', fontWeight: 200, color: 'rgba(242,241,238,0.4)', marginBottom: '8px' }}>
                        2–4 weeks
                      </div>
                      <div style={{ fontSize: '14px', color: 'rgba(242,241,238,0.5)' }}>
                        Manual review, subjective, no traceability
                      </div>
                    </div>
                    <div style={{ borderTop: '1px solid rgba(242,241,238,0.2)', paddingTop: '32px' }}>
                      <div style={{ fontSize: '13px', color: 'var(--gold)', marginBottom: '8px', letterSpacing: '0.08em' }}>
                        ATTLEE
                      </div>
                      <div style={{ fontSize: '48px', fontFamily: 'DM Sans, sans-serif', fontWeight: 200, color: 'var(--cream)', marginBottom: '8px' }}>
                        1 week
                      </div>
                      <div style={{ fontSize: '14px', color: 'rgba(242,241,238,0.8)' }}>
                        Expert-signed, deterministic rules, full BSR traceability
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
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
              AI drafts findings in 5 minutes within our closed-tenancy system. Proprietary deterministic rules validate consistency. Expert consultants verify each finding by hand, draft amendments, and sign off the final report. Every gap traced to BSR source. Not raw AI output — AI validated by deterministic rules and expert review.
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

      {/* Service Options */}
      <div style={{ padding: '100px 5%', background: 'var(--beige)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <p className="section-eyebrow" style={{ textAlign: 'center' }}>How to work with us</p>
          <h2 className="section-title" style={{ textAlign: 'center', marginBottom: '64px' }}>
            Flexible service options to fit your needs
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '32px'
          }}>
            {/* Gap Analysis Only */}
            <div style={{
              background: 'var(--white)',
              padding: '40px',
              border: '1px solid var(--beige)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                letterSpacing: '0.15em',
                color: 'var(--gold)',
                marginBottom: '16px',
                fontWeight: 400,
                textTransform: 'uppercase'
              }}>
                One-time
              </div>
              <h3 style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '28px',
                fontWeight: 200,
                color: 'var(--navy)',
                marginBottom: '16px',
                letterSpacing: '-0.02em'
              }}>
                Gap Analysis
              </h3>
              <p style={{
                fontSize: '15px',
                color: 'var(--muted)',
                lineHeight: 1.7,
                marginBottom: '24px',
                flex: 1
              }}>
                Just need to know where you stand? Get a comprehensive gap analysis identifying all BSR compliance issues without the full amendment service.
              </p>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: '0 0 32px 0',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <li style={{ fontSize: '14px', color: 'var(--navy)', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: 'var(--gold)' }}>✓</span>
                  <span>55+ BSR checks</span>
                </li>
                <li style={{ fontSize: '14px', color: 'var(--navy)', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: 'var(--gold)' }}>✓</span>
                  <span>Expert-verified findings</span>
                </li>
                <li style={{ fontSize: '14px', color: 'var(--navy)', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: 'var(--gold)' }}>✓</span>
                  <span>Gap report only</span>
                </li>
              </ul>
              <a href="mailto:george@attlee.ai?subject=Gap Analysis Enquiry" className="btn-primary" style={{ width: '100%', textAlign: 'center' }}>
                Request quote
              </a>
            </div>

            {/* Full Service */}
            <div style={{
              background: 'var(--navy)',
              padding: '40px',
              border: '2px solid var(--gold)',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '-12px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'var(--gold)',
                color: 'var(--navy)',
                padding: '4px 16px',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase'
              }}>
                Most Popular
              </div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                letterSpacing: '0.15em',
                color: 'var(--gold)',
                marginBottom: '16px',
                fontWeight: 400,
                textTransform: 'uppercase'
              }}>
                One-time
              </div>
              <h3 style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '28px',
                fontWeight: 200,
                color: 'var(--cream)',
                marginBottom: '16px',
                letterSpacing: '-0.02em'
              }}>
                Full Service
              </h3>
              <p style={{
                fontSize: '15px',
                color: 'rgba(242,241,238,0.7)',
                lineHeight: 1.7,
                marginBottom: '24px',
                flex: 1
              }}>
                Complete end-to-end service: gap analysis, expert-drafted amendments, and signed report. Everything you need for a confident BSR submission.
              </p>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: '0 0 32px 0',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <li style={{ fontSize: '14px', color: 'var(--cream)', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: 'var(--gold)' }}>✓</span>
                  <span>55+ BSR checks</span>
                </li>
                <li style={{ fontSize: '14px', color: 'var(--cream)', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: 'var(--gold)' }}>✓</span>
                  <span>Expert-verified findings</span>
                </li>
                <li style={{ fontSize: '14px', color: 'var(--cream)', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: 'var(--gold)' }}>✓</span>
                  <span>Drafted amendments</span>
                </li>
                <li style={{ fontSize: '14px', color: 'var(--cream)', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: 'var(--gold)' }}>✓</span>
                  <span>Expert-signed report</span>
                </li>
                <li style={{ fontSize: '14px', color: 'var(--cream)', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: 'var(--gold)' }}>✓</span>
                  <span>1-week turnaround</span>
                </li>
              </ul>
              <a href="mailto:george@attlee.ai?subject=Full Service Enquiry" className="btn-primary" style={{ width: '100%', textAlign: 'center', background: 'var(--gold)', color: 'var(--navy)' }}>
                Request quote
              </a>
            </div>

            {/* Monthly Retainer */}
            <div style={{
              background: 'var(--white)',
              padding: '40px',
              border: '1px solid var(--beige)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                letterSpacing: '0.15em',
                color: 'var(--gold)',
                marginBottom: '16px',
                fontWeight: 400,
                textTransform: 'uppercase'
              }}>
                Ongoing
              </div>
              <h3 style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '28px',
                fontWeight: 200,
                color: 'var(--navy)',
                marginBottom: '16px',
                letterSpacing: '-0.02em'
              }}>
                Monthly Retainer
              </h3>
              <p style={{
                fontSize: '15px',
                color: 'var(--muted)',
                lineHeight: 1.7,
                marginBottom: '24px',
                flex: 1
              }}>
                Fixed monthly fee includes up to 2 reports per month. Perfect for consultancies and developers with ongoing pipeline. Pay-per-report for additional reviews.
              </p>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: '0 0 32px 0',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <li style={{ fontSize: '14px', color: 'var(--navy)', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: 'var(--gold)' }}>✓</span>
                  <span>Up to 2 reports/month</span>
                </li>
                <li style={{ fontSize: '14px', color: 'var(--navy)', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: 'var(--gold)' }}>✓</span>
                  <span>Full service per report</span>
                </li>
                <li style={{ fontSize: '14px', color: 'var(--navy)', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: 'var(--gold)' }}>✓</span>
                  <span>Pay for extras on top</span>
                </li>
                <li style={{ fontSize: '14px', color: 'var(--navy)', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: 'var(--gold)' }}>✓</span>
                  <span>Priority turnaround</span>
                </li>
              </ul>
              <a href="mailto:george@attlee.ai?subject=Retainer Enquiry" className="btn-primary" style={{ width: '100%', textAlign: 'center' }}>
                Request quote
              </a>
            </div>
          </div>
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
          © 2026 Attlee AI Ltd · Get Britain Building
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
function HowTabButton({ active, onClick, number, children }: {
  active: boolean;
  onClick: () => void;
  number?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '16px 32px',
        background: active ? 'var(--navy)' : 'var(--white)',
        color: active ? 'var(--cream)' : 'var(--navy)',
        border: active ? '2px solid var(--gold)' : '1px solid var(--beige)',
        fontSize: '14px',
        fontWeight: active ? 500 : 400,
        letterSpacing: '0.04em',
        cursor: 'pointer',
        transition: 'all 0.2s',
        fontFamily: 'Inter, sans-serif'
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'var(--beige)';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'var(--white)';
        }
      }}
    >
      {number && (
        <span style={{
          color: 'var(--gold)',
          marginRight: '8px',
          fontSize: '12px',
          letterSpacing: '0.1em'
        }}>
          {number}
        </span>
      )}
      {children}
    </button>
  );
}

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

import { useEffect, useRef, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SignedIn } from '@clerk/clerk-react';
import AttleeLogo from '../components/AttleeLogo';

export default function Landing() {
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      setScrollY(-rect.top);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={{ background: 'var(--ink-1)', minHeight: '100vh' }}>

      {/* Fixed Nav */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(17,18,22,0.85)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '0 56px', height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontFamily: 'var(--font-sans)', fontSize: 13,
      }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <AttleeLogo size={28} showWordmark={true} color="var(--type-hi)" />
        </Link>
        <div style={{ display: 'flex', gap: '32px', color: 'rgba(255,255,255,0.5)' }}>
          <a href="#platform" style={navLinkStyle}>Platform</a>
          <a href="#how" style={navLinkStyle}>How it works</a>
          <Link to="/security" style={navLinkStyle}>Security</Link>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <SignedIn>
            <Link to="/clients" style={{
              ...navLinkStyle, opacity: 1,
              background: 'rgba(255,255,255,0.08)',
              padding: '9px 18px', borderRadius: 999, fontSize: 12
            }}>Dashboard</Link>
          </SignedIn>
          <a href="mailto:george@attlee.ai" style={{
            color: 'var(--ink-0)', background: 'var(--flame)',
            textDecoration: 'none', padding: '9px 20px',
            borderRadius: 999, fontSize: 12, fontWeight: 500, letterSpacing: '0.02em'
          }}>Book a demo →</a>
        </div>
      </nav>

      {/* ── HERO — cinematic full-bleed ────────────────────────────────── */}
      <section ref={heroRef} className="noise" style={{
        position: 'relative', height: '100vh', minHeight: 720, overflow: 'hidden',
      }}>
        {/* Sky gradient — dark at top, warm amber glow at horizon */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, #0A0B0D 0%, #0f1118 35%, #1a1020 55%, #2a1508 80%, #1a0d04 100%)',
        }}/>
        {/* Sun disc — parallaxes upward on scroll */}
        <div style={{
          position: 'absolute', left: '50%', top: '58%',
          transform: `translate(-50%, ${scrollY * -0.15}px)`,
          width: 520, height: 520, borderRadius: '50%',
          background: 'radial-gradient(circle, #ff8c40 0%, #E85C2C 30%, #6b2a00 60%, transparent 75%)',
          filter: 'blur(4px)', opacity: 0.85,
        }}/>
        {/* Horizon glow — warm band at ground level */}
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, height: '50%',
          background: 'linear-gradient(to top, #1a0d04 0%, #2a1508 20%, transparent 100%)',
        }}/>
        {/* Far skyline — slow parallax */}
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%',
          transform: `translateY(${scrollY * 0.08}px)`,
        }}>
          <Skyline tone="#0d0f14" height={520} seed={3} />
        </div>
        {/* Near skyline — faster parallax */}
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, height: '40%',
          transform: `translateY(${scrollY * 0.18}px)`,
        }}>
          <Skyline tone="#080a0e" height={440} seed={11} />
        </div>
        {/* Ground fade — fades bottom to page background */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, transparent 60%, rgba(10,11,13,0.4) 85%, var(--ink-1) 100%)',
        }}/>

        {/* Copy — bottom-left */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          justifyContent: 'flex-end', padding: '0 56px 128px',
        }}>
          <div style={{ maxWidth: 1100 }}>
            <p className="eyebrow" style={{ color: 'var(--flame-soft)', marginBottom: 28 }}>
              AI for UK building regulation
            </p>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 400,
              fontSize: 'clamp(60px, 9vw, 128px)',
              lineHeight: 0.95,
              letterSpacing: '-0.025em',
              margin: '0 0 44px',
              color: 'var(--type-hi)',
            }}>
              Britain needs{' '}
              <em style={{ fontStyle: 'italic', color: 'var(--flame-soft)' }}>homes.</em>
              <br />
              Attlee clears the way.
            </h1>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <a href="mailto:george@attlee.ai" className="btn-primary">Request early access</a>
              <a href="#how" style={{
                color: 'rgba(255,255,255,0.6)', textDecoration: 'none',
                fontSize: 14, letterSpacing: '0.02em'
              }}>See how it works →</a>
            </div>
          </div>
        </div>

        {/* Ticker */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '18px 0',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          fontFamily: 'var(--font-mono)',
          fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.4)',
          background: 'rgba(10,11,13,0.55)',
          backdropFilter: 'blur(6px)',
          overflow: 'hidden', whiteSpace: 'nowrap',
          maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
        }}>
          <Ticker />
        </div>
      </section>

      {/* ── STAT BAR ──────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        borderTop: '1px solid var(--ink-3)', borderBottom: '1px solid var(--ink-3)',
      }}>
        <StatItem num="1.5M" label="homes pledged this Parliament" />
        <StatItem num="33 wks" label="avg. Gateway 2 wait in 2025" />
        <StatItem num="12 wks" label="statutory Gateway 2 target" />
        <StatItem num="~70%" label="Gateway 2 rejection rate" accent />
      </div>

      {/* ── 01 — THESIS ───────────────────────────────────────────────── */}
      <section style={{
        padding: '160px 56px 160px',
        borderBottom: '1px solid var(--ink-3)',
      }}>
        <div style={{
          maxWidth: 1400, margin: '0 auto',
          display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 80,
          alignItems: 'start',
        }}>
          <div className="eyebrow" style={{ color: 'var(--type-lo)', paddingTop: 12 }}>
            01 — Thesis
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 400,
            fontSize: 'clamp(32px, 4vw, 58px)',
            lineHeight: 1.1, letterSpacing: '-0.015em',
            margin: 0, color: 'var(--type-hi)',
          }}>
            The bottleneck to UK housing isn't bricks — it's{' '}
            <em style={{ fontStyle: 'italic', color: 'var(--flame)' }}>paperwork.</em>{' '}
            Planning, Building Control, Approved Documents, fire safety, warranties — every home passes through thousands of pages of regulation. Attlee reads all of it.
          </h2>
        </div>
      </section>

      {/* ── 02 — WHAT ATTLEE DOES (three capability pillars) ──────────── */}
      <section id="platform" style={{
        padding: '140px 56px',
        borderBottom: '1px solid var(--ink-3)',
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div className="eyebrow" style={{ color: 'var(--type-lo)', marginBottom: 64 }}>
            02 — What Attlee does
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2,
            background: 'var(--ink-3)',
          }}>
            {[
              {
                n: 'I.',
                t: 'Regulatory intelligence',
                d: 'Attlee holds the full BSR regulatory corpus — Approved Documents A–R, CLC Guidance Suite, Building Safety Act secondary legislation, and Gateway 2 rejection data. It knows what the BSR looks for, and where applicants fail.',
              },
              {
                n: 'II.',
                t: 'Contradiction detection',
                d: 'Most Gateway 2 rejections come from inconsistencies between documents — a height in the fire strategy that disagrees with the structural report, or a sprinkler spec that contradicts the MEP drawings. Attlee finds them all before submission.',
              },
              {
                n: 'III.',
                t: 'Golden thread output',
                d: 'The Building Safety Act demands a documented, versioned evidence trail for every compliance decision. Attlee generates it automatically — every gap traced to its source regulation, expert-reviewed, and ready to submit.',
              },
            ].map((p, i) => (
              <div key={i} style={{
                background: 'var(--ink-1)', padding: '48px 40px 56px',
                minHeight: 340,
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              }}>
                <div style={{
                  fontFamily: 'var(--font-display)', fontStyle: 'italic',
                  fontSize: 28, color: 'var(--flame)',
                }}>{p.n}</div>
                <div>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 36, letterSpacing: '-0.02em', marginBottom: 20,
                    color: 'var(--type-hi)', lineHeight: 1.1,
                  }}>{p.t}</div>
                  <div style={{
                    fontSize: 15, lineHeight: 1.6,
                    color: 'var(--type-mid)', maxWidth: 360,
                  }}>{p.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY DETERMINISTIC RULES ───────────────────────────────────── */}
      <div style={{ padding: '120px 56px', background: 'var(--ink-2)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <p className="section-eyebrow" style={{ textAlign: 'center' }}>Why Deterministic Rules Matter</p>
          <h2 className="section-title" style={{ textAlign: 'center', margin: '0 auto 24px', maxWidth: 900 }}>
            You can't be <em style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--flame-soft)' }}>probably</em> compliant.
          </h2>
          <p style={{
            textAlign: 'center', fontSize: '18px', color: 'var(--type-mid)',
            fontWeight: 300, maxWidth: 700, margin: '0 auto 56px', lineHeight: 1.7,
          }}>
            AI is probabilistic. Building regulations are not.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '32px', marginBottom: '48px' }}>
            <div style={{ padding: '40px', background: 'rgba(160,64,64,0.12)', border: '1px solid rgba(160,64,64,0.35)' }}>
              <h3 style={{ fontWeight: 300, fontSize: '22px', color: '#e08080', marginBottom: '20px' }}>
                ❌ Pure AI (ChatGPT / Claude alone)
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  ['Probabilistic outputs', 'Same input can produce different answers each time'],
                  ['Hallucinations', 'Invents BSR requirements that don\'t exist'],
                  ['No traceability', 'Can\'t cite specific regulation clauses'],
                  ['Legally indefensible', 'BSR won\'t accept "AI said so"'],
                ].map(([b, t], i) => (
                  <li key={i} style={{ fontSize: '15px', color: 'var(--type-mid)', lineHeight: 1.6 }}>
                    <strong style={{ color: 'var(--type-hi)' }}>{b}:</strong> {t}
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ padding: '40px', background: 'rgba(45,106,45,0.12)', border: '1px solid rgba(45,106,45,0.35)' }}>
              <h3 style={{ fontWeight: 300, fontSize: '22px', color: '#7ec87e', marginBottom: '20px' }}>
                ✓ Attlee: Deterministic Rules + AI + Experts
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  ['AI drafts findings', 'Rapid analysis across documents in closed-tenancy architecture'],
                  ['Proprietary rules validate', '55+ deterministic checks layered over AI ensure consistency'],
                  ['Expert verification', 'Every finding reviewed by qualified consultants'],
                  ['Traceable & defensible', 'Every gap linked to specific BSR regulation'],
                ].map(([b, t], i) => (
                  <li key={i} style={{ fontSize: '15px', color: 'var(--type-mid)', lineHeight: 1.6 }}>
                    <strong style={{ color: 'var(--type-hi)' }}>{b}:</strong> {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div style={{
            background: 'var(--ink-0)', padding: '40px',
            border: '1px solid var(--flame)', textAlign: 'center',
          }}>
            <p style={{
              fontSize: '18px', fontWeight: 300, color: 'var(--type-hi)',
              lineHeight: 1.7, maxWidth: 900, margin: '0 auto',
            }}>
              <strong style={{ color: 'var(--flame)' }}>What this means:</strong>{' '}
              AI drafts findings across your documents at speed within our closed-tenancy system, then our proprietary deterministic rules validate every output for consistency and accuracy. Expert consultants verify each finding by hand and sign off the final report. AI does the first draft — deterministic logic and expert judgement ensure reliability.
            </p>
          </div>
        </div>
      </div>

      {/* ── 03 — HOW IT WORKS (4-step strip) ─────────────────────────── */}
      <section id="how" style={{ padding: '160px 56px', borderTop: '1px solid var(--ink-3)' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 80,
            alignItems: 'start', marginBottom: 80,
          }}>
            <div className="eyebrow" style={{ color: 'var(--type-lo)', paddingTop: 12 }}>
              03 — How it works
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontWeight: 400,
              fontSize: 'clamp(28px, 3.5vw, 48px)', lineHeight: 1.12,
              letterSpacing: '-0.015em', margin: 0, color: 'var(--type-hi)',
            }}>
              From drawing to determination, in hours.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32 }}>
            {[
              { s: '01', t: 'Upload', d: 'Drawings, spec, fire strategy, planning docs — your complete Gateway 2 pack, uploaded securely.' },
              { s: '02', t: 'Interpret', d: 'Attlee maps every document to the BSR clauses and Approved Documents that govern it.' },
              { s: '03', t: 'Check', d: '55+ proprietary deterministic rules test each item against live regulation and your specific conditions.' },
              { s: '04', t: 'Evidence', d: 'An expert-signed, versioned audit pack — every gap traced to source, ready for Gateway submission.' },
            ].map((step, i) => (
              <div key={i} style={{
                borderTop: '1px solid var(--ink-4)',
                paddingTop: 24, paddingRight: 16,
              }}>
                <div className="eyebrow" style={{ color: 'var(--flame)', marginBottom: 48 }}>{step.s}</div>
                <div style={{
                  fontFamily: 'var(--font-display)', fontSize: 36,
                  letterSpacing: '-0.02em', marginBottom: 16, color: 'var(--type-hi)',
                }}>{step.t}</div>
                <div style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--type-mid)' }}>{step.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SCORE VISUAL ──────────────────────────────────────────────── */}
      <div style={{ background: 'var(--ink-2)', padding: '120px 56px' }}>
        <div style={{
          maxWidth: 1400, margin: '0 auto',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center',
        }}>
          <ScoreCard />
          <div>
            <p className="section-eyebrow">Expert-verified output</p>
            <h2 className="section-title">
              Professional consultant reports — delivered in 1 week, not 4.
            </h2>
            <p style={{
              fontSize: '15px', color: 'var(--type-mid)',
              lineHeight: 1.8, fontWeight: 300, marginBottom: '32px',
            }}>
              AI drafts findings in 5 minutes within our closed-tenancy system. Proprietary deterministic rules validate consistency. Expert consultants verify each finding by hand, draft amendments, and sign off the final report. Every gap traced to BSR source.
            </p>
            <a href="mailto:george@attlee.ai" className="btn-primary">Request consultation</a>
          </div>
        </div>
      </div>

      {/* ── WHO IT'S FOR ──────────────────────────────────────────────── */}
      <div id="who" style={{ background: 'var(--ink-0)', padding: '120px 56px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <p className="section-eyebrow">Who it's for</p>
          <h2 className="section-title" style={{ marginBottom: '56px' }}>
            Built for everyone with skin in the game.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px' }}>
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

      {/* ── SERVICE OPTIONS ───────────────────────────────────────────── */}
      <div style={{ padding: '120px 56px', background: 'var(--ink-1)' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <p className="section-eyebrow" style={{ textAlign: 'center' }}>How to work with us</p>
          <h2 className="section-title" style={{ textAlign: 'center', marginBottom: '64px' }}>
            Flexible service options to fit your needs
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px', background: 'var(--ink-3)' }}>
            {/* Gap Analysis */}
            <div style={{ background: 'var(--ink-1)', padding: '48px 40px', display: 'flex', flexDirection: 'column' }}>
              <div className="eyebrow" style={{ color: 'var(--flame)', marginBottom: 16 }}>One-time</div>
              <h3 style={{ fontSize: '32px', fontWeight: 200, color: 'var(--type-hi)', marginBottom: '16px', letterSpacing: '-0.02em' }}>
                Gap Analysis
              </h3>
              <p style={{ fontSize: '15px', color: 'var(--type-mid)', lineHeight: 1.7, marginBottom: '24px', flex: 1 }}>
                Just need to know where you stand? A comprehensive gap analysis identifying all BSR compliance issues without the full amendment service.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {['55+ BSR checks', 'Expert-verified findings', 'Gap report only'].map((f, i) => (
                  <li key={i} style={{ fontSize: '14px', color: 'var(--type-hi)', display: 'flex', gap: '8px' }}>
                    <span style={{ color: 'var(--flame)' }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <a href="mailto:george@attlee.ai?subject=Gap Analysis Enquiry" className="btn-primary" style={{ textAlign: 'center' }}>Request quote</a>
            </div>

            {/* Full Service */}
            <div style={{ background: 'var(--ink-0)', padding: '48px 40px', display: 'flex', flexDirection: 'column', border: '1px solid var(--flame)', position: 'relative' }}>
              <div style={{
                position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
                background: 'var(--flame)', color: 'var(--ink-0)',
                padding: '4px 16px', fontSize: '11px', fontWeight: 600,
                letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: '999px',
              }}>Most Popular</div>
              <div className="eyebrow" style={{ color: 'var(--flame)', marginBottom: 16 }}>One-time</div>
              <h3 style={{ fontSize: '32px', fontWeight: 200, color: 'var(--type-hi)', marginBottom: '16px', letterSpacing: '-0.02em' }}>
                Full Service
              </h3>
              <p style={{ fontSize: '15px', color: 'var(--type-mid)', lineHeight: 1.7, marginBottom: '24px', flex: 1 }}>
                Complete end-to-end: gap analysis, expert-drafted amendments, and signed report. Everything you need for a confident BSR submission.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {['55+ BSR checks', 'Expert-verified findings', 'Drafted amendments', 'Expert-signed report', '1-week turnaround'].map((f, i) => (
                  <li key={i} style={{ fontSize: '14px', color: 'var(--type-hi)', display: 'flex', gap: '8px' }}>
                    <span style={{ color: 'var(--flame)' }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <a href="mailto:george@attlee.ai?subject=Full Service Enquiry" className="btn-primary" style={{ textAlign: 'center' }}>Request quote</a>
            </div>

            {/* Retainer */}
            <div style={{ background: 'var(--ink-1)', padding: '48px 40px', display: 'flex', flexDirection: 'column' }}>
              <div className="eyebrow" style={{ color: 'var(--flame)', marginBottom: 16 }}>Ongoing</div>
              <h3 style={{ fontSize: '32px', fontWeight: 200, color: 'var(--type-hi)', marginBottom: '16px', letterSpacing: '-0.02em' }}>
                Monthly Retainer
              </h3>
              <p style={{ fontSize: '15px', color: 'var(--type-mid)', lineHeight: 1.7, marginBottom: '24px', flex: 1 }}>
                Fixed monthly fee, up to 2 reports per month. Perfect for consultancies and developers with ongoing pipeline.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {['Up to 2 reports/month', 'Full service per report', 'Pay for extras on top', 'Priority turnaround'].map((f, i) => (
                  <li key={i} style={{ fontSize: '14px', color: 'var(--type-hi)', display: 'flex', gap: '8px' }}>
                    <span style={{ color: 'var(--flame)' }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <a href="mailto:george@attlee.ai?subject=Retainer Enquiry" className="btn-primary" style={{ textAlign: 'center' }}>Request quote</a>
            </div>
          </div>
        </div>
      </div>

      {/* ── CTA BANNER ────────────────────────────────────────────────── */}
      <section className="noise" style={{
        position: 'relative', height: 520, overflow: 'hidden',
        borderTop: '1px solid var(--ink-3)',
      }}>
        {/* Skyline background */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.4 }}>
          <Skyline tone="#050609" height={520} seed={7} />
        </div>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, var(--ink-1) 0%, rgba(10,11,13,0.7) 30%, rgba(10,11,13,0.7) 70%, var(--ink-1) 100%)',
        }}/>
        <div style={{
          position: 'relative', zIndex: 2, height: '100%',
          display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center',
          textAlign: 'center', padding: '0 40px',
        }}>
          <div className="eyebrow" style={{ color: 'var(--flame)', marginBottom: 28 }}>
            Now in early access
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontWeight: 400,
            fontSize: 'clamp(44px, 7vw, 96px)',
            lineHeight: 0.98, letterSpacing: '-0.025em',
            margin: '0 0 48px', maxWidth: 1000,
            color: 'var(--type-hi)',
          }}>
            Build more homes.{' '}
            <em style={{ fontStyle: 'italic', color: 'var(--flame-soft)' }}>Faster, safer.</em>
          </h2>
          <a href="mailto:george@attlee.ai" className="btn-primary" style={{ fontSize: 14, padding: '16px 32px' }}>
            Book a demo →
          </a>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer style={{
        background: 'var(--ink-0)',
        padding: '56px 56px 40px',
        borderTop: '1px solid var(--ink-3)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontFamily: 'var(--font-mono)', fontSize: 11,
        letterSpacing: '0.1em', textTransform: 'uppercase',
        color: 'var(--type-lo)',
      }}>
        <AttleeLogo size={20} showWordmark={true} color="rgba(255,255,255,0.25)" />
        <div>attlee © 2026 · london</div>
        <a href="mailto:george@attlee.ai" style={{ color: 'inherit', textDecoration: 'none' }}>george@attlee.ai</a>
      </footer>
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const navLinkStyle: React.CSSProperties = {
  fontSize: '13px',
  letterSpacing: '0.01em',
  color: 'rgba(255,255,255,0.5)',
  textDecoration: 'none',
  transition: 'color 0.2s',
};

// ── Components ─────────────────────────────────────────────────────────────

// ── Skyline — procedural SVG city silhouette (ported from shared.jsx) ──────

interface Building { x: number; w: number; h: number; windows: boolean; roof: number; }

function Skyline({ tone = '#0A0B0D', height = 520, seed = 1 }: { tone?: string; height?: number; seed?: number }) {
  const buildings = useMemo<Building[]>(() => {
    let s = seed * 9301 + 49297;
    const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const out: Building[] = [];
    let x = 0;
    while (x < 2400) {
      const w = 28 + rnd() * 90;
      const h = 90 + rnd() * (height - 80);
      const windows = rnd() > 0.3;
      const roof = rnd();
      out.push({ x, w, h, windows, roof });
      x += w + (2 + rnd() * 4);
    }
    return out;
  }, [seed, height]);

  return (
    <svg viewBox={`0 0 2400 ${height}`} preserveAspectRatio="xMidYMax slice"
         style={{ display: 'block', width: '100%', height: '100%' }}>
      {buildings.map((b, i) => {
        const top = height - b.h;
        return (
          <g key={i}>
            <rect x={b.x} y={top} width={b.w} height={b.h} fill={tone} />
            {b.roof > 0.8 && (
              <rect x={b.x + b.w * 0.3} y={top - 24} width={b.w * 0.12} height={24} fill={tone} />
            )}
            {b.roof > 0.92 && (
              <rect x={b.x + b.w * 0.5} y={top - 60} width={3} height={60} fill={tone} />
            )}
            {b.windows && Array.from({ length: Math.floor(b.h / 14) }).map((_, r) =>
              Array.from({ length: Math.floor(b.w / 10) }).map((_, c) => {
                const on = ((r * 13 + c * 7 + i) % 11) < 3;
                if (!on) return null;
                return (
                  <rect key={`${r}-${c}`}
                    x={b.x + 4 + c * 10} y={top + 8 + r * 14}
                    width={3} height={5}
                    fill="rgba(255,225,160,0.55)" />
                );
              })
            )}
          </g>
        );
      })}
    </svg>
  );
}

function Ticker() {
  const items = [
    'AI-powered regulatory compliance', 'Building Safety Act 2022', 'Gateway 2 & 3',
    'Approved Documents A–R', 'Golden thread', 'UK housing', 'Principal Designer',
    '55+ deterministic checks', 'Expert-verified reports',
  ];
  const doubled = [...items, ...items];
  return (
    <div style={{
      display: 'inline-flex', gap: 48,
      animation: 'ticker 55s linear infinite',
    }}>
      {doubled.map((t, i) => (
        <span key={i} style={{ display: 'inline-flex', gap: 48, alignItems: 'center' }}>
          <span>{t}</span>
          <span style={{ opacity: 0.3 }}>/</span>
        </span>
      ))}
      <style>{`@keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </div>
  );
}

function StatItem({ num, label, accent }: { num: string; label: string; accent?: boolean }) {
  return (
    <div style={{
      padding: '48px 40px',
      borderRight: '1px solid var(--ink-3)',
    }}>
      <div className="eyebrow" style={{ color: 'var(--type-lo)', marginBottom: 20 }}>{label}</div>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(40px, 4.5vw, 64px)',
        letterSpacing: '-0.025em', lineHeight: 1,
        color: accent ? 'var(--flame-soft)' : 'var(--type-hi)',
      }}>
        {num}
      </div>
    </div>
  );
}

function ScoreCard() {
  return (
    <div style={{ background: 'var(--ink-1)', border: '1px solid var(--ink-3)', padding: '48px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--type-lo)' }}>
            Readiness Score
          </div>
          <div style={{ fontSize: '11px', color: 'var(--type-lo)', marginTop: '4px' }}>
            Riverside Tower — GW2 Pack v3
          </div>
        </div>
        <div style={{ fontWeight: 200, fontSize: '52px', color: 'var(--type-hi)', letterSpacing: '-0.04em', lineHeight: 1 }}>
          75<span style={{ color: 'var(--flame)', fontSize: '24px' }}>%</span>
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

function CheckRow({ name, status, muted }: { name: string; status: 'pass' | 'fail' | 'warn'; muted?: boolean }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '12px 0', borderBottom: '1px solid var(--ink-3)', fontSize: '13px',
    }}>
      <span style={{ color: muted ? 'var(--type-lo)' : 'var(--type-hi)', fontWeight: muted ? 300 : 400 }}>{name}</span>
      <span className={`pill ${status}`}>{status === 'warn' ? 'Partial' : status === 'pass' ? 'Pass' : 'Fail'}</span>
    </div>
  );
}

function WhoCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '40px', border: '1px solid var(--ink-3)' }}>
      <div style={{ width: '36px', height: '36px', marginBottom: '24px' }}>{icon}</div>
      <h4 style={{ fontWeight: 300, fontSize: '18px', color: 'var(--type-hi)', marginBottom: '10px', letterSpacing: '-0.01em' }}>{title}</h4>
      <p style={{ fontSize: '13px', color: 'var(--type-mid)', lineHeight: 1.7, fontWeight: 300 }}>{description}</p>
    </div>
  );
}

function DesignerIcon() {
  return (
    <svg viewBox="0 0 36 36" fill="none" width="36" height="36">
      <rect x="4" y="10" width="28" height="22" stroke="var(--flame)" strokeWidth="2" fill="none"/>
      <polyline points="4,10 18,2 32,10" stroke="var(--flame)" strokeWidth="2" fill="none"/>
    </svg>
  );
}

function HousingIcon() {
  return (
    <svg viewBox="0 0 36 36" fill="none" width="36" height="36">
      <circle cx="18" cy="18" r="14" stroke="var(--flame)" strokeWidth="2" fill="none"/>
      <polyline points="11,18 16,23 25,13" stroke="var(--flame)" strokeWidth="2" fill="none" strokeLinecap="square"/>
    </svg>
  );
}

function ConsultantIcon() {
  return (
    <svg viewBox="0 0 36 36" fill="none" width="36" height="36">
      <rect x="2" y="8" width="32" height="24" stroke="var(--flame)" strokeWidth="2" fill="none"/>
      <line x1="9" y1="16" x2="27" y2="16" stroke="var(--flame)" strokeWidth="2"/>
      <line x1="9" y1="22" x2="20" y2="22" stroke="var(--flame)" strokeWidth="2"/>
    </svg>
  );
}

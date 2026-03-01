import { useState } from 'react';
import { Link } from 'react-router-dom';

type AccordionSection = 'claude' | 'soc2' | 'data-retention' | 'infrastructure' | 'access' | null;

export default function Security() {
  const [expandedSection, setExpandedSection] = useState<AccordionSection>('claude');

  const toggleSection = (section: AccordionSection) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Minimal Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800/50 bg-slate-950/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                attlee.ai
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-sm">
              <Link to="/problem" className="text-slate-400 hover:text-white transition-colors">
                Problem
              </Link>
              <Link to="/system" className="text-slate-400 hover:text-white transition-colors">
                System
              </Link>
              <Link to="/approach" className="text-slate-400 hover:text-white transition-colors">
                Approach
              </Link>
              <Link to="/security" className="text-white font-medium">
                Security
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-20 bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <h1 className="text-4xl sm:text-6xl font-bold text-white leading-tight">
            Enterprise-Grade Security.
            <br />
            <span className="text-slate-400">Your documents never train AI models.</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            Your sensitive building safety documents are protected.
          </p>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="relative py-12 bg-slate-800/50 border-y border-slate-700">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-semibold">SOC 2 Type II</p>
                <p className="text-xs text-slate-400">Independently audited</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-semibold">ISO 27001</p>
                <p className="text-xs text-slate-400">Certified security</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-semibold">HTTPS / TLS 1.3</p>
                <p className="text-xs text-slate-400">Encrypted transit</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Security Content */}
      <section className="relative py-20 bg-slate-900">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              How We Protect Your Data
            </h2>
            <div className="h-1 w-24 bg-gradient-to-r from-blue-500 to-cyan-400 mx-auto rounded-full" />
          </div>

          <div className="space-y-3">
            {/* Claude API Security */}
            <Accordion
              id="claude"
              title="We Use Claude API (Anthropic) for AI Processing"
              icon="🔒"
              isExpanded={expandedSection === 'claude'}
              onToggle={() => toggleSection('claude')}
            >
              <div className="space-y-4">
                <p className="font-medium text-slate-200">
                  Why Claude API specifically protects your data:
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-cyan-400 mt-1 flex-shrink-0">✓</span>
                    <span className="text-slate-300">
                      <strong className="text-white">SOC 2 Type II and ISO 27001 certified</strong> – independently audited security controls
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-cyan-400 mt-1 flex-shrink-0">✓</span>
                    <span className="text-slate-300">
                      <strong className="text-white">Your data is NEVER used to train AI models</strong> – API/commercial customers are excluded from training
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-cyan-400 mt-1 flex-shrink-0">✓</span>
                    <span className="text-slate-300">
                      <strong className="text-white">30-day data retention</strong> – processed data is automatically deleted
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-cyan-400 mt-1 flex-shrink-0">✓</span>
                    <span className="text-slate-300">
                      <strong className="text-white">No third-party data sharing</strong> – Anthropic never sells customer data
                    </span>
                  </li>
                </ul>

                <div className="mt-6 bg-blue-600/10 border border-blue-600/30 rounded-lg p-4">
                  <p className="text-sm text-blue-300">
                    <strong>Learn more:</strong>{' '}
                    <a
                      href="https://www.anthropic.com/security"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-blue-200"
                    >
                      Anthropic Security Documentation
                    </a>
                  </p>
                </div>
              </div>
            </Accordion>

            {/* SOC 2 & ISO 27001 */}
            <Accordion
              id="soc2"
              title="SOC 2 Type II & ISO 27001 Certification"
              icon="🛡️"
              isExpanded={expandedSection === 'soc2'}
              onToggle={() => toggleSection('soc2')}
            >
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-white mb-2">SOC 2 Type II Compliance</h4>
                  <p className="text-slate-300 text-sm">
                    SOC 2 is an independent audit framework focused on security, availability, processing integrity, confidentiality, and privacy.
                    Type II certification means our controls are tested over time, not just at a point in time.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-2">ISO 27001 Certification</h4>
                  <p className="text-slate-300 text-sm">
                    ISO 27001 is the international standard for information security management systems. Certification requires implementing
                    comprehensive security controls and regular third-party audits.
                  </p>
                </div>

                <div className="bg-green-600/10 border border-green-600/30 rounded-lg p-4">
                  <p className="text-sm text-green-300">
                    <strong>What this means:</strong> Our security practices are independently verified by accredited auditors.
                    We don't just claim to be secure—we prove it.
                  </p>
                </div>
              </div>
            </Accordion>

            {/* Data Retention */}
            <Accordion
              id="data-retention"
              title="Data Retention and Deletion"
              icon="⏱️"
              isExpanded={expandedSection === 'data-retention'}
              onToggle={() => toggleSection('data-retention')}
            >
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <h5 className="text-cyan-400 font-semibold mb-2">Anthropic Claude API</h5>
                    <p className="text-sm text-slate-300">
                      Documents sent to Claude API are retained for 30 days for abuse monitoring, then automatically deleted.
                      They are never used for model training.
                    </p>
                  </div>

                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <h5 className="text-cyan-400 font-semibold mb-2">Our Database</h5>
                    <p className="text-sm text-slate-300">
                      Your submission data is retained for the duration of your project. You can request deletion at any time,
                      and we will permanently remove all associated data within 7 days.
                    </p>
                  </div>
                </div>

                <div className="bg-amber-600/10 border border-amber-600/30 rounded-lg p-4">
                  <p className="text-sm text-amber-300">
                    <strong>Your Control:</strong> You own your data. Request a data export or complete deletion at any time via{' '}
                    <a href="mailto:george@attlee.ai" className="underline hover:text-amber-200">george@attlee.ai</a>
                  </p>
                </div>
              </div>
            </Accordion>

            {/* Infrastructure Security */}
            <Accordion
              id="infrastructure"
              title="Infrastructure and Application Security"
              icon="🔐"
              isExpanded={expandedSection === 'infrastructure'}
              onToggle={() => toggleSection('infrastructure')}
            >
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-cyan-400 font-semibold">Secure Authentication</div>
                    <div className="text-sm text-slate-400">
                      Team access protected by Clerk (enterprise authentication provider) with MFA support
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-cyan-400 font-semibold">HTTPS Encryption</div>
                    <div className="text-sm text-slate-400">
                      All data transmitted over TLS 1.3 encrypted connections
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-cyan-400 font-semibold">Secure Database</div>
                    <div className="text-sm text-slate-400">
                      PostgreSQL database with role-based access controls and encrypted at rest
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-cyan-400 font-semibold">Environment Isolation</div>
                    <div className="text-sm text-slate-400">
                      API keys and credentials stored securely as environment variables, never in code
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-cyan-400 font-semibold">Regular Updates</div>
                    <div className="text-sm text-slate-400">
                      Automated dependency updates and security patch management
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-cyan-400 font-semibold">Infrastructure Monitoring</div>
                    <div className="text-sm text-slate-400">
                      24/7 uptime monitoring and automated alerts for anomalies
                    </div>
                  </div>
                </div>
              </div>
            </Accordion>

            {/* Access Controls */}
            <Accordion
              id="access"
              title="Access Controls and Permissions"
              icon="👥"
              isExpanded={expandedSection === 'access'}
              onToggle={() => toggleSection('access')}
            >
              <div className="space-y-4">
                <p className="text-slate-300">
                  We implement strict access controls to ensure only authorized personnel can access your data:
                </p>

                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-cyan-400 mt-1 flex-shrink-0">→</span>
                    <span className="text-slate-300">
                      <strong className="text-white">Role-based access control (RBAC)</strong> – Users only see data for their assigned clients
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-cyan-400 mt-1 flex-shrink-0">→</span>
                    <span className="text-slate-300">
                      <strong className="text-white">Multi-factor authentication (MFA)</strong> – Available for all team accounts
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-cyan-400 mt-1 flex-shrink-0">→</span>
                    <span className="text-slate-300">
                      <strong className="text-white">Audit logging</strong> – All document access and modifications are logged
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-cyan-400 mt-1 flex-shrink-0">→</span>
                    <span className="text-slate-300">
                      <strong className="text-white">Principle of least privilege</strong> – Engineering team access is limited and time-boxed
                    </span>
                  </li>
                </ul>

                <div className="bg-purple-600/10 border border-purple-600/30 rounded-lg p-4">
                  <p className="text-sm text-purple-300">
                    <strong>Client Isolation:</strong> Your submission data is logically separated from other clients.
                    No cross-client data access is possible.
                  </p>
                </div>
              </div>
            </Accordion>
          </div>

          {/* Summary */}
          <div className="mt-12 text-center bg-slate-800/30 rounded-xl p-8 border border-slate-700">
            <p className="text-lg font-semibold text-cyan-400 mb-2">
              Enterprise-grade AI security from Anthropic, combined with professional data handling practices.
            </p>
            <p className="text-sm text-slate-400">
              Questions about our security practices? Contact us at{' '}
              <a href="mailto:george@attlee.ai" className="text-blue-400 hover:text-blue-300 underline">
                george@attlee.ai
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Next Section */}
      <section className="relative py-16 bg-slate-950 border-t border-slate-800/50">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <p className="text-slate-400">Ready to get started?</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="mailto:george@attlee.ai"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-lg font-semibold rounded-lg transition-all shadow-lg shadow-blue-600/20"
            >
              Book a Demo
            </a>
            <Link
              to="/"
              className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition-all border border-slate-700 hover:border-slate-600"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-slate-950 border-t border-slate-800/50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <p className="text-sm text-slate-500">
                <a href="mailto:george@attlee.ai" className="hover:text-blue-400 transition-colors">
                  george@attlee.ai
                </a>
              </p>
            </div>
            <div className="text-center md:text-right">
              <p className="text-xs text-slate-600">© 2026 attlee.ai</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Accordion Component
interface AccordionProps {
  id: string;
  title: string;
  icon: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function Accordion({ title, icon, isExpanded, onToggle, children }: AccordionProps) {
  return (
    <div className={`
      border rounded-xl overflow-hidden transition-all
      ${isExpanded
        ? 'border-cyan-600/50 bg-cyan-600/5 shadow-lg shadow-cyan-600/10'
        : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
      }
    `}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-6 hover:bg-slate-700/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <h3 className="text-xl font-semibold text-white text-left">{title}</h3>
        </div>
        <svg
          className={`w-6 h-6 text-slate-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isExpanded && (
        <div className="px-6 pb-6 pt-2">
          {children}
        </div>
      )}
    </div>
  );
}

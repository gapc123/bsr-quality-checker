import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TimelapseSection } from '../components/ContextSection';

type Tab = 'overview' | 'step1' | 'step2' | 'step3' | 'step4';

export default function System() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

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
              <Link to="/system" className="text-white font-medium">
                System
              </Link>
              <Link to="/approach" className="text-slate-400 hover:text-white transition-colors">
                Approach
              </Link>
              <Link to="/security" className="text-slate-400 hover:text-white transition-colors">
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
            Deterministic Rules
            <br />
            <span className="text-cyan-400">+ AI Extraction</span>
            <br />
            <span className="text-blue-400">+ Human Oversight</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            We've built a proprietary rules engine layered over secure AI—then put expert consultants in control.
          </p>
        </div>
      </section>

      {/* Tabbed System Overview */}
      <section className="relative py-20 bg-slate-900">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">
              How attlee.ai Makes Compliance Reliable
            </h2>
            <p className="text-slate-400 italic">
              A proprietary rules engine specifically for building safety compliance
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <TabButton
              active={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </TabButton>
            <TabButton
              active={activeTab === 'step1'}
              onClick={() => setActiveTab('step1')}
              number={1}
            >
              AI Extraction
            </TabButton>
            <TabButton
              active={activeTab === 'step2'}
              onClick={() => setActiveTab('step2')}
              number={2}
            >
              Rules Engine
            </TabButton>
            <TabButton
              active={activeTab === 'step3'}
              onClick={() => setActiveTab('step3')}
              number={3}
            >
              Audit Trail
            </TabButton>
            <TabButton
              active={activeTab === 'step4'}
              onClick={() => setActiveTab('step4')}
              number={4}
            >
              Expert Review
            </TabButton>
          </div>

          {/* Tab Content */}
          <div className="bg-slate-800/50 border-2 border-cyan-600/30 rounded-2xl p-8 md:p-10 min-h-[400px]">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-white">The Complete System</h3>
                <p className="text-lg text-slate-300 leading-relaxed">
                  Delivering intelligent document review at the scale and speed of AI, with the reliability of deterministic logic and human oversight.
                </p>

                <div className="grid md:grid-cols-2 gap-6 mt-8">
                  <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700">
                    <div className="w-12 h-12 bg-cyan-600/20 rounded-lg flex items-center justify-center mb-4">
                      <span className="text-2xl font-bold text-cyan-400">55</span>
                    </div>
                    <h4 className="text-lg font-semibold text-white mb-2">Deterministic Rules</h4>
                    <p className="text-sm text-slate-400">
                      All Gateway 2 requirements encoded as deterministic rules mapped to a regulatory matrix
                    </p>
                  </div>

                  <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700">
                    <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-white mb-2">Enterprise AI</h4>
                    <p className="text-sm text-slate-400">
                      Claude API for secure extraction. Your data never trains AI models
                    </p>
                  </div>

                  <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700">
                    <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-white mb-2">Full Audit Trail</h4>
                    <p className="text-sm text-slate-400">
                      Every decision traceable to specific regulatory clause and evidence
                    </p>
                  </div>

                  <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700">
                    <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-white mb-2">Expert Oversight</h4>
                    <p className="text-sm text-slate-400">
                      Building safety consultants maintain final authority on every decision
                    </p>
                  </div>
                </div>

                <div className="mt-8 text-center">
                  <p className="text-slate-400 text-sm mb-4">Click the tabs above to explore each step</p>
                </div>
              </div>
            )}

            {activeTab === 'step1' && (
              <StepContent
                number={1}
                title="Secure AI extracts and structures information"
                color="cyan"
              >
                <p className="text-slate-300 mb-4">
                  We use enterprise-grade Claude AI to read documents quickly, extract relevant sections, and structure evidence with custom prompts designed for building safety regulations.
                </p>
                <p className="font-medium text-slate-200">
                  But the AI doesn't make compliance decisions—that's where our proprietary rules engine comes in.
                </p>

                <div className="mt-6 bg-slate-900/50 rounded-lg p-4 border border-cyan-600/30">
                  <h5 className="text-sm font-semibold text-cyan-400 mb-2">What AI Does:</h5>
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-400 mt-1">→</span>
                      <span>Extracts text from PDFs and drawings</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-400 mt-1">→</span>
                      <span>Identifies relevant sections based on regulatory keywords</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-400 mt-1">→</span>
                      <span>Structures evidence for rules engine evaluation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-400 mt-1">→</span>
                      <span>Cross-references between documents automatically</span>
                    </li>
                  </ul>
                </div>
              </StepContent>
            )}

            {activeTab === 'step2' && (
              <StepContent
                number={2}
                title="Our deterministic rules engine makes recommendations"
                color="blue"
              >
                <p className="text-slate-300 mb-4">
                  We've encoded all 55 Gateway 2 requirements as deterministic rules mapped to a regulatory matrix.
                </p>
                <p className="text-slate-300 mb-4">
                  The rules engine evaluates the AI-extracted evidence and returns clear pass/fail recommendations per requirement.
                </p>
                <p className="font-medium text-slate-200">
                  The same input always produces the same output—zero probabilistic guesswork.
                </p>

                <div className="mt-6 bg-slate-900/50 rounded-lg p-4 border border-blue-600/30">
                  <h5 className="text-sm font-semibold text-blue-400 mb-2">Example Rule Logic:</h5>
                  <div className="font-mono text-xs text-slate-400 bg-slate-950 rounded p-3">
                    <div className="text-green-400">// SM-002: Means of Escape</div>
                    <div className="mt-2">IF fireStrategy.contains("means of escape")</div>
                    <div className="ml-4">AND travelDistances.specified === true</div>
                    <div className="ml-4">AND exitWidths.specified === true</div>
                    <div className="ml-4">AND travelDistances.max ≤ ADB_Table_3_2.limit</div>
                    <div className="mt-2">THEN status = PASS</div>
                    <div>ELSE status = FAIL</div>
                  </div>
                </div>
              </StepContent>
            )}

            {activeTab === 'step3' && (
              <StepContent
                number={3}
                title="Full audit trail for every recommendation"
                color="green"
              >
                <p className="text-slate-300 mb-6">
                  Every recommendation includes:
                </p>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 bg-slate-900/50 rounded-lg p-4 border border-green-600/30">
                    <div className="w-6 h-6 bg-green-600 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">1</span>
                    </div>
                    <div>
                      <h5 className="font-semibold text-white mb-1">The specific regulatory clause being tested</h5>
                      <p className="text-sm text-slate-400">e.g., "Approved Document B Section 3.2: Means of Escape"</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-slate-900/50 rounded-lg p-4 border border-green-600/30">
                    <div className="w-6 h-6 bg-green-600 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">2</span>
                    </div>
                    <div>
                      <h5 className="font-semibold text-white mb-1">The deterministic rule applied</h5>
                      <p className="text-sm text-slate-400">e.g., "SM-002: Means of Escape Clearly Defined"</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-slate-900/50 rounded-lg p-4 border border-green-600/30">
                    <div className="w-6 h-6 bg-green-600 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">3</span>
                    </div>
                    <div>
                      <h5 className="font-semibold text-white mb-1">The source text used as evidence</h5>
                      <p className="text-sm text-slate-400">Direct quote from Fire Strategy Report, page 12</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-slate-900/50 rounded-lg p-4 border border-green-600/30">
                    <div className="w-6 h-6 bg-green-600 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">4</span>
                    </div>
                    <div>
                      <h5 className="font-semibold text-white mb-1">The confidence level of the assessment</h5>
                      <p className="text-sm text-slate-400">Definitive | High | Needs Review</p>
                    </div>
                  </div>
                </div>

                <p className="font-medium text-slate-200 mt-6">
                  This makes our recommendations explainable, reviewable, and defensible to auditors and regulators.
                </p>
              </StepContent>
            )}

            {activeTab === 'step4' && (
              <StepContent
                number={4}
                title="Our expert consultants have the final word"
                color="purple"
              >
                <p className="text-slate-300 mb-4">
                  AI and rules provide speed and consistency. But <span className="font-semibold text-white">human experts always maintain final authority</span>.
                </p>
                <p className="text-slate-300 mb-4">
                  Our building safety consultants review every assessment, especially edge cases flagged by the system.
                </p>
                <p className="text-slate-300 mb-4">
                  Experts can approve, reject, or override any recommendation with a recorded rationale.
                </p>
                <p className="font-medium text-slate-200">
                  The technology serves the experts—not the other way around.
                </p>

                <div className="mt-6 bg-slate-900/50 rounded-lg p-6 border border-purple-600/30">
                  <h5 className="text-sm font-semibold text-purple-400 mb-4">Human Decision Points:</h5>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="text-sm">
                      <div className="text-purple-400 font-medium mb-2">✓ Expert Approval</div>
                      <p className="text-slate-400">Consultant agrees with system recommendation</p>
                    </div>
                    <div className="text-sm">
                      <div className="text-purple-400 font-medium mb-2">✗ Expert Rejection</div>
                      <p className="text-slate-400">Consultant identifies issue system missed</p>
                    </div>
                    <div className="text-sm">
                      <div className="text-purple-400 font-medium mb-2">⟳ Expert Override</div>
                      <p className="text-slate-400">Consultant provides alternative interpretation with rationale</p>
                    </div>
                    <div className="text-sm">
                      <div className="text-purple-400 font-medium mb-2">⚠ Flag for Review</div>
                      <p className="text-slate-400">Edge case requires senior consultant decision</p>
                    </div>
                  </div>
                </div>
              </StepContent>
            )}
          </div>

          {/* Summary */}
          <div className="mt-8 text-center bg-slate-800/30 rounded-xl p-6 border border-slate-700">
            <p className="text-lg font-semibold text-cyan-400 mb-2">
              Secure AI delivers efficiency. Our proprietary rules engine ensures consistency. Our expert consultants provide assurance.
            </p>
            <p className="text-sm text-slate-400">
              It's the combination that makes it reliable—AI for speed, rules for decisions, humans for oversight.
            </p>
          </div>
        </div>
      </section>

      {/* What AI Does vs Defers */}
      <section className="relative py-20 bg-slate-950">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Intelligent Review, Not Content Generation
            </h2>
            <div className="h-1 w-24 bg-gradient-to-r from-blue-500 to-cyan-400 mx-auto rounded-full" />
            <p className="text-slate-400 text-lg mt-4">
              AI-powered triage at scale. Human expertise for decisions.
            </p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 space-y-8">
            {/* What AI Does */}
            <ExpandableSection
              title="What the AI Does"
              icon="⚡"
              isExpanded={expandedSection === 'ai-does'}
              onToggle={() => setExpandedSection(expandedSection === 'ai-does' ? null : 'ai-does')}
              color="green"
            >
              <ul className="space-y-3 text-slate-300">
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Reviews documents across entire submission packs for consistency</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Understands building safety regulations at granular detail</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Identifies gaps, risks, and inconsistencies early in the process</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Cross-references requirements across dozens of documents simultaneously</span>
                </li>
              </ul>
            </ExpandableSection>

            {/* What AI Defers */}
            <ExpandableSection
              title="What the AI Always Defers to Humans"
              icon="👤"
              isExpanded={expandedSection === 'ai-defers'}
              onToggle={() => setExpandedSection(expandedSection === 'ai-defers' ? null : 'ai-defers')}
              color="amber"
            >
              <ul className="grid sm:grid-cols-2 gap-3 text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                  Professional engineering judgement
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                  Creation of new technical documents
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                  Final sign-off and accountability
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                  Physical testing and site inspections
                </li>
              </ul>
            </ExpandableSection>

            <div className="pt-6 border-t border-slate-700">
              <p className="text-lg text-cyan-400 font-medium italic text-center">
                The Goal: Reduce the human workload by handling repetitive review tasks, while keeping human expertise and accountability at the center of every submission.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Timelapse Video */}
      <TimelapseSection />

      {/* Next Section */}
      <section className="relative py-16 bg-slate-950 border-t border-slate-800/50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Link
            to="/approach"
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg font-semibold rounded-lg transition-all shadow-lg shadow-blue-600/20"
          >
            Next: Why This Approach Works
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
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

// Tab Button Component
interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  number?: number;
}

function TabButton({ active, onClick, children, number }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2
        ${active
          ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
          : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700'
        }
      `}
    >
      {number && (
        <span className={`
          w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
          ${active ? 'bg-cyan-700' : 'bg-slate-700'}
        `}>
          {number}
        </span>
      )}
      {children}
    </button>
  );
}

// Step Content Component
interface StepContentProps {
  number: number;
  title: string;
  color: 'cyan' | 'blue' | 'green' | 'purple';
  children: React.ReactNode;
}

function StepContent({ number, title, color, children }: StepContentProps) {
  const colorClasses = {
    cyan: 'text-cyan-400 bg-cyan-600/20',
    blue: 'text-blue-400 bg-blue-600/20',
    green: 'text-green-400 bg-green-600/20',
    purple: 'text-purple-400 bg-purple-600/20',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-10 h-10 rounded-full ${colorClasses[color]} flex items-center justify-center`}>
          <span className={`text-lg font-bold ${colorClasses[color].split(' ')[0]}`}>{number}</span>
        </div>
        <h3 className="text-xl font-semibold text-white">{title}</h3>
      </div>
      <div className="pl-13">
        {children}
      </div>
    </div>
  );
}

// Expandable Section Component
interface ExpandableSectionProps {
  title: string;
  icon: string;
  isExpanded: boolean;
  onToggle: () => void;
  color: 'green' | 'amber';
  children: React.ReactNode;
}

function ExpandableSection({ title, icon, isExpanded, onToggle, color, children }: ExpandableSectionProps) {
  const colorClasses = {
    green: 'border-green-600/30 bg-green-600/5',
    amber: 'border-amber-600/30 bg-amber-600/5',
  };

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${colorClasses[color]}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-6 hover:bg-slate-700/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <h3 className="text-xl font-semibold text-white text-left">{title}</h3>
        </div>
        <svg
          className={`w-6 h-6 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
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

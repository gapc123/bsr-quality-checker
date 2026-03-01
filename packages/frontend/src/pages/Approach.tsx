import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ConstructionSection } from '../components/ContextSection';

type ComparisonView = 'chatgpt' | 'traditional' | 'attlee';

export default function Approach() {
  const [comparisonView, setComparisonView] = useState<ComparisonView>('attlee');
  const [expandedLearning, setExpandedLearning] = useState<string | null>(null);

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
              <Link to="/approach" className="text-white font-medium">
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
          <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
            The speed of AI.
            <br />
            The certainty of rules.
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              The assurance of experts.
            </span>
          </h1>
        </div>
      </section>

      {/* Interactive Comparison */}
      <section className="relative py-20 bg-slate-900">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Why Our Approach Is Different
            </h2>
            <div className="h-1 w-24 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full" />
            <p className="text-slate-400 mt-4">
              Click to compare approaches
            </p>
          </div>

          {/* Comparison Selector */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <button
              onClick={() => setComparisonView('chatgpt')}
              className={`
                px-6 py-3 rounded-lg font-medium transition-all
                ${comparisonView === 'chatgpt'
                  ? 'bg-amber-600 text-white shadow-lg'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'
                }
              `}
            >
              ChatGPT / Generic AI
            </button>
            <button
              onClick={() => setComparisonView('traditional')}
              className={`
                px-6 py-3 rounded-lg font-medium transition-all
                ${comparisonView === 'traditional'
                  ? 'bg-slate-600 text-white shadow-lg'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'
                }
              `}
            >
              Traditional Consultant
            </button>
            <button
              onClick={() => setComparisonView('attlee')}
              className={`
                px-6 py-3 rounded-lg font-medium transition-all
                ${comparisonView === 'attlee'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/30'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'
                }
              `}
            >
              attlee.ai ⭐
            </button>
          </div>

          {/* Comparison Content */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* ChatGPT */}
            <div className={`
              bg-slate-900/50 border rounded-xl p-6 transition-all duration-300
              ${comparisonView === 'chatgpt'
                ? 'border-amber-600 shadow-lg shadow-amber-600/20 scale-105'
                : 'border-slate-700 opacity-40 scale-95'
              }
            `}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-200">ChatGPT / Generic AI</h3>
                <span className="px-3 py-1 bg-amber-600/20 text-amber-400 text-xs font-semibold rounded-full border border-amber-600/30">
                  Probabilistic
                </span>
              </div>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-slate-600 mt-1">•</span>
                  <span>Generates likely answers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-600 mt-1">•</span>
                  <span>No deterministic pass/fail logic</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-600 mt-1">•</span>
                  <span>No embedded regulatory matrix</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-600 mt-1">•</span>
                  <span>Inconsistent outputs</span>
                </li>
              </ul>
            </div>

            {/* Traditional Consultant */}
            <div className={`
              bg-slate-900/50 border rounded-xl p-6 transition-all duration-300
              ${comparisonView === 'traditional'
                ? 'border-slate-600 shadow-lg shadow-slate-600/20 scale-105'
                : 'border-slate-700 opacity-40 scale-95'
              }
            `}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-200">Traditional Consultant</h3>
                <span className="px-3 py-1 bg-slate-600/20 text-slate-400 text-xs font-semibold rounded-full border border-slate-600/30">
                  4–6 weeks
                </span>
              </div>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-slate-600 mt-1">•</span>
                  <span>Manual interpretation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-600 mt-1">•</span>
                  <span>Variable outcomes between reviewers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-600 mt-1">•</span>
                  <span>Hard to scale</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-600 mt-1">•</span>
                  <span>Long turnaround times</span>
                </li>
              </ul>
            </div>

            {/* Attlee - Featured */}
            <div className={`
              bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border-2 rounded-xl p-6 transition-all duration-300
              ${comparisonView === 'attlee'
                ? 'border-cyan-600/50 shadow-xl shadow-cyan-600/20 scale-105'
                : 'border-cyan-600/30 opacity-40 scale-95'
              }
            `}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">attlee.ai</h3>
                <span className="px-3 py-1 bg-cyan-600 text-white text-xs font-semibold rounded-full">
                  Best of both
                </span>
              </div>
              <ul className="space-y-2 text-sm text-slate-200">
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>AI-powered extraction and structuring</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Deterministic Yes/No decisions per regulation</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Full audit trail and expert verification</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Scales to any volume</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Summary */}
          <div className="text-center mt-12">
            <p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              The speed of AI. The certainty of rules. The assurance of experts.
            </p>
          </div>
        </div>
      </section>

      {/* Construction Imagery Context */}
      <ConstructionSection />

      {/* Continuous Improvement */}
      <section className="relative py-20 bg-slate-900">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              A Growing Regulatory Intelligence Layer
            </h2>
            <div className="h-1 w-24 bg-gradient-to-r from-cyan-500 to-blue-400 mx-auto rounded-full" />
            <p className="text-slate-400 text-lg mt-4">
              Not a static rules engine
            </p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 space-y-6">
            <p className="text-lg text-slate-300 leading-relaxed">
              Unlike static compliance checklists, this system <span className="text-cyan-400 font-semibold">learns from real regulatory outcomes</span>.
              Every submission—whether successful or not—contributes to the system's understanding of what the Building Safety Regulator expects.
            </p>

            {/* Expandable Learning Sources */}
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-white flex items-center gap-3">
                <span className="w-2 h-2 bg-blue-500 rounded-full" />
                What the System Learns From
              </h3>

              <LearningSource
                id="successful"
                title="Successful Gateway 2 submissions and their common patterns"
                icon="✓"
                color="green"
                isExpanded={expandedLearning === 'successful'}
                onToggle={() => setExpandedLearning(expandedLearning === 'successful' ? null : 'successful')}
              >
                <p className="text-sm text-slate-400">
                  We analyze submissions that pass Gateway 2 review to identify patterns in documentation quality, structure, and regulatory interpretation.
                  These patterns inform our rules engine's quality thresholds and evidence requirements.
                </p>
              </LearningSource>

              <LearningSource
                id="failed"
                title="Submissions that failed and the specific reasons why"
                icon="⚠"
                color="amber"
                isExpanded={expandedLearning === 'failed'}
                onToggle={() => setExpandedLearning(expandedLearning === 'failed' ? null : 'failed')}
              >
                <p className="text-sm text-slate-400">
                  Failed submissions reveal BSR's interpretation of requirements and common pitfalls. We use this to strengthen our validation rules
                  and flag similar issues proactively in future assessments.
                </p>
              </LearningSource>

              <LearningSource
                id="feedback"
                title="Direct feedback from BSR reviews and queries"
                icon="💬"
                color="blue"
                isExpanded={expandedLearning === 'feedback'}
                onToggle={() => setExpandedLearning(expandedLearning === 'feedback' ? null : 'feedback')}
              >
                <p className="text-sm text-slate-400">
                  When BSR requests clarifications or additional information, we capture these as signals about their expectations.
                  This helps calibrate our confidence scoring and flag areas likely to trigger regulator questions.
                </p>
              </LearningSource>

              <LearningSource
                id="changes"
                title="Changes in regulatory interpretation over time"
                icon="⟳"
                color="purple"
                isExpanded={expandedLearning === 'changes'}
                onToggle={() => setExpandedLearning(expandedLearning === 'changes' ? null : 'changes')}
              >
                <p className="text-sm text-slate-400">
                  As BSR evolves its interpretation of the Building Safety Act, our system adapts. We track how regulatory standards
                  shift and update our rules accordingly, ensuring our assessments stay current.
                </p>
              </LearningSource>
            </div>

            {/* How This Improves */}
            <div className="pt-6 border-t border-slate-700">
              <h3 className="text-xl font-semibold text-white flex items-center gap-3 mb-4">
                <span className="w-2 h-2 bg-cyan-500 rounded-full" />
                How This Improves the System
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-slate-900/50 rounded-lg p-4 space-y-2">
                  <div className="text-cyan-400 font-semibold">Pattern Recognition</div>
                  <div className="text-sm text-slate-400">
                    Better identification of what constitutes submission-ready documentation
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4 space-y-2">
                  <div className="text-cyan-400 font-semibold">Risk Identification</div>
                  <div className="text-sm text-slate-400">
                    Earlier detection of issues likely to trigger regulator queries
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4 space-y-2">
                  <div className="text-cyan-400 font-semibold">Confidence Calibration</div>
                  <div className="text-sm text-slate-400">
                    More accurate assessment of which areas need further review
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4 space-y-2">
                  <div className="text-cyan-400 font-semibold">Conservative Guidance</div>
                  <div className="text-sm text-slate-400">
                    More cautious where regulatory standards remain ambiguous
                  </div>
                </div>
              </div>
            </div>

            {/* The Result */}
            <div className="pt-6 border-t border-slate-700">
              <p className="text-lg text-cyan-400 font-medium italic text-center">
                The Result: Over time, the system becomes not just faster, but more accurate—helping teams
                anticipate regulator expectations before submission, reducing delays and rework.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Next Section */}
      <section className="relative py-16 bg-slate-950 border-t border-slate-800/50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Link
            to="/security"
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-lg font-semibold rounded-lg transition-all shadow-lg shadow-purple-600/20"
          >
            Next: See Security Details
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

// Learning Source Component (Expandable)
interface LearningSourceProps {
  id: string;
  title: string;
  icon: string;
  color: 'green' | 'amber' | 'blue' | 'purple';
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function LearningSource({ title, icon, color, isExpanded, onToggle, children }: LearningSourceProps) {
  const colorClasses = {
    green: 'border-green-600/30 bg-green-600/5 text-green-400',
    amber: 'border-amber-600/30 bg-amber-600/5 text-amber-400',
    blue: 'border-blue-600/30 bg-blue-600/5 text-blue-400',
    purple: 'border-purple-600/30 bg-purple-600/5 text-purple-400',
  };

  return (
    <div className={`border rounded-lg overflow-hidden transition-all ${colorClasses[color].split(' ').slice(0, 2).join(' ')}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-3 p-4 hover:bg-slate-700/30 transition-colors text-left"
      >
        <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
          <span className="text-lg">{icon}</span>
        </div>
        <div className="flex-1">
          <p className="text-slate-300 font-medium">{title}</p>
        </div>
        <svg
          className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isExpanded && (
        <div className="px-4 pb-4 pl-13">
          {children}
        </div>
      )}
    </div>
  );
}

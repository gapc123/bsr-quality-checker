import { useState } from 'react';

interface PackRef {
  docName: string;
  page: number;
  excerpt: string;
  confidence: number;
}

interface RegRef {
  source: string;
  section: string;
  page?: number;
  excerpt: string;
}

interface CriterionAssessment {
  id: string;
  criterion: string;
  status: 'pass' | 'partial' | 'fail' | 'not_assessed';
  severity?: 'high' | 'medium' | 'low';
  finding: string;
  packRefs: PackRef[];
  regRefs: RegRef[];
  rationale: string[];
}

interface AuditTrailProps {
  assessments: CriterionAssessment[];
}

export default function AuditTrail({ assessments }: AuditTrailProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'evidence' | 'regulation' | 'reasoning'>('evidence');

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'pass':
        return { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-500', text: 'text-emerald-700' };
      case 'partial':
        return { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-500', text: 'text-amber-700' };
      case 'fail':
        return { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-500', text: 'text-red-700' };
      default:
        return { bg: 'bg-slate-50', border: 'border-slate-200', badge: 'bg-slate-400', text: 'text-slate-600' };
    }
  };

  const getSeverityBadge = (severity?: string) => {
    if (!severity) return null;
    const styles = {
      high: 'bg-red-100 text-red-700',
      medium: 'bg-amber-100 text-amber-700',
      low: 'bg-blue-100 text-blue-700'
    };
    return (
      <span className={`text-xs font-medium px-2 py-0.5 rounded ${styles[severity as keyof typeof styles]}`}>
        {severity.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* How to read hint */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <div>
          <p className="text-sm font-medium text-blue-900">How to read this report</p>
          <p className="text-sm text-blue-700 mt-1">
            Click any assessment to see the evidence from your documents, the regulatory basis, and our reasoning.
            Each finding links directly to page numbers in your submission.
          </p>
        </div>
      </div>

      {/* Assessments list */}
      <div className="space-y-3">
        {assessments.map((assessment) => {
          const styles = getStatusStyles(assessment.status);
          const isExpanded = expandedId === assessment.id;

          return (
            <div
              key={assessment.id}
              className={`rounded-xl border-2 overflow-hidden transition-all ${styles.border} ${isExpanded ? styles.bg : 'bg-white hover:bg-slate-50'}`}
            >
              {/* Header - always visible */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : assessment.id)}
                className="w-full px-5 py-4 flex items-center gap-4 text-left"
              >
                {/* Status indicator */}
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${styles.badge}`} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-slate-900">{assessment.criterion}</span>
                    {getSeverityBadge(assessment.severity)}
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-1">{assessment.finding}</p>
                </div>

                {/* Status badge */}
                <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${styles.badge}`}>
                  {assessment.status.toUpperCase()}
                </span>

                {/* Expand icon */}
                <svg
                  className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-5 pb-5 border-t border-slate-100">
                  {/* Tabs */}
                  <div className="flex gap-1 mt-4 mb-4 bg-slate-100 rounded-lg p-1">
                    <TabButton
                      active={activeTab === 'evidence'}
                      onClick={() => setActiveTab('evidence')}
                      count={assessment.packRefs.length}
                    >
                      Evidence in Pack
                    </TabButton>
                    <TabButton
                      active={activeTab === 'regulation'}
                      onClick={() => setActiveTab('regulation')}
                      count={assessment.regRefs.length}
                    >
                      Regulatory Sources
                    </TabButton>
                    <TabButton
                      active={activeTab === 'reasoning'}
                      onClick={() => setActiveTab('reasoning')}
                      count={assessment.rationale.length}
                    >
                      Reasoning
                    </TabButton>
                  </div>

                  {/* Tab content */}
                  <div className="min-h-[120px]">
                    {activeTab === 'evidence' && (
                      <EvidencePanel refs={assessment.packRefs} />
                    )}
                    {activeTab === 'regulation' && (
                      <RegulationPanel refs={assessment.regRefs} />
                    )}
                    {activeTab === 'reasoning' && (
                      <ReasoningPanel rationale={assessment.rationale} />
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TabButton({
  children,
  active,
  onClick,
  count
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
        active
          ? 'bg-white text-slate-900 shadow-sm'
          : 'text-slate-600 hover:text-slate-900'
      }`}
    >
      {children}
      <span className={`text-xs px-1.5 py-0.5 rounded-full ${active ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'}`}>
        {count}
      </span>
    </button>
  );
}

function EvidencePanel({ refs }: { refs: PackRef[] }) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (refs.length === 0) {
    return (
      <div className="text-center py-6 text-slate-500">
        <svg className="w-8 h-8 mx-auto mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-sm">No direct evidence found in submission</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {refs.map((ref, index) => (
        <div
          key={index}
          className="bg-white rounded-lg border border-slate-200 overflow-hidden"
        >
          <button
            onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-50 rounded flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-slate-900">{ref.docName}</p>
                <p className="text-xs text-slate-500">Page {ref.page}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ConfidenceBadge confidence={ref.confidence} />
              <svg
                className={`w-4 h-4 text-slate-400 transition-transform ${expandedIndex === index ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {expandedIndex === index && (
            <div className="px-4 pb-4 border-t border-slate-100">
              <div className="mt-3 bg-slate-50 rounded-lg p-3 border-l-4 border-blue-400">
                <p className="text-sm text-slate-700 italic">"{ref.excerpt}"</p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function RegulationPanel({ refs }: { refs: RegRef[] }) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (refs.length === 0) {
    return (
      <div className="text-center py-6 text-slate-500">
        <svg className="w-8 h-8 mx-auto mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <p className="text-sm">No regulatory sources linked</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {refs.map((ref, index) => (
        <div
          key={index}
          className="bg-white rounded-lg border border-slate-200 overflow-hidden"
        >
          <button
            onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-50 rounded flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-slate-900">{ref.source}</p>
                <p className="text-xs text-slate-500">{ref.section}{ref.page ? `, p.${ref.page}` : ''}</p>
              </div>
            </div>
            <svg
              className={`w-4 h-4 text-slate-400 transition-transform ${expandedIndex === index ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expandedIndex === index && (
            <div className="px-4 pb-4 border-t border-slate-100">
              <div className="mt-3 bg-purple-50 rounded-lg p-3 border-l-4 border-purple-400">
                <p className="text-sm text-slate-700">"{ref.excerpt}"</p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ReasoningPanel({ rationale }: { rationale: string[] }) {
  if (rationale.length === 0) {
    return (
      <div className="text-center py-6 text-slate-500">
        <p className="text-sm">No detailed reasoning available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <ul className="space-y-2">
        {rationale.map((point, index) => (
          <li key={index} className="flex items-start gap-3">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center mt-0.5">
              {index + 1}
            </span>
            <p className="text-sm text-slate-700">{point}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const label = confidence >= 0.8 ? 'High' : confidence >= 0.5 ? 'Medium' : 'Low';
  const color = confidence >= 0.8 ? 'bg-green-100 text-green-700' : confidence >= 0.5 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600';

  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded ${color}`}>
      {label}
    </span>
  );
}

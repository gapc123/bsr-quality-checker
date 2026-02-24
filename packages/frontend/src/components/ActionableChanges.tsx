import { useState } from 'react';

interface AIActionableChange {
  id: string;
  title: string;
  description: string;
  why: string;
  riskLevel: 'low' | 'mechanical';
  appliesTo: string;
  category: 'formatting' | 'structure' | 'cross-reference' | 'clarity' | 'navigation';
}

interface HumanJudgementChange {
  id: string;
  title: string;
  description: string;
  suggestedOwner: string;
  severity: 'high' | 'medium' | 'low';
}

interface ActionableChangesProps {
  aiChanges: AIActionableChange[];
  humanChanges: HumanJudgementChange[];
  onApplyChanges: (selectedIds: string[]) => Promise<void>;
  onDownloadUpdated: () => void;
  onDownloadEditable: (selectedIds: string[]) => Promise<void>;
  hasUpdatedReport: boolean;
  packId: string;
  versionId: string;
}

type ChangeDecision = 'approved' | 'rejected' | 'pending';

export default function ActionableChanges({
  aiChanges,
  humanChanges,
  onApplyChanges,
  onDownloadUpdated,
  onDownloadEditable,
  hasUpdatedReport: _hasUpdatedReport,
  packId: _packId,
  versionId: _versionId
}: ActionableChangesProps) {
  const [decisions, setDecisions] = useState<Record<string, ChangeDecision>>(
    () => aiChanges.reduce((acc, c) => ({ ...acc, [c.id]: 'pending' as ChangeDecision }), {})
  );
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [showHumanChanges, setShowHumanChanges] = useState(false);
  const [downloadingDocx, setDownloadingDocx] = useState(false);

  const approveChange = (id: string) => {
    setDecisions(prev => ({ ...prev, [id]: 'approved' }));
  };

  const rejectChange = (id: string) => {
    setDecisions(prev => ({ ...prev, [id]: 'rejected' }));
  };

  const approveAll = () => {
    const newDecisions = { ...decisions };
    aiChanges.forEach(c => { newDecisions[c.id] = 'approved'; });
    setDecisions(newDecisions);
  };

  const rejectAll = () => {
    const newDecisions = { ...decisions };
    aiChanges.forEach(c => { newDecisions[c.id] = 'rejected'; });
    setDecisions(newDecisions);
  };

  const approvedChanges = aiChanges.filter(c => decisions[c.id] === 'approved');
  const rejectedChanges = aiChanges.filter(c => decisions[c.id] === 'rejected');
  const pendingCount = aiChanges.filter(c => decisions[c.id] === 'pending').length;

  const handleApply = async () => {
    setApplying(true);
    try {
      await onApplyChanges(approvedChanges.map(c => c.id));
      setApplied(true);
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* AI-Actionable Changes */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">AI-Actionable Changes</h3>
                <p className="text-sm text-slate-500">Format & structure improvements only</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={approveAll}
                className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Approve all
              </button>
              <span className="text-slate-300">|</span>
              <button
                onClick={rejectAll}
                className="text-sm text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Reject all
              </button>
            </div>
          </div>
          {/* Explanation of AI limitations */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-800">
            <strong>Why only formatting changes?</strong> AI can safely make structural and formatting improvements
            (navigation, citations, headings) without professional judgement. Substantive compliance changes
            require human expertise and are listed separately below.
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {aiChanges.map((change) => {
            const decision = decisions[change.id];
            const isApproved = decision === 'approved';
            const isRejected = decision === 'rejected';

            return (
              <div
                key={change.id}
                className={`px-5 py-4 transition-colors ${
                  isApproved ? 'bg-green-50' : isRejected ? 'bg-red-50' : 'bg-white'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Tick/Cross buttons */}
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <button
                      onClick={() => approveChange(change.id)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                        isApproved
                          ? 'bg-green-600 text-white shadow-md'
                          : 'bg-slate-100 text-slate-400 hover:bg-green-100 hover:text-green-600'
                      }`}
                      title="Approve this change"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => rejectChange(change.id)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                        isRejected
                          ? 'bg-red-600 text-white shadow-md'
                          : 'bg-slate-100 text-slate-400 hover:bg-red-100 hover:text-red-600'
                      }`}
                      title="Reject this change"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-slate-900">{change.title}</span>
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full capitalize">
                        {change.category || 'formatting'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{change.description}</p>
                    {/* Why explanation in italics */}
                    <p className="text-sm italic text-slate-500">
                      {change.why || `Improves report quality and readability.`}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Status and Submit */}
        <div className="px-5 py-4 border-t border-slate-200 bg-slate-50">
          {!applied ? (
            <div className="space-y-3">
              {/* Status summary */}
              <div className="flex items-center justify-center gap-4 text-sm">
                <span className="flex items-center gap-1 text-green-600">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {approvedChanges.length} approved
                </span>
                <span className="flex items-center gap-1 text-red-500">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  {rejectedChanges.length} rejected
                </span>
                {pendingCount > 0 && (
                  <span className="text-slate-400">{pendingCount} pending</span>
                )}
              </div>

              <button
                onClick={handleApply}
                disabled={approvedChanges.length === 0 || applying}
                className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {applying ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Applying changes...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Submit {approvedChanges.length} Approved Changes
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-700 bg-green-100 rounded-lg px-4 py-3">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{approvedChanges.length} changes applied successfully</span>
              </div>

              {/* Download Options */}
              <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
                <h4 className="font-semibold text-slate-900">Download Your Report</h4>

                {/* PDF Option */}
                <button
                  onClick={onDownloadUpdated}
                  className="w-full py-3 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Download PDF Report
                </button>

                {/* Editable DOCX Option - Emphasized */}
                <div className="border-2 border-blue-200 bg-blue-50 rounded-lg p-3">
                  <button
                    onClick={async () => {
                      setDownloadingDocx(true);
                      try {
                        await onDownloadEditable(approvedChanges.map(c => c.id));
                      } finally {
                        setDownloadingDocx(false);
                      }
                    }}
                    disabled={downloadingDocx}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {downloadingDocx ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    )}
                    Download Editable DOCX
                  </button>
                  <div className="mt-2 flex items-start gap-2">
                    <svg className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <p className="text-xs text-blue-700">
                      <strong>Editable Word document</strong> with all approved changes highlighted in yellow.
                      You can review, modify, and share with your team.
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary of what was applied */}
              <div className="text-sm space-y-2">
                <p className="font-medium text-slate-700">Changes included:</p>
                <ul className="space-y-1">
                  {approvedChanges.map(c => (
                    <li key={c.id} className="flex items-center gap-2 text-green-700">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {c.title}
                    </li>
                  ))}
                </ul>
                {rejectedChanges.length > 0 && (
                  <>
                    <p className="font-medium text-slate-500 mt-3">Not included:</p>
                    <ul className="space-y-1">
                      {rejectedChanges.map(c => (
                        <li key={c.id} className="flex items-center gap-2 text-slate-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          {c.title}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Human Judgement Changes (collapsible) */}
      {humanChanges.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <button
            onClick={() => setShowHumanChanges(!showHumanChanges)}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-slate-900">Changes Requiring Human Judgement</h3>
                <p className="text-sm text-slate-500">{humanChanges.length} items need manual review</p>
              </div>
            </div>
            <svg
              className={`w-5 h-5 text-slate-400 transition-transform ${showHumanChanges ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showHumanChanges && (
            <div className="border-t border-slate-200">
              <div className="divide-y divide-slate-100">
                {humanChanges.map((change) => (
                  <div key={change.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-slate-900">{change.title}</span>
                          <SeverityBadge severity={change.severity} />
                        </div>
                        <p className="text-sm text-slate-600">{change.description}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-slate-500">Suggested owner</p>
                        <p className="text-sm font-medium text-slate-700">{change.suggestedOwner}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-5 py-3 bg-amber-50 border-t border-amber-200">
                <p className="text-xs text-amber-700">
                  These changes involve technical content, regulatory interpretation, or professional judgement.
                  They should be reviewed by the appropriate stakeholder before implementation.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SeverityBadge({ severity }: { severity: 'high' | 'medium' | 'low' }) {
  const styles = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-blue-100 text-blue-700'
  };

  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded ${styles[severity]}`}>
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  );
}

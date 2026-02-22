import { useState } from 'react';

interface AIActionableChange {
  id: string;
  title: string;
  description: string;
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
  hasUpdatedReport: boolean;
}

export default function ActionableChanges({
  aiChanges,
  humanChanges,
  onApplyChanges,
  onDownloadUpdated,
  hasUpdatedReport: _hasUpdatedReport
}: ActionableChangesProps) {
  const [selectedChanges, setSelectedChanges] = useState<Set<string>>(
    new Set(aiChanges.map(c => c.id))
  );
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [showHumanChanges, setShowHumanChanges] = useState(false);

  const toggleChange = (id: string) => {
    const newSelected = new Set(selectedChanges);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedChanges(newSelected);
  };

  const selectAll = () => {
    setSelectedChanges(new Set(aiChanges.map(c => c.id)));
  };

  const deselectAll = () => {
    setSelectedChanges(new Set());
  };

  const handleApply = async () => {
    setApplying(true);
    try {
      await onApplyChanges(Array.from(selectedChanges));
      setApplied(true);
    } finally {
      setApplying(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'formatting':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        );
      case 'structure':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        );
      case 'cross-reference':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        );
      case 'clarity':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
      case 'navigation':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{aiChanges.length}</p>
              <p className="text-sm text-green-600">AI can fix automatically</p>
            </div>
          </div>
          <p className="text-xs text-green-600 mt-2">
            Low-risk improvements like formatting, navigation, and cross-references
          </p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-700">{humanChanges.length}</p>
              <p className="text-sm text-amber-600">Require human judgement</p>
            </div>
          </div>
          <p className="text-xs text-amber-600 mt-2">
            Technical content, professional sign-offs, and regulatory decisions
          </p>
        </div>
      </div>

      {/* AI-Actionable Changes */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">AI-Actionable Changes</h3>
                <p className="text-sm text-slate-500">Select changes to apply automatically</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={selectAll}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Select all
              </button>
              <span className="text-slate-300">|</span>
              <button
                onClick={deselectAll}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {aiChanges.map((change) => (
            <label
              key={change.id}
              className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedChanges.has(change.id)}
                onChange={() => toggleChange(change.id)}
                className="mt-1 h-5 w-5 text-green-600 border-slate-300 rounded focus:ring-green-500"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-slate-400">{getCategoryIcon(change.category)}</span>
                  <span className="font-medium text-slate-900">{change.title}</span>
                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                    {change.riskLevel === 'mechanical' ? 'Mechanical' : 'Low risk'}
                  </span>
                </div>
                <p className="text-sm text-slate-600">{change.description}</p>
                <p className="text-xs text-slate-400 mt-1">Applies to: {change.appliesTo}</p>
              </div>
            </label>
          ))}
        </div>

        {/* Apply button */}
        <div className="px-5 py-4 border-t border-slate-200 bg-slate-50">
          {!applied ? (
            <button
              onClick={handleApply}
              disabled={selectedChanges.size === 0 || applying}
              className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {applying ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Applying {selectedChanges.size} changes...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Apply {selectedChanges.size} Selected Changes
                </>
              )}
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-lg px-4 py-3">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{selectedChanges.size} changes applied successfully</span>
              </div>
              <button
                onClick={onDownloadUpdated}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Download Updated PDF Report
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Human Judgement Changes (collapsible) */}
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

      {/* What was changed summary (after applying) */}
      {applied && (
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
          <h4 className="font-medium text-slate-900 mb-2">Changes Applied</h4>
          <ul className="space-y-1">
            {aiChanges
              .filter(c => selectedChanges.has(c.id))
              .map(c => (
                <li key={c.id} className="flex items-center gap-2 text-sm text-slate-600">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {c.title}
                </li>
              ))}
          </ul>
          {aiChanges.filter(c => !selectedChanges.has(c.id)).length > 0 && (
            <>
              <h4 className="font-medium text-slate-900 mt-4 mb-2">Not Applied</h4>
              <ul className="space-y-1">
                {aiChanges
                  .filter(c => !selectedChanges.has(c.id))
                  .map(c => (
                    <li key={c.id} className="flex items-center gap-2 text-sm text-slate-400">
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

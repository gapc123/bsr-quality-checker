/**
 * Grouped Review Flow - MVP Fast Review
 *
 * Replaces item-by-item carousel with grouped summary approach
 * - Summary screen
 * - Grouped AI items by document/category
 * - Batch accept/reject
 * - Human items shown as summary only
 *
 * Goal: 5-10 clicks instead of 50+ clicks
 */

import React, { useState, useMemo } from 'react';
import type { AssessmentResult } from '../types/assessment';

interface GroupedReviewFlowProps {
  issues: AssessmentResult[];
  onComplete: (acceptedIds: string[], rejectedIds: string[]) => void;
  onClose: () => void;
}

interface IssueGroup {
  id: string;
  name: string;
  responsible: string; // "Fire Engineer", "Structural Engineer", "Internal Team", etc.
  issues: AssessmentResult[];
  canAIFix: boolean;
}

type ViewScreen = 'summary' | 'ai-groups' | 'human-summary' | 'complete';

export const GroupedReviewFlow: React.FC<GroupedReviewFlowProps> = ({
  issues,
  onComplete,
  onClose
}) => {
  const [currentScreen, setCurrentScreen] = useState<ViewScreen>('summary');
  const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set());
  const [rejectedIds, setRejectedIds] = useState<Set<string>>(new Set());
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  // Classify issues
  const { aiFixable, humanRequired, aiChangeTypes, humanReasons } = useMemo(() => {
    const aiFixable: AssessmentResult[] = [];
    const humanRequired: AssessmentResult[] = [];
    const aiChangeTypes = {
      formatting: 0,
      wording: 0,
      compliance: 0,
      structural: 0
    };
    const humanReasons = {
      missingInfo: 0,
      specialistRequired: 0,
      ambiguousInterpretation: 0,
      physicalEvidence: 0
    };

    issues.forEach(issue => {
      // AI can fix if there's a proposed change and confidence is not REQUIRES_HUMAN_JUDGEMENT
      const canAIFix =
        issue.proposed_change &&
        issue.proposed_change.length > 100 &&
        issue.confidence?.level !== 'REQUIRES_HUMAN_JUDGEMENT';

      if (canAIFix) {
        aiFixable.push(issue);

        // Categorize AI change type
        const category = issue.category?.toLowerCase() || '';
        const action = issue.actions_required?.[0]?.action?.toLowerCase() || '';

        if (category.includes('format') || action.includes('format')) {
          aiChangeTypes.formatting++;
        } else if (category.includes('wording') || action.includes('wording') || action.includes('clarif')) {
          aiChangeTypes.wording++;
        } else if (category.includes('compliance') || category.includes('regulation')) {
          aiChangeTypes.compliance++;
        } else {
          aiChangeTypes.structural++;
        }
      } else {
        humanRequired.push(issue);

        // Categorize human reason
        const gaps = issue.gaps_identified?.join(' ').toLowerCase() || '';
        const reasoning = issue.reasoning?.toLowerCase() || '';
        const engagement = issue.triage?.engagement_type || '';

        if (gaps.includes('missing') || reasoning.includes('not provided') || reasoning.includes('tbc')) {
          humanReasons.missingInfo++;
        } else if (engagement === 'SPECIALIST_REQUIRED') {
          humanReasons.specialistRequired++;
        } else if (reasoning.includes('ambiguous') || reasoning.includes('unclear')) {
          humanReasons.ambiguousInterpretation++;
        } else if (reasoning.includes('testing') || reasoning.includes('certification') || reasoning.includes('evidence')) {
          humanReasons.physicalEvidence++;
        } else {
          humanReasons.specialistRequired++;
        }
      }
    });

    return { aiFixable, humanRequired, aiChangeTypes, humanReasons };
  }, [issues]);

  // Group AI-fixable items by responsible party/document
  const aiGroups = useMemo((): IssueGroup[] => {
    const groups: Map<string, IssueGroup> = new Map();

    aiFixable.forEach(issue => {
      // Determine responsible party from triage or action
      let responsible = 'Internal Team';
      let groupKey = 'internal';

      if (issue.triage?.engagement_type === 'SPECIALIST_REQUIRED') {
        // Try to determine specialist type from category or actions
        const category = issue.category?.toLowerCase() || '';
        const actions = issue.actions_required?.[0]?.owner?.toLowerCase() || '';

        if (category.includes('fire') || actions.includes('fire engineer')) {
          responsible = 'Fire Engineer';
          groupKey = 'fire';
        } else if (category.includes('structural') || actions.includes('structural')) {
          responsible = 'Structural Engineer';
          groupKey = 'structural';
        } else if (category.includes('mep') || category.includes('mechanical') || category.includes('electrical')) {
          responsible = 'MEP Engineer';
          groupKey = 'mep';
        } else if (category.includes('architect') || actions.includes('architect')) {
          responsible = 'Architect';
          groupKey = 'architect';
        } else {
          responsible = 'Specialist Required';
          groupKey = 'specialist';
        }
      } else if (issue.triage?.quick_win) {
        responsible = 'Quick Wins (Internal)';
        groupKey = 'quick-wins';
      }

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          id: groupKey,
          name: groupKey === 'quick-wins' ? 'Quick Wins' : `${responsible} Items`,
          responsible,
          issues: [],
          canAIFix: true
        });
      }

      groups.get(groupKey)!.issues.push(issue);
    });

    return Array.from(groups.values()).sort((a, b) => {
      // Quick wins first, then by issue count descending
      if (a.id === 'quick-wins') return -1;
      if (b.id === 'quick-wins') return 1;
      return b.issues.length - a.issues.length;
    });
  }, [aiFixable]);

  // Group human items by responsible party
  const humanGroups = useMemo((): IssueGroup[] => {
    const groups: Map<string, IssueGroup> = new Map();

    humanRequired.forEach(issue => {
      const category = issue.category?.toLowerCase() || '';
      const actions = issue.actions_required?.[0]?.owner?.toLowerCase() || '';

      let responsible = 'General Review';
      let groupKey = 'general';

      if (category.includes('fire') || actions.includes('fire')) {
        responsible = 'Fire Engineer';
        groupKey = 'fire';
      } else if (category.includes('structural')) {
        responsible = 'Structural Engineer';
        groupKey = 'structural';
      } else if (category.includes('mep') || category.includes('mechanical') || category.includes('electrical')) {
        responsible = 'MEP Engineer';
        groupKey = 'mep';
      } else if (category.includes('architect')) {
        responsible = 'Architect';
        groupKey = 'architect';
      }

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          id: `human-${groupKey}`,
          name: `${responsible} Review Required`,
          responsible,
          issues: [],
          canAIFix: false
        });
      }

      groups.get(groupKey)!.issues.push(issue);
    });

    return Array.from(groups.values()).sort((a, b) => b.issues.length - a.issues.length);
  }, [humanRequired]);

  const handleAcceptGroup = (group: IssueGroup) => {
    const newAccepted = new Set(acceptedIds);
    const newRejected = new Set(rejectedIds);

    group.issues.forEach(issue => {
      newAccepted.add(issue.matrix_id);
      newRejected.delete(issue.matrix_id);
    });

    setAcceptedIds(newAccepted);
    setRejectedIds(newRejected);
  };

  const handleRejectGroup = (group: IssueGroup) => {
    const newAccepted = new Set(acceptedIds);
    const newRejected = new Set(rejectedIds);

    group.issues.forEach(issue => {
      newRejected.add(issue.matrix_id);
      newAccepted.delete(issue.matrix_id);
    });

    setAcceptedIds(newAccepted);
    setRejectedIds(newRejected);
  };

  const handleToggleItem = (issueId: string) => {
    const newAccepted = new Set(acceptedIds);
    const newRejected = new Set(rejectedIds);

    if (newAccepted.has(issueId)) {
      newAccepted.delete(issueId);
      newRejected.add(issueId);
    } else {
      newRejected.delete(issueId);
      newAccepted.add(issueId);
    }

    setAcceptedIds(newAccepted);
    setRejectedIds(newRejected);
  };

  const handleFinish = () => {
    console.log('[GroupedReviewFlow] Generate Documents clicked');
    console.log('[GroupedReviewFlow] Accepted IDs:', Array.from(acceptedIds));
    console.log('[GroupedReviewFlow] Rejected IDs:', Array.from(rejectedIds));
    onComplete(Array.from(acceptedIds), Array.from(rejectedIds));
  };

  // Calculate stats
  const totalReviewed = acceptedIds.size + rejectedIds.size;
  const totalAIItems = aiFixable.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col rounded-lg">
        {/* Header */}
        <div className="border-b-2 border-slate-300 bg-slate-50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Review Assessment Results</h2>
              <p className="text-sm text-slate-600 mt-1">
                {currentScreen === 'summary' && 'Overview of issues found'}
                {currentScreen === 'ai-groups' && `Reviewing AI-fixable items (${totalReviewed}/${totalAIItems})`}
                {currentScreen === 'human-summary' && 'Items requiring specialist review'}
                {currentScreen === 'complete' && 'Review complete'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* EXECUTIVE SUMMARY SCREEN */}
          {currentScreen === 'summary' && (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Header */}
              <div className="text-center pb-4 border-b-2 border-slate-200">
                <h3 className="text-3xl font-light text-slate-900 mb-2">Executive Summary</h3>
                <p className="text-lg text-slate-600">BSR Gateway 2 Compliance Assessment</p>
              </div>

              {/* Overall Verdict */}
              <div className={`border-l-4 p-6 ${
                humanRequired.length > 50 ? 'bg-red-50 border-red-500' :
                humanRequired.length > 20 ? 'bg-amber-50 border-amber-500' :
                'bg-emerald-50 border-emerald-500'
              }`}>
                <div className="flex items-start gap-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    humanRequired.length > 50 ? 'bg-red-500' :
                    humanRequired.length > 20 ? 'bg-amber-500' :
                    'bg-emerald-500'
                  }`}>
                    <span className="text-white text-2xl font-bold">
                      {humanRequired.length > 50 ? '🔴' : humanRequired.length > 20 ? '🟡' : '🟢'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className={`text-xl font-semibold mb-2 ${
                      humanRequired.length > 50 ? 'text-red-900' :
                      humanRequired.length > 20 ? 'text-amber-900' :
                      'text-emerald-900'
                    }`}>
                      {humanRequired.length > 50 ? 'Submission Not Ready' :
                       humanRequired.length > 20 ? 'Submission Requires Significant Work' :
                       'Submission Nearly Ready'}
                    </h4>
                    <p className={`text-base leading-relaxed ${
                      humanRequired.length > 50 ? 'text-red-800' :
                      humanRequired.length > 20 ? 'text-amber-800' :
                      'text-emerald-800'
                    }`}>
                      {humanRequired.length > 50 ?
                        `Your submission has ${humanRequired.length} items that require attention before it can proceed to Gateway 2. This will require significant additional work from specialists.` :
                       humanRequired.length > 20 ?
                        `Your submission has ${humanRequired.length} items that need to be addressed. Most can be resolved with focused effort from the appropriate specialists.` :
                        `Your submission is in good shape with only ${humanRequired.length} items requiring attention. These can likely be resolved quickly.`
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* What's Good */}
              <div className="bg-white border-2 border-emerald-500 rounded-lg overflow-hidden">
                <div className="bg-emerald-600 px-6 py-3">
                  <h4 className="text-lg font-semibold text-white">✓ What's Working</h4>
                </div>
                <div className="p-6">
                  <p className="text-base text-slate-700 leading-relaxed mb-4">
                    {aiFixable.length === 0 ? (
                      <span>
                        Your submission has <strong className="text-emerald-700">no quick fixes available</strong>. While this means all issues require human attention, your core documentation structure appears solid.
                      </span>
                    ) : (
                      <span>
                        We found <strong className="text-emerald-700">{aiFixable.length} minor {aiFixable.length === 1 ? 'issue' : 'issues'}</strong> that can be fixed with simple text edits—mostly small improvements to meet BSR formatting and wording requirements. These don't require new work from specialists.
                      </span>
                    )}
                  </p>
                  {aiFixable.length > 0 && (
                    <>
                      <p className="text-base text-slate-700 leading-relaxed mb-4">
                        <strong>What we can fix:</strong>
                      </p>
                      <ul className="space-y-2 text-sm text-slate-600 mb-4">
                        {aiChangeTypes.formatting > 0 && (
                          <li className="flex items-start gap-2">
                            <span className="text-emerald-600 mt-1">•</span>
                            <span><strong>{aiChangeTypes.formatting}</strong> document formatting {aiChangeTypes.formatting === 1 ? 'issue' : 'issues'} (section numbering, headers, layouts)</span>
                          </li>
                        )}
                        {aiChangeTypes.compliance > 0 && (
                          <li className="flex items-start gap-2">
                            <span className="text-emerald-600 mt-1">•</span>
                            <span><strong>{aiChangeTypes.compliance}</strong> regulatory wording {aiChangeTypes.compliance === 1 ? 'update' : 'updates'} (making language match BSR requirements)</span>
                          </li>
                        )}
                        {aiChangeTypes.wording > 0 && (
                          <li className="flex items-start gap-2">
                            <span className="text-emerald-600 mt-1">•</span>
                            <span><strong>{aiChangeTypes.wording}</strong> clarity {aiChangeTypes.wording === 1 ? 'improvement' : 'improvements'} (making technical descriptions clearer)</span>
                          </li>
                        )}
                        {aiChangeTypes.structural > 0 && (
                          <li className="flex items-start gap-2">
                            <span className="text-emerald-600 mt-1">•</span>
                            <span><strong>{aiChangeTypes.structural}</strong> structural {aiChangeTypes.structural === 1 ? 'edit' : 'edits'} (reorganizing content to match BSR structure)</span>
                          </li>
                        )}
                      </ul>
                      <div className="bg-emerald-50 border border-emerald-200 rounded p-3 text-sm text-emerald-800">
                        <strong>Good news:</strong> These {aiFixable.length} {aiFixable.length === 1 ? 'issue requires' : 'issues require'} no new specialist work—just approval of our suggested edits.
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* What's Bad / Needs Work */}
              <div className="bg-white border-2 border-red-500 rounded-lg overflow-hidden">
                <div className="bg-red-600 px-6 py-3">
                  <h4 className="text-lg font-semibold text-white">✗ What Needs Work</h4>
                </div>
                <div className="p-6">
                  <p className="text-base text-slate-700 leading-relaxed mb-4">
                    {humanRequired.length === 0 ? (
                      <span>
                        <strong className="text-emerald-700">Excellent news:</strong> No significant issues found. Your submission appears ready for Gateway 2.
                      </span>
                    ) : (
                      <span>
                        Your submission has <strong className="text-red-700">{humanRequired.length} {humanRequired.length === 1 ? 'issue' : 'issues'}</strong> that cannot be fixed with simple text edits. {humanRequired.length === 1 ? 'This requires' : 'These require'} actual work from specialists to provide missing information, create new documents, or make professional judgements.
                      </span>
                    )}
                  </p>
                  {humanRequired.length > 0 && (
                    <>
                      <p className="text-base text-slate-700 leading-relaxed mb-4">
                        <strong>Why {humanRequired.length === 1 ? 'this needs' : 'these need'} human attention:</strong>
                      </p>
                      <ul className="space-y-2 text-sm text-slate-600 mb-4">
                        {humanReasons.missingInfo > 0 && (
                          <li className="flex items-start gap-2">
                            <span className="text-red-600 mt-1">•</span>
                            <span><strong>{humanReasons.missingInfo}</strong> {humanReasons.missingInfo === 1 ? 'section is' : 'sections are'} incomplete or marked "TBC" (to be confirmed)</span>
                          </li>
                        )}
                        {humanReasons.specialistRequired > 0 && (
                          <li className="flex items-start gap-2">
                            <span className="text-red-600 mt-1">•</span>
                            <span><strong>{humanReasons.specialistRequired}</strong> {humanReasons.specialistRequired === 1 ? 'item requires' : 'items require'} specialist input (e.g., fire strategy calculations, structural certifications)</span>
                          </li>
                        )}
                        {humanReasons.ambiguousInterpretation > 0 && (
                          <li className="flex items-start gap-2">
                            <span className="text-red-600 mt-1">•</span>
                            <span><strong>{humanReasons.ambiguousInterpretation}</strong> {humanReasons.ambiguousInterpretation === 1 ? 'requirement needs' : 'requirements need'} professional interpretation of regulations</span>
                          </li>
                        )}
                        {humanReasons.physicalEvidence > 0 && (
                          <li className="flex items-start gap-2">
                            <span className="text-red-600 mt-1">•</span>
                            <span><strong>{humanReasons.physicalEvidence}</strong> {humanReasons.physicalEvidence === 1 ? 'item requires' : 'items require'} testing certificates or physical evidence</span>
                          </li>
                        )}
                      </ul>
                      <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-800">
                        <strong>Who needs to work on this:</strong> {humanGroups.map(g => g.responsible).join(', ')}. Your Outstanding Issues Report will show exactly what each specialist needs to provide.
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Next Steps */}
              <div className="bg-white border-2 border-indigo-500 rounded-lg overflow-hidden">
                <div className="bg-indigo-600 px-6 py-3">
                  <h4 className="text-lg font-semibold text-white">→ What Happens Next</h4>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-indigo-700 font-bold text-sm">1</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-900 mb-1">
                          {aiFixable.length > 0 ? 'Review suggested edits (optional)' : 'Generate your reports'}
                        </p>
                        <p className="text-sm text-slate-600">
                          {aiFixable.length > 0
                            ? `You can review and approve ${aiFixable.length} minor text edits, or skip this and go straight to your reports.`
                            : 'Click below to generate your assessment reports as downloadable PDFs.'
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-indigo-700 font-bold text-sm">2</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-900 mb-1">Download two PDF reports</p>
                        <ul className="text-sm text-slate-600 mt-2 space-y-2">
                          <li className="flex items-start gap-2">
                            <span className="text-indigo-600 mt-0.5">📄</span>
                            <span><strong>Full Assessment Report</strong> — Complete compliance analysis showing all {issues.length} items checked</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-indigo-600 mt-0.5">📋</span>
                            <span><strong>Outstanding Issues Report</strong> — Just the {humanRequired.length} {humanRequired.length === 1 ? 'issue' : 'issues'} that {humanRequired.length === 1 ? 'needs' : 'need'} work, organized by who needs to do it</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-indigo-700 font-bold text-sm">3</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-900 mb-1">Send to your team</p>
                        <p className="text-sm text-slate-600">
                          Hand the Outstanding Issues Report directly to the Fire Engineer, Structural Engineer, etc. Each specialist gets exactly what they need to fix.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action button */}
              <div className="pt-2">
                <button
                  onClick={() => setCurrentScreen(aiFixable.length > 0 ? 'ai-groups' : 'human-summary')}
                  className="w-full px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-semibold rounded-lg transition-colors shadow-lg flex items-center justify-center gap-3"
                >
                  {aiFixable.length > 0 ? 'Continue' : 'Generate Documents'}
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* AI GROUPS SCREEN */}
          {currentScreen === 'ai-groups' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-emerald-900">AI-Fixable Items ({aiGroups.length} groups)</h3>
                  <p className="text-sm text-emerald-700">Review and accept proposed changes</p>
                </div>
                <div className="text-sm text-emerald-800">
                  <strong>{acceptedIds.size}</strong> accepted • <strong>{rejectedIds.size}</strong> rejected
                </div>
              </div>

              {/* Groups */}
              {aiGroups.map((group, idx) => {
                const isExpanded = expandedGroup === group.id;
                const groupAccepted = group.issues.filter(i => acceptedIds.has(i.matrix_id)).length;
                const groupRejected = group.issues.filter(i => rejectedIds.has(i.matrix_id)).length;
                const groupPending = group.issues.length - groupAccepted - groupRejected;

                return (
                  <div key={group.id} className="bg-white border-2 border-slate-300 rounded-lg overflow-hidden">
                    <div className="bg-slate-50 border-b border-slate-300 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                              GROUP {idx + 1}
                            </span>
                            <h4 className="font-bold text-slate-900">{group.name}</h4>
                            <span className="text-sm text-slate-600">({group.issues.length} items)</span>
                          </div>
                          <div className="text-xs text-slate-600 mt-1">
                            {groupAccepted > 0 && <span className="text-emerald-600 font-semibold">{groupAccepted} accepted</span>}
                            {groupAccepted > 0 && groupRejected > 0 && <span> • </span>}
                            {groupRejected > 0 && <span className="text-red-600 font-semibold">{groupRejected} rejected</span>}
                            {groupPending > 0 && (groupAccepted > 0 || groupRejected > 0) && <span> • </span>}
                            {groupPending > 0 && <span className="text-slate-600">{groupPending} pending</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAcceptGroup(group)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded transition-colors"
                          >
                            ✓ Accept All
                          </button>
                          <button
                            onClick={() => handleRejectGroup(group)}
                            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 text-sm font-semibold rounded transition-colors"
                          >
                            ✗ Reject All
                          </button>
                          <button
                            onClick={() => setExpandedGroup(isExpanded ? null : group.id)}
                            className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold rounded transition-colors"
                          >
                            {isExpanded ? '▲ Less' : '▼ Details'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-4 space-y-3">
                        {group.issues.map(issue => {
                          const isAccepted = acceptedIds.has(issue.matrix_id);
                          const isRejected = rejectedIds.has(issue.matrix_id);

                          return (
                            <div
                              key={issue.matrix_id}
                              className={`border-2 rounded p-3 transition-colors ${
                                isAccepted
                                  ? 'border-emerald-500 bg-emerald-50'
                                  : isRejected
                                  ? 'border-red-500 bg-red-50'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs font-mono px-2 py-1 bg-slate-100 text-slate-700 rounded">
                                      {issue.matrix_id}
                                    </span>
                                    {issue.triage?.quick_win && (
                                      <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 font-semibold rounded">
                                        ⚡ QUICK WIN
                                      </span>
                                    )}
                                  </div>
                                  <h5 className="text-sm font-semibold text-slate-900 mb-2">{issue.matrix_title}</h5>
                                  <p className="text-xs text-slate-600 line-clamp-2">{issue.reasoning}</p>
                                </div>
                                <button
                                  onClick={() => handleToggleItem(issue.matrix_id)}
                                  className={`px-4 py-2 text-sm font-semibold rounded transition-colors ${
                                    isAccepted
                                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                      : isRejected
                                      ? 'bg-red-600 text-white hover:bg-red-700'
                                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                  }`}
                                >
                                  {isAccepted ? '✓ Accepted' : isRejected ? '✗ Rejected' : 'Review'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4">
                <button
                  onClick={() => setCurrentScreen('summary')}
                  className="px-6 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                >
                  ← Back to Summary
                </button>
                <button
                  onClick={() => setCurrentScreen('human-summary')}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Continue to Specialist Items →
                </button>
              </div>
            </div>
          )}

          {/* HUMAN SUMMARY SCREEN */}
          {currentScreen === 'human-summary' && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Specialist Review Required</h3>
                <p className="text-slate-600">{humanRequired.length} items need professional review</p>
              </div>

              {/* Human groups summary */}
              <div className="space-y-3">
                {humanGroups.map(group => (
                  <div key={group.id} className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-amber-900">{group.responsible}</div>
                        <div className="text-sm text-amber-700">{group.issues.length} items requiring review</div>
                      </div>
                      <span className="px-3 py-1 bg-amber-200 text-amber-900 text-sm font-bold rounded">
                        {group.issues.length} ITEMS
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                <h4 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  These Items Will Be In Your Report
                </h4>
                <p className="text-sm text-blue-800">
                  All {humanRequired.length} items are automatically included in your <strong>Outstanding Issues Report</strong>,
                  grouped by responsible party with full context, regulatory references, and recommended actions.
                </p>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCurrentScreen(aiFixable.length > 0 ? 'ai-groups' : 'summary')}
                  className="px-6 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={handleFinish}
                  className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors shadow-sm flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Generate Documents
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupedReviewFlow;

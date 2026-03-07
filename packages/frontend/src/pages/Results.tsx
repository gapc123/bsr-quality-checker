/**
 * Results Page - Dashboard-First UI
 *
 * Clean, modern results page using the new dashboard components
 * Replaces old carousel-first approach with intelligent grouping
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ResultsDashboard from '../components/ResultsDashboard';
import MobileDashboardView from '../components/MobileDashboardView';
import { useResponsive } from '../components/ResponsiveContainer';
import { useA11y } from '../components/AccessibilityEnhancements';
import type { FullAssessment, SubmissionGate, AssessmentResult } from '../types/assessment';
import * as exportService from '../services/exportService';

export default function Results() {
  const { packId, versionId } = useParams<{ packId: string; versionId: string }>();
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const { announce } = useA11y();

  const [assessment, setAssessment] = useState<FullAssessment | null>(null);
  const [submissionGate, setSubmissionGate] = useState<SubmissionGate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchResults();
  }, [packId, versionId]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch assessment results
      const assessmentRes = await fetch(`/api/packs/${packId}/versions/${versionId}/assessment`);
      if (!assessmentRes.ok) {
        throw new Error(`Failed to fetch assessment: ${assessmentRes.statusText}`);
      }
      const assessmentData = await assessmentRes.json();

      // Transform to FullAssessment format if needed
      const fullAssessment: FullAssessment = transformAssessmentData(assessmentData);
      setAssessment(fullAssessment);

      // Fetch submission gate analysis
      try {
        const gateRes = await fetch(`/api/packs/${packId}/versions/${versionId}/submission-gate`);
        if (gateRes.ok) {
          const gateData = await gateRes.json();
          setSubmissionGate(gateData);
        }
      } catch (err) {
        console.warn('Submission gate not available:', err);
        // Generate basic gate from assessment data
        const generatedGate = generateSubmissionGate(fullAssessment);
        setSubmissionGate(generatedGate);
      }

      announce('Assessment results loaded', 'polite');
    } catch (err: any) {
      setError(err.message || 'Failed to load assessment results');
      announce('Failed to load assessment results', 'assertive');
      console.error('Error fetching results:', err);
    } finally {
      setLoading(false);
    }
  };

  const transformAssessmentData = (data: any): FullAssessment => {
    // If data is already in correct format, return it
    if (data.results && data.pack_context && data.readiness_score !== undefined) {
      return data as FullAssessment;
    }

    // Transform old format to new format
    const results: AssessmentResult[] = (data.criteria || data.results || []).map((criterion: any) => ({
      matrix_id: criterion.matrix_id || criterion.id || '',
      matrix_title: criterion.matrix_title || criterion.title || '',
      matrix_references: criterion.matrix_references || [],
      category: criterion.category || 'General',
      status: criterion.status || 'not_assessed',
      reasoning: criterion.reasoning || '',
      success_definition: criterion.success_definition || criterion.success_criteria || '',
      pack_evidence: {
        found: criterion.pack_evidence?.found || false,
        document: criterion.pack_evidence?.document || null,
        page: criterion.pack_evidence?.page || criterion.pack_evidence?.page_number || null,
        section: criterion.pack_evidence?.section || null,
        quote: criterion.pack_evidence?.quote || criterion.pack_evidence?.text_evidence || null
      },
      reference_evidence: {
        found: criterion.reference_evidence?.found || false,
        doc_id: criterion.reference_evidence?.doc_id || null,
        doc_title: criterion.reference_evidence?.doc_title || null,
        page: criterion.reference_evidence?.page || null,
        quote: criterion.reference_evidence?.quote || null
      },
      gaps_identified: criterion.gaps_identified || [],
      actions_required: (criterion.actions_required || []).map((action: any) => ({
        action: action.action || '',
        owner: action.owner || 'TBD',
        effort: action.effort || 'Unknown',
        expected_benefit: action.expected_benefit || action.benefit || ''
      })),
      confidence: {
        level: criterion.confidence === 'high' ? 'HIGH' :
               criterion.confidence === 'medium' ? 'MEDIUM' :
               criterion.confidence === 'low' ? 'REQUIRES_HUMAN_JUDGEMENT' : 'MEDIUM',
        can_system_act: criterion.confidence === 'high' || criterion.confidence === 'medium',
        reasoning: ''
      },
      triage: generateTriage(criterion),
      proposed_change: criterion.proposed_change || null
    }));

    return {
      pack_id: packId || '',
      version_id: versionId || '',
      pack_context: {
        buildingType: data.pack_context?.buildingType || 'Unknown',
        isLondon: data.pack_context?.isLondon || false,
        heightMeters: data.pack_context?.heightMeters || null,
        storeys: data.pack_context?.storeys || null,
        isHRB: data.pack_context?.isHRB || false
      },
      readiness_score: data.readiness_score || calculateReadinessScore(results),
      results,
      generated_at: new Date().toISOString()
    };
  };

  const generateTriage = (criterion: any): AssessmentResult['triage'] => {
    const severity = criterion.severity || 'medium';
    const status = criterion.status;

    // Determine urgency
    let urgency: 'CRITICAL_BLOCKER' | 'HIGH_PRIORITY' | 'MEDIUM_PRIORITY' | 'LOW_PRIORITY' = 'MEDIUM_PRIORITY';
    if (severity === 'high' && status === 'does_not_meet') {
      urgency = 'CRITICAL_BLOCKER';
    } else if (severity === 'high' || (severity === 'medium' && status === 'does_not_meet')) {
      urgency = 'HIGH_PRIORITY';
    } else if (severity === 'low') {
      urgency = 'LOW_PRIORITY';
    }

    // Determine if it blocks submission
    const blocks_submission = urgency === 'CRITICAL_BLOCKER';

    // Determine if it's a quick win (can be fixed in < 2 days)
    const effort = criterion.actions_required?.[0]?.effort || '';
    const quick_win = effort.toLowerCase().includes('day') || effort.toLowerCase().includes('hour');

    // Determine engagement type
    const owner = criterion.actions_required?.[0]?.owner?.toLowerCase() || '';
    let engagement_type: 'SPECIALIST_REQUIRED' | 'INTERNAL_FIX' | 'AI_AMENDABLE' | 'CLIENT_INPUT' = 'SPECIALIST_REQUIRED';
    if (quick_win) {
      engagement_type = 'INTERNAL_FIX';
    } else if (owner.includes('client') || owner.includes('developer')) {
      engagement_type = 'CLIENT_INPUT';
    }

    return {
      urgency,
      blocks_submission,
      quick_win,
      engagement_type
    };
  };

  const calculateReadinessScore = (results: AssessmentResult[]): number => {
    if (results.length === 0) return 0;

    const weights = { meets: 1, partial: 0.5, does_not_meet: 0, not_assessed: 0 };
    const totalWeight = results.reduce((sum, r) => sum + (weights[r.status] || 0), 0);
    return Math.round((totalWeight / results.length) * 100);
  };

  const generateSubmissionGate = (assessment: FullAssessment): SubmissionGate => {
    const blockers = assessment.results.filter(r => r.triage?.blocks_submission);
    const highPriority = assessment.results.filter(r => r.triage?.urgency === 'HIGH_PRIORITY');

    const gate_status: 'GREEN' | 'AMBER' | 'RED' =
      blockers.length > 0 ? 'RED' :
      highPriority.length > 5 ? 'AMBER' : 'GREEN';

    return {
      can_submit: gate_status === 'GREEN',
      gate_status,
      blockers_count: blockers.length,
      high_priority_count: highPriority.length,
      recommendation:
        gate_status === 'RED' ? `Not ready for submission. ${blockers.length} critical blockers must be resolved.` :
        gate_status === 'AMBER' ? `Submission possible with caveats. ${highPriority.length} high-priority items should be addressed.` :
        'Ready for submission. All critical requirements met.',
      blocking_issues: blockers.map(b => b.matrix_id)
    };
  };

  const handleGenerateBrief = async (specialist: string, issues: AssessmentResult[]) => {
    console.log('Generate brief for:', specialist, issues);
    // Brief generation handled by modal
  };

  const handleExportReport = async () => {
    if (!assessment) return;

    try {
      // Quick export for mobile - just export PDF directly
      await exportService.exportAssessmentPDF(
        packId || '',
        versionId || '',
        assessment,
        submissionGate || undefined
      );
      announce('Assessment report exported', 'polite');
    } catch (error) {
      console.error('Export failed:', error);
      announce('Failed to export report', 'assertive');
      alert('Failed to export report. Please try again.');
    }
  };

  const handleViewIssue = (issue: AssessmentResult) => {
    console.log('View issue:', issue);
    // Detail panel handles this
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block">
            <div className="w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Loading Assessment Results
          </h2>
          <p className="text-slate-600">
            Analyzing building safety compliance...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border-2 border-red-200">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            Error Loading Results
          </h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={fetchResults}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors shadow-sm"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate(`/packs/${packId}`)}
              className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold rounded-lg transition-colors"
            >
              Back to Pack
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!assessment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            No Results Available
          </h2>
          <p className="text-slate-600 mb-6">
            Assessment data not found for this version.
          </p>
          <button
            onClick={() => navigate(`/packs/${packId}`)}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg"
          >
            Back to Pack
          </button>
        </div>
      </div>
    );
  }

  // Main results view
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <main id="main-content" className="pb-20">
        {isMobile ? (
          <MobileDashboardView
            assessment={assessment}
            submissionGate={submissionGate || undefined}
            onIssueSelect={handleViewIssue}
            onExport={handleExportReport}
          />
        ) : (
          <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-bold text-slate-900 mb-2">
                    Assessment Results
                  </h1>
                  <p className="text-slate-600">
                    {assessment.pack_context.buildingType}
                    {assessment.pack_context.isLondon && <span className="ml-2">• London</span>}
                    {assessment.pack_context.isHRB && (
                      <span className="ml-3 px-3 py-1 bg-red-100 text-red-800 text-sm font-semibold rounded-full">
                        HRB
                      </span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => navigate(`/packs/${packId}`)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2"
                >
                  ← Back to Pack
                </button>
              </div>
            </div>

            {/* Dashboard */}
            <ResultsDashboard
              assessment={assessment}
              submissionGate={submissionGate || undefined}
              onGenerateBrief={handleGenerateBrief}
              onExportReport={handleExportReport}
              onViewIssue={handleViewIssue}
            />
          </div>
        )}
      </main>
    </div>
  );
}

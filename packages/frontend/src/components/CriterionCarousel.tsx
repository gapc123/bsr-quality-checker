import { useState, useEffect } from 'react';

// Types matching backend AssessmentResult
export interface CriterionResult {
  matrix_id: string;
  matrix_title: string;
  category: string;
  status: 'meets' | 'partial' | 'does_not_meet' | 'not_assessed';
  severity: string;
  reasoning: string;
  success_definition: string;
  pack_evidence: {
    found: boolean;
    document: string | null;
    page: number | null;
    quote: string | null;
  };
  reference_evidence: {
    found: boolean;
    doc_id: string | null;
    doc_title: string | null;
    page: number | null;
    quote: string | null;
  };
  gaps_identified: string[];
  actions_required: Array<{
    action: string;
    owner: string;
    effort: string;
    expected_benefit: string;
  }>;
  confidence: string;
  proposed_change?: string | null;
  proposed_change_source?: string | null;  // Source document if info came from cross-document search
}

export interface CriterionDecision {
  matrix_id: string;
  accepted: boolean | null; // null = skipped
  proposed_change: string | null;
}

interface CriterionCarouselProps {
  criteria: CriterionResult[];
  onComplete: (decisions: CriterionDecision[]) => void;
  onClose: () => void;
}

// Keywords that indicate human intervention is required even if proposed_change exists
const HUMAN_INTERVENTION_KEYWORDS = [
  'new document',
  'new report',
  'new drawing',
  'create a',
  'prepare a',
  'commission',
  'engage',
  'specialist',
  'expert',
  'professional',
  'engineer',
  'consultant',
  'surveyor',
  'fire safety',
  'structural',
  'certification',
  'certificate',
  'testing',
  'test result',
  'physical',
  'site visit',
  'inspection',
  'independent',
  'third party',
  'third-party',
  'assessment by',
  'review by',
  'sign-off',
  'sign off',
  'approval from',
  'missing document',
  'document not provided',
  'not included',
  'not found',
  'absent',
  'no evidence',
  'tbc',
  'to be confirmed',
  'to be determined',
  'not specified',
  'competence',
  'competency',
  'qualification',
  'appointment',
  'appoint',
  'principal contractor',
  'principal designer',
  'dutyholder',
  'responsible person',
];

// Patterns that indicate the proposed_change is NOT a real actionable text change
// These are generic "add documentation" prompts rather than actual text to insert
const GENERIC_CHANGE_PATTERNS = [
  /^add documentation addressing/i,
  /^add documentation for/i,
  /^add information about/i,
  /^provide documentation/i,
  /^include documentation/i,
  /^document the/i,
  /^provide evidence/i,
  /^include evidence/i,
  /^add evidence/i,
  /states? ["']?tbc["']?/i,
  /without explaining/i,
  /needs to be provided/i,
  /should be provided/i,
  /must be provided/i,
  /requires additional/i,
];

// Check if a criterion requires human intervention
function requiresHumanIntervention(criterion: CriterionResult): boolean {
  // No proposed change = definitely human intervention
  if (!criterion.proposed_change) {
    return true;
  }

  const proposedChange = criterion.proposed_change;
  const proposedChangeLower = proposedChange.toLowerCase();

  // Check if the proposed change is a generic "add documentation" prompt
  // rather than actual text that can be inserted
  for (const pattern of GENERIC_CHANGE_PATTERNS) {
    if (pattern.test(proposedChange)) {
      return true;
    }
  }

  // Check if the proposed change is too short to be meaningful text
  // Real actionable changes should have substantial content
  if (proposedChange.length < 100 && proposedChangeLower.includes('add')) {
    return true;
  }

  const reasoningLower = criterion.reasoning?.toLowerCase() || '';
  const gapsLower = criterion.gaps_identified.map(g => g.toLowerCase()).join(' ');
  const actionsLower = criterion.actions_required.map(a => a.action.toLowerCase()).join(' ');

  // Check if the proposed change or reasoning contains human intervention keywords
  const combinedText = `${proposedChangeLower} ${reasoningLower} ${gapsLower} ${actionsLower}`;

  for (const keyword of HUMAN_INTERVENTION_KEYWORDS) {
    if (combinedText.includes(keyword)) {
      return true;
    }
  }

  // Check if pack evidence was not found AND no document exists to modify
  if (!criterion.pack_evidence.found && !criterion.pack_evidence.document) {
    // If there's no document to modify, this is human intervention
    return true;
  }

  return false;
}

// Tile types for the carousel
type TileType = 'summary' | 'ai-actionable' | 'divider' | 'human-intervention';

interface CarouselTile {
  type: TileType;
  criterion?: CriterionResult;
}

export default function CriterionCarousel({ criteria, onComplete, onClose }: CriterionCarouselProps) {
  // Filter to only show criteria that need attention (not "meets")
  const allActionableCriteria = criteria.filter(c => c.status !== 'meets' && c.status !== 'not_assessed');

  // Properly classify criteria using the enhanced logic
  const aiActionableCriteria = allActionableCriteria.filter(c => !requiresHumanIntervention(c));
  const humanInterventionCriteria = allActionableCriteria.filter(c => requiresHumanIntervention(c));

  // Build the carousel tiles in the correct order
  const carouselTiles: CarouselTile[] = [];

  // 1. Summary tile (always first)
  carouselTiles.push({ type: 'summary' });

  // 2. AI-actionable items
  aiActionableCriteria.forEach(c => {
    carouselTiles.push({ type: 'ai-actionable', criterion: c });
  });

  // 3. Divider tile (only if there are human intervention items)
  if (humanInterventionCriteria.length > 0) {
    carouselTiles.push({ type: 'divider' });
  }

  // 4. Human intervention items
  humanInterventionCriteria.forEach(c => {
    carouselTiles.push({ type: 'human-intervention', criterion: c });
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [decisions, setDecisions] = useState<Record<string, CriterionDecision>>(() => {
    const initial: Record<string, CriterionDecision> = {};
    allActionableCriteria.forEach(c => {
      const isHumanIntervention = requiresHumanIntervention(c);
      initial[c.matrix_id] = {
        matrix_id: c.matrix_id,
        // Human intervention items are pre-set to false (added to Outstanding Issues)
        // AI actionable items start as null (pending review)
        accepted: isHumanIntervention ? false : null,
        proposed_change: c.proposed_change || null
      };
    });
    return initial;
  });

  const currentTile = carouselTiles[currentIndex];

  // Calculate progress stats
  const acceptedCount = Object.values(decisions).filter(d => d.accepted === true).length;
  const pendingAICount = aiActionableCriteria.filter(c => decisions[c.matrix_id]?.accepted === null).length;
  const allAIReviewed = pendingAICount === 0;

  const handleAccept = () => {
    if (!currentTile.criterion) return;
    setDecisions(prev => ({
      ...prev,
      [currentTile.criterion!.matrix_id]: {
        ...prev[currentTile.criterion!.matrix_id],
        accepted: true
      }
    }));
    // Auto-advance to next
    if (currentIndex < carouselTiles.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleSkip = () => {
    if (!currentTile.criterion) return;
    setDecisions(prev => ({
      ...prev,
      [currentTile.criterion!.matrix_id]: {
        ...prev[currentTile.criterion!.matrix_id],
        accepted: false
      }
    }));
    // Auto-advance to next
    if (currentIndex < carouselTiles.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < carouselTiles.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleSubmit = () => {
    const decisionArray = Object.values(decisions);
    onComplete(decisionArray);
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  if (allActionableCriteria.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-lg w-full p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">All Criteria Pass</h2>
          <p className="text-slate-600 mb-6">No changes are needed for your submission.</p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Calculate which section we're in for the progress indicator
  const getSectionInfo = () => {
    if (currentTile.type === 'summary') {
      return { section: 'overview', label: 'Overview' };
    }
    if (currentTile.type === 'divider') {
      return { section: 'divider', label: 'Section Divider' };
    }
    if (currentTile.type === 'ai-actionable') {
      const aiIndex = carouselTiles.slice(0, currentIndex + 1).filter(t => t.type === 'ai-actionable').length;
      return { section: 'ai', label: `AI Change ${aiIndex} of ${aiActionableCriteria.length}` };
    }
    if (currentTile.type === 'human-intervention') {
      const humanIndex = carouselTiles.slice(0, currentIndex + 1).filter(t => t.type === 'human-intervention').length;
      return { section: 'human', label: `Human Review ${humanIndex} of ${humanInterventionCriteria.length}` };
    }
    return { section: 'unknown', label: '' };
  };

  const sectionInfo = getSectionInfo();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Review Assessment Results</h2>
              <p className="text-sm text-slate-500">Review findings and decide which changes to apply</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className={`font-medium ${
                sectionInfo.section === 'ai' ? 'text-green-600' :
                sectionInfo.section === 'human' ? 'text-amber-600' :
                'text-slate-600'
              }`}>
                {sectionInfo.label}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-green-600">{acceptedCount} accepted</span>
                <span className="text-amber-600">{humanInterventionCriteria.length} for report</span>
                {pendingAICount > 0 && <span className="text-blue-600">{pendingAICount} AI items remaining</span>}
              </div>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  sectionInfo.section === 'ai' ? 'bg-gradient-to-r from-green-500 to-green-400' :
                  sectionInfo.section === 'human' ? 'bg-gradient-to-r from-amber-500 to-amber-400' :
                  'bg-gradient-to-r from-blue-500 to-blue-400'
                }`}
                style={{ width: `${((currentIndex + 1) / carouselTiles.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tile Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentTile.type === 'summary' && (
            <SummaryTile
              aiCount={aiActionableCriteria.length}
              humanCount={humanInterventionCriteria.length}
              onContinue={handleNext}
            />
          )}

          {currentTile.type === 'divider' && (
            <DividerTile
              humanCount={humanInterventionCriteria.length}
              onContinue={handleNext}
            />
          )}

          {currentTile.type === 'ai-actionable' && currentTile.criterion && (
            <AIActionableTile
              criterion={currentTile.criterion}
              decision={decisions[currentTile.criterion.matrix_id]}
              onAccept={handleAccept}
              onSkip={handleSkip}
            />
          )}

          {currentTile.type === 'human-intervention' && currentTile.criterion && (
            <HumanInterventionTile
              criterion={currentTile.criterion}
              onContinue={handleNext}
              isLast={currentIndex === carouselTiles.length - 1}
            />
          )}
        </div>

        {/* Footer with navigation */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between">
            {/* Navigation arrows */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={handleNext}
                disabled={currentIndex === carouselTiles.length - 1}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <span className="text-sm text-slate-500 ml-2">
                {currentIndex + 1} of {carouselTiles.length} • Use arrow keys to navigate
              </span>
            </div>

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={!allAIReviewed}
              className={`px-6 py-2.5 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                allAIReviewed
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-md'
                  : 'bg-slate-200 text-slate-500 cursor-not-allowed'
              }`}
            >
              {allAIReviewed ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Generate Documents
                </>
              ) : (
                `Review ${pendingAICount} AI item${pendingAICount !== 1 ? 's' : ''} first`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Summary Tile Component (First tile - orientation)
interface SummaryTileProps {
  aiCount: number;
  humanCount: number;
  onContinue: () => void;
}

function SummaryTile({ aiCount, humanCount, onContinue }: SummaryTileProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Review Your Assessment Results</h2>
        <p className="text-slate-600">
          We've analysed your submission and identified items that need attention.
        </p>
      </div>

      {/* Two types of findings */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {/* AI Actionable */}
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{aiCount}</p>
              <p className="text-sm font-medium text-green-600">AI Can Fix</p>
            </div>
          </div>
          <p className="text-sm text-green-700">
            These issues can be resolved by adding or modifying text in your existing documents.
            Review each proposed change and accept or skip.
          </p>
        </div>

        {/* Human Intervention */}
        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-700">{humanCount}</p>
              <p className="text-sm font-medium text-amber-600">Requires Human Action</p>
            </div>
          </div>
          <p className="text-sm text-amber-700">
            These issues require new documents, expert judgement, or physical evidence.
            They will be added to your Outstanding Issues Report.
          </p>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 mb-6">
        <h3 className="font-semibold text-slate-900 mb-3">How This Works</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-green-600">1</span>
            </div>
            <p className="text-sm text-slate-600">
              <strong className="text-slate-900">AI-fixable items shown first</strong> — Review each proposed text change and click Accept or Skip
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-amber-600">2</span>
            </div>
            <p className="text-sm text-slate-600">
              <strong className="text-slate-900">Human intervention items shown after</strong> — These are automatically added to your Outstanding Issues Report
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-blue-600">3</span>
            </div>
            <p className="text-sm text-slate-600">
              <strong className="text-slate-900">Generate your documents</strong> — Amended submission + Outstanding Issues Report for your team
            </p>
          </div>
        </div>
      </div>

      {/* Important notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="text-sm text-blue-800">
            <strong>Important:</strong> AI can only modify text in existing documents. It cannot create new documents,
            make professional judgements, or generate certifications. Items requiring these actions are clearly marked
            for human intervention.
          </div>
        </div>
      </div>

      <button
        onClick={onContinue}
        className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center justify-center gap-2"
      >
        {aiCount > 0 ? 'Start Reviewing AI Changes' : 'View Human Intervention Items'}
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </button>
    </div>
  );
}

// Divider Tile Component
interface DividerTileProps {
  humanCount: number;
  onContinue: () => void;
}

function DividerTile({ humanCount, onContinue }: DividerTileProps) {
  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
        <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-slate-900 mb-2">Human Intervention Required</h2>
      <p className="text-slate-600 mb-6">
        The following {humanCount} item{humanCount !== 1 ? 's' : ''} cannot be fixed by AI and must be addressed manually before submission.
      </p>

      <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6 mb-6 text-left">
        <h3 className="font-semibold text-amber-800 mb-3">These items may require:</h3>
        <ul className="space-y-2">
          <li className="flex items-start gap-3 text-sm text-amber-700">
            <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span><strong>New documents</strong> — Fire strategies, structural reports, or technical drawings</span>
          </li>
          <li className="flex items-start gap-3 text-sm text-amber-700">
            <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span><strong>Expert analysis</strong> — Professional engineering assessment or specialist review</span>
          </li>
          <li className="flex items-start gap-3 text-sm text-amber-700">
            <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span><strong>Physical evidence</strong> — Testing results, certifications, or site inspections</span>
          </li>
        </ul>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-slate-600">
          <svg className="w-4 h-4 inline mr-1 -mt-0.5 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          All human intervention items will be included in your <strong>Outstanding Issues Report</strong> with
          full context, regulatory references, and recommended actions for your team.
        </p>
      </div>

      <button
        onClick={onContinue}
        className="w-full py-3 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
      >
        View Human Intervention Items
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </button>
    </div>
  );
}

// AI Actionable Tile Component
interface AIActionableTileProps {
  criterion: CriterionResult;
  decision: CriterionDecision;
  onAccept: () => void;
  onSkip: () => void;
}

function AIActionableTile({ criterion, decision, onAccept, onSkip }: AIActionableTileProps) {
  const statusStyles = {
    meets: 'bg-green-100 text-green-700',
    partial: 'bg-amber-100 text-amber-700',
    does_not_meet: 'bg-red-100 text-red-700',
    not_assessed: 'bg-slate-100 text-slate-700'
  };

  const statusLabels = {
    meets: 'PASS',
    partial: 'PARTIAL',
    does_not_meet: 'FAIL',
    not_assessed: 'N/A'
  };

  const isAccepted = decision.accepted === true;
  const isSkipped = decision.accepted === false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-sm font-mono text-slate-500">{criterion.matrix_id}</span>
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${statusStyles[criterion.status]}`}>
              {statusLabels[criterion.status]}
            </span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
              criterion.severity === 'high' ? 'bg-red-50 text-red-600' :
              criterion.severity === 'medium' ? 'bg-amber-50 text-amber-600' :
              'bg-blue-50 text-blue-600'
            }`}>
              {criterion.severity.toUpperCase()}
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-600 border border-green-200">
              AI ACTIONABLE
            </span>
          </div>
          <h3 className="text-xl font-semibold text-slate-900">{criterion.matrix_title}</h3>
        </div>
      </div>

      {/* Two-column evidence */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Submission quote */}
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">
            Your Submission
          </h4>
          {criterion.pack_evidence.found && criterion.pack_evidence.quote ? (
            <>
              <blockquote className="text-sm text-slate-600 italic border-l-2 border-slate-300 pl-3">
                "{criterion.pack_evidence.quote}"
              </blockquote>
              <p className="text-xs text-slate-500 mt-2">
                {criterion.pack_evidence.document}
                {criterion.pack_evidence.page && `, Page ${criterion.pack_evidence.page}`}
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-500 italic">No relevant evidence found in submission</p>
          )}
        </div>

        {/* Regulation quote */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="text-sm font-semibold text-blue-700 uppercase tracking-wide mb-2">
            Regulation Requirement
          </h4>
          {criterion.reference_evidence.found && criterion.reference_evidence.quote ? (
            <>
              <blockquote className="text-sm text-blue-800 italic border-l-2 border-blue-300 pl-3">
                "{criterion.reference_evidence.quote}"
              </blockquote>
              <p className="text-xs text-blue-600 mt-2">
                {criterion.reference_evidence.doc_title}
                {criterion.reference_evidence.page && `, Page ${criterion.reference_evidence.page}`}
              </p>
            </>
          ) : (
            <p className="text-sm text-blue-600 italic">
              {criterion.success_definition}
            </p>
          )}
        </div>
      </div>

      {/* Gaps identified */}
      {criterion.gaps_identified.length > 0 && (
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <h4 className="text-sm font-semibold text-red-700 uppercase tracking-wide mb-2">
            Gaps Identified
          </h4>
          <ul className="space-y-1">
            {criterion.gaps_identified.map((gap, i) => (
              <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {gap}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Proposed change */}
      {criterion.proposed_change && (
        <div className={`rounded-lg p-4 border-2 ${
          isAccepted ? 'bg-green-50 border-green-300' :
          isSkipped ? 'bg-slate-50 border-slate-200 opacity-60' :
          'bg-green-50 border-green-300'
        }`}>
          <h4 className={`text-sm font-semibold uppercase tracking-wide mb-2 ${
            isAccepted ? 'text-green-700' : isSkipped ? 'text-slate-500' : 'text-green-700'
          }`}>
            Proposed Text Change
          </h4>
          <div className={`text-sm p-3 rounded border ${
            isAccepted ? 'bg-white border-green-200 text-green-800' :
            isSkipped ? 'bg-white border-slate-200 text-slate-500' :
            'bg-white border-green-200 text-slate-700'
          }`}>
            {criterion.proposed_change}
          </div>

          {criterion.proposed_change_source && (
            <p className="text-xs text-blue-600 mt-2 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
              </svg>
              <span className="font-medium">Source:</span> {criterion.proposed_change_source}
            </p>
          )}

          <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            This text will be added to your amended document if accepted
          </p>

          {/* Accept/Skip buttons */}
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={onAccept}
              className={`flex-1 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                isAccepted
                  ? 'bg-green-600 text-white'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              {isAccepted ? 'Accepted' : 'Accept Change'}
            </button>
            <button
              onClick={onSkip}
              className={`flex-1 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                isSkipped
                  ? 'bg-slate-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
              {isSkipped ? 'Skipped — Added to Report' : 'Skip (Add to Report)'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Human Intervention Tile Component
interface HumanInterventionTileProps {
  criterion: CriterionResult;
  onContinue: () => void;
  isLast: boolean;
}

function HumanInterventionTile({ criterion, onContinue, isLast }: HumanInterventionTileProps) {
  const statusStyles = {
    meets: 'bg-green-100 text-green-700',
    partial: 'bg-amber-100 text-amber-700',
    does_not_meet: 'bg-red-100 text-red-700',
    not_assessed: 'bg-slate-100 text-slate-700'
  };

  const statusLabels = {
    meets: 'PASS',
    partial: 'PARTIAL',
    does_not_meet: 'FAIL',
    not_assessed: 'N/A'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-sm font-mono text-slate-500">{criterion.matrix_id}</span>
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${statusStyles[criterion.status]}`}>
              {statusLabels[criterion.status]}
            </span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
              criterion.severity === 'high' ? 'bg-red-50 text-red-600' :
              criterion.severity === 'medium' ? 'bg-amber-50 text-amber-600' :
              'bg-blue-50 text-blue-600'
            }`}>
              {criterion.severity.toUpperCase()}
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-600 border border-amber-200">
              HUMAN INTERVENTION
            </span>
          </div>
          <h3 className="text-xl font-semibold text-slate-900">{criterion.matrix_title}</h3>
        </div>
      </div>

      {/* Two-column evidence */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Submission quote */}
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">
            Your Submission
          </h4>
          {criterion.pack_evidence.found && criterion.pack_evidence.quote ? (
            <>
              <blockquote className="text-sm text-slate-600 italic border-l-2 border-slate-300 pl-3">
                "{criterion.pack_evidence.quote}"
              </blockquote>
              <p className="text-xs text-slate-500 mt-2">
                {criterion.pack_evidence.document}
                {criterion.pack_evidence.page && `, Page ${criterion.pack_evidence.page}`}
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-500 italic">No relevant evidence found in submission</p>
          )}
        </div>

        {/* Regulation quote */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="text-sm font-semibold text-blue-700 uppercase tracking-wide mb-2">
            Regulation Requirement
          </h4>
          {criterion.reference_evidence.found && criterion.reference_evidence.quote ? (
            <>
              <blockquote className="text-sm text-blue-800 italic border-l-2 border-blue-300 pl-3">
                "{criterion.reference_evidence.quote}"
              </blockquote>
              <p className="text-xs text-blue-600 mt-2">
                {criterion.reference_evidence.doc_title}
                {criterion.reference_evidence.page && `, Page ${criterion.reference_evidence.page}`}
              </p>
            </>
          ) : (
            <p className="text-sm text-blue-600 italic">
              {criterion.success_definition}
            </p>
          )}
        </div>
      </div>

      {/* Gaps identified */}
      {criterion.gaps_identified.length > 0 && (
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <h4 className="text-sm font-semibold text-red-700 uppercase tracking-wide mb-2">
            Gaps Identified
          </h4>
          <ul className="space-y-1">
            {criterion.gaps_identified.map((gap, i) => (
              <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {gap}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Human Intervention Required Banner - NO Accept button */}
      <div className="bg-amber-50 rounded-lg p-5 border-2 border-amber-400">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 bg-amber-200 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-bold text-amber-800">Why This Requires Human Action</h4>
            </div>
            <p className="text-sm text-amber-700">
              This issue cannot be resolved by adding or modifying text alone. It requires one or more of the following:
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-amber-200 mb-4">
          <ul className="text-sm text-amber-700 space-y-2">
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Creating a new document, drawing, or technical report</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Expert analysis, engineering assessment, or professional judgement</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Physical evidence, testing results, or certifications</span>
            </li>
          </ul>
        </div>

        {/* Recommended actions if available */}
        {criterion.actions_required.length > 0 && (
          <div className="bg-white rounded-lg p-4 border border-amber-200 mb-4">
            <h5 className="text-sm font-semibold text-amber-800 mb-2">Recommended Actions:</h5>
            <ul className="space-y-2">
              {criterion.actions_required.slice(0, 3).map((action, i) => (
                <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center text-xs font-bold text-amber-600">
                    {i + 1}
                  </span>
                  <div>
                    <span>{action.action}</span>
                    <span className="text-xs text-amber-500 ml-2">({action.owner} • {action.effort})</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Status indicator - NO accept/skip buttons */}
        <div className="flex items-center gap-2 p-3 bg-amber-100 rounded-lg">
          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium text-amber-800">
            This item will be included in your Outstanding Issues Report
          </span>
        </div>
      </div>

      {/* Continue button */}
      {!isLast && (
        <button
          onClick={onContinue}
          className="w-full py-3 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
        >
          Continue to Next Item
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      )}
    </div>
  );
}

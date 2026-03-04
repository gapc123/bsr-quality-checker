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
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
        <div style={{ background: 'var(--white)', maxWidth: '32rem', width: '100%', padding: '2rem', textAlign: 'center' }}>
          <div style={{ width: '4rem', height: '4rem', margin: '0 auto 1rem', background: '#d1f4d1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg style={{ width: '2rem', height: '2rem', color: '#2d6a2d' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--navy)', marginBottom: '0.5rem' }}>All Criteria Pass</h2>
          <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>No changes are needed for your submission.</p>
          <button
            onClick={onClose}
            style={{ padding: '0.5rem 1.5rem', background: 'var(--navy)', color: 'var(--cream)', fontWeight: '500', cursor: 'pointer', border: 'none' }}
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
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
      <div style={{ background: 'var(--white)', maxWidth: '56rem', width: '100%', maxHeight: '90vh', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--beige)', background: 'var(--cream)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--navy)' }}>Review Assessment Results</h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Review findings and decide which changes to apply</p>
            </div>
            <button onClick={onClose} style={{ color: 'var(--muted)', cursor: 'pointer', background: 'none', border: 'none' }}>
              <svg style={{ width: '1.5rem', height: '1.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress bar */}
          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
              <span style={{
                fontWeight: '500',
                color: sectionInfo.section === 'ai' ? '#2d6a2d' :
                       sectionInfo.section === 'human' ? '#d97706' :
                       'var(--muted)'
              }}>
                {sectionInfo.label}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ color: '#2d6a2d' }}>{acceptedCount} accepted</span>
                <span style={{ color: '#d97706' }}>{humanInterventionCriteria.length} for report</span>
                {pendingAICount > 0 && <span style={{ color: 'var(--navy)' }}>{pendingAICount} AI items remaining</span>}
              </div>
            </div>
            <div style={{ height: '0.5rem', background: 'var(--beige)', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  transition: 'all 0.3s',
                  background: sectionInfo.section === 'ai' ? '#2d6a2d' :
                             sectionInfo.section === 'human' ? '#d97706' :
                             'var(--navy)',
                  width: `${((currentIndex + 1) / carouselTiles.length) * 100}%`
                }}
              />
            </div>
          </div>
        </div>

        {/* Tile Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
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
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--beige)', background: 'var(--cream)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Navigation arrows */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                style={{
                  padding: '0.5rem',
                  border: '1px solid var(--beige)',
                  cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
                  opacity: currentIndex === 0 ? 0.5 : 1,
                  background: 'var(--white)'
                }}
              >
                <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={handleNext}
                disabled={currentIndex === carouselTiles.length - 1}
                style={{
                  padding: '0.5rem',
                  border: '1px solid var(--beige)',
                  cursor: currentIndex === carouselTiles.length - 1 ? 'not-allowed' : 'pointer',
                  opacity: currentIndex === carouselTiles.length - 1 ? 0.5 : 1,
                  background: 'var(--white)'
                }}
              >
                <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <span style={{ fontSize: '0.875rem', color: 'var(--muted)', marginLeft: '0.5rem' }}>
                {currentIndex + 1} of {carouselTiles.length} • Use arrow keys to navigate
              </span>
            </div>

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={!allAIReviewed}
              style={{
                padding: '0.625rem 1.5rem',
                fontWeight: '600',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: allAIReviewed ? 'var(--navy)' : 'var(--beige)',
                color: allAIReviewed ? 'var(--cream)' : 'var(--muted)',
                cursor: allAIReviewed ? 'pointer' : 'not-allowed',
                border: 'none',
                boxShadow: allAIReviewed ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'
              }}
            >
              {allAIReviewed ? (
                <>
                  <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    <div style={{ maxWidth: '42rem', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ width: '4rem', height: '4rem', margin: '0 auto 1rem', background: '#d6e5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg style={{ width: '2rem', height: '2rem', color: 'var(--navy)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--navy)', marginBottom: '0.5rem' }}>Review Your Assessment Results</h2>
        <p style={{ color: 'var(--muted)' }}>
          We've analysed your submission and identified items that need attention.
        </p>
      </div>

      {/* Two types of findings */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
        {/* AI Actionable */}
        <div style={{ background: '#f0f9f0', border: '2px solid #d1f4d1', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ width: '2.5rem', height: '2.5rem', background: '#d1f4d1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg style={{ width: '1.25rem', height: '1.25rem', color: '#2d6a2d' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2d6a2d' }}>{aiCount}</p>
              <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#2d6a2d' }}>AI Can Fix</p>
            </div>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#2d6a2d' }}>
            These issues can be resolved by adding or modifying text in your existing documents.
            Review each proposed change and accept or skip.
          </p>
        </div>

        {/* Human Intervention */}
        <div style={{ background: '#fef3e0', border: '2px solid #f5d699', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ width: '2.5rem', height: '2.5rem', background: '#f5d699', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg style={{ width: '1.25rem', height: '1.25rem', color: '#d97706' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#d97706' }}>{humanCount}</p>
              <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#d97706' }}>Requires Human Action</p>
            </div>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#d97706' }}>
            These issues require new documents, expert judgement, or physical evidence.
            They will be added to your Outstanding Issues Report.
          </p>
        </div>
      </div>

      {/* How it works */}
      <div style={{ background: 'var(--cream)', padding: '1.25rem', border: '1px solid var(--beige)', marginBottom: '1.5rem' }}>
        <h3 style={{ fontWeight: '600', color: 'var(--navy)', marginBottom: '0.75rem' }}>How This Works</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
            <div style={{ width: '1.5rem', height: '1.5rem', background: '#d1f4d1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '0.125rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#2d6a2d' }}>1</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
              <strong style={{ color: 'var(--navy)' }}>AI-fixable items shown first</strong> — Review each proposed text change and click Accept or Skip
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
            <div style={{ width: '1.5rem', height: '1.5rem', background: '#f5d699', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '0.125rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#d97706' }}>2</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
              <strong style={{ color: 'var(--navy)' }}>Human intervention items shown after</strong> — These are automatically added to your Outstanding Issues Report
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
            <div style={{ width: '1.5rem', height: '1.5rem', background: '#d6e5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '0.125rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--navy)' }}>3</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
              <strong style={{ color: 'var(--navy)' }}>Generate your documents</strong> — Amended submission + Outstanding Issues Report for your team
            </p>
          </div>
        </div>
      </div>

      {/* Important notice */}
      <div style={{ background: '#d6e5f5', border: '1px solid #b3d4f0', padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
          <svg style={{ width: '1.25rem', height: '1.25rem', color: 'var(--navy)', marginTop: '0.125rem', flexShrink: 0 }} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div style={{ fontSize: '0.875rem', color: 'var(--navy)' }}>
            <strong>Important:</strong> AI can only modify text in existing documents. It cannot create new documents,
            make professional judgements, or generate certifications. Items requiring these actions are clearly marked
            for human intervention.
          </div>
        </div>
      </div>

      <button
        onClick={onContinue}
        style={{
          width: '100%',
          padding: '0.75rem',
          background: 'var(--navy)',
          color: 'var(--cream)',
          fontWeight: '600',
          transition: 'colors 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        {aiCount > 0 ? 'Start Reviewing AI Changes' : 'View Human Intervention Items'}
        <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    <div style={{ maxWidth: '42rem', margin: '0 auto', textAlign: 'center' }}>
      <div style={{ width: '4rem', height: '4rem', margin: '0 auto 1rem', background: '#f5d699', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg style={{ width: '2rem', height: '2rem', color: '#d97706' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>

      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--navy)', marginBottom: '0.5rem' }}>Human Intervention Required</h2>
      <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>
        The following {humanCount} item{humanCount !== 1 ? 's' : ''} cannot be fixed by AI and must be addressed manually before submission.
      </p>

      <div style={{ background: '#fef3e0', border: '2px solid #f5d699', padding: '1.5rem', marginBottom: '1.5rem', textAlign: 'left' }}>
        <h3 style={{ fontWeight: '600', color: '#d97706', marginBottom: '0.75rem' }}>These items may require:</h3>
        <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <li style={{ display: 'flex', alignItems: 'start', gap: '0.75rem', fontSize: '0.875rem', color: '#d97706' }}>
            <svg style={{ width: '1.25rem', height: '1.25rem', color: '#d97706', flexShrink: 0, marginTop: '0.125rem' }} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span><strong>New documents</strong> — Fire strategies, structural reports, or technical drawings</span>
          </li>
          <li style={{ display: 'flex', alignItems: 'start', gap: '0.75rem', fontSize: '0.875rem', color: '#d97706' }}>
            <svg style={{ width: '1.25rem', height: '1.25rem', color: '#d97706', flexShrink: 0, marginTop: '0.125rem' }} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span><strong>Expert analysis</strong> — Professional engineering assessment or specialist review</span>
          </li>
          <li style={{ display: 'flex', alignItems: 'start', gap: '0.75rem', fontSize: '0.875rem', color: '#d97706' }}>
            <svg style={{ width: '1.25rem', height: '1.25rem', color: '#d97706', flexShrink: 0, marginTop: '0.125rem' }} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span><strong>Physical evidence</strong> — Testing results, certifications, or site inspections</span>
          </li>
        </ul>
      </div>

      <div style={{ background: 'var(--cream)', border: '1px solid var(--beige)', padding: '1rem', marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
          <svg style={{ width: '1rem', height: '1rem', display: 'inline', marginRight: '0.25rem', marginTop: '-0.125rem', color: 'var(--muted)' }} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          All human intervention items will be included in your <strong>Outstanding Issues Report</strong> with
          full context, regulatory references, and recommended actions for your team.
        </p>
      </div>

      <button
        onClick={onContinue}
        style={{
          width: '100%',
          padding: '0.75rem',
          background: '#d97706',
          color: 'var(--white)',
          fontWeight: '600',
          transition: 'colors 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        View Human Intervention Items
        <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    meets: { background: '#d1f4d1', color: '#2d6a2d' },
    partial: { background: '#f5d699', color: '#d97706' },
    does_not_meet: { background: '#f8d7da', color: '#dc3545' },
    not_assessed: { background: 'var(--beige)', color: 'var(--muted)' }
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.875rem', fontFamily: 'monospace', color: 'var(--muted)' }}>{criterion.matrix_id}</span>
            <span style={{
              padding: '0.125rem 0.5rem',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              ...statusStyles[criterion.status]
            }}>
              {statusLabels[criterion.status]}
            </span>
            <span style={{
              padding: '0.125rem 0.5rem',
              fontSize: '0.75rem',
              fontWeight: '500',
              background: criterion.severity === 'high' ? '#f8d7da' :
                         criterion.severity === 'medium' ? '#fef3e0' :
                         '#d6e5f5',
              color: criterion.severity === 'high' ? '#dc3545' :
                     criterion.severity === 'medium' ? '#d97706' :
                     'var(--navy)'
            }}>
              {criterion.severity.toUpperCase()}
            </span>
            <span style={{
              padding: '0.125rem 0.5rem',
              fontSize: '0.75rem',
              fontWeight: '500',
              background: '#f0f9f0',
              color: '#2d6a2d',
              border: '1px solid #d1f4d1'
            }}>
              AI ACTIONABLE
            </span>
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--navy)' }}>{criterion.matrix_title}</h3>
        </div>
      </div>

      {/* Two-column evidence */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Submission quote */}
        <div style={{ background: 'var(--cream)', padding: '1rem', border: '1px solid var(--beige)' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            Your Submission
          </h4>
          {criterion.pack_evidence.found && criterion.pack_evidence.quote ? (
            <>
              <blockquote style={{ fontSize: '0.875rem', color: 'var(--muted)', fontStyle: 'italic', borderLeft: '2px solid var(--beige)', paddingLeft: '0.75rem' }}>
                "{criterion.pack_evidence.quote}"
              </blockquote>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.5rem' }}>
                {criterion.pack_evidence.document}
                {criterion.pack_evidence.page && `, Page ${criterion.pack_evidence.page}`}
              </p>
            </>
          ) : (
            <p style={{ fontSize: '0.875rem', color: 'var(--muted)', fontStyle: 'italic' }}>No relevant evidence found in submission</p>
          )}
        </div>

        {/* Regulation quote */}
        <div style={{ background: '#d6e5f5', padding: '1rem', border: '1px solid #b3d4f0' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--navy)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            Regulation Requirement
          </h4>
          {criterion.reference_evidence.found && criterion.reference_evidence.quote ? (
            <>
              <blockquote style={{ fontSize: '0.875rem', color: 'var(--navy)', fontStyle: 'italic', borderLeft: '2px solid var(--navy)', paddingLeft: '0.75rem' }}>
                "{criterion.reference_evidence.quote}"
              </blockquote>
              <p style={{ fontSize: '0.75rem', color: 'var(--navy)', marginTop: '0.5rem' }}>
                {criterion.reference_evidence.doc_title}
                {criterion.reference_evidence.page && `, Page ${criterion.reference_evidence.page}`}
              </p>
            </>
          ) : (
            <p style={{ fontSize: '0.875rem', color: 'var(--navy)', fontStyle: 'italic' }}>
              {criterion.success_definition}
            </p>
          )}
        </div>
      </div>

      {/* Gaps identified */}
      {criterion.gaps_identified.length > 0 && (
        <div style={{ background: '#f8d7da', padding: '1rem', border: '1px solid #f5c2c7' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#dc3545', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            Gaps Identified
          </h4>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {criterion.gaps_identified.map((gap, i) => (
              <li key={i} style={{ fontSize: '0.875rem', color: '#dc3545', display: 'flex', alignItems: 'start', gap: '0.5rem' }}>
                <svg style={{ width: '1rem', height: '1rem', marginTop: '0.125rem', flexShrink: 0 }} fill="currentColor" viewBox="0 0 20 20">
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
        <div style={{
          padding: '1rem',
          border: isAccepted ? '2px solid #d1f4d1' :
                 isSkipped ? '2px solid var(--beige)' :
                 '2px solid #d1f4d1',
          background: isAccepted ? '#f0f9f0' :
                     isSkipped ? 'var(--cream)' :
                     '#f0f9f0',
          opacity: isSkipped ? 0.6 : 1
        }}>
          <h4 style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.5rem',
            color: isAccepted ? '#2d6a2d' : isSkipped ? 'var(--muted)' : '#2d6a2d'
          }}>
            Proposed Text Change
          </h4>
          <div style={{
            fontSize: '0.875rem',
            padding: '0.75rem',
            border: isAccepted ? '1px solid #d1f4d1' :
                   isSkipped ? '1px solid var(--beige)' :
                   '1px solid #d1f4d1',
            background: 'var(--white)',
            color: isAccepted ? '#2d6a2d' :
                  isSkipped ? 'var(--muted)' :
                  'var(--navy)'
          }}>
            {criterion.proposed_change}
          </div>

          {criterion.proposed_change_source && (
            <p style={{
              fontSize: '0.75rem',
              color: 'var(--navy)',
              marginTop: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              background: '#d6e5f5',
              padding: '0.25rem 0.5rem'
            }}>
              <svg style={{ width: '1rem', height: '1rem' }} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
              </svg>
              <span style={{ fontWeight: '500' }}>Source:</span> {criterion.proposed_change_source}
            </p>
          )}

          <p style={{
            fontSize: '0.75rem',
            color: '#2d6a2d',
            marginTop: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            <svg style={{ width: '1rem', height: '1rem' }} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            This text will be added to your amended document if accepted
          </p>

          {/* Accept/Skip buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem' }}>
            <button
              onClick={onAccept}
              style={{
                flex: 1,
                padding: '0.75rem',
                fontWeight: '600',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                background: isAccepted ? '#2d6a2d' : '#d1f4d1',
                color: isAccepted ? 'var(--white)' : '#2d6a2d',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              {isAccepted ? 'Accepted' : 'Accept Change'}
            </button>
            <button
              onClick={onSkip}
              style={{
                flex: 1,
                padding: '0.75rem',
                fontWeight: '600',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                background: isSkipped ? 'var(--muted)' : 'var(--beige)',
                color: isSkipped ? 'var(--white)' : 'var(--muted)',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    meets: { background: '#d1f4d1', color: '#2d6a2d' },
    partial: { background: '#f5d699', color: '#d97706' },
    does_not_meet: { background: '#f8d7da', color: '#dc3545' },
    not_assessed: { background: 'var(--beige)', color: 'var(--muted)' }
  };

  const statusLabels = {
    meets: 'PASS',
    partial: 'PARTIAL',
    does_not_meet: 'FAIL',
    not_assessed: 'N/A'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.875rem', fontFamily: 'monospace', color: 'var(--muted)' }}>{criterion.matrix_id}</span>
            <span style={{
              padding: '0.125rem 0.5rem',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              ...statusStyles[criterion.status]
            }}>
              {statusLabels[criterion.status]}
            </span>
            <span style={{
              padding: '0.125rem 0.5rem',
              fontSize: '0.75rem',
              fontWeight: '500',
              background: criterion.severity === 'high' ? '#f8d7da' :
                         criterion.severity === 'medium' ? '#fef3e0' :
                         '#d6e5f5',
              color: criterion.severity === 'high' ? '#dc3545' :
                     criterion.severity === 'medium' ? '#d97706' :
                     'var(--navy)'
            }}>
              {criterion.severity.toUpperCase()}
            </span>
            <span style={{
              padding: '0.125rem 0.5rem',
              fontSize: '0.75rem',
              fontWeight: '500',
              background: '#fef3e0',
              color: '#d97706',
              border: '1px solid #f5d699'
            }}>
              HUMAN INTERVENTION
            </span>
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--navy)' }}>{criterion.matrix_title}</h3>
        </div>
      </div>

      {/* Two-column evidence */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Submission quote */}
        <div style={{ background: 'var(--cream)', padding: '1rem', border: '1px solid var(--beige)' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            Your Submission
          </h4>
          {criterion.pack_evidence.found && criterion.pack_evidence.quote ? (
            <>
              <blockquote style={{ fontSize: '0.875rem', color: 'var(--muted)', fontStyle: 'italic', borderLeft: '2px solid var(--beige)', paddingLeft: '0.75rem' }}>
                "{criterion.pack_evidence.quote}"
              </blockquote>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.5rem' }}>
                {criterion.pack_evidence.document}
                {criterion.pack_evidence.page && `, Page ${criterion.pack_evidence.page}`}
              </p>
            </>
          ) : (
            <p style={{ fontSize: '0.875rem', color: 'var(--muted)', fontStyle: 'italic' }}>No relevant evidence found in submission</p>
          )}
        </div>

        {/* Regulation quote */}
        <div style={{ background: '#d6e5f5', padding: '1rem', border: '1px solid #b3d4f0' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--navy)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            Regulation Requirement
          </h4>
          {criterion.reference_evidence.found && criterion.reference_evidence.quote ? (
            <>
              <blockquote style={{ fontSize: '0.875rem', color: 'var(--navy)', fontStyle: 'italic', borderLeft: '2px solid var(--navy)', paddingLeft: '0.75rem' }}>
                "{criterion.reference_evidence.quote}"
              </blockquote>
              <p style={{ fontSize: '0.75rem', color: 'var(--navy)', marginTop: '0.5rem' }}>
                {criterion.reference_evidence.doc_title}
                {criterion.reference_evidence.page && `, Page ${criterion.reference_evidence.page}`}
              </p>
            </>
          ) : (
            <p style={{ fontSize: '0.875rem', color: 'var(--navy)', fontStyle: 'italic' }}>
              {criterion.success_definition}
            </p>
          )}
        </div>
      </div>

      {/* Gaps identified */}
      {criterion.gaps_identified.length > 0 && (
        <div style={{ background: '#f8d7da', padding: '1rem', border: '1px solid #f5c2c7' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#dc3545', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            Gaps Identified
          </h4>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {criterion.gaps_identified.map((gap, i) => (
              <li key={i} style={{ fontSize: '0.875rem', color: '#dc3545', display: 'flex', alignItems: 'start', gap: '0.5rem' }}>
                <svg style={{ width: '1rem', height: '1rem', marginTop: '0.125rem', flexShrink: 0 }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {gap}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Human Intervention Required Banner - NO Accept button */}
      <div style={{ background: '#fef3e0', padding: '1.25rem', border: '2px solid #d97706' }}>
        <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ width: '2.5rem', height: '2.5rem', background: '#f5d699', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg style={{ width: '1.25rem', height: '1.25rem', color: '#d97706' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <h4 style={{ fontWeight: 'bold', color: '#d97706' }}>Why This Requires Human Action</h4>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#d97706' }}>
              This issue cannot be resolved by adding or modifying text alone. It requires one or more of the following:
            </p>
          </div>
        </div>

        <div style={{ background: 'var(--white)', padding: '1rem', border: '1px solid #f5d699', marginBottom: '1rem' }}>
          <ul style={{ fontSize: '0.875rem', color: '#d97706', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li style={{ display: 'flex', alignItems: 'start', gap: '0.5rem' }}>
              <svg style={{ width: '1rem', height: '1rem', marginTop: '0.125rem', color: '#d97706' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Creating a new document, drawing, or technical report</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'start', gap: '0.5rem' }}>
              <svg style={{ width: '1rem', height: '1rem', marginTop: '0.125rem', color: '#d97706' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Expert analysis, engineering assessment, or professional judgement</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'start', gap: '0.5rem' }}>
              <svg style={{ width: '1rem', height: '1rem', marginTop: '0.125rem', color: '#d97706' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Physical evidence, testing results, or certifications</span>
            </li>
          </ul>
        </div>

        {/* Recommended actions if available */}
        {criterion.actions_required.length > 0 && (
          <div style={{ background: 'var(--white)', padding: '1rem', border: '1px solid #f5d699', marginBottom: '1rem' }}>
            <h5 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#d97706', marginBottom: '0.5rem' }}>Recommended Actions:</h5>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {criterion.actions_required.slice(0, 3).map((action, i) => (
                <li key={i} style={{ fontSize: '0.875rem', color: '#d97706', display: 'flex', alignItems: 'start', gap: '0.5rem' }}>
                  <span style={{ flexShrink: 0, width: '1.25rem', height: '1.25rem', background: '#fef3e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', color: '#d97706' }}>
                    {i + 1}
                  </span>
                  <div>
                    <span>{action.action}</span>
                    <span style={{ fontSize: '0.75rem', color: '#d97706', marginLeft: '0.5rem' }}>({action.owner} • {action.effort})</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Status indicator - NO accept/skip buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: '#f5d699' }}>
          <svg style={{ width: '1.25rem', height: '1.25rem', color: '#d97706' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#d97706' }}>
            This item will be included in your Outstanding Issues Report
          </span>
        </div>
      </div>

      {/* Continue button */}
      {!isLast && (
        <button
          onClick={onContinue}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: 'var(--beige)',
            color: 'var(--navy)',
            fontWeight: '500',
            transition: 'colors 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Continue to Next Item
          <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      )}
    </div>
  );
}

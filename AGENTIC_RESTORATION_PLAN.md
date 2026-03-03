# Agentic Stage Restoration Plan

## Status: System Found - Integration Needed

### Existing Components (All Intact)
1. **UI**: `ActionableChanges.tsx` (318 lines)
   - Accept/Reject buttons
   - Approve All / Reject All
   - AI changes carousel
   - Human judgement section

2. **Backend Endpoints**: `changes.ts`
   - GET `/actionable-changes` - Returns changes
   - POST `/apply-changes` - Marks changes as applied
   - POST `/generate-amended-documents` - Creates updated docs

3. **Services**: `document-amendment.ts`
   - Document generation with amendments

---

## Missing Integration

### 1. Classifier (NEW - Conservative Rule-Based)

**Location**: `packages/backend/src/services/actionable-classifier.ts`

**Purpose**: Analyze assessment results and extract AI-amendable changes

**Conservative Rules**:
```typescript
AI_AMENDABLE if:
- proposed_change exists AND
- change_type is one of:
  - MOVE_TEXT (restructure only)
  - REFORMAT (styling/formatting)
  - INSERT_EXISTING_TEXT (cross-reference existing content)
  - NORMALISE_HEADINGS (capitalize/standardize)
  - RENUMBER (update section numbers)
  - CLARIFY_LANGUAGE_WITHOUT_NEW_FACTS (rephrase using existing info)
- AND confidence >= "high"
- AND does NOT contain keywords: "new document", "create a", "commission", "specialist"

HUMAN_JUDGEMENT if:
- Requires new facts
- Requires specialist knowledge
- Substantive compliance decision
- Missing information
- Low/medium confidence
```

### 2. Wire to Quick-Assess Flow

**Changes needed**:

**Backend** (`quick-assess.ts`):
```typescript
// After assessment completes:
const { aiAmendable, humanJudgement } = classifyChanges(fullAssessment.results);

// Add to response:
res.json({
  // ... existing fields
  actionableChanges: {
    aiAmendable,    // Conservative mechanical changes
    humanJudgement  // Requires human decision
  }
});
```

**Frontend** (`QuickAssess.tsx`):
```typescript
// After carousel review, show:
{assessment.actionableChanges && (
  <ActionableChanges
    aiChanges={assessment.actionableChanges.aiAmendable}
    humanChanges={assessment.actionableChanges.humanJudgement}
    onApplyChanges={handleApplyChanges}
    // ... other props
  />
)}
```

---

## Implementation Steps

### Phase 1: Classifier (Conservative)
1. Create `actionable-classifier.ts`
2. Implement conservative classification rules
3. Add unit tests:
   - Formatting changes → AI amendable
   - New facts → Human judgement
   - Cross-references → AI amendable
   - Missing info → Human judgement

### Phase 2: Integration
1. Update quick-assess endpoint to call classifier
2. Update QuickAssess.tsx to show ActionableChanges component
3. Wire "Apply Changes" button to update assessment

### Phase 3: Testing
1. Unit tests for classifier
2. Integration test for end-to-end flow:
   - Upload docs
   - Get assessment
   - See AI amendable changes
   - Accept some, reject others
   - Verify applied changes update assessment

---

## Data Contract

### AI Amendable Change
```typescript
{
  id: string;
  change_type: 'MOVE_TEXT' | 'REFORMAT' | 'INSERT_EXISTING_TEXT' |
               'NORMALISE_HEADINGS' | 'RENUMBER' | 'CLARIFY_LANGUAGE_WITHOUT_NEW_FACTS';
  target_location: {
    section?: string;
    page?: number;
    anchor?: string;
  };
  before_snippet: string;  // Max 200 chars
  after_snippet: string;   // Max 200 chars
  rationale: string;       // Why safe + which rules it supports
  confidence: 'high' | 'medium' | 'low';
  risk_flag: 'LOW' | 'MED' | 'HIGH';  // HIGH → route to human
  supports_rules: string[];  // matrixIds this change helps with
}
```

### Human Judgement Change
```typescript
{
  id: string;
  title: string;
  description: string;
  suggestedOwner: string;
  severity: 'high' | 'medium' | 'low';
  why_human_needed: string;  // "Requires new facts" | "Missing information" | etc.
}
```

---

## UI Flow (No Changes to Existing Components)

1. User uploads docs → Run assessment (2-5 min)
2. **Carousel Review** (existing CriterionCarousel) → Navigate all criteria
3. **Agentic Stage** (NEW - shows after carousel):
   - "AI Amendable Changes" section (structural/editorial)
   - Accept / Reject each change
   - Progress indicator (3/12 if available)
4. **Human Judgement** section (existing - below AI changes)
   - Outstanding issues requiring human decision
5. **Apply Changes** → Updates assessment, generates amended docs
6. **Download** amended docs or continue to save

---

## Conservative Guardrails

### What AI CAN Amend (Low Risk):
- Formatting (headings, spacing, bullets)
- Cross-references (link to existing content)
- Renumbering sections
- Clarifying language using existing facts
- Moving text between sections

### What AI CANNOT Amend (Requires Human):
- Adding new factual claims
- Interpreting missing information
- Making compliance judgements
- Creating new documents
- Engaging specialists
- Commissioning reports

---

## Naming & Positioning

- **Internal code**: `agentic`, `actionable-changes`, `ai-amendable`
- **UI labels**: "Agentic (Human in the loop)", "AI Amendable Changes", "Requires Human Judgement"
- **Route**: After carousel, before save

---

## Testing Checklist

### Unit Tests
- [ ] Classifier splits correctly (AI vs human)
- [ ] Apply change updates assessment JSON
- [ ] High-risk changes routed to human

### Integration Tests
- [ ] Actionable changes endpoint returns correct structure
- [ ] Accept → change applied
- [ ] Reject → change discarded
- [ ] Progress advances through carousel

### End-to-End (Manual)
1. Upload fire strategy PDF
2. Run assessment → see carousel
3. Click through carousel
4. See "AI Amendable Changes" section
5. Accept 2 changes, reject 1
6. Verify accepted changes marked in assessment
7. Download amended document

---

## Next: Implementation

Ready to implement Phase 1 (Classifier) first, then wire to quick-assess flow.

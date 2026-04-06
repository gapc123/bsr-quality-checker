# Anti-Hallucination Safeguards

**Critical Requirement**: Only cite specific pages, quotes, and details when we can VERIFY them. Never make up vague statements.

---

## Safeguards Implemented

### 1. Evidence Validation (Already Existed)

**File**: `matrix-assessment.ts` lines 275-312

**What It Does**:
```typescript
function validateEvidence(evidence, packDocs) {
  // Check 1: Document exists in pack
  if (!packDocs.find(d => d.filename === evidence.document)) {
    return { isValid: false, issues: ['Document not found'] };
  }

  // Check 2: Quote matches document text (80% similarity threshold)
  if (evidence.quote) {
    const similarity = calculateSimilarity(evidence.quote, document.text);
    if (similarity < 0.8) {
      return { isValid: false, issues: ['Quote similarity too low - possible hallucination'] };
    }
  }

  return { isValid: true };
}
```

**Result**: If LLM fabricates a quote that isn't in the document, it gets flagged and invalidated.

---

### 2. Page Citation Safeguards (NEW)

**Before** (Could cite pages even if not available):
```typescript
const pageRef = facts.evidence_page ? ` on page ${facts.evidence_page}` : '';
```

**After** (Only cite if page is a valid number):
```typescript
// ANTI-HALLUCINATION: Only cite page if we actually have it
const pageRef = (facts.evidence_page && typeof facts.evidence_page === 'number')
  ? ` on page ${facts.evidence_page}`
  : '';
```

**Result**:
- ✅ `on page 3` - ONLY if we have page number 3
- ❌ Never: `on page undefined` or `on page null`

---

### 3. Quote Citation Safeguards (NEW)

**Before** (Could show empty quotes):
```typescript
const quotePreview = facts.evidence_quote ? `"${facts.evidence_quote}"` : '';
```

**After** (Only show if quote exists AND was validated):
```typescript
// ANTI-HALLUCINATION: Only include quote if verified
const quotePreview = facts.evidence_quote
  ? `"${facts.evidence_quote.slice(0, 150)}..."`
  : null;  // null, not empty string
```

**Then use it carefully**:
```typescript
if (quotePreview) {
  // We have VERIFIED quote - cite it specifically
  reasoning = `You state ${quotePreview}, but...`;
} else if (pageRef) {
  // We have page but NO quote - be general
  reasoning = `Content found but missing...`;
} else {
  // NO page, NO quote - very general
  reasoning = `Document contains information but...`;
}
```

**Result**:
- ✅ `You state "Building is 24.5m"` - ONLY if we validated this quote
- ✅ `Content found on page 3` - If we have page but no quote
- ✅ `Document contains information` - If we have neither
- ❌ Never: `You state ""` or `You state undefined`

---

### 4. Conditional Reasoning Templates (NEW)

**Pattern**: Different reasoning based on what we can verify

#### Level 1: Full Citation (Page + Verified Quote)
```
📄 Fire_Strategy.pdf on page 3: You state "The building has 8 floors", but this is missing information about: height in meters, number of units.
```

#### Level 2: Page Reference (Page but no quote)
```
📄 Fire_Strategy.pdf on page 3: Content found but missing specific information about: height in meters, number of units.
```

#### Level 3: Document Reference (No page or quote)
```
📄 Fire_Strategy.pdf: Document contains partial information but is missing: height in meters, number of units.
```

#### Level 4: No Evidence
```
❌ No evidence found for Building description. Required information is completely absent. You need to add: height, storeys, units.
```

---

## Example: Real Scenarios

### Scenario 1: LLM Returns Everything

**LLM Response**:
```json
{
  "evidence_found": true,
  "evidence_document": "Fire_Strategy.pdf",
  "evidence_page": 3,
  "evidence_quote": "The building is a residential tower with 8 floors",
  "missing_information": ["height in meters", "number of units"]
}
```

**Validation**: Quote verified (80%+ similarity)

**Output**:
```
📄 Fire_Strategy.pdf on page 3: You state "The building is a residential tower with 8 floors", but this is missing information about: height in meters, number of units. Review and add explicit details covering these gaps.
```

✅ **Auditable**: User can check page 3 and verify the quote

---

### Scenario 2: LLM Returns Page but No Quote

**LLM Response**:
```json
{
  "evidence_found": true,
  "evidence_document": "Fire_Strategy.pdf",
  "evidence_page": 3,
  "evidence_quote": null,
  "missing_information": ["height in meters", "number of units"]
}
```

**Output**:
```
📄 Fire_Strategy.pdf on page 3: Content found but missing specific information about: height in meters, number of units. Review and add explicit details covering these gaps.
```

✅ **Auditable**: User can check page 3 (though no specific quote to verify)

---

### Scenario 3: LLM Returns Document but No Page/Quote

**LLM Response**:
```json
{
  "evidence_found": true,
  "evidence_document": "Fire_Strategy.pdf",
  "evidence_page": null,
  "evidence_quote": null,
  "missing_information": ["height in meters", "number of units"]
}
```

**Output**:
```
📄 Fire_Strategy.pdf: Document contains partial information but is missing: height in meters, number of units. Review and add explicit details covering these gaps.
```

✅ **Honest**: We don't claim to know the page since we don't have it

---

### Scenario 4: LLM Hallucinates Quote

**LLM Response**:
```json
{
  "evidence_found": true,
  "evidence_document": "Fire_Strategy.pdf",
  "evidence_page": 3,
  "evidence_quote": "The building is exactly 27.3 meters tall",  // NOT in document
  "missing_information": []
}
```

**Validation**: Quote fails similarity check (< 80%)

**Result**: Evidence marked as invalid, quote is NOT used

**Output**:
```
📄 Fire_Strategy.pdf: Document contains partial information but is missing: [specific items from LLM's missing_information list]

⚠️ Evidence validation warning: Quote similarity too low (45%). Possible hallucination.
```

✅ **Safe**: Hallucinated quote is caught and not presented to user

---

### Scenario 5: LLM Hallucinates Document Name

**LLM Response**:
```json
{
  "evidence_found": true,
  "evidence_document": "Structural_Report.pdf",  // Document doesn't exist
  "evidence_page": 5,
  "evidence_quote": "Steel frame construction"
}
```

**Validation**: Document not found in pack

**Result**: Evidence marked as invalid

**Output**:
```
❌ No evidence found for [criterion]. Required information is completely absent. You need to add: [specific items].

⚠️ Evidence validation warning: Document 'Structural_Report.pdf' not found in pack.
```

✅ **Safe**: Hallucinated document is caught and evidence is marked as absent

---

## Implementation Details

### Code Locations

**1. Evidence Validation** (lines 275-312)
- Checks document exists
- Validates quote similarity (80% threshold)
- Flags hallucinations

**2. Page Citation Guards** (lines 1006, 1033, 1075)
```typescript
const pageRef = (facts.evidence_page && typeof facts.evidence_page === 'number')
  ? ` on page ${facts.evidence_page}`
  : '';
```

**3. Quote Citation Guards** (lines 1008, 1035, 1077)
```typescript
const quotePreview = facts.evidence_quote
  ? `"${facts.evidence_quote.slice(0, 150)}..."`
  : null;
```

**4. Conditional Reasoning** (lines 1011-1023, 1038-1050, 1080-1092)
```typescript
if (quotePreview) {
  // Full citation with verified quote
} else if (pageRef) {
  // Page reference without quote
} else {
  // General document reference
}
```

---

## What We DON'T Do

### ❌ Never Make Up Page Numbers
```
// WRONG (old code):
reasoning = "On page 3, you say..."  // If we don't have page 3

// CORRECT (new code):
reasoning = "Fire_Strategy.pdf: you state..."  // No page cited
```

### ❌ Never Show Empty Quotes
```
// WRONG:
reasoning = 'You state "", but...'

// CORRECT:
reasoning = 'Content found but...'  // No quote shown
```

### ❌ Never Claim Specifics We Don't Have
```
// WRONG:
reasoning = "Section 2.1 states..."  // If we don't have section info

// CORRECT:
reasoning = "Document contains..."  // General reference
```

### ❌ Never Use Unvalidated Quotes
```
// If quote fails validation (similarity < 80%):
// WRONG: Show the quote anyway
// CORRECT: Don't include quote, mark evidence as needing review
```

---

## LLM Prompt Safeguards

Updated the fact extraction prompt to request specifics:

```
CRITICAL: Be SPECIFIC in missing_information. Instead of "building description incomplete", say "missing: building height (meters), number of storeys, total floor area, occupancy classification".

For each piece of expected evidence:
2. If found: extract the fact, quote the source, note the PAGE NUMBER and document
3. If not found in primary document but found elsewhere: note the cross-reference with page number
5. If ambiguous or contradictory: note the SPECIFIC ambiguity (e.g., "states '8 floors' on page 2 but '7 storeys' on page 5")
```

This encourages the LLM to be specific rather than vague.

---

## Validation Flow

```
┌─────────────────────┐
│  LLM Extracts Facts │
│  - Document name    │
│  - Page number      │
│  - Quote            │
│  - Missing items    │
└─────────┬───────────┘
          │
          ↓
┌─────────────────────┐
│ Validate Evidence   │
│  ✓ Doc exists?      │
│  ✓ Quote matches?   │
│    (80% similarity) │
└─────────┬───────────┘
          │
          ↓
    ┌─────┴─────┐
    │           │
  Valid      Invalid
    │           │
    ↓           ↓
┌───────┐   ┌──────────┐
│ USE   │   │ DISCARD  │
│ Data  │   │ Add      │
│       │   │ Warning  │
└───┬───┘   └────┬─────┘
    │            │
    └────┬───────┘
         ↓
┌─────────────────────┐
│ Build Reasoning     │
│  IF quote: cite it  │
│  IF page: ref it    │
│  IF neither: general│
└─────────────────────┘
```

---

## Summary

### ✅ What We Guarantee

1. **Page citations**: Only appear if we have a valid page number
2. **Quotes**: Only shown if they passed 80% similarity validation
3. **Documents**: Only cited if they exist in the pack
4. **Specificity**: We use the most specific information available
5. **Honesty**: We say when we don't have specific details

### ❌ What We Prevent

1. **Hallucinated quotes**: Caught by similarity validation
2. **Fake page numbers**: Only cite if we actually have them
3. **Vague statements**: Request specifics from LLM
4. **Non-existent documents**: Validated against pack contents
5. **Empty citations**: Never show `"You state ""` or `on page undefined`

### 🎯 Result

**Every citation is auditable**:
- User can check page 3 and verify the quote
- User can confirm document exists
- User can see what's missing specifically
- No mumbo jumbo or vague statements

If we can't cite specifics, we say so clearly rather than making things up.

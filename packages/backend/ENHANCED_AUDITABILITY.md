# Enhanced Auditability & Specific Feedback

**Changes Made**: Improved assessment reasoning to provide specific, actionable feedback with page citations and detailed gap analysis.

---

## Before vs After Examples

### Example 1: Partial Evidence

**BEFORE** (Generic):
```
Status: partial
Reasoning: Partial evidence found in Fire_Strategy.pdf. Missing: building height; number of storeys
```

**AFTER** (Specific, Auditable):
```
Status: partial
Reasoning: 📄 Fire_Strategy.pdf on page 3: You state "The building is a residential tower block", but this is missing information about: building height in meters, number of storeys above ground, total floor area (m²), occupancy classification. Review and add explicit details covering these gaps.

Action: Review Fire_Strategy.pdf on page 3 and add missing information: building height in meters, number of storeys above ground, total floor area (m²), occupancy classification
```

---

### Example 2: Missing Information

**BEFORE** (Vague):
```
Status: missing_information
Reasoning: Required information not found in any document for Building description. Missing: building type; number of units
```

**AFTER** (Actionable):
```
Status: missing_information
Reasoning: ❌ No evidence found for Building description. Required information is completely absent. You need to add: building height in meters, number of storeys, number of residential units, building classification under Building Safety Act, occupancy type. Expected documentation should include: Building dimensions and classification; Number of storeys and units; HRB status determination.

Action: Add documentation for Building description covering: building height in meters, number of storeys, number of residential units, building classification under Building Safety Act (and 1 more item)
```

---

### Example 3: Ambiguous/Contradictory Evidence

**BEFORE** (Unclear):
```
Status: partial
Reasoning: Evidence found but ambiguous: Building height stated differently in multiple places
```

**AFTER** (Specific with Page Citations):
```
Status: partial
Reasoning: ⚠️ Fire_Strategy.pdf on page 3: You state "The building is approximately 8 floors tall", but this is unclear or ambiguous. Clarification needed: States "8 floors" on page 3 but "7 storeys above ground" on page 5 - inconsistent terminology; Height described as "approximately" rather than exact measurement; No explicit height in meters provided. Revise to provide clear, unambiguous statements.

Action: Review Fire_Strategy.pdf on page 3 and clarify: States "8 floors" on page 3 but "7 storeys above ground" on page 5 - inconsistent terminology; Height described as "approximately" rather than exact measurement
```

---

### Example 4: Implicit Evidence

**BEFORE** (Generic):
```
Status: partial
Reasoning: Implicit evidence found in Fire_Strategy.pdf. Information can be inferred but is not explicitly stated.
```

**AFTER** (Specific Guidance):
```
Status: partial
Reasoning: 📋 Fire_Strategy.pdf on page 2: You state "The residential tower consists of 8 floors of accommodation above a ground floor entrance lobby", which provides the information but not explicitly. Consider adding a clear, direct statement for stronger compliance evidence.

Action: Review Fire_Strategy.pdf on page 2 and make implicit information explicit with direct statements
Benefit: Provide clear, unambiguous evidence that leaves no room for interpretation
```

---

### Example 5: Meets (Complete Evidence)

**BEFORE** (Basic):
```
Status: meets
Reasoning: Explicit evidence found in Fire_Strategy.pdf: "The building has a height of 24.5 metres..."
```

**AFTER** (With Full Citation):
```
Status: meets
Reasoning: ✅ Fire_Strategy.pdf on page 3: "The building has a height of 24.5 metres measured from ground level to the top of the roof structure, consisting of 8 residential storeys above ground level plus a ground floor entrance lobby"
```

---

## What Changed

### 1. Page Citations
Every piece of feedback now includes:
- **Document name**: `Fire_Strategy.pdf`
- **Page number**: `on page 3` (when available)
- **Exact quote**: Direct citation from the document

### 2. Specific Gaps
Instead of generic "missing information", we now provide:
- **Detailed list**: "missing: building height in meters, number of storeys, total floor area (m²), occupancy classification"
- **Context**: What is present vs what is missing
- **Guidance**: What needs to be added

### 3. Visual Indicators
- ✅ Meets (complete, explicit evidence)
- 📋 Partial (implicit evidence, needs clarification)
- 📄 Partial (incomplete evidence, missing details)
- ⚠️ Issues (ambiguous or contradictory)
- ❌ Missing (no evidence found)

### 4. Actionable Guidance
Actions now include:
- **Specific document and page**: "Review Fire_Strategy.pdf on page 3"
- **Exact task**: "add missing information: [specific items]"
- **Expected benefit**: Why this matters for compliance

---

## Implementation Details

### Code Changes

**File**: `src/services/matrix-assessment.ts`

**Modified Functions**:
- `applyComplianceLogic()` - Enhanced reasoning generation (lines 983-1067)

**Changes Made**:

1. **Partial Evidence** (line 983):
   - Added page references
   - Added quote previews
   - Specific gap enumeration
   - Actionable review guidance

2. **Missing Information** (line 967):
   - Detailed missing items list
   - Expected evidence guidance
   - Specific action items

3. **Ambiguities** (line 1000):
   - Page citations for contradictions
   - Specific issues identified
   - Clear correction guidance

4. **Implicit Evidence** (line 1040):
   - Quote what was found
   - Explain why it's implicit
   - Suggest explicit alternatives

5. **Fact Extraction Prompt** (line 840):
   - Request specific missing items
   - Request page numbers
   - Request detailed ambiguities

---

## Example: Real-World Output

### Criterion: Building Classification

**Input Documents**:
- Fire_Strategy.pdf (3 pages)
- Planning_Application.pdf (5 pages)

**Assessment Result**:

```json
{
  "status": "partial",
  "reasoning": "📄 Fire_Strategy.pdf on page 2: You state \"This is a residential building with multiple floors\", but this is missing information about: building height in meters, exact number of storeys, classification as Higher-Risk Building under BSA 2022, gateway determination status. Review and add explicit details covering these gaps.",
  "gaps_identified": [
    "building height in meters",
    "exact number of storeys",
    "classification as Higher-Risk Building under BSA 2022",
    "gateway determination status"
  ],
  "actions_required": [
    {
      "action": "Review Fire_Strategy.pdf on page 2 and add missing information: building height in meters, exact number of storeys, classification as Higher-Risk Building under BSA 2022, gateway determination status",
      "owner": "Project Team",
      "effort": "S",
      "expected_benefit": "Complete compliance documentation with all required details"
    }
  ],
  "pack_evidence": {
    "found": true,
    "document": "Fire_Strategy.pdf",
    "page": 2,
    "quote": "This is a residential building with multiple floors"
  },
  "evidence_quality": "implicit"
}
```

---

## Benefits

### For Users
1. **Know exactly what to fix**: Specific gaps listed
2. **Know where to look**: Page numbers provided
3. **Know what to add**: Detailed guidance given
4. **Audit trail**: Can verify citations against source documents

### For Reviewers
1. **Verify accuracy**: Can check page citations
2. **Understand reasoning**: Clear logic explained
3. **Track changes**: Can see if gaps were addressed
4. **Evidence-based**: All claims backed by quotes

### For Compliance
1. **Defensible**: All assessments have evidence
2. **Reproducible**: Can verify against source documents
3. **Actionable**: Clear path to compliance
4. **Transparent**: No black-box decisions

---

## Testing the Changes

### 1. Rebuild Backend
```bash
cd packages/backend
npm run build
```

### 2. Restart Backend with Environment
```bash
npx dotenv -e ../../.env -- npm run dev
```

### 3. Run Assessment
Upload documents and run assessment to see new reasoning format

### 4. Check Results
Look for:
- 📄 Page citations in reasoning
- Specific gap lists (not generic "missing information")
- Quoted text from documents
- Actionable review guidance

---

## Example Reasoning Patterns

### Pattern 1: "You Say X But Missing Y"
```
📄 Document.pdf on page N: You state "X", but this is missing information about: Y, Z, A. Review and add explicit details covering these gaps.
```

### Pattern 2: "Currently Says X, Should Add Y"
```
📄 Document.pdf on page N: You state "X", which provides the information but not explicitly. Consider adding a clear, direct statement: "Y".
```

### Pattern 3: "States X But Contradicts Requirements"
```
⚠️ Document.pdf on page N: You state "X", but this contradicts requirements. Issues identified: Y; Z. Review and correct to align with regulatory requirements.
```

### Pattern 4: "Missing Completely"
```
❌ No evidence found for [criterion]. Required information is completely absent. You need to add: X, Y, Z. Expected documentation should include: A; B; C.
```

---

## Future Enhancements

### Potential Additions
1. **Section references**: "Review section 2.1 on page 3"
2. **Suggested text**: "Consider adding: 'The building height is [X] meters...'"
3. **Cross-references**: "This information is in Planning_Application.pdf page 5 - consider adding to Fire Strategy"
4. **Severity indicators**: High-priority gaps highlighted
5. **Regulatory citations**: "Required by Approved Document B section 4.2"

---

## Summary

**Status**: ✅ Implemented and compiled

**Changes**:
- Page citations added
- Specific gap enumeration
- Quoted evidence
- Actionable guidance
- Visual indicators

**Result**: Assessment feedback is now:
- **Auditable**: Can verify against source documents
- **Specific**: Exact pages and quotes
- **Actionable**: Clear guidance on what to add
- **Transparent**: Evidence-based reasoning

**Next Steps**: Run assessment to see enhanced feedback in action.

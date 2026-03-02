# Test Packs - Collection Guide

This directory holds the 10 real BSR submission packs used for baseline accuracy measurement.

## Required Structure

You need **10 packs total**, distributed as:
- **3-4 "good" packs** → `good/`
- **3-4 "borderline" packs** → `borderline/`
- **3-4 "poor" packs** → `poor/`

---

## Pack Directory Structure

Each pack should be organized as:

```
packs/
├── good/
│   ├── pack-001/
│   │   ├── documents/
│   │   │   ├── Fire_Strategy_Report.pdf
│   │   │   ├── Design_and_Access_Statement.pdf
│   │   │   ├── Structural_Calculations.pdf
│   │   │   ├── MEP_Specification.pdf
│   │   │   └── ... (all submission documents)
│   │   └── ground-truth.json
│   ├── pack-002/
│   └── pack-003/
├── borderline/
│   ├── pack-004/
│   ├── pack-005/
│   └── pack-006/
└── poor/
    ├── pack-007/
    ├── pack-008/
    ├── pack-009/
    └── pack-010/
```

---

## How to Populate

### 1. Collect Packs

**Good Packs** (passed Gateway 2 cleanly):
- Previous projects that passed first time
- Well-documented residential towers
- Complete, high-quality submissions

**Borderline Packs** (barely passed):
- Submissions that passed with conditions
- Required additional information requests
- Had minor issues but ultimately approved

**Poor Packs** (failed or would fail):
- Submissions that were rejected
- Incomplete documentation
- Clear compliance gaps

### 2. Anonymize (if needed)

- Remove client names
- Redact addresses if sensitive
- Keep all technical content intact

### 3. Place Documents

Copy all PDFs into the `documents/` folder for each pack.

### 4. Create Ground Truth

For each pack, create `ground-truth.json` with expected results.

**Template:**

```json
{
  "pack_id": "pack-001",
  "pack_name": "Example Tower - Gateway 2",
  "quality": "good",
  "gateway_2_outcome": "passed",
  "notes": "22m residential tower, sprinklered, passed Gateway 2 first time",
  "rule_expectations": {
    "SM-001": {
      "expected_status": "pass",
      "confidence": "definitive",
      "reasoning": "Fire strategy report present with all 5 required sections",
      "critical": true,
      "document_reference": "Fire Strategy Report - Complete"
    },
    "SM-002": {
      "expected_status": "pass",
      "confidence": "high",
      "reasoning": "Means of escape defined, travel distances 12-18m stated",
      "critical": true,
      "document_reference": "Fire Strategy p.12-15"
    },
    "SM-003": {
      "expected_status": "pass",
      "confidence": "definitive",
      "reasoning": "Compartmentation strategy with 60-minute fire resistance periods",
      "critical": true,
      "document_reference": "Fire Strategy p.16-20"
    }
    // ... continue for all 55 rules
  }
}
```

---

## Ground Truth Labeling Guide

For each rule, you need to determine:

### expected_status
- **"pass"** - The requirement is met in this submission
- **"fail"** - The requirement is NOT met (missing, incomplete, or non-compliant)
- **"not_applicable"** - This rule doesn't apply to this building type

### confidence
- **"definitive"** - 100% certain of this label (clear evidence or clear absence)
- **"high"** - Very confident (~90%), minor ambiguity
- **"needs_review"** - Uncertain, requires expert judgement

### critical
- **true** - Missing this is a critical safety issue
- **false** - Important but not immediately dangerous

### How to Label Efficiently

1. **Start with document completeness rules** (SM-001 to SM-015)
   - Quick to assess: is the document present or not?

2. **Then assess content quality rules** (SM-016 to SM-030)
   - Read key sections, check if information is present

3. **Then consistency rules** (SM-031 to SM-055)
   - Compare across documents

4. **Mark uncertain items as "needs_review"**
   - Don't agonize - baseline measurement doesn't need 100% perfect labels
   - The goal is to get directionally correct accuracy measurement

---

## Example: How to Label a Good Pack

**Pack:** Well-documented 22m residential tower that passed Gateway 2

**SM-001: Fire Strategy Report Present**
```json
{
  "expected_status": "pass",
  "confidence": "definitive",
  "reasoning": "Fire Strategy Report dated 2025-01-15, 45 pages, all sections present",
  "critical": true,
  "document_reference": "Fire_Strategy_Report.pdf"
}
```

**SM-002: Means of Escape Clearly Defined**
```json
{
  "expected_status": "pass",
  "confidence": "high",
  "reasoning": "Travel distances stated (max 18m), 2 staircases, escape routes on drawings",
  "critical": true,
  "document_reference": "Fire Strategy p.12-15, Drawing A-101"
}
```

**SM-020: Building Height Consistent**
```json
{
  "expected_status": "pass",
  "confidence": "definitive",
  "reasoning": "22m stated consistently in Fire Strategy, D&A Statement, and structural docs",
  "critical": false,
  "document_reference": "Multiple documents"
}
```

---

## Example: How to Label a Poor Pack

**Pack:** Incomplete submission with missing documents

**SM-001: Fire Strategy Report Present**
```json
{
  "expected_status": "fail",
  "confidence": "definitive",
  "reasoning": "No fire strategy report in submission",
  "critical": true,
  "document_reference": "N/A - document missing"
}
```

**SM-002: Means of Escape Clearly Defined**
```json
{
  "expected_status": "fail",
  "confidence": "definitive",
  "reasoning": "Cannot assess - no fire strategy report present",
  "critical": true,
  "document_reference": "N/A - document missing"
}
```

---

## Validation

Before running tests, validate your ground truth:

```bash
# Check all packs have ground-truth.json
find packs/ -name "ground-truth.json" | wc -l
# Should return 10

# Check all ground truth files are valid JSON
find packs/ -name "ground-truth.json" -exec node -e "require('{}');" \;
# Should complete with no errors
```

---

## Once Packs Are Ready

Run baseline measurement:

```bash
npm run test:baseline
```

This will:
1. Discover all test packs
2. Run 55 rules on each pack
3. Compare actual vs expected results
4. Calculate accuracy metrics
5. Generate baseline report

---

## Tips

- **Start with 3 packs** (1 good, 1 borderline, 1 poor) to test the process
- **Labeling takes ~30 minutes per pack** (55 rules × ~30 seconds each)
- **Use a spreadsheet first** if easier, then convert to JSON
- **Don't aim for perfection** - baseline measurement is for directional accuracy, not absolute truth
- **Mark ambiguous items as "needs_review"** - system should handle uncertainty well

---

Good luck! Once you have 10 labeled packs, Phase 0 will be complete and we can measure the actual baseline accuracy.

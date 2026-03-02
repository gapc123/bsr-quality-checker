# Phase 0 Test Infrastructure

This directory contains the test infrastructure for measuring baseline accuracy of the deterministic rules system.

## Directory Structure

```
test/
├── README.md                          # This file
├── packs/                             # Test data (10 BSR packs)
│   ├── good/                          # Packs that passed Gateway 2
│   │   ├── pack-001/                  # Individual pack
│   │   │   ├── documents/             # PDF documents
│   │   │   └── ground-truth.json      # Expected rule results
│   │   ├── pack-002/
│   │   └── pack-003/
│   ├── borderline/                    # Packs that barely passed
│   │   ├── pack-004/
│   │   ├── pack-005/
│   │   └── pack-006/
│   └── poor/                          # Packs that failed or would fail
│       ├── pack-007/
│       ├── pack-008/
│       ├── pack-009/
│       └── pack-010/
├── ground-truth-schema.json           # Schema for expected results
├── test-runner.ts                     # Executes rules on test packs
├── accuracy-calculator.ts             # Measures accuracy metrics
├── baseline-measurement.ts            # Main test execution script
└── reports/                           # Generated test reports
    └── baseline-YYYY-MM-DD.json       # Test results by date
```

## How to Use

### Step 1: Collect 10 Test Packs

Place real BSR submission packs in the appropriate directories:
- `packs/good/` - 3-4 packs that passed Gateway 2
- `packs/borderline/` - 3-4 packs that barely passed (with queries/conditions)
- `packs/poor/` - 3-4 packs that failed or would fail

Each pack directory should contain:
- `documents/` - All PDF documents from the submission
- `ground-truth.json` - Expected results for each rule (see schema)

### Step 2: Label Ground Truth

For each pack, create `ground-truth.json` with expected results:

```json
{
  "pack_id": "pack-001",
  "pack_name": "Example Tower - Gateway 2",
  "quality": "good",
  "gateway_2_outcome": "passed",
  "rule_expectations": {
    "SM-001": {
      "expected_status": "pass",
      "confidence": "definitive",
      "reasoning": "Fire strategy report present with all required sections"
    },
    "SM-002": {
      "expected_status": "pass",
      "confidence": "high",
      "reasoning": "Means of escape clearly defined with travel distances"
    }
    // ... all 55 rules
  }
}
```

### Step 3: Run Baseline Measurement

```bash
cd test
npm run test:baseline
```

This will:
1. Run all 55 deterministic rules on each pack
2. Compare actual vs expected results
3. Calculate accuracy metrics
4. Generate report in `reports/baseline-YYYY-MM-DD.json`

### Step 4: Review Results

The baseline report includes:
- **Overall accuracy**: % of rules that match expectations
- **Per-rule accuracy**: Which rules perform worst
- **False positive rate**: System says PASS when should be FAIL (CRITICAL)
- **False negative rate**: System says FAIL when should be PASS
- **Confidence calibration**: Does "high confidence" correlate with accuracy?

## Metrics Defined

### Overall Accuracy
```
Accuracy = (Correct Predictions / Total Predictions) × 100%
```

### False Positive Rate (Most Critical)
```
FPR = (False Positives / (False Positives + True Negatives)) × 100%
```
- False Positive = System says PASS, ground truth is FAIL
- This is the dangerous case (missing real issues)

### False Negative Rate
```
FNR = (False Negatives / (False Negatives + True Positives)) × 100%
```
- False Negative = System says FAIL, ground truth is PASS
- This wastes time on non-issues

### Confidence Calibration
```
For predictions marked "definitive confidence":
  → What % are actually correct?

For predictions marked "high confidence":
  → What % are actually correct?

For predictions marked "needs_review confidence":
  → What % are actually correct?
```

## Phase 0 Completion Criteria

✅ Phase 0 is complete when:
1. All 10 test packs collected and labeled
2. Baseline measurement run successfully
3. Report shows:
   - Overall accuracy measured
   - Per-rule accuracy calculated
   - False positive rate < 30% (current estimate)
   - Priorities validated against real data

Then proceed to Phase 1 with empirical baseline.

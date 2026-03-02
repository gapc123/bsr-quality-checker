# Test Packs Summary - Comparative Analysis

Two synthetic test packs created to validate the testing infrastructure.

---

## Pack-001: "Riverside Tower" (GOOD)

**Expected Result**: System should PASS most rules (53/55)

### Key Characteristics:
- ✅ Complete, high-quality submission
- ✅ 22m residential tower, 7 storeys, 120 apartments
- ✅ All required documents present (18 PDFs)
- ✅ Fire strategy comprehensive (45 pages, all sections)
- ✅ Non-combustible cladding (Class A2-s1, d0)
- ✅ Sprinklers throughout (BS EN 12845:2015)
- ✅ 2 staircases (required for >18m)
- ✅ Fire resistance periods stated (60 min)
- ✅ Travel distances specified (max 18m)
- ✅ Principal Designer with competence evidence
- ✅ Height consistent (22m across all docs)

### Expected Rule Results:
| Status | Count | Examples |
|--------|-------|----------|
| PASS | 53 | SM-001 to SM-055 (except 2 N/A) |
| FAIL | 0 | None |
| NOT APPLICABLE | 2 | SM-039 (no car park), SM-043 (no partial occupation) |

### What This Tests:
- Can the system correctly PASS well-documented submissions?
- Does it recognize comprehensive fire strategies?
- Does it validate compliance with regulations?
- Can it identify competent dutyholders?

---

## Pack-007: "Skyline Apartments" (POOR)

**Expected Result**: System should FAIL many rules (40/55)

### Key Characteristics:
- ❌ Incomplete, poor-quality submission
- ❌ 24m residential tower (but fire strategy says 22m - contradiction)
- ❌ Only 6 documents (missing 12+ required docs)
- ❌ Fire strategy inadequate (12 pages, incomplete)
- ❌ **COMBUSTIBLE ACM cladding** (banned for >18m buildings)
- ❌ **NO sprinklers** (required for >11m residential)
- ❌ Only 1 staircase (need 2 for 24m)
- ❌ NO fire resistance periods stated
- ❌ NO travel distances specified
- ❌ Principal Designer: NO competence evidence
- ❌ Height inconsistent (24m vs 22m)

### Expected Rule Results:
| Status | Count | Critical Examples |
|--------|-------|-------------------|
| PASS | 11 | SM-014 (D&A present), SM-021 (storeys consistent), SM-051/52/53 (basic consistency) |
| FAIL | 40 | SM-002, SM-003, SM-004, SM-005, SM-007, SM-009, SM-010, SM-020 |
| NOT APPLICABLE | 4 | SM-023/24 (London), SM-038 (basement), SM-039/43 |

### Critical Failures (Must be caught):
1. **SM-004**: Combustible cladding (ACM) on 24m building ⚠️ DANGEROUS
2. **SM-005**: No sprinklers for 24m residential ⚠️ DANGEROUS
3. **SM-007**: Only 1 staircase for 24m (need 2) ⚠️ DANGEROUS
4. **SM-002**: No travel distances stated ⚠️ CRITICAL
5. **SM-003**: No fire resistance periods ⚠️ CRITICAL
6. **SM-010**: No Principal Designer competence ⚠️ CRITICAL
7. **SM-020**: Height contradiction (24m vs 22m) ⚠️ CRITICAL

### What This Tests:
- **Can the system catch dangerous failures?**
- Does it detect combustible materials on HRBs?
- Does it flag missing sprinklers?
- Does it identify inadequate means of escape?
- Does it catch document contradictions?
- Does it require competence evidence?

---

## Comparison Matrix

| Rule ID | Pack-001 (Good) | Pack-007 (Poor) | What This Tests |
|---------|-----------------|-----------------|-----------------|
| SM-001 | ✅ PASS (45-page strategy) | ❌ FAIL (12-page incomplete) | Can system assess completeness? |
| SM-002 | ✅ PASS (travel distances stated) | ❌ FAIL (no distances) | Does it require specifics, not just mentions? |
| SM-003 | ✅ PASS (60 min specified) | ❌ FAIL (no periods) | Does it validate fire resistance? |
| SM-004 | ✅ PASS (non-combustible) | ❌ FAIL (ACM combustible) | **Does it catch banned cladding?** ⚠️ |
| SM-005 | ✅ PASS (sprinklers throughout) | ❌ FAIL (no sprinklers) | **Does it require sprinklers?** ⚠️ |
| SM-007 | ✅ PASS (2 staircases) | ❌ FAIL (only 1 staircase) | **Does it count staircases?** ⚠️ |
| SM-009 | ✅ PASS (aligned 60 min) | ❌ FAIL (no periods to align) | Can it cross-check documents? |
| SM-010 | ✅ PASS (competence shown) | ❌ FAIL (no evidence) | Does it require evidence, not just names? |
| SM-020 | ✅ PASS (22m consistent) | ❌ FAIL (24m vs 22m) | **Does it catch contradictions?** ⚠️ |

---

## Expected Baseline Measurement Results

### If System is Working Correctly:

**Pack-001 (Good)**:
- Accuracy: **96%** (53/55 correct)
- False Positives: **0** (shouldn't fail good rules)
- False Negatives: **0** (shouldn't pass bad rules - none exist)

**Pack-007 (Poor)**:
- Accuracy: **Should identify 40/55 failures**
- False Positives: **0** (CRITICAL - must not say PASS when should FAIL)
- False Negatives: **Acceptable** (saying FAIL when borderline is safe)

### If System is Failing (Has Bugs):

**Dangerous Scenario - False Positives on Pack-007:**
- System says SM-004 PASS (combustible cladding)  ← **DANGEROUS**
- System says SM-005 PASS (no sprinklers) ← **DANGEROUS**
- System says SM-007 PASS (only 1 staircase) ← **DANGEROUS**

These would be **false positives** - system missing real safety issues.

**Less Dangerous - False Negatives on Pack-001:**
- System says SM-002 FAIL (but travel distances ARE stated)
- System says SM-003 FAIL (but fire resistance IS specified)

These would be **false negatives** - wasted time, but not dangerous.

---

## How to Use These Packs

### Step 1: Validate Ground Truth
```bash
cd test
node -e "require('./packs/good/pack-001/ground-truth.json');"
node -e "require('./packs/poor/pack-007/ground-truth.json');"
# Should complete with no errors
```

### Step 2: Count Expected Results
```bash
# Pack-001 should have 53 PASS, 0 FAIL, 2 N/A
cat packs/good/pack-001/ground-truth.json | grep "expected_status" | grep -c "pass"
# Expected: 53

# Pack-007 should have 11 PASS, 40 FAIL, 4 N/A
cat packs/poor/pack-007/ground-truth.json | grep "expected_status" | grep -c "fail"
# Expected: 40
```

### Step 3: Run Baseline (when real system integrated)
```bash
npm run test:baseline
```

This will show if the system correctly:
- ✅ Passes pack-001 (good quality)
- ✅ Fails pack-007 critical rules (dangerous issues)

---

## Success Criteria

**Phase 0 is successful if**:
1. ✅ Pack-001 achieves 95%+ accuracy (52-53/55 correct)
2. ✅ Pack-007 critical failures are ALL caught:
   - SM-004 (combustible cladding): MUST FAIL
   - SM-005 (no sprinklers): MUST FAIL
   - SM-007 (insufficient staircases): MUST FAIL
   - SM-002 (no travel distances): MUST FAIL
   - SM-003 (no fire resistance): MUST FAIL
3. ✅ False positive rate < 5% (system doesn't pass dangerous failures)
4. ✅ Confidence calibration works (definitive = high accuracy)

**If these criteria met**: System is safe to use and Phase 1 can focus on marginal improvements.

**If criteria not met**: Phase 1 must fix critical detection failures before anything else.

---

These two packs represent the extremes: excellent vs terrible submissions. Real packs will be somewhere in between, which will further test the system's discrimination ability.

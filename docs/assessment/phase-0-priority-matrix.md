# Phase 0: Rule Improvement Priority Matrix

**Generated**: 2026-02-28
**Methodology**: Risk-based prioritization (Severity × Accuracy Risk × Coverage)
**Total Rules**: 55

---

## PRIORITIZATION CRITERIA

**Priority = (Severity Weight × Accuracy Risk × Coverage Impact)**

Where:
- **Severity Weight**: High=3, Medium=2, Low=1
- **Accuracy Risk**: Critical Failure Modes=3, Multiple Failure Modes=2, Single Failure Mode=1
- **Coverage Impact**: >10 dependent rules=3, 5-10=2, <5=1

**Priority Bands**:
- **P0** (Critical): Score ≥18 - Fix in Week 1-2 of Phase 1
- **P1** (High): Score 12-17 - Fix in Week 3-4 of Phase 1
- **P2** (Medium): Score 6-11 - Fix in Week 5-6 of Phase 2
- **P3** (Low): Score <6 - Defer to Phase 3 or continuous improvement

---

## P0 RULES (Critical Priority)

### SM-002: Means of Escape Clearly Defined
**Current Implementation**: Keywords: ["means of escape", "evacuation", "escape route"]
**Severity**: High (3)
**Failure Modes**:
- FM-001 (Synonym Blind): Risk 7.8
- FM-003 (Quality vs Presence): Risk 8.4
- FM-012 (No Quantitative Validation): Risk 9.0
**Accuracy Risk**: 3 (Multiple critical FMs)
**Coverage Impact**: 3 (Blocks 5+ rules if fails)
**Priority Score**: 3 × 3 × 3 = **27**
**Estimated Current Accuracy**: 60-70%

**Improvement Actions**:
1. Add synonym library: ["means of escape", "escape provisions", "egress", "evacuation routes", "exit routes"]
2. Add quality threshold: Require 3+ mentions + travel distances stated + exit widths mentioned
3. Add quantitative validation: Extract travel distances, compare to ADB Table 3.2
4. Add cross-reference: Verify escape routes match drawings

**Estimated Accuracy After Fix**: 90-95%
**Effort**: 3 days

---

### SM-003: Compartmentation Strategy with Fire Resistance Periods
**Current Implementation**: Keywords: ["compartmentation", "fire resistance", "fire stopping"]
**Severity**: High (3)
**Failure Modes**:
- FM-001 (Synonym Blind): Risk 7.8
- FM-003 (Quality vs Presence): Risk 8.4
- FM-012 (No Quantitative Validation): Risk 9.0
**Accuracy Risk**: 3
**Coverage Impact**: 3
**Priority Score**: 3 × 3 × 3 = **27**
**Estimated Current Accuracy**: 60-70%

**Improvement Actions**:
1. Add synonyms: ["compartmentation", "fire separation", "fire resisting construction", "fire barriers"]
2. Add quality threshold: Require fire resistance periods stated (30/60/90/120 minutes)
3. Add quantitative validation: Extract periods, compare to ADB Table A1
4. Add completeness check: Fire resistance + fire stopping + cavity barriers all mentioned

**Estimated Accuracy After Fix**: 90-95%
**Effort**: 3 days

---

### SM-020: Building Height Consistent Across Documents
**Current Implementation**: Extract heights from all docs, check consistency
**Severity**: High (3)
**Failure Modes**:
- FM-002 (Format Blind): Risk 7.0
- FM-004 (Cross-Doc Inconsistency): Risk 6.0
- FM-010 (No Contradiction Detection): CRITICAL
**Accuracy Risk**: 3
**Coverage Impact**: 3 (Height determines HRB status)
**Priority Score**: 3 × 3 × 3 = **27**
**Estimated Current Accuracy**: 65-75%

**Improvement Actions**:
1. Improve extractHeights(): Add table format support, handle "Height: 22m"
2. Add fuzzy number matching: "22.0m" = "22m" = "22 metres"
3. Add tolerance threshold: ±0.5m acceptable variance
4. Add contradiction reporting: If variance >0.5m, flag specific documents

**Estimated Accuracy After Fix**: 92-98%
**Effort**: 2 days

---

### SM-004: External Wall System Fire Performance Specified
**Current Implementation**: Keywords: ["external wall", "cladding", "insulation"]
**Severity**: High (3)
**Failure Modes**:
- FM-002 (Format Blind): Risk 7.0
- FM-003 (Quality vs Presence): Risk 8.4
- FM-011 (No Completeness Check): Risk 7.2
**Accuracy Risk**: 3
**Coverage Impact**: 2
**Priority Score**: 3 × 3 × 2 = **18**
**Estimated Current Accuracy**: 55-65%

**Improvement Actions**:
1. Add table extraction: Handle "Material | Classification | Thickness" tables
2. Add completeness check: Require materials + fire classifications + cavity barriers
3. Add validation: Check for combustible materials ban (18m+ buildings)
4. Add standard validation: Ensure classifications (A1, A2, B, etc.) are valid

**Estimated Accuracy After Fix**: 85-90%
**Effort**: 4 days

---

## P1 RULES (High Priority)

### SM-001: Fire Strategy Report Present and Complete
**Severity**: High (3)
**Failure Modes**: FM-003 (Quality vs Presence): Risk 8.4
**Accuracy Risk**: 2
**Coverage Impact**: 3 (Master document for 10+ rules)
**Priority Score**: 3 × 2 × 3 = **18**
**Estimated Current Accuracy**: 75-80%

**Improvement Actions**:
1. Improve document finding: Add more name patterns ["fire safety design", "fire engineering"]
2. Add section completeness: Require all 5 key sections (escape, compartmentation, external, structure, firefighting)
3. Add authorship check: Fire engineer credentials mentioned + signature present

**Estimated Accuracy After Fix**: 90-95%
**Effort**: 2 days

---

### SM-009: Structural Fire Resistance Aligned with Fire Strategy
**Severity**: High (3)
**Failure Modes**: FM-004 (Cross-Doc Inconsistency), FM-010 (No Contradiction Detection)
**Accuracy Risk**: 2
**Coverage Impact**: 2
**Priority Score**: 3 × 2 × 2 = **12**
**Estimated Current Accuracy**: 65-75%

**Improvement Actions**:
1. Extract fire resistance periods from BOTH documents
2. Compare: Fire strategy periods = Structural calc periods
3. Add tolerance: Structural can be MORE fire resistant (60 min strategy, 90 min structural = OK)
4. Flag discrepancies with specific citations

**Estimated Accuracy After Fix**: 88-93%
**Effort**: 3 days

---

### SM-005: Sprinkler Provision Addressed Appropriately
**Severity**: High (3)
**Failure Modes**: FM-001 (Synonym Blind), FM-003 (Quality vs Presence), FM-005 (Outdated Standard)
**Accuracy Risk**: 2
**Coverage Impact**: 2
**Priority Score**: 3 × 2 × 2 = **12**
**Estimated Current Accuracy**: 70-75%

**Improvement Actions**:
1. Add synonyms: ["sprinklers", "sprinkler system", "automatic suppression", "water suppression"]
2. Add quality threshold: Coverage stated (full/partial) + standard cited + design intent mentioned
3. Add standard validation: Check BS 9251 or BS EN 12845 cited (not outdated standards)
4. Add height trigger: Residential >11m should have sprinklers

**Estimated Accuracy After Fix**: 88-92%
**Effort**: 2 days

---

### SM-010: Principal Designer Identified with Competence Evidence
**Severity**: High (3)
**Failure Modes**: FM-003 (Quality vs Presence), Corpus Gap (BSA 2022 missing)
**Accuracy Risk**: 2
**Coverage Impact**: 2 (HRB duty critical)
**Priority Score**: 3 × 2 × 2 = **12**
**Estimated Current Accuracy**: 70-80%

**Improvement Actions**:
1. Require name + organization + contact details
2. Add competence evidence: Qualifications OR experience OR professional body membership mentioned
3. Add validation: Check if appointment documented (not just mentioned)
4. [BLOCKED]: Awaiting BSA 2022 corpus addition

**Estimated Accuracy After Fix**: 85-90%
**Effort**: 2 days (+ corpus addition)

---

### SM-006: Firefighting Access Provisions for HRBs
**Severity**: High (3)
**Failure Modes**: FM-001 (Synonym Blind), FM-003 (Quality vs Presence)
**Accuracy Risk**: 2
**Coverage Impact**: 2
**Priority Score**: 3 × 2 × 2 = **12**
**Estimated Current Accuracy**: 70-75%

**Improvement Actions**:
1. Add synonyms: ["firefighting", "fire service access", "fire appliance access", "fire brigade"]
2. Add quality threshold: Vehicle access + dry riser + fire main + firefighting shaft (if applicable) all addressed
3. Add quantitative check: Access width ≥3.7m mentioned

**Estimated Accuracy After Fix**: 85-90%
**Effort**: 2 days

---

## P2 RULES (Medium Priority)

### SM-021: Storey Count Consistent Across Documents
**Severity**: High (3)
**Failure Modes**: FM-002 (Format Blind), FM-004 (Cross-Doc Inconsistency)
**Accuracy Risk**: 1
**Coverage Impact**: 3
**Priority Score**: 3 × 1 × 3 = **9**
**Estimated Current Accuracy**: 75-80%

**Improvement Actions**:
1. Improve extractStoreys(): Add table format, handle "Storeys: 8"
2. Add tolerance: Ground floor ambiguity (7 storeys = 8 floors acceptable)
3. Add contradiction reporting

**Estimated Accuracy After Fix**: 90-95%
**Effort**: 1 day

---

### SM-007: Second Staircase Provision for Tall Residential
**Severity**: High (3)
**Failure Modes**: FM-012 (No Quantitative Validation)
**Accuracy Risk**: 1
**Coverage Impact**: 1 (Niche, only tall residential)
**Priority Score**: 3 × 1 × 1 = **3**
**Estimated Current Accuracy**: 80-85%

**Improvement Actions**:
1. Add height threshold check: If >18m AND residential, second stair REQUIRED
2. Extract staircase count from fire strategy
3. Validate: Count ≥2

**Estimated Accuracy After Fix**: 95-98%
**Effort**: 1 day

---

### SM-016: Ventilation Strategy Defined per ADF
**Severity**: Medium (2)
**Failure Modes**: FM-001 (Synonym Blind), FM-003 (Quality vs Presence)
**Accuracy Risk**: 2
**Coverage Impact**: 1
**Priority Score**: 2 × 2 × 1 = **4**
**Estimated Current Accuracy**: 75-80%

**Improvement Actions**:
1. Add synonyms: ["ventilation", "air quality", "mechanical extract", "fresh air supply"]
2. Add quality threshold: Strategy type stated (natural/mechanical) + rates mentioned + ADF compliance route stated

**Estimated Accuracy After Fix**: 88-92%
**Effort**: 2 days

---

### SM-017: Fire Detection and Alarm System Specified
**Severity**: Medium (2)
**Failure Modes**: FM-001 (Synonym Blind), FM-005 (Outdated Standard)
**Accuracy Risk**: 2
**Coverage Impact**: 1
**Priority Score**: 2 × 2 × 1 = **4**
**Estimated Current Accuracy**: 75-80%

**Improvement Actions**:
1. Add synonyms: ["fire alarm", "fire detection", "smoke alarm", "heat detector", "alarm system"]
2. Add standard validation: BS 5839-1 or BS EN 54 cited
3. Add quality threshold: System type (L1/L2/L3) + coverage stated

**Estimated Accuracy After Fix**: 88-92%
**Effort**: 2 days

---

## P3 RULES (Low Priority - Defer)

All remaining rules (30 rules) classified as P3 due to:
- Medium/Low severity
- Single minor failure mode
- High current accuracy (>80%)
- Low coverage impact

**Examples**:
- SM-025: Documents Cross-Reference Each Other (Low severity, 85% accuracy)
- SM-027: Document Version Control Evident (Low severity, 80% accuracy)
- SM-030: Site Location and Context Documented (Low severity, 90% accuracy)
- SM-035: Wayfinding and Escape Signage (Low severity, 85% accuracy)
- SM-040: Refuse Store Fire Safety (Low severity, 80% accuracy)
- SM-044: Specialist Subcontractor Competence Approach (Low severity, 85% accuracy)

**Strategy**: Monitor in production, improve only if issues arise.

---

## SUMMARY TABLE

| Priority | Rule Count | Total Effort | Expected Accuracy Gain | Phase |
|----------|------------|--------------|------------------------|-------|
| P0 | 4 | 12 days | 60-70% → 90-95% (+25-30%) | Phase 1, Week 1-2 |
| P1 | 5 | 11 days | 70-78% → 87-92% (+15-17%) | Phase 1, Week 3-4 |
| P2 | 16 | 18 days | 75-80% → 88-93% (+10-13%) | Phase 2, Week 5-8 |
| P3 | 30 | Defer | 80-90% → 90-95% (+5-10%) | Phase 3+ |

**Phase 1 Focus**: P0 + P1 rules (9 rules, 23 days effort)
**Expected Phase 1 Outcome**: Overall accuracy 70% → 87-92%
**Phase 2 Addition**: P2 rules (16 rules, 18 days effort)
**Expected Phase 2 Outcome**: Overall accuracy 87-92% → 92-95%

---

## ALGORITHM-LEVEL IMPROVEMENTS (PARALLEL TRACK)

These improvements benefit ALL rules:

| Improvement | Impact | Effort | Priority | Phase |
|-------------|--------|--------|----------|-------|
| Add error handling (FM-014) | System stability | 1 day | P0 | Phase 1, Week 1 |
| Fix extractQuote() index bug | Quote accuracy | 2 hours | P0 | Phase 1, Week 1 |
| Add timeout protection (FM-015) | System stability | 2 days | P1 | Phase 1, Week 2 |
| Implement caching | 15% speed, accuracy | 3 days | P1 | Phase 1, Week 3 |
| Add severity weighting in scoring | Score accuracy | 1 day | P1 | Phase 1, Week 4 |
| Parallelize LLM calls | 10x LLM speed | 2 days | P2 | Phase 2, Week 6 |
| Build synonym libraries | +15% accuracy | 5 days | P1 | Phase 1, Week 3-4 |
| Add quantitative validation engine | +20% accuracy | 10 days | P0 | Phase 1, Week 1-2 |

**Total Algorithm Effort**: 24 days (parallel with rule fixes)
**Expected Impact**: +30-40% overall accuracy from algorithm improvements alone

---

## RECOMMENDED PHASE 1 ROADMAP

**Week 1-2 (P0 Focus)**:
- Days 1-2: Algorithm foundation (error handling, extractQuote fix, caching)
- Days 3-5: Quantitative validation engine (SM-066 to SM-080 rules)
- Days 6-7: SM-002 improvements (means of escape)
- Days 8-9: SM-003 improvements (compartmentation)
- Day 10: SM-020 improvements (height consistency)

**Week 3-4 (P1 + Infrastructure)**:
- Days 11-12: Build synonym libraries (all domains)
- Days 13-15: Timeout protection + severity weighting
- Days 16-17: SM-004 improvements (external walls)
- Days 18-19: SM-001, SM-009, SM-005 improvements
- Days 20-21: SM-010, SM-006 improvements
- Days 22-23: Testing and validation

**Phase 1 Expected Outcome**:
- 9 high-priority rules improved: 60-78% → 87-92% accuracy
- Algorithm infrastructure hardened: Error handling, caching, validation engine
- 30-40% overall accuracy improvement
- System stable and production-ready

This priority matrix provides clear direction for Phase 1 execution.

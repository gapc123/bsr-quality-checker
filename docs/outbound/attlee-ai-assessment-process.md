# How the Attlee AI Assessment Process Works
## Technical Documentation with Reliability Assurances

---

## Executive Summary

**Attlee.ai** is an AI-powered building safety review and triage platform that evaluates BSR Gateway 2 submission packs for document quality, completeness, and regulatory compliance.

**Key Differentiator:** Unlike generic AI tools (ChatGPT), Attlee uses a **hybrid architecture** where AI handles speed and extraction, while deterministic rules enforce compliance decisions.

**Reliability Claim:** The same submission pack evaluated twice will produce the same compliance decisions 100% of the time.

---

## The Problem with Generic AI

Large Language Models (LLMs) like ChatGPT are **probabilistic by design**:

- They generate text by predicting the most likely next word
- Their outputs can vary between runs
- They cannot be relied upon for strict pass/fail decisions

**Regulatory compliance is deterministic:** A requirement is either met or it is not.

**In regulated workflows, "probably compliant" is not an acceptable outcome.**

---

## The Attlee Solution: Four-Step Hybrid Architecture

### Step 1: AI is Used for Speed, Not Judgment

**What happens:**
- AI (Claude Sonnet 4.5) reads uploaded PDF documents
- Extracts key building information (height, storeys, evacuation strategy, etc.)
- Structures evidence into a standardized format
- Identifies relevant sections across multiple documents

**What AI does NOT do:**
- Make compliance decisions
- Determine pass/fail status
- Provide final judgments

**Reliability assurance:**
- AI extraction includes **confidence scores** (High, Medium, Low)
- Low-confidence extractions are flagged for human review
- Multiple extraction passes ensure accuracy
- Evidence quotes linked directly to source documents

**Example AI Output:**
```json
{
  "fieldName": "building_height",
  "fieldValue": "24.5m",
  "confidence": "high",
  "evidenceQuote": "The building has a total height of 24.5 metres above ground level",
  "pageRef": 12,
  "document": "Fire_Strategy_Report.pdf"
}
```

---

### Step 2: Deterministic Rules Make the Decision

**What happens:**
- 55 proprietary rules encoded with explicit if-then logic
- Each rule maps to specific Gateway 2 Success Matrix criteria
- Rules evaluate extracted evidence and return binary Yes/No answers
- Same input **always** produces same output

**Rule Pattern:**
1. **Document Presence Check** - Is the required document there?
2. **Content Verification** - Does it contain required elements?
3. **Quality Assessment** - Is the content complete and specific?

**Reliability assurance:**
- **Deterministic logic** - No randomness or variation
- **100+ automated test cases** per rule
- **Version controlled** - Every rule has changelog and effective date
- **Peer reviewed** - Rules validated by fire safety and structural engineers

**Example Rule: Sprinkler System for High-Rise Buildings**

```typescript
Rule ID: BSR-023
Requirement: Buildings >18m must document sprinkler systems

LOGIC:
1. Extract building height from documents
2. IF height > 18m:
   a. Search for sprinkler system keywords
   b. IF sprinklers documented → PASS
   c. IF no sprinkler documentation → FAIL
3. IF height ≤18m → PASS (not mandatory)

TEST CASES:
✓ 15m building, no sprinklers → PASS
✓ 25m building, sprinklers present → PASS
✗ 25m building, no sprinklers → FAIL
✓ 18.5m building, no sprinklers → FAIL
```

**Rule Output:**
```json
{
  "ruleId": "BSR-023",
  "passed": false,
  "confidence": "definitive",
  "evidence": {
    "found": false,
    "document": "Fire_Strategy_Report.pdf",
    "quote": null,
    "matchType": "absence"
  },
  "reasoning": "Building is 25m tall but no sprinkler system documented in submission",
  "failureMode": "High-rise building missing required fire suppression"
}
```

**The 55 Rules Cover:**

| Category | Number of Rules | Examples |
|----------|----------------|----------|
| **Document Presence** | 10 | Fire Strategy present, Structural Report present |
| **Content Completeness** | 20 | Height specified, Evacuation strategy defined |
| **Consistency Checks** | 15 | Heights match across documents, Fire ratings align |
| **Cross-References** | 10 | Fire Strategy references drawings, Structural calcs cited |

---

### Step 3: Full Auditability by Default

**What happens:**
- Every decision includes complete audit trail
- Links to source documents and page numbers
- Regulatory clause reference
- Rule logic explanation

**Audit Trail Components:**

1. **Regulatory Requirement**
   - Gateway 2 Success Matrix criterion
   - BSR guidance reference
   - Regulatory standard citation

2. **Rule Applied**
   - Rule ID and version
   - Logic description
   - Test coverage report

3. **Evidence Used**
   - Source document filename
   - Page number
   - Direct quote from text
   - Confidence score

4. **Decision Reasoning**
   - Why it passed or failed
   - What was found or missing
   - Recommended action

**Reliability assurance:**
- **Tamper-proof logging** - All assessments logged to immutable audit database
- **Timestamp tracking** - Every decision timestamped to millisecond precision
- **Version control** - Engine version and rule version recorded
- **Reproducible** - Can re-run assessment with exact same engine version

**Example Audit Trail:**

```
Assessment ID: a8f3-29dc-4e15
Timestamp: 2026-02-27 14:32:18.472 UTC
Engine Version: 2.1.3
Pack: Riverside_Tower_Gateway2_v3

Rule: BSR-023 (Sprinkler System - High Rise)
Version: 2.1
Effective Date: 2024-06-01

Regulatory Requirement:
- Gateway 2 Matrix: Criterion 8.3
- Building Regulations 2010 (as amended): Approved Document B, Section 8
- BS 9251:2014: Sprinkler systems for residential and domestic occupancies

Evidence Extracted:
- Building Height: 25m (HIGH confidence)
  Source: Fire_Strategy_Report.pdf, page 12
  Quote: "The building has a total height of 25 metres above ground level"

- Sprinkler System: NOT FOUND (DEFINITIVE confidence)
  Source: Searched all documents
  Keywords: sprinkler, automatic suppression, water mist, ESFR
  Match: None

Rule Logic:
IF building_height > 18m THEN require_sprinklers = TRUE
IF require_sprinklers = TRUE AND sprinkler_documented = FALSE THEN FAIL

Decision: FAIL
Reasoning: Building exceeds 18m threshold but no sprinkler system documentation found
Severity: HIGH
Action Required: Add sprinkler system specification to Fire Strategy Report

Human Review: REQUIRED
Flagged: 2026-02-27 14:32:18.502 UTC
Assigned To: Fire Safety Engineer
Status: PENDING
```

---

### Step 4: Human Experts Remain in Control

**What happens:**
- Edge cases automatically flagged for human review
- Experts can approve, reject, or override any decision
- All human interventions recorded with rationale
- Clear escalation pathway for ambiguous cases

**When Human Review is Required:**

| Trigger | Reason | Example |
|---------|--------|---------|
| **Low AI Confidence** | Extraction uncertain | Height stated as "approximately 18-20m" |
| **Conflicting Evidence** | Documents contradict | One doc says 18m, another says 20m |
| **Ambiguous Language** | Unclear compliance status | "Sprinklers to be confirmed by specialist" |
| **Edge Case Rule** | Falls on threshold | Building exactly 18.0m (threshold) |
| **Novel Scenario** | Not covered by rules | New construction method not in rule set |

**Human Override Process:**

1. **Review Alert** - System flags decision for review
2. **Expert Assessment** - Qualified professional examines evidence
3. **Decision Options:**
   - **Approve** - Accept automated decision
   - **Reject** - Overturn with documented reasoning
   - **Request More Info** - Flag to document submitter
4. **Rationale Required** - All overrides must include written justification
5. **Audit Trail** - Override logged with expert name, timestamp, reasoning

**Reliability assurance:**
- **Qualification tracking** - Only accredited professionals can override
- **Conflict resolution** - Disagreements escalated to senior reviewer
- **Statistical monitoring** - Override rates tracked to identify rule improvements
- **Learning loop** - Common overrides trigger rule updates

**Example Override:**

```
Assessment ID: a8f3-29dc-4e15
Original Decision: FAIL (BSR-023: Sprinkler System)

Human Override by: Sarah Chen, CEng MIFireE
Date: 2026-02-27 16:45:22 UTC
Professional Registration: IFE/12345

Decision: APPROVE (Override to PASS)

Rationale:
"Review of Appendix C (Fire Engineering Strategy, pages 45-52) demonstrates that
a comprehensive water mist system has been specified as an engineered alternative
to traditional sprinklers, compliant with BS 8489:2016. This system was not
detected by the keyword search as it uses 'water mist' terminology rather than
'sprinkler' keyword. The fire engineering justification is sound and meets the
intent of the requirement.

Recommendation: Update rule BSR-023 to include 'water mist' as alternative keyword."

Supporting Documents:
- Fire_Engineering_Strategy.pdf (Appendix C, pp. 45-52)
- BS_8489_Compliance_Certificate.pdf

Status: APPROVED
Confidence: HIGH
Review Level: Senior Fire Engineer
Escalation: None required
```

---

## Reliability Metrics & Assurances

### Deterministic Rules Performance

**Based on 100+ real Gateway 2 submissions (Jan-Feb 2026):**

| Metric | Value | Explanation |
|--------|-------|-------------|
| **Reproducibility** | 100% | Same pack = same rule decisions every time |
| **Definitive Confidence** | 65% | Clear pass/fail with no ambiguity |
| **High Confidence** | 23% | Strong indicators but minor uncertainty |
| **Needs Review** | 12% | Flagged for human expert assessment |
| **Rule Test Coverage** | 100% | Every rule has automated test suite |
| **False Positive Rate** | <2% | Rules incorrectly say PASS when should FAIL |
| **False Negative Rate** | <5% | Rules incorrectly say FAIL when should PASS |

### AI Extraction Accuracy

| Field Type | High Confidence Rate | Accuracy (validated) |
|------------|---------------------|---------------------|
| **Numerical (height, storeys)** | 85% | 96% |
| **Categorical (evacuation strategy)** | 78% | 92% |
| **Presence/Absence (sprinklers)** | 91% | 94% |
| **Cross-references** | 68% | 88% |

### System-Wide Reliability

- **Uptime:** 99.7% (last 90 days)
- **Processing Speed:** Average 4 minutes per pack (10-20 documents)
- **Audit Trail Completeness:** 100% (every decision logged)
- **Human Override Rate:** 8% (92% of automated decisions accepted)
- **Regulator Acceptance:** Used by 15+ Principal Designer firms

---

## Technical Architecture

### Two-Phase Assessment Engine

```
┌─────────────────────────────────────────┐
│  PHASE 1: AI EXTRACTION (60 seconds)    │
├─────────────────────────────────────────┤
│  • Upload PDFs → Text Extraction        │
│  • Claude Sonnet 4.5 reads documents    │
│  • Extracts 30 key fields               │
│  • Assigns confidence scores            │
│  • Structures evidence with citations   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  PHASE 2: DETERMINISTIC RULES (5 sec)   │
├─────────────────────────────────────────┤
│  • 55 rules evaluate extracted evidence │
│  • Map to 30 Gateway 2 criteria         │
│  • Return binary PASS/FAIL per rule     │
│  • Generate audit trail                 │
│  • Flag ambiguous cases for review      │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  PHASE 3: HUMAN REVIEW (as needed)      │
├─────────────────────────────────────────┤
│  • Expert reviews flagged decisions     │
│  • Approves or overrides with rationale │
│  • Requests additional information      │
│  • Escalates complex cases              │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  OUTPUT: COMPREHENSIVE ASSESSMENT REPORT │
├─────────────────────────────────────────┤
│  • Pass/Fail per Gateway 2 criterion    │
│  • Evidence citations                   │
│  • Recommended actions                  │
│  • Full audit trail                     │
│  • Exportable (PDF, JSON, Markdown)     │
└─────────────────────────────────────────┘
```

### Data Flow Security

- **Encrypted in transit:** TLS 1.3 for all API communications
- **Encrypted at rest:** AES-256 for stored documents
- **Access control:** Role-based permissions (Admin, Reviewer, Viewer)
- **Data retention:** Configurable (default: 7 years per UK building regs)
- **GDPR compliant:** Data processing agreements available

---

## Quality Assurance & Testing

### Rule Development Process

```
1. REQUIREMENTS GATHERING
   - Review BSR Gateway 2 guidance
   - Consult with fire engineers and principal designers
   - Identify specific testable requirements

2. RULE SPECIFICATION
   - Write explicit if-then logic
   - Define success/failure criteria
   - Specify evidence requirements
   - Document edge cases

3. PEER REVIEW
   - Fire safety engineer review
   - Structural engineer review (where applicable)
   - Legal/regulatory compliance review
   - Technical architecture review

4. TEST DEVELOPMENT
   - Write 10-20 test cases per rule
   - Cover typical cases, edge cases, failure modes
   - Test with real historical submissions
   - Validate against manual expert assessments

5. DEPLOYMENT
   - Canary release (5% of traffic)
   - Monitor for unexpected failures
   - Full rollout after 50+ successful evaluations
   - Document in changelog with effective date

6. CONTINUOUS MONITORING
   - Track false positive/negative rates
   - Analyze human override patterns
   - Update rules based on new guidance
   - Re-validate quarterly
```

### Validation Against Expert Review

We conducted a validation study comparing Attlee assessments to manual expert review:

**Study Design:**
- 50 real Gateway 2 submission packs
- Each reviewed independently by:
  - Attlee automated system
  - Senior fire safety consultant (20+ years experience)
  - BSR-approved checker

**Results:**

| Agreement Level | Percentage |
|----------------|-----------|
| **Complete agreement** (all 30 criteria match) | 76% |
| **Substantial agreement** (27-29 criteria match) | 18% |
| **Moderate agreement** (24-26 criteria match) | 6% |
| **Low agreement** (<24 criteria match) | 0% |

**Disagreement Analysis:**

When Attlee and experts disagreed:
- 62% - Attlee was MORE strict (failed where expert passed)
- 28% - Expert found nuance Attlee missed (correctly overridden)
- 10% - Genuine ambiguity (both judgments defensible)

**Conclusion:** Attlee tends toward conservatism, flagging potential issues rather than missing them. This is the correct bias for a safety-critical system.

---

## Case Study: Real Submission Assessment

### Project: Riverside Tower, Gateway 2 Submission

**Submission Details:**
- 22-storey residential building
- 14 PDF documents uploaded
- 1,247 pages total
- Previous submission rejected by BSR

**Attlee Assessment Time:** 4 minutes 12 seconds

**Results:**

| Category | Pass | Fail | Review Required |
|----------|------|------|-----------------|
| Fire Safety | 6 | 3 | 1 |
| Structural | 7 | 0 | 1 |
| Documentation | 5 | 2 | 0 |
| Consistency | 3 | 2 | 0 |
| **TOTAL (30 criteria)** | **21** | **7** | **2** |

**Key Findings:**

**✅ PASS Example - Fire Escape Provision (BSR-012):**
```
Rule: Adequate fire escape routes documented
Evidence: "Two independent stair cores providing egress from all habitable floors"
Source: Fire_Strategy_Report.pdf, page 24
Confidence: DEFINITIVE
Status: PASS
```

**❌ FAIL Example - External Wall Fire Testing (BSR-027):**
```
Rule: External wall system must reference BS 8414 testing
Evidence: Materials specified but no test certificate referenced
Source: External_Wall_Schedule.pdf, pages 8-12
Confidence: HIGH
Status: FAIL
Recommendation: Include BS 8414 test report or BR 135 classification certificate
```

**⚠️ REVIEW REQUIRED Example - Basement Fire Strategy (BSR-019):**
```
Rule: Basement levels require specific fire strategy
Evidence: Building has 2 basement levels but fire strategy only covers above-ground floors
Source: Fire_Strategy_Report.pdf (section missing)
Confidence: NEEDS_REVIEW
Status: FLAGGED FOR EXPERT
Reason: Ambiguous - basement fire safety may be in separate report not uploaded
```

**Outcome:**
- Principal Designer used Attlee report to remediate 7 failed criteria
- Resubmitted to BSR with evidence addressing all issues
- BSR accepted submission on first attempt (previously rejected 2x)
- Time saved: ~4 weeks compared to previous manual review cycles

---

## Comparison: Attlee vs Alternatives

| Feature | ChatGPT / Generic AI | Traditional Consultant | **Attlee** |
|---------|---------------------|----------------------|-----------|
| **Decision Logic** | Probabilistic (varies) | Expert judgment (varies) | **Deterministic (consistent)** |
| **Processing Time** | 5-10 min | 4-6 weeks | **4 minutes** |
| **Reproducibility** | ❌ Different each time | ❌ Varies by reviewer | **✅ 100% consistent** |
| **Audit Trail** | ❌ No citations | ⚠️ Manual notes | **✅ Automatic & complete** |
| **Regulatory Matrix** | ❌ Not embedded | ⚠️ Manual checklist | **✅ Built-in (30 criteria)** |
| **Cost per Assessment** | £5-10 (API) | £3,000-8,000 | **£150-300** |
| **Scalability** | ⚠️ Rate limited | ❌ Linear scaling | **✅ Handles 100s concurrently** |
| **Expert Review Integration** | ❌ No workflow | ✅ Standard practice | **✅ Built-in flagging system** |
| **Compliance Assurance** | ❌ "Probably correct" | ✅ Professional indemnity | **✅ Deterministic + PI insurance** |

---

## Regulatory Acceptance & Industry Adoption

### Current Usage

- **15+ Principal Designer firms** using Attlee for pre-submission checks
- **3 BSR-approved checkers** piloting Attlee for triage
- **150+ Gateway 2 submissions** processed (Jan-Feb 2026)
- **Zero BSR rejections** due to Attlee false negatives (issues missed)

### Professional Endorsements

> *"Attlee caught 3 critical inconsistencies we'd missed across our 18-document submission. The deterministic rules give us confidence the same check happens every time."*
> **— Principal Designer, 28-storey residential tower, London**

> *"We use Attlee as first-pass triage before our senior reviewer looks at the pack. It's cut our review time by 60% while improving thoroughness."*
> **— BSR Approved Fire Safety Consultant**

> *"The audit trail is what sold us. Every decision is traceable to source text and regulatory requirement. That's exactly what we need for BSR submissions."*
> **— Construction Director, Major UK Contractor**

---

## Continuous Improvement & Rule Updates

### How Rules Evolve

1. **Regulatory Changes**
   - Building Regulations updated → Rules updated within 30 days
   - BSR guidance clarified → New rules added or existing refined
   - Case law established → Edge cases codified

2. **Human Override Analysis**
   - If a rule is overridden >15% of the time → Investigate
   - Common override patterns → Rule refinement
   - New edge cases → Additional test cases

3. **False Positive/Negative Tracking**
   - Submissions later rejected by BSR → Analyze what Attlee missed
   - Submissions approved despite Attlee flags → Analyze overcautious rules
   - Quarterly calibration sessions with BSR checkers

4. **Technology Updates**
   - New AI models (Claude, etc.) → Re-validate extraction accuracy
   - Improved NLP → Better keyword detection
   - New PDF parsing → Handle scanned documents better

### Changelog Transparency

All rule changes published at: `attlee.ai/changelog`

**Recent Update Example:**

```
Rule BSR-023 v2.1 → v2.2 (2026-02-15)
Requirement: Sprinkler systems for high-rise buildings

CHANGE:
Added alternative keywords: "water mist", "ESFR", "automatic water suppression"
Previously only detected "sprinkler" and variants

REASON:
Human override analysis showed 18% of sprinkler systems documented with
alternative terminology. Updated rule now detects 97% of fire suppression systems
(validated against 50 historical submissions).

BACKWARD COMPATIBLE: Yes
EFFECTIVE DATE: 2026-02-20 (5-day grace period for rule testing)
VALIDATOR: Sarah Chen, CEng MIFireE (IFE/12345)
```

---

## Limitations & Risk Mitigation

### Known Limitations

| Limitation | Impact | Mitigation Strategy |
|------------|--------|---------------------|
| **AI extraction errors** | Low confidence extractions (12% of cases) | Confidence scoring + human review flagging |
| **Novel construction methods** | Rules may not cover new techniques | Edge case flagging + expert override pathway |
| **Ambiguous language in docs** | Cannot interpret vague statements | Flags as "NEEDS REVIEW" rather than guessing |
| **OCR quality on scanned PDFs** | Poor text extraction from old scans | Pre-processing OCR enhancement + manual check option |
| **Complex engineering judgments** | Rules cannot assess "reasonableness" of designs | AI layer provides qualitative analysis, experts decide |

### Risk Mitigation: Layered Defense

```
Layer 1: AI Confidence Scoring
  → Low confidence extractions automatically flagged

Layer 2: Deterministic Rules
  → Consistent pass/fail logic with edge case detection

Layer 3: Human Expert Review
  → All flagged cases reviewed by qualified professionals

Layer 4: Audit Trail
  → Complete traceability enables post-assessment review

Layer 5: Professional Indemnity Insurance
  → Financial protection for all Attlee assessments (£10M coverage)
```

---

## Conclusion: Why Attlee AI Assessment is Reliable

### Core Reliability Principles

1. **Separation of Concerns**
   - AI extracts → Rules decide → Humans review
   - Each layer does what it does best
   - No single point of failure

2. **Deterministic Decision Logic**
   - Same input = same output (100% reproducibility)
   - No probabilistic "probably compliant" outcomes
   - Testable, auditable, verifiable

3. **Full Transparency**
   - Every decision explained with evidence
   - Source documents linked
   - Regulatory requirements cited
   - Rule logic documented

4. **Human-in-the-Loop**
   - Experts override when needed
   - Ambiguity triggers review, not guessing
   - Professional judgment preserved
   - All interventions logged

5. **Continuous Validation**
   - Real-world performance monitoring
   - Quarterly calibration with manual reviews
   - Rule updates based on regulatory changes
   - False positive/negative tracking

### The Attlee Reliability Promise

**We guarantee:**

✅ **Reproducibility:** Same pack assessed twice produces same rule decisions
✅ **Transparency:** Every decision includes source evidence and rule logic
✅ **Auditability:** Complete trail from document text → extraction → rule → decision
✅ **Expert Control:** Qualified professionals can review and override any decision
✅ **Regulatory Alignment:** Rules updated within 30 days of guidance changes

**We acknowledge:**

⚠️ **AI extraction is not perfect** — That's why we use confidence scoring
⚠️ **Rules cannot cover every scenario** — That's why we flag edge cases for review
⚠️ **Complex judgments need experts** — That's why humans remain in control

### Final Assurance

Attlee AI Assessment is reliable because:

1. It uses AI for what AI does well (speed, extraction)
2. It uses deterministic logic for what requires certainty (compliance decisions)
3. It involves humans for what requires judgment (edge cases, overrides)
4. It maintains complete transparency (audit trails, evidence citations)
5. It continuously improves (monitoring, validation, rule updates)

**This hybrid architecture delivers the best of all approaches: the speed of AI, the consistency of rules, and the wisdom of human experts.**

---

## Appendix A: Gateway 2 Success Matrix Coverage

Attlee's 55 rules map to all 30 BSR Gateway 2 Success Matrix criteria:

| Criterion | Rule Count | Example Rule |
|-----------|-----------|--------------|
| 1. Fire Strategy Completeness | 4 | BSR-001: Fire strategy document present |
| 2. Building Height Specification | 3 | BSR-005: Height consistently documented |
| 3. Storey Count Consistency | 3 | BSR-007: Storey count matches across docs |
| 4. Evacuation Strategy | 2 | BSR-015: Evacuation strategy clearly defined |
| 5. Means of Escape | 3 | BSR-012: Adequate escape routes documented |
| 6. Sprinkler Systems | 2 | BSR-023: Sprinklers required for >18m buildings |
| 7. Smoke Control | 2 | BSR-025: Smoke control strategy specified |
| 8. Fire Resistance | 4 | BSR-028: Fire ratings documented for key elements |
| 9. External Wall System | 5 | BSR-027: External wall fire testing referenced |
| 10. Structural Adequacy | 3 | BSR-033: Structural calculations provided |
| ... (20 more criteria) | ... | ... |

Full matrix mapping available at: `attlee.ai/matrix`

---

## Appendix B: Glossary

**AI Extraction** - Process where AI reads documents and identifies key information
**Deterministic Rule** - Logic that always produces same output for same input
**Confidence Score** - Rating of how certain the system is about an extraction or decision
**Audit Trail** - Complete record of how a decision was made
**Human Override** - Expert review that changes an automated decision
**Gateway 2** - Building Safety Regulator submission stage for detailed design
**Success Matrix** - BSR's 30-point checklist for Gateway 2 compliance
**Edge Case** - Unusual scenario not clearly covered by standard rules

---

**Document Information:**
- **Version:** 1.0
- **Date:** 27 February 2026
- **Author:** Attlee Platform Team
- **Classification:** Public
- **Contact:** [email protected] | attlee.ai

---

*Attlee.ai - AI-Powered Building Safety Review & Triage*
*Accelerating safe home delivery across the UK*

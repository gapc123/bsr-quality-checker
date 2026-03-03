# Attlee.ai
## AI-Powered BSR Compliance Assessment
### Expert Agency Services with AI-Acceleration

**Our mission: Help get more safe homes built in the UK, faster.**

---

## The Problem

The UK needs **1.5 million new homes**. The Building Safety Act 2022 created rigorous Gateway processes to ensure safety—but regulatory bottlenecks now delay even well-designed projects.

**Gateway 2 submissions face:**
- **Rejection rates of 40%+** due to documentation gaps
- **3-6 month delays** for resubmission cycles
- **£50k-200k costs** per rejected Gateway submission
- **Regulatory uncertainty** — what will pass BSR review?

Traditional consultants are expensive, slow, and can't guarantee pass rates. Generic AI tools lack regulatory expertise and produce unreliable outputs.

---

## The Solution

**Attlee.ai** is a purpose-built AI platform that assesses Gateway 2 submissions **before you submit**, catching documentation issues early and dramatically reducing rejection risk.

### How It Works

**1. Upload Your Gateway 2 Documents**
Fire strategy, drawings, specifications—no client/pack creation needed. Just upload and run.

**2. Two-Phase Assessment (2-5 minutes)**
- **Phase 1: 55 Deterministic Rules** — Proprietary if-then logic derived from Building Regulations, Approved Documents, and BSR guidance. Every rule pre-linked to specific regulatory citations. 100% consistent, zero hallucination.
- **Phase 2: AI Enrichment** — Claude (Anthropic) analyzes nuanced criteria requiring judgement, enriching findings with reasoning, proposed changes, and cross-document evidence.

**3. Criterion-by-Criterion Carousel Review**
Navigate each of 55+ compliance criteria one at a time:
- ✅ / ❌ Pass/Fail status
- 📄 Evidence extracted from your documents (with quotes)
- 📘 Regulatory reference (source, section, page)
- 🤖 AI reasoning explaining the finding
- ✏️ Proposed changes (where applicable)

**4. Agentic Human-in-the-Loop**
After review, Attlee intelligently separates findings into:
- **AI-Amendable Changes** (formatting, cross-references, structure) → Accept/Reject each change
- **Human Judgement Required** (substantive compliance issues) → Flagged for professional review

Accept mechanical improvements with one click. Reject what doesn't apply.

**5. Download Amended Documents**
Generate updated fire strategy with approved changes applied, plus an outstanding issues report for professional sign-off.

**6. Save to Client (Optional)**
Save the full assessment, documents, and audit trail to a client record for future reference and team collaboration.

---

## What Makes Us Stand Out

### 1. Purpose-Built, Not a Wrapper
Attlee is **not** "upload your documents to ChatGPT and ask for feedback." We've built:
- **55 proprietary deterministic rules** coded in 3,465 lines of expert logic
- **Pre-linked regulatory citations** to Building Regulations, Approved Documents B/C/E, BSR guidance
- **Custom data model** for UK building safety regulation
- **Sector-specific AI** trained on regulatory compliance, not generic chat

This is AI **customized for this use case**, not bolted-on GPT.

### 2. Full Transparency & Auditability
Every finding cites:
- **Specific regulation** (document, section, page)
- **Exact extract from your submission** (with page numbers)
- **Reasoning** explaining pass/fail decision
- **Proposed remediation** (where applicable)

**No black box.** Complete audit trail for BSR review.

### 3. Conservative Agentic AI
Attlee **triages intelligently**:
- **AI handles:** Formatting, cross-references, restructuring, clarifying language using existing facts
- **Human reviews:** New factual claims, missing information, substantive compliance judgements

You approve every AI change. We never introduce new facts without human oversight.

### 4. Two-Phase Architecture (Deterministic + AI)
**Phase 1 (Deterministic):** Rule-based checks with explicit pass/fail logic. Zero hallucination. Used for black-and-white compliance requirements.

**Phase 2 (AI Analysis):** LLM enrichment for nuanced criteria requiring judgement. Adds reasoning, cross-document analysis, and proposed changes.

**Result:** Best of both worlds—reliability of rules + intelligence of AI.

### 5. Proven Track Record
- **55+ compliance criteria** assessed per submission
- **2-5 minute assessment time** (vs weeks for consultants)
- **Unlimited re-assessments** to iterate before submission
- **Evidence-based findings** cited to specific document locations

---

## Service Packages

### 1. Gap Analysis
**Know what needs fixing before you submit.**

**What you get:**
- Full AI assessment (55+ criteria, two-phase analysis)
- Comprehensive compliance report with:
  - Pass/fail status for each criterion
  - Evidence extracts from your documents
  - Regulatory citations (document, section, page)
  - AI reasoning explaining each finding
- Outstanding issues report (prioritized by severity)
- AI-identified mechanical improvements list

**Deliverables:**
- Compliance assessment report (PDF)
- Outstanding issues report (PDF)
- Evidence map showing where each requirement is addressed

**Timeline:** 2-5 minutes for AI assessment, 1-2 business days for professional review

**Ideal for:** Pre-submission checks, understanding compliance gaps, tender preparation

---

### 2. Gap Analysis + Execute All Changes
**Get a submission-ready document package.**

**Everything in Gap Analysis, plus:**
- Expert human review & audit by qualified fire safety professionals
- AI executes all approved mechanical changes:
  - Formatting improvements (headings, TOC, structure)
  - Cross-reference insertion (link findings to documents/pages)
  - Citation standardization
  - Text clarification (using existing facts only)
- Document amendment generation:
  - Updated fire strategy (DOCX) with changes applied
  - Track-changes version showing all edits
  - Clean final version ready for submission
- Remediation guidance call (30-60 min) to walk through findings
- Professional sign-off letter for substantive compliance issues

**Deliverables:**
- Everything from Gap Analysis
- Amended fire strategy document (DOCX + PDF)
- Track-changes version (DOCX)
- Professional review letter
- Remediation action plan

**Timeline:** 2-3 business days from document upload to delivery

**Ideal for:** Developers ready to submit, teams without in-house fire safety expertise, tight deadlines

---

### 3. Retainer Partnership
**Ongoing compliance support for active development pipelines.**

**Monthly retainer includes:**
- Up to **2 full assessments per month** (Gap Analysis + Execute All Changes)
- Unlimited gap analysis previews (no professional review)
- Priority support (24-hour turnaround on assessments)
- Quarterly compliance review call
- Access to regulatory updates affecting your projects

**Additional assessments:** Available at **30% discount** off standard pricing

**Minimum term:** 3 months

**Ideal for:**
- Developers with multiple projects in flight
- Housing associations managing ongoing submissions
- Consultancies needing white-label compliance support
- Teams submitting 3+ Gateway packages per quarter

**Example usage:**
- Month 1: Full assessment for Project A, gap preview for Project B
- Month 2: Full assessment for Project B, full assessment for Project C (2 included)
- Month 3: Gap preview for Project D, additional full assessment for Project E (1 included + 1 at 30% off)

---

## Pricing

**Contact us** for a quote tailored to your project scope and volume.

All packages include:
- Full transparency & auditability
- Regulatory citations for every finding
- AI-first approach with human verification
- Professional indemnity insurance coverage

**Volume discounts** available for 5+ assessments.

---

## Technology Stack

- **Frontend:** React with criterion-by-criterion carousel UI (43KB component)
- **Backend:** Node.js + Express with two-phase assessment orchestration
- **AI:** Anthropic Claude (Sonnet 4.5) for nuanced analysis
- **Database:** PostgreSQL (Railway) for client/pack management
- **Rules Engine:** 3,465 lines of proprietary deterministic logic
- **Document Processing:** PDF parsing, text extraction, cross-document search

---

## Use Cases

### 1. Pre-Submission Assessment
Run Attlee **before** submitting to BSR. Catch gaps early. Reduce rejection risk.

### 2. Gap Analysis for Tenders
Assess existing documentation before bidding on a project. Understand compliance gaps upfront.

### 3. Iterative Improvement
Run unlimited assessments as you update documents. See improvement in real-time.

### 4. Client Handover
Fire safety consultancies use Attlee to provide clients with detailed, evidence-based compliance reports.

---

## Regulatory Disclaimer

Attlee supports professional compliance activities but does not replace qualified specialists. Findings should be reviewed by appropriately qualified persons (fire safety engineers, building control professionals) before BSR submission.

**AI assists. Humans verify.**

---

## Ready to Reduce Rejection Rates and Accelerate Approvals?

**Contact us** for a demonstration or pilot assessment.

📧 **george@attlee.ai**
🌐 **attlee.ai**

---

**Attlee.ai** — AI-First. Human-Verified. Always.

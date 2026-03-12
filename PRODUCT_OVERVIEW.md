# BSR Quality Checker - Product Overview

## 🤖 AI-Powered Building Safety Compliance Platform

**Tagline:** Automated compliance analysis in minutes, not days. AI-powered intelligence that replaces weeks of manual consultancy work.

---

## The Problem We Solve

### Traditional Consultancy Approach (Status Quo)
Building safety consultants currently spend **5-20 hours per project** manually:
- Reading through hundreds of pages of Gateway 2 submission documents
- Cross-referencing 55+ Building Safety Regulator (BSR) requirements
- Creating compliance matrices mapping requirements → evidence → page numbers
- Identifying gaps and missing information
- Writing client reports and action plans
- Billing £500-1,000+ per compliance matrix (taking days to produce)

**Pain Points:**
- ❌ Manual document review is slow and error-prone
- ❌ Human reviewers miss requirements or inconsistencies
- ❌ Compliance matrices take 4-8 hours to build manually
- ❌ Clients wait days for gap analysis feedback
- ❌ High cost per project limits market accessibility
- ❌ No standardization - quality varies by consultant

### Our AI-Powered Solution
**BSR Quality Checker automates the entire compliance review process using AI:**
- ✅ Upload documents → AI analysis complete in **2-5 minutes**
- ✅ Automated requirement checking across 55 BSR criteria
- ✅ AI-generated compliance matrices (worth £500-1,000) in **seconds**
- ✅ Instant gap analysis with page-level evidence linking
- ✅ Three submission-ready documents generated automatically
- ✅ Consistent, repeatable quality every time

---

## What Is BSR Quality Checker?

BSR Quality Checker is an **AI-powered SaaS platform** that automates Building Safety Regulator (BSR) Gateway 2 compliance assessments for UK high-rise residential buildings (18m+).

### Core Product: AI Compliance Analysis Engine

**Input:**
- Fire Strategy documents
- Structural calculations
- Architectural drawings
- Building specifications
- Design & Access Statements
- Any Gateway 2 submission documents

**AI Processing:**
1. **Document Intelligence:** AI extracts text, requirements, evidence, and context from uploaded PDFs
2. **Compliance Mapping:** AI checks each document against 55 proprietary BSR compliance rules
3. **Evidence Linking:** AI maps every requirement to specific document + page number with quotes
4. **Gap Analysis:** AI identifies missing information, non-compliant areas, and ambiguities
5. **Action Planning:** AI generates prioritized action items with owner assignments

**Output (Generated in 2-5 minutes):**
1. **Client Gap Analysis PDF** - What information the client needs to provide
2. **Consultant Action Plan PDF** - Internal working document with prioritized issues
3. **Compliance Matrix Excel** - Submission-ready traceability matrix with color-coded status

---

## Product Architecture & Technology

### Five-Stage Product Lifecycle (Inspired by Patent Prosecution Workflow)

**Stage 1: Discovery & Gap Analysis** ✅ **LIVE**
- Quick document upload and instant AI assessment
- Identifies missing requirements and compliance gaps
- Generates gap analysis reports for client follow-up
- **Current Phase:** Fully operational, production-ready

**Stage 2: Submission Drafting** 🔨 **PLANNED (6-9 months)**
- AI-assisted section generation for BSR submissions
- Template library for common building types
- Auto-fill capabilities based on extracted data
- **Goal:** Reduce drafting time from weeks to hours

**Stage 3: Evidence Linking (Compliance Matrix Generator)** ✅ **LIVE**
- Auto-generates professional Excel compliance matrices
- Maps requirements → evidence → document → page number
- Color-coded status (Met/Partial/Not Met)
- **Value:** £500-1,000 per matrix, generated in seconds

**Stage 4: Review Workflow** 🔮 **PLANNED (9-12 months)**
- Internal review routing for multi-specialist sign-offs
- Specialist assignment and collaboration tools
- Pre-submission quality checks
- **Goal:** Streamline multi-party review process

**Stage 5: Post-Submission Management** 🔮 **PLANNED (9-12 months)**
- RFI (Request for Information) response generator
- Submission status tracking and audit trail
- Regulator communication management
- **Goal:** Handle post-submission workflow efficiently

### Technical Stack

**Frontend:**
- React + TypeScript
- Vite build system
- Tailwind CSS for styling
- Client-side PDF preview
- Real-time progress tracking

**Backend:**
- Node.js + Express
- TypeScript for type safety
- Prisma ORM (PostgreSQL production, SQLite local dev)
- Puppeteer for PDF generation
- ExcelJS for compliance matrix export

**AI/ML Layer:**
- Anthropic Claude Sonnet 4.5 for document analysis
- Custom prompt engineering for compliance assessment
- 55 proprietary deterministic rules engine
- Hybrid approach: Rules + AI enrichment

**Infrastructure:**
- Hosted on Railway (automatic deployment from GitHub)
- PostgreSQL database
- File storage for document processing
- API-first architecture

---

## Key Features

### 1. Quick Assess (Main User Flow)
**Purpose:** Run instant compliance checks on any building project

**Workflow:**
1. Upload documents (PDFs: fire strategy, drawings, specs, etc.)
2. AI processes documents and runs 55 compliance checks (2-5 min)
3. View results in intuitive dashboard with color-coded status
4. Download 3 AI-generated documents:
   - Client Gap Analysis PDF
   - Consultant Action Plan PDF
   - Compliance Matrix Excel
5. Save assessment to client record for future reference

**Use Cases:**
- Initial project feasibility check
- Pre-submission review
- Client onboarding gap analysis
- Proposal generation for consultancy bids

### 2. Client Management System
**Purpose:** Organize projects by client for consultancy workflow

**Features:**
- Create clients with contact information
- Link multiple packs (projects) to each client
- Version history for iterative assessments
- Download reports for any saved assessment
- Track project status and progress

**Use Cases:**
- Agency/consultancy managing multiple clients
- Tracking repeat clients across projects
- Organizing by building developer or architect firm

### 3. AI-Generated Compliance Matrix (Stage 3)
**Purpose:** Auto-generate submission-ready traceability matrices

**What It Produces:**
- Professional Excel spreadsheet with:
  - **Summary section:** Project info, compliance statistics (Met/Partial/Not Met percentages)
  - **Data table:** ID | Requirement | Category | Status | Priority | Evidence Document | Page | Action | Owner | Notes
  - **Color coding:** Green (Met), Yellow (Partial), Red (Not Met)
  - **Formatting:** Frozen headers, auto-filters, borders, alternating rows
  - **Evidence linking:** Every requirement mapped to specific document + page number

**Value Proposition:**
- Traditional consultancies: £500-1,000 per matrix, 4-8 hours manual work
- BSR Quality Checker: £0 (included), generated in seconds by AI
- **ROI:** Instant, repeatable, consistent quality

### 4. 55-Point Compliance Rules Engine
**Categories Covered:**
- Fire Safety Strategy requirements
- Structural compliance
- MEP (Mechanical, Electrical, Plumbing) systems
- Architectural design standards
- Design & Access Statement completeness
- Submission formatting and documentation
- Environmental considerations
- Accessibility compliance

**Rules Examples:**
- "Fire strategy must specify evacuation strategy (stay put/simultaneous)"
- "Building height must be stated explicitly in meters"
- "Compartmentation details required for residential buildings 18m+"
- "Structural calculations must reference Eurocodes"
- "External wall system materials must be explicitly identified"

### 5. AI-Powered Document Analysis
**What the AI Does:**
- Extracts building type, height, location, storeys from context
- Identifies whether building is HRB (High-Rise Building) or London-regulated
- Reads fire strategies and maps to compliance requirements
- Cross-references evidence across multiple documents
- Identifies ambiguities and areas requiring clarification
- Generates human-readable reasoning for each assessment
- Suggests specific actions with owner assignments
- Estimates effort levels (S/M/L) for remediation

**AI Advantages Over Manual Review:**
- **Speed:** 100x faster than human reading
- **Consistency:** Same criteria applied every time
- **Coverage:** Never misses a requirement
- **Evidence linking:** Automatically finds page numbers and quotes
- **Reasoning:** Explains WHY something fails or passes

---

## User Personas

### Primary: Building Safety Consultants
**Profile:**
- Fire safety engineers, structural engineers, building control approvers
- Managing 5-50 Gateway 2 projects simultaneously
- Billing £80-150/hour for compliance reviews
- Spending 5-20 hours per project on manual document review

**Pain Points:**
- Drowning in document review work
- Missing requirements during manual checks
- Time-consuming matrix building
- Clients demanding faster turnaround

**How We Help:**
- Run assessment in 5 minutes vs 5 hours
- Never miss a requirement (AI + rules engine)
- Auto-generate matrices worth £500-1,000
- Instant client gap reports for faster follow-up

### Secondary: Architects & Developers
**Profile:**
- Architectural practices submitting Gateway 2 applications
- Building developers coordinating multi-specialist teams
- Need compliance checks before engaging consultants

**Pain Points:**
- Don't know if submission is complete before paying consultants
- Expensive consultancy fees for basic gap checks
- Waiting weeks for consultant availability

**How We Help:**
- Self-serve compliance checks before consultant engagement
- Identify gaps early to prepare complete submissions
- Reduce rework and resubmission costs

### Tertiary: Building Control Bodies
**Profile:**
- Approved Inspectors and Local Authority Building Control
- Reviewing Gateway 2 submissions for compliance
- Need standardized checklists and audit trails

**Pain Points:**
- Manual review is slow and inconsistent
- Hard to track compliance status across projects
- No audit trail for decisions

**How We Help:**
- Standardized compliance framework
- Documented evidence links for audit trail
- Fast initial review before detailed assessment

---

## Business Model & Pricing

### Current Status: Pre-Revenue / MVP

**Future Pricing Models (Under Consideration):**

**Option 1: Per-Assessment Pricing**
- £99 per Quick Assess (single-use)
- £49 for repeat assessments on same project
- No subscription, pay-as-you-go

**Option 2: Subscription Tiers**
- **Starter:** £199/month - 5 assessments/month
- **Professional:** £499/month - 20 assessments/month
- **Agency:** £999/month - Unlimited assessments + team features

**Option 3: Freemium + Premium Features**
- Free: Basic gap analysis (limited features)
- Pro: £299/month - Full compliance matrix, unlimited assessments
- Enterprise: Custom pricing - API access, white-label, integrations

**Revenue Comparison:**
- Traditional consultant: £500-1,000 per compliance matrix (one-time)
- BSR Quality Checker: £99-299/month (recurring) for unlimited matrices

---

## Competitive Differentiation

### vs. Traditional Consultancy Services

| Traditional Consultancy | BSR Quality Checker |
|------------------------|---------------------|
| ⏰ 5-20 hours per project | ⚡ 2-5 minutes |
| 💰 £500-1,000 per matrix | 🎯 £99-299/month unlimited |
| 📝 Manual document review | 🤖 AI-powered automation |
| 🎲 Quality varies by consultant | ✅ Consistent, repeatable |
| 📞 Requires human availability | 🌐 24/7 self-service |
| 📄 Email delivery (days) | 📥 Instant download |

### vs. Checklist/Template Tools

**Competitors:** Generic building compliance checklists, Excel templates

**Our Advantages:**
- ❌ They require manual input → ✅ We auto-extract from documents
- ❌ Static checklists → ✅ AI-powered intelligence
- ❌ No evidence linking → ✅ Automatic requirement → page mapping
- ❌ No reasoning → ✅ AI explains WHY and HOW to fix
- ❌ One-size-fits-all → ✅ Adapts to building type (HRB, London, etc.)

### vs. Generic Document AI Tools

**Competitors:** ChatGPT, general-purpose document analyzers

**Our Advantages:**
- ❌ No BSR domain expertise → ✅ 55 proprietary compliance rules
- ❌ Generic outputs → ✅ Submission-ready matrices and reports
- ❌ No structured workflow → ✅ End-to-end consultancy process
- ❌ Requires prompt engineering → ✅ One-click assessment
- ❌ No compliance framework → ✅ Built for UK Building Safety Act

---

## Market Opportunity

### Total Addressable Market (TAM)

**UK Gateway 2 Submissions (Annual):**
- ~5,000-10,000 high-rise buildings requiring Gateway 2 submissions
- Each building requires compliance review (£500-2,000 per review)
- Total market: £2.5M-20M annually for compliance analysis alone

**Serviceable Market:**
- Building safety consultancies: ~500 firms in UK
- Architectural practices: ~2,000 firms handling high-rise projects
- Building control bodies: ~100 organizations

**Early Adopter Segments:**
- Small consultancies (1-5 engineers) lacking capacity
- Mid-size firms (10-50 staff) seeking efficiency gains
- Architects doing pre-submission checks

### Growth Trajectory

**Phase 1 (Months 0-6): Stage 3 Launch - Compliance Matrix Focus**
- Target: 20-50 paying consultancy customers
- Revenue: £5,000-15,000 MRR
- Focus: Perfect compliance matrix product-market fit

**Phase 2 (Months 6-12): Stage 2 Launch - Submission Drafting**
- Target: 100-200 customers
- Revenue: £30,000-60,000 MRR
- Focus: Expand to full submission workflow

**Phase 3 (Months 12-24): Stages 4-5 - Review & Post-Submission**
- Target: 500-1,000 customers
- Revenue: £150,000-300,000 MRR
- Focus: Enterprise deals with large consultancies

---

## Product Roadmap

### ✅ Completed (Current State)

**Stage 1: Discovery & Gap Analysis**
- Quick Assess workflow (upload → analyze → download reports)
- 55-point compliance rules engine
- AI-powered document analysis with Claude Sonnet 4.5
- Client management system
- Version history and saved assessments

**Stage 3: Compliance Matrix Generator**
- AI-generated Excel compliance matrices
- Color-coded status (Met/Partial/Not Met)
- Evidence linking (requirement → document → page)
- Professional formatting (frozen headers, filters, borders)
- Summary statistics and compliance rate calculation

**Infrastructure:**
- Production deployment on Railway
- PostgreSQL database
- PDF generation pipeline
- Excel export with ExcelJS
- TypeScript full-stack application

### 🔨 In Progress

**UI/UX Improvements:**
- Simplified results view (single-screen clarity)
- AI branding throughout product (differentiate from consultancies)
- Download button reliability fixes

**Backend Optimizations:**
- Payload size handling (10MB limit for large assessments)
- Database schema for client/pack relationships
- Caching for faster repeat assessments

### 🔮 Planned (Next 6-12 Months)

**Stage 2: Submission Drafting (Q2-Q3 2026)**
- AI-assisted section generation for Gateway 2 submissions
- Template library for common building types
- Auto-fill based on extracted data
- Collaborative editing for multi-specialist teams

**Stage 4: Review Workflow (Q3-Q4 2026)**
- Specialist assignment and routing
- Internal review sign-offs
- Pre-submission quality checks
- Team collaboration features

**Stage 5: Post-Submission Management (Q4 2026)**
- RFI response generator
- Status tracking and notifications
- Regulator communication log
- Full audit trail

**Enterprise Features:**
- API access for integration with existing tools
- White-label for large consultancies
- Custom compliance frameworks
- SSO and team management

---

## Technical Deep Dive

### AI Compliance Assessment Workflow

**Step 1: Document Upload & Processing**
```
User uploads PDFs → Backend stores files → AI extracts text + metadata
```
- Accepts multiple PDFs (fire strategy, drawings, specs, etc.)
- Extracts building context (type, height, location, storeys)
- Determines if High-Rise Building (HRB) or London-regulated

**Step 2: Deterministic Rules Engine**
```
55 if-then rules → Check each requirement → Output: meets/partial/does_not_meet
```
- Example rules:
  - IF (building height >= 18m) THEN (fire strategy required)
  - IF (fire strategy present) THEN (evacuation strategy must be specified)
  - IF (London location) THEN (additional London Building Act requirements apply)

**Step 3: AI Enrichment (Claude Sonnet 4.5)**
```
For each requirement → AI reads documents → Extracts evidence + reasoning
```
- AI finds relevant sections in documents
- Links to specific page numbers
- Extracts supporting quotes
- Identifies gaps (what's missing)
- Generates human-readable reasoning
- Suggests remediation actions

**Step 4: Triage & Prioritization**
```
AI categorizes issues → Assigns urgency → Determines owner → Estimates effort
```
- Critical blockers (must fix before submission)
- High priority (significant compliance risk)
- Medium priority (should address)
- Low priority (nice to have)

**Step 5: Report Generation**
```
Assessment data → Generate PDFs (Puppeteer) + Excel (ExcelJS) → Download
```
- Client Gap Analysis: What client needs to provide
- Consultant Action Plan: Internal working document
- Compliance Matrix: Submission-ready traceability

### Data Model

**Core Entities:**
- **Client:** Name, company, contact info, notes
- **Pack:** Project/submission package linked to client
- **PackVersion:** Version history for iterative assessments
- **Document:** Uploaded PDFs with metadata
- **PackTask:** Checklist items for tracking progress
- **AssessmentResult:** Compliance status for each requirement

**Key Relationships:**
```
Client (1) → (many) Packs
Pack (1) → (many) PackVersions
PackVersion (1) → (many) Documents
PackVersion (1) → (many) AssessmentResults
Pack (1) → (many) PackTasks
```

### API Endpoints

**Assessment:**
- `POST /api/assess` - Run new assessment
- `POST /api/assess/save` - Save assessment to client

**Export:**
- `POST /api/packs/:packId/versions/:versionId/client-gap-analysis/download`
- `POST /api/packs/:packId/versions/:versionId/consultant-action-plan/download`
- `POST /api/packs/:packId/versions/:versionId/compliance-matrix/excel`
- `GET /api/packs/:packId/versions/:versionId/saved-assessment/compliance-matrix/excel`

**Clients:**
- `GET /api/clients` - List all clients
- `GET /api/clients/:id` - Get client with packs
- `POST /api/clients` - Create new client
- `DELETE /api/clients/:id` - Delete client

**Packs:**
- `GET /api/packs/:id` - Get pack details
- `POST /api/packs` - Create new pack
- `DELETE /api/packs/:id` - Delete pack

---

## Success Metrics & KPIs

### Product Metrics
- **Time to assessment:** Target <5 minutes (currently 2-5 min) ✅
- **Accuracy rate:** % of AI assessments matching human expert review (target 90%+)
- **Evidence linking success:** % of requirements with valid document + page references
- **Report generation success:** % of assessments producing all 3 documents without errors

### Business Metrics
- **Monthly Active Users (MAU):** Target 20-50 in first 6 months
- **Assessments per user per month:** Target 5-10 (indicates value/adoption)
- **Conversion rate:** Free → Paid (if freemium model)
- **Monthly Recurring Revenue (MRR):** Target £5K-15K in first 6 months
- **Churn rate:** Target <5% monthly
- **Net Promoter Score (NPS):** Target 50+ (consultants would recommend)

### Efficiency Metrics (vs. Traditional Consultancy)
- **Time savings:** 95%+ reduction (5 hours → 5 minutes)
- **Cost savings:** 80%+ reduction (£500-1,000 → £99-299/month unlimited)
- **Compliance matrix generation:** 100x faster (4-8 hours → 30 seconds)

---

## Risk Factors & Mitigations

### Technical Risks

**AI Accuracy & Hallucinations**
- **Risk:** AI misses requirements or generates incorrect assessments
- **Mitigation:** Hybrid approach (deterministic rules + AI enrichment), human review workflows in Stage 4, continuous validation against expert reviews

**Document Format Variability**
- **Risk:** PDFs vary widely (scanned images, tables, complex layouts)
- **Mitigation:** Robust text extraction, support for OCR, clear guidance on acceptable formats

**Scalability & Performance**
- **Risk:** AI processing slow for large document sets (100+ page PDFs)
- **Mitigation:** Async processing, progress tracking, caching, chunking strategies

### Market Risks

**Regulatory Changes**
- **Risk:** BSR requirements change, invalidating rules engine
- **Mitigation:** Modular rules engine design, rapid update capabilities, compliance versioning

**Consultant Resistance**
- **Risk:** Consultants view as threat to their business
- **Mitigation:** Position as productivity tool, not replacement; target junior engineers and small firms first; emphasize time savings for higher-value work

**Slow Adoption**
- **Risk:** Market not ready for AI-powered compliance tools
- **Mitigation:** Pilot programs with early adopters, case studies showing ROI, freemium to reduce barrier to entry

### Legal/Liability Risks

**Professional Indemnity**
- **Risk:** Who is liable if AI assessment is wrong and causes submission failure?
- **Mitigation:** Clear disclaimers ("All findings should be reviewed by qualified professionals"), position as decision-support tool, not final authority

**Data Privacy & Security**
- **Risk:** Handling sensitive building plans and client data
- **Mitigation:** SOC 2 compliance pathway, encryption at rest/in transit, GDPR compliance, clear data retention policies

---

## Why Now? Market Timing

**Regulatory Drivers:**
- UK Building Safety Act 2022 created Gateway 2 regime
- Thousands of high-rise buildings now require compliance assessments
- Consultancy bottleneck: Not enough qualified reviewers to meet demand

**Technology Enablers:**
- Claude Sonnet 4.5 (Jan 2025 release) offers unprecedented document understanding
- AI can now reliably extract requirements from complex technical documents
- PDF processing and AI integration mature enough for production use

**Market Conditions:**
- Building safety consultancies overwhelmed with demand post-Grenfell
- Clients demanding faster turnaround and lower costs
- Industry ready for automation (proven by early positive feedback)

---

## Conclusion: The Vision

**BSR Quality Checker is building the operating system for building safety compliance.**

We're not just automating compliance checks—we're creating an **end-to-end platform** that handles the entire Gateway 2 submission lifecycle:
- ✅ **Stage 1:** Discover gaps (live)
- 🔨 **Stage 2:** Draft submissions (planned)
- ✅ **Stage 3:** Generate compliance matrices (live)
- 🔮 **Stage 4:** Coordinate reviews (planned)
- 🔮 **Stage 5:** Manage post-submission (planned)

**Our competitive moat:**
1. **Domain expertise:** 55 proprietary BSR compliance rules
2. **AI engineering:** Custom prompts optimized for building safety
3. **Workflow design:** Consultancy-focused UX built for professionals
4. **Data network effects:** More assessments → better AI training → better product
5. **First-mover advantage:** No direct AI-powered competitors in BSR compliance

**The opportunity:**
- Replace £500-1,000 manual compliance matrices with AI-generated versions (seconds, not hours)
- Expand to full submission drafting and review workflow
- Become the de facto standard for UK building safety compliance
- International expansion (Australia, Canada, EU have similar regimes)

**The mission:**
Make building safety compliance faster, cheaper, and more reliable through AI automation—helping ensure no building slips through the cracks due to manual review errors or capacity constraints.

---

## Contact & Next Steps

**For Investors:**
- See our competitive analysis and go-to-market strategy
- Review financial projections and unit economics
- Schedule product demo and customer interviews

**For Early Customers:**
- Try Quick Assess with your next Gateway 2 project
- See compliance matrix generation in action
- Provide feedback to shape the product roadmap

**For Partners:**
- Integration opportunities with existing building safety tools
- White-label for large consultancies
- API access for custom workflows

---

*Last Updated: March 2026*
*Version: 2.0 (Post-Stage 3 Launch)*
*🤖 AI-Powered Building Safety Compliance*

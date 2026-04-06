# ATTLEE AI - OPERATING PLAN
**AI-Powered Gateway 2 Building Safety Compliance Platform**

**Date:** March 2026
**Founders:** George Clarke (Product & Technology), Hugo Hiley (Commercial)

---

## EXECUTIVE SUMMARY

Attlee AI is building an AI-powered compliance platform for UK Gateway 2 Building Safety submissions. The platform automates regulatory compliance checking, reducing manual review time from 5-20 hours to 2-5 minutes, and auto-generates compliance matrices worth £500-1,000 in seconds.

**Current Status:**
- Product: 70% production-ready with 55 compliance rules engine, two-phase AI assessment, and export system
- Market: £20M+ annual opportunity, 2,000+ Gateway 2 submissions per year
- Go-to-Market: Target fire safety consultancies, housing associations, and residential developers
- Funding: Seeking £100K-250K pre-seed from UK angels and accelerators

**90-Day Plan:**
- Month 1: Secure MVP, sign 4 pilot customers
- Month 2: Prove value, convert 2 pilots to paid (£3K-5K MRR)
- Month 3: Scale to 8-10 paying customers, close £100K-250K angel round

---

## TABLE OF CONTENTS

1. Technical Assessment
2. MVP Definition
3. Product Development Roadmap
4. Ideal Customers & Business Development Strategy
5. Investor Strategy
6. Founder Task Allocation
7. Operational Infrastructure Setup
8. 90 Day Execution Plan

---

## 1. TECHNICAL ASSESSMENT

### Current System Architecture

**Core Technology Stack:**
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS (14 pages, 38 components)
- **Backend:** Node.js 24 + Express + TypeScript (9 route groups fully implemented)
- **Database:** PostgreSQL with Prisma ORM (normalized schema with 12+ models)
- **AI Layer:** Anthropic Claude Sonnet 4.5 + OpenAI embeddings
- **Infrastructure:** Railway PaaS with Docker containerization

**System Components:**

```
User Upload → Document Processing → Compliance Engine → AI Enrichment → Report Generation
                                    (55 Rules)        (Claude)      (PDF + Excel)
```

### What Already Exists

#### ✅ Production-Ready Components

**1. Compliance Rules Engine (3,668 lines)**
- 55 deterministic rules for BSR Gateway 2 requirements
- Two-phase assessment: Rules + LLM enrichment
- Evidence extraction with page-level citations
- Assessment time: 2-5 minutes per typical pack

**2. Backend API (9 route groups, ~30 endpoints)**
- Document upload and processing pipeline
- Quick assessment workflow (`/api/assess`)
- Client/Pack management system
- Export generation (PDF, Excel)
- Butler reference library (RAG system)
- Team collaboration endpoints

**3. Database Schema (PostgreSQL)**
- Client → Pack → PackVersion → Documents hierarchy
- Assessment results storage with audit trail
- Task management with dependencies
- Service package templates
- Status lifecycle tracking

**4. Frontend Application**
- Landing page with marketing sections
- Quick Assess workflow (main entry point)
- Results dashboard with submission verdict (RED/AMBER/GREEN)
- Client management interface
- Pack detail views with version history
- Clerk authentication integration (protected routes)

**5. Export System**
- Submission Readiness Report (PDF via Puppeteer)
- Compliance Matrix (Excel via ExcelJS)
- Color-coded status indicators
- Evidence linking (document → page → quote)

#### ⚠️ Prototype/Incomplete Components

**1. Document Amendment Workflow**
- Components exist (DocumentRevisionDashboard, RevisionExporter)
- DOCX generation framework present but untested
- Proposed changes UI built but not integrated

**2. Team Collaboration Features**
- Database schema complete
- Task assignment/commenting endpoints exist
- Multi-user workflows not fully tested

**3. Service Package Templates**
- Template system coded
- Auto-task generation implemented
- UI integration partial

**4. Mobile Experience**
- Responsive components built
- Not tested on actual devices
- Mobile-specific interactions incomplete

### Technical Gaps

#### Critical Issues

**1. Security: API keys exposed in `.env` file** ⚠️ **MUST FIX WEEK 1**
- Anthropic key and OpenAI key visible in git history
- Must move to environment variables only
- Remove from repository history

**2. Database Persistence**
- Railway deployment requires PostgreSQL configuration
- SQLite works locally but doesn't persist in production
- Environment variable setup needed

**3. Testing Coverage**
- Framework exists (Vitest backend, Playwright frontend)
- Critical workflows not validated
- No load testing with real document volumes

#### Non-Critical Gaps

**4. Performance Optimization**
- Sequential LLM calls create bottleneck (55 rules evaluated serially)
- Potential for parallel batching (30s target vs current 2-5min)

**5. Error Handling**
- No rate limiting on API
- Limited input sanitization
- No quota management for AI calls

### Architectural Risks

**1. AI Cost Scaling**
- Current: 55+ Claude API calls per assessment
- At scale (100 assessments/day): £500-1,000/month in AI costs
- Mitigation: Caching, batching, rule optimization

**2. Document Processing Reliability**
- PDF parsing varies by document quality (scanned vs native PDFs)
- No OCR fallback currently
- Tables and diagrams not well-handled

**3. Monolithic Deployment**
- Single service handles everything (assessment, API, PDF generation)
- No horizontal scaling strategy
- Puppeteer (Chromium) adds 200MB+ to container size

**4. Vendor Lock-in**
- Heavy dependency on Anthropic Claude
- No multi-model strategy
- Mitigation: Abstract LLM layer behind interface

### Production Readiness Summary

**Overall Status: ~70% Production-Ready**

**Can Deploy Today For:**
- ✅ Single-user quick assessments
- ✅ Basic compliance checking workflows
- ✅ Report/matrix export
- ✅ Pack management with version history

**Needs Work For:**
- ⚠️ Multi-team environments
- ⚠️ High-volume processing (>20 assessments/day)
- ⚠️ Complex document amendment workflows
- ⚠️ Enterprise security requirements

---

## 2. MVP DEFINITION

### True Minimum Viable Product for Pilot Customers

**Goal:** Run real compliance assessments for 3-5 pilot housing associations or developers.

### Required Capabilities

**Core Assessment Flow:**

**1. Document Ingestion** ✅ *Ready*
- Upload 3-10 PDF documents per pack
- Accept fire strategies, drawings, specifications, structural calculations
- Handle 50-500 page documents
- Store securely with audit trail

**2. Document Indexing / RAG** ✅ *Ready*
- Text extraction from PDFs
- Chunk documents for semantic search
- Generate vector embeddings (OpenAI)
- Evidence retrieval from document corpus

**3. Compliance Rule Engine** ✅ *Ready*
- Execute 55 deterministic rules
- Check document presence, content verification, quality assessment
- Assign status: Met / Partial / Not Met
- Extract evidence with page numbers

**4. AI Evidence Extraction** ✅ *Ready*
- Claude Sonnet 4.5 enrichment for nuanced criteria
- Semantic understanding of fire strategies, evacuation plans
- Cross-document consistency checking
- Reasoning generation for findings

**5. Gap Analysis** ✅ *Ready*
- Identify missing requirements
- Highlight inconsistencies across documents
- Triage findings by urgency (Critical/High/Medium/Low)
- Estimate remediation effort and cost impact

**6. Compliance Matrix Generation** ✅ *Ready*
- Excel export with all 55 requirements
- Color-coded status (Green/Yellow/Red)
- Evidence linking (Requirement → Document → Page → Quote)
- Summary statistics (% Met, % Partial, % Not Met)

**7. Report Generation** ✅ *Ready*
- Submission Readiness Report PDF (3-5 pages)
- Includes: Verdict (RED/AMBER/GREEN), top blockers, action items
- Professional formatting via Puppeteer

**8. Audit Trail** ✅ *Ready*
- Assessment history per pack
- Version comparison (track changes across submissions)
- Status lifecycle tracking
- User activity log

### MVP Success Criteria

**Before Real Customers Can Run Assessments:**

**1. Security Hardening** (Week 1 - Critical)
- Move API keys to environment variables only
- Implement user authentication (Clerk already integrated)
- Add API rate limiting
- Set up HTTPS in production

**2. Database Persistence** (Week 1-2)
- Configure PostgreSQL in Railway
- Verify data retention across deployments
- Set up automated backups

**3. Testing Validation** (Week 2-3)
- Run 10 test assessments with real documents
- Validate all 55 rules produce correct outputs
- Verify PDF and Excel exports work reliably
- Test with edge cases (missing docs, scanned PDFs, large files)

**4. Performance Baseline** (Week 3-4)
- Confirm <5 minute assessment time for typical packs
- Monitor AI costs per assessment
- Track error rates and failure modes

**5. User Experience** (Week 4-5)
- Simplified onboarding (1-page explainer)
- Clear instructions for document upload
- Intuitive results presentation
- Download buttons work consistently

### What Can Be Deferred Post-MVP

- Document amendment/DOCX generation (manual follow-up works for pilots)
- Team collaboration features (single-user assessment sufficient)
- Service package templates (manual task tracking acceptable)
- Mobile optimization (desktop-first for consultants)
- Advanced analytics dashboard
- Multi-model AI switching
- API integrations with third-party tools

---

## 3. PRODUCT DEVELOPMENT ROADMAP

### Phase 1 — MVP Usable for Pilot Customers (Weeks 1-6)

**Objective:** Secure 3-5 pilot customers running real assessments within 6 weeks.

#### Features
- ✅ Quick Assess workflow (already built)
- ✅ Compliance matrix export (ready)
- ✅ Submission Readiness Report (ready)
- 🔨 Security hardening (move API keys, add rate limiting)
- 🔨 Database persistence (PostgreSQL setup in Railway)
- 🔨 Testing suite (validate 55 rules, export reliability)

#### Technical Work

**Week 1: Security Fixes** ⚠️ *Critical*
- Remove API keys from `.env` in git history
- Set up environment variables in Railway
- Add API rate limiting middleware
- Enable CORS restrictions

**Week 2: Database Migration**
- Set up PostgreSQL in Railway
- Run Prisma migrations
- Configure connection pooling
- Set up automated daily backups

**Week 3: Testing & Validation**
- Write unit tests for all 55 rules
- Integration tests for assessment workflow
- E2E test for upload → assess → download flow
- Load test with 10 concurrent assessments

**Week 4: Error Handling & Monitoring**
- Implement structured logging (Winston/Pino)
- Add error tracking (Sentry or Railway logs)
- Create health check endpoint
- Set up uptime monitoring

**Week 5: UX Polish**
- Add loading states and progress indicators
- Improve error messages (user-friendly)
- Create onboarding walkthrough
- Add tooltips for compliance terms

**Week 6: Documentation**
- Write user guide (how to prepare documents)
- Create video walkthrough (5 min)
- FAQ for common issues
- API documentation (if exposing to partners)

#### Infrastructure Improvements
- Railway deployment with PostgreSQL
- Automated CI/CD from GitHub
- Environment-specific configs (dev/staging/prod)
- SSL certificate for custom domain (attlee.ai)

#### AI Improvements
- Prompt optimization for better evidence extraction
- Confidence scoring calibration
- Hallucination detection (validate page numbers)

#### Deliverables
- Deployed MVP at https://attlee.ai
- 10 validated test assessments
- User documentation
- Security audit checklist

---

### Phase 2 — Early Production SaaS (Months 2-4)

**Objective:** Convert pilots to paying customers, add 10-15 more customers.

#### Features
- 🔨 Pricing/billing integration (Stripe)
- 🔨 Usage analytics dashboard
- 🔨 Email notifications (assessment complete, errors)
- 🔨 Document amendment proposals (complete DOCX export)
- 🔨 Team collaboration (share assessments, assign reviews)
- 🔨 White-label option for consultancies

#### Technical Work

**Month 2: Monetization**
- Stripe integration for subscriptions
- Usage metering (assessments per month)
- Invoice generation
- Payment method management

**Month 2-3: Analytics & Insights**
- User dashboard (assessments run, compliance trends)
- Admin panel (customer usage, system health)
- Assessment quality metrics (accuracy vs human review)

**Month 3: Collaboration Features**
- Share assessments with team members
- Commenting on findings
- Task assignment for remediation
- Email notifications

**Month 3-4: Document Amendments**
- Complete DOCX export with track changes
- Proposed text improvements
- Human review approval workflow
- Version comparison UI

#### Infrastructure Improvements
- Redis caching for faster repeat assessments
- Separate job queue for long-running tasks (BullMQ)
- Horizontal scaling (multiple backend instances)
- CDN for static assets

#### AI Improvements
- Fine-tune prompts based on pilot feedback
- Add caching layer for repeated document analysis
- Implement parallel rule evaluation (reduce to <1 min)

#### Deliverables
- 15-20 paying customers
- £5K-10K MRR
- Case studies from 3 pilot customers
- Testimonials and proof points

---

### Phase 3 — Scalable Infrastructure (Months 5-9)

**Objective:** Scale to 50-100 customers, improve reliability and performance.

#### Features
- 🔨 API access for partners
- 🔨 Regulatory document updates (versioned compliance rules)
- 🔨 Mobile app or PWA
- 🔨 Advanced reporting (compliance trends, benchmarking)
- 🔨 Gateway 3 support (completion certificates)
- 🔨 Integration marketplace (export to Procore, BIM 360, etc.)

#### Technical Work

**Month 5-6: Performance Optimization**
- Parallel rule evaluation
- Optimize LLM calls (batching, caching)
- Lazy loading for large documents
- Database query optimization

**Month 6-7: API Platform**
- Public API with authentication
- Webhooks for assessment completion
- SDK for Node.js and Python
- API documentation portal

**Month 7: Compliance Rule Versioning**
- Version control for 55 rules
- Support historical assessments
- Update notifications when regulations change
- Diff view between rule versions

**Month 8: Mobile/PWA**
- Progressive Web App for mobile access
- Offline mode for viewing saved assessments
- Push notifications

**Month 9: Advanced Features**
- Benchmarking (compare your pack vs industry average)
- Predictive analytics (likelihood of approval)
- Gateway 3 completion certificate checking
- Building Assessment Certificate prep

#### Infrastructure Improvements
- Microservices architecture (separate assessment engine)
- Kubernetes for orchestration (if scaling beyond Railway)
- Multi-region deployment (UK + EU)
- Advanced monitoring (Datadog/New Relic)

#### Deliverables
- 50-100 paying customers
- £30K-60K MRR
- API partnerships with 2-3 prop-tech platforms
- Gateway 3 product launched

---

## 4. IDEAL CUSTOMERS & BUSINESS DEVELOPMENT STRATEGY

### Target Customer Categories (Prioritized)

### Priority 1: Fire Safety Consultancies ⭐⭐⭐

**Why They Would Buy:**
- Spend 5-20 hours per project manually checking compliance
- Billing £500-1,000 per compliance matrix
- Drowning in Gateway 2 work (capacity bottleneck)
- Need to scale without hiring more engineers

**Problem Attlee Solves:**
- Automate 80% of manual document review
- Generate compliance matrices in seconds (worth £500-1,000)
- Never miss a requirement (AI + rules engine)
- Free up time for higher-value interpretation work

**Decision Maker:**
- Technical Director or Director of Consultancy
- Typically a chartered fire engineer with 15-25 years experience
- Controls budget for tools and software

**Typical Deal Size:**
- £299-499/month per user (subscription)
- Or £99-149 per assessment (pay-as-you-go)
- Enterprise: £2K-5K/month for unlimited use + white-label

**Pilot Project Approach:**
- Offer free assessment of their next 3 Gateway 2 projects
- Compare Attlee output vs their manual matrix
- Measure time saved and accuracy
- Convert to paid after pilot proves value

**Target Companies:**
1. **FDS Consult** - Granville Harris (Director), David Sibert (Technical Director)
2. **OFR Consultants** - Stewart Dabin (Residential Director), Dr Danny Hopkin, Jack Wilshaw, Andy Passingham (Founder)
3. **Trenton Fire** (Butler & Young/Socotec subsidiary)

---

### Priority 2: Housing Associations ⭐⭐⭐

**Why They Would Buy:**
- Building 50-200 high-rise units per year (multiple Gateway 2 submissions)
- Internal teams lack capacity for detailed compliance checking
- Consultancy fees are expensive (£3K-15K per project)
- Need confidence before submitting to BSR

**Problem Attlee Solves:**
- Pre-submission quality checks before engaging consultants
- Identify gaps early to avoid rejection (£50K-200K delay costs)
- Internal QA before handing to fire engineer
- Reduce consultant review time (and cost) by 40-60%

**Decision Maker:**
- Group Director of Development or Technical Director
- Reports to Chief Executive
- Budget for project delivery and compliance

**Typical Deal Size:**
- £499-999/month for team access (5-10 users)
- £1,500-3,000/year per building (project-based pricing)
- Enterprise: £10K-20K/year for portfolio-wide access

**Pilot Project Approach:**
- Offer to assess their next 2 submissions for free
- Show gap analysis before they pay consultants
- Measure: # of issues caught early, consultant time saved
- Position as "insurance policy" against rejection

**Target Companies (G15 Housing Associations):**
1. **L&Q** - Vicky Savage (Group Director of Development & Sales)
2. **Peabody** - Development Director
3. **Network Homes** - Development Director
4. **Notting Hill Genesis** - Development Director
5. **Clarion Housing** - Technical Director

---

### Priority 3: Residential Developers ⭐⭐

**Why They Would Buy:**
- Submit 5-20 Gateway 2 applications per year
- Project delays cost £50K-200K per month
- Need certainty before spending £6K-12K on BSR review
- In-house teams lack regulatory expertise

**Problem Attlee Solves:**
- Self-serve compliance checks before consultant engagement
- Catch fatal flaws early (before design lock-in)
- Demonstrate due diligence to investors/lenders
- Reduce resubmission risk

**Decision Maker:**
- Technical Director or Head of Building Safety
- Works with Commercial Director and Project Directors
- Controls pre-construction budget

**Typical Deal Size:**
- £149-299/month per user
- £499-999/year per project (large schemes)
- Volume discount for 10+ projects per year

**Pilot Project Approach:**
- Free assessment on 1 upcoming submission
- Present findings to technical team + consultants
- Measure: issues identified, consultant validation rate
- Position as "pre-flight checklist" before submission

**Target Companies:**
1. **Barratt London** - Craig Carson (Technical Director)
2. **Berkeley Group** - Technical Director
3. **Ballymore** - Technical Director
4. **Mount Anvil** - Technical Director
5. **Countryside Partnerships** - Building Safety Lead

---

### Priority 4: Building Control Advisors ⭐

**Why They Would Buy:**
- Review Gateway 2 submissions for compliance
- Manual review is slow and inconsistent
- Need standardized checklists
- Want audit trail for decisions

**Problem Attlee Solves:**
- Fast initial review before detailed assessment
- Standardized compliance framework
- Documented evidence links for audit
- Catch obvious issues early

**Decision Maker:**
- Managing Director or Technical Director
- Approved Inspector status
- Controls operational tooling budget

**Typical Deal Size:**
- £299-499/month per reviewer
- £149 per assessment reviewed
- Enterprise: £2K-5K/month for firm-wide access

**Pilot Project Approach:**
- Free trial on next 5 submissions they're reviewing
- Compare Attlee findings vs their manual review
- Measure time saved per review
- Position as "first-pass screening tool"

**Target Companies:**
1. **Exigere** - Managing Director (vocal on Gateway 2 delays)
2. **Butler & Young** - Director
3. **NHBC** - Building Control services
4. **Local Authority Building Control (LABC)** members

---

### Structured Outreach Strategy

#### Phase 1: Warm Introductions (Weeks 1-2)

**Objective:** Get 5-10 intro calls with target companies

**Tactics:**

**1. Leverage Existing Network**
- Hugo: Reach out to contacts in property/construction
- George: Post on LinkedIn announcing Attlee launch
- Ask for warm intros to fire safety consultants

**2. Industry Events**
- Attend: Building Safety Conference, Fire Safety Event, RIBA CPD sessions
- Sponsor: Fire Protection Association (FPA) member events
- Exhibit: PropTech UK meetups

**3. LinkedIn Outreach**
- Hugo: Connect with all 20 target contacts on list
- Personalized messages (not generic sales pitch)
- Mention specific pain points (e.g., "48-week Gateway 2 delays")

**Message Template:**

> Subject: Reducing Gateway 2 rejection risk with AI
>
> Hi [Name],
>
> I'm reaching out because [Company] handles [X] Gateway 2 submissions per year, and I've built something that might save your team significant time.
>
> We're seeing 40%+ rejection rates at Gateway 2 due to documentation gaps. Attlee AI runs 55 compliance checks in 2-5 minutes and auto-generates the compliance matrix you'd normally spend 4-8 hours building manually.
>
> Would you be open to a 15-minute demo on [Date]? I can show you how it works on one of your recent submissions (anonymized if needed).
>
> Best,
> George & Hugo
> Attlee AI

---

#### Phase 2: Pilot Customer Acquisition (Weeks 3-8)

**Objective:** Sign 3-5 pilot customers for free trials

**Tactics:**

**1. Free Pilot Offer**
- "Assess your next 3 Gateway 2 submissions for free"
- "No credit card required, no strings attached"
- "We'll compare our AI output vs your manual review"

**2. Demo Strategy**
- 15-minute live demo (upload → assess → results)
- Use their real documents (or anonymized examples)
- Show compliance matrix + gap analysis side-by-side
- Highlight time saved (5 min vs 5 hours)

**3. Objection Handling**
- "AI can't replace human judgement" → "We agree. Attlee handles routine checks so you focus on interpretation."
- "Our process is fine" → "Even 10% time savings = £10K-50K/year in capacity."
- "Too expensive" → "Our starter plan is £299/month. Your first compliance matrix pays for itself."

**4. Success Metrics**
- Track: # of issues found by Attlee that consultant missed
- Measure: Time saved (manually building matrix vs AI)
- Capture: Consultant feedback on accuracy

---

#### Phase 3: Case Studies & Testimonials (Weeks 9-12)

**Objective:** Convert pilots to paying customers, create proof points

**Tactics:**

**1. Case Study Template**
- Challenge: [Company] was spending 8 hours per compliance matrix
- Solution: Attlee AI automated 80% of manual checks
- Result: 5-minute assessment, £500 saved per project, 95% accuracy vs human review

**2. Video Testimonials**
- Record 2-minute interview with pilot customer
- Questions: "What problem were you trying to solve?" "How did Attlee help?" "Would you recommend?"
- Use on landing page and in sales conversations

**3. Industry Press**
- Submit to: Building Magazine, Construction News, Fire Safety Matters
- Angle: "AI startup automates building safety compliance, saving consultancies 80% of review time"
- Include customer quotes and pilot results

---

#### Phase 4: Scalable Acquisition (Month 4+)

**Objective:** Scale beyond personal outreach

**Tactics:**

**1. Content Marketing**
- Blog: "55 Things the BSR Checks in Your Gateway 2 Submission"
- Guide: "How to Prepare a Rejection-Proof Fire Strategy"
- Webinar: "AI for Building Safety Compliance: What Works, What Doesn't"

**2. SEO**
- Target keywords: "Gateway 2 compliance checker", "BSR submission checklist", "fire strategy review"
- Build backlinks from industry sites

**3. Paid Ads**
- LinkedIn ads targeting: Fire Safety Engineer, Building Control, Technical Director (UK construction)
- Google Search ads: "gateway 2 compliance", "bsr submission help"
- Budget: £1K-2K/month initially

**4. Partner Channel**
- Partner with architectural practices (referral fee for leads)
- Integrate with project management tools (Procore, BIM 360)
- White-label for large consultancies

---

## 5. INVESTOR STRATEGY (UK/LONDON FOCUS)

### Stage: Pre-Seed / Angel Funding

**Funding Target:** £100K-250K

**Use of Funds:**
- 50% Product development (George full-time for 6 months)
- 30% Customer acquisition (pilot programs, marketing)
- 20% Operations (hosting, AI API costs, legal)

**Ideal Investor Profile:**
- UK-based angels who can open doors to housing associations, developers, consultancies
- PropTech / Construction Tech specialists with UK industry connections
- Applied AI investors who understand LLM applications
- Regulatory Tech investors (compliance automation experience)

---

### Angel Investors (UK/London)

#### 1. Saul Klein - LocalGlobe (London)
**Why Interested:**
- Co-founded LocalGlobe (seed-stage fund, London-based)
- Strong thesis on applied AI and vertical SaaS
- Invested in UK proptech (GoCardless, Citymapper)
- Understands UK housing crisis and regulatory landscape

**Connection Strategy:**
- Warm intro via LocalGlobe portfolio founders
- Pitch angle: "AI for UK housing infrastructure bottlenecks, post-Grenfell regulatory transformation"
- Highlight: £20M+ UK market, first-mover in BSR compliance

---

#### 2. Alice Bentinck - Entrepreneur First (London)
**Why Interested:**
- Co-founder of Entrepreneur First (London HQ)
- Focus on technical founders solving hard problems
- Strong UK government/policy connections (relevant for BSR)
- Invests personally in EF alumni companies

**Connection Strategy:**
- Apply to EF alumni network or angel syndicate
- Pitch angle: "Two technical founders, solving post-Grenfell regulatory bottleneck with 55 proprietary rules + AI"
- Emphasize technical depth and market timing

---

#### 3. Matt Robinson - GoCardless Co-Founder (London)
**Why Interested:**
- Built GoCardless (payments infrastructure for recurring billing)
- Understands B2B SaaS unit economics
- Active angel investor in UK startups
- Appreciates vertical SaaS with clear ROI

**Connection Strategy:**
- LinkedIn outreach or warm intro via GoCardless network
- Pitch angle: "Stripe for building safety compliance - recurring revenue, negative churn potential"
- Highlight: Clear customer pain, £299-499/month pricing

---

#### 4. Brent Hoberman - Founders Factory (London)
**Why Interested:**
- Co-founded Lastminute.com, Founders Factory
- Active in proptech and infrastructure investments
- Well-connected in UK business/government circles
- Focuses on UK market opportunities

**Connection Strategy:**
- Apply to Founders Factory studio program
- Direct approach via LinkedIn (high-profile but accessible)
- Pitch angle: "UK housing crisis + Building Safety Act = massive compliance market opening up"

---

#### 5. Dharmash Mistry - Former LendInvest VP, Angel (London)
**Why Interested:**
- Former VP Product at LendInvest (UK proptech unicorn)
- Deep understanding of UK property/construction market
- Invests in B2B SaaS with strong unit economics
- Venture Partner at Notion Capital (UK/EU focus)

**Connection Strategy:**
- LinkedIn introduction via LendInvest network
- Pitch angle: "SaaS for building safety consultancies, £299-499/mo subscriptions, 90%+ gross margins"
- Emphasize unit economics and scalability

---

#### 6. Taavet Hinrikus - Wise Co-Founder (London)
**Why Interested:**
- Co-founded TransferWise/Wise (London-based fintech unicorn)
- Active angel investor in European startups
- Understands regulated industries and compliance automation
- Portfolio includes infrastructure and B2B companies

**Connection Strategy:**
- Warm intro via Wise/fintech network
- Pitch angle: "Infrastructure for UK construction compliance - similar regulatory pain to early fintech"
- Highlight: Large addressable market, high switching costs once adopted

---

#### 7. Robin Klein - LocalGlobe & Index Ventures (London)
**Why Interested:**
- Partner at LocalGlobe (brother of Saul Klein)
- Previously at Index Ventures (early Skype, Betfair investor)
- Focus on European tech with global potential
- Strong track record in marketplace and SaaS

**Connection Strategy:**
- Warm intro via LocalGlobe portfolio
- Pitch angle: "Vertical SaaS for £20M+ UK compliance market, potential to expand to EU/Australia"
- Emphasize first-mover advantage in post-2022 regulatory regime

---

#### 8. Tom Hulme - Google Ventures Europe (London)
**Why Interested:**
- Managing Partner at GV Europe (London office)
- Former IDEO designer, understands product design
- Invested in UK proptech (Nested, Unmortgage)
- Can provide Silicon Valley connections while UK-based

**Connection Strategy:**
- Apply via GV website or warm intro
- Pitch angle: "AI-first compliance platform, strong product/market fit in UK construction"
- Highlight: Technical founders, working product, pilot traction

---

#### 9. James Wise - Balderton Capital (London)
**Why Interested:**
- Partner at Balderton Capital (leading European VC, London-based)
- Focus on seed and Series A B2B companies
- Invested in construction tech and proptech
- Strong European network

**Connection Strategy:**
- Warm intro via Balderton portfolio
- Pitch angle: "Vertical SaaS for UK building safety, expanding to EU markets (similar regulations)"
- Emphasize scalability and European expansion potential

---

#### 10. Carlos Espinal - Seedcamp (London)
**Why Interested:**
- Managing Partner at Seedcamp (Europe's leading pre-seed fund)
- Focus on technical founders solving real problems
- Portfolio includes proptech and AI companies
- Very hands-on with portfolio support

**Connection Strategy:**
- Apply to Seedcamp via website (they review all applications)
- Pitch angle: "AI infrastructure for UK construction compliance, £20M TAM growing post-Building Safety Act"
- Emphasize: Strong technical capability, clear customer pain

---

### Incubators / Accelerators / Venture Studios (UK/London)

#### 1. Entrepreneur First (EF) - London ⭐⭐⭐
**Why Strong Fit:**
- London HQ, UK-focused with global reach
- Invests pre-company or very early stage
- Strong government/policy network (relevant for BSR)
- £80K investment + equity for 6-month program
- Alumni network of 1,000+ technical founders

**Application Strategy:**
- Apply as early-stage company (already incorporated)
- Emphasize: Technical depth (55 rules, AI engineering), working prototype
- Highlight market timing (Building Safety Act 2022)

**Timeline:** Rolling applications, cohorts start quarterly

---

#### 2. Seedcamp - London ⭐⭐⭐
**Why Strong Fit:**
- Europe's leading pre-seed fund (London-based)
- €100K investment for ~8% equity
- 3-month intensive program
- Strong portfolio support and follow-on funding
- Portfolio includes proptech and vertical SaaS

**Application Strategy:**
- Online application (they review everything)
- Emphasize: Clear customer pain, technical founders, pilot traction
- Show: Working product, 3-5 pilot customers, early revenue/LOIs

**Timeline:** Rolling applications, investment decisions in 4-6 weeks

---

#### 3. Antler - London ⭐⭐⭐
**Why Strong Fit:**
- Global early-stage VC with London office
- Invests pre-revenue (£100K for ~10% equity)
- 10-week residency program
- Strong in proptech and infrastructure

**Application Strategy:**
- Apply as early-stage company
- Highlight: Working product, addressable market (£20M+), technical team
- Emphasize: UK housing crisis + regulatory tailwind

**Timeline:** Cohorts start quarterly (Jan, Apr, Jul, Oct)

---

#### 4. L Marks - London ⭐⭐
**Why Strong Fit:**
- London-based proptech accelerator
- Corporate partnerships: Grosvenor, Landsec, British Land
- Can directly connect to housing associations and developers
- 3-month program with £20K investment + £50K optional

**Application Strategy:**
- Position as "infrastructure for building safety"
- Emphasize customer traction with housing associations
- Leverage corporate partnerships for pilot customers

**Timeline:** 2 cohorts per year (applications in Feb/Aug)

---

#### 5. Pi Labs - London ⭐⭐⭐
**Why Strong Fit:**
- Europe's first dedicated proptech VC (London HQ)
- Seed-stage fund (£250K-1M investments)
- Portfolio includes UK construction tech companies
- Strong network in UK property industry

**Application Strategy:**
- Direct application via website
- Warm intro via portfolio founders (check their portfolio)
- Emphasize: £20M+ UK market, recurring revenue model, pilot traction

**Timeline:** Rolling applications, quarterly investment committee

---

#### 6. Founders Factory - London ⭐⭐
**Why Strong Fit:**
- London-based venture studio + accelerator
- Corporate partnerships with easyJet, The Guardian, L'Oréal
- 6-month program with £40K investment
- Hands-on support building product

**Application Strategy:**
- Apply via website or direct outreach to Brent Hoberman
- Pitch angle: "UK housing crisis + regulatory transformation"
- Highlight: Technical founders, working MVP, clear GTM

**Timeline:** Rolling applications, cohorts start quarterly

---

#### 7. Techstars London ⭐⭐
**Why Strong Fit:**
- Global accelerator with London program
- $120K investment for 6% equity
- 3-month intensive program
- Strong mentor network in UK construction/proptech

**Application Strategy:**
- Apply to Techstars London (not US programs)
- Emphasize: B2B SaaS, clear customer pain, pilot traction
- Highlight: UK-specific regulatory opportunity

**Timeline:** 1 cohort per year, applications open Mar-May

---

#### 8. Accelerator London ⭐
**Why Strong Fit:**
- West London-based accelerator
- Focus on deep tech and AI companies
- 12-week program, £25K investment
- Strong connections to UK corporates

**Application Strategy:**
- Position as AI/deep tech company (55 proprietary rules + LLM)
- Emphasize technical innovation
- Highlight UK market opportunity

**Timeline:** 2 cohorts per year

---

#### 9. Bethnal Green Ventures (BGV) - London ⭐
**Why Strong Fit:**
- London-based, focus on tech for social good
- Building safety = social impact (post-Grenfell)
- £20K investment + 3-month program
- Strong network in housing/community sectors

**Application Strategy:**
- Angle: "Preventing another Grenfell through AI-powered compliance"
- Emphasize social impact (safe housing, regulatory enforcement)
- Connect to mission of ensuring building safety

**Timeline:** 2 cohorts per year

---

#### 10. UCL Technology Fund - London ⭐
**Why Strong Fit:**
- University College London's investment fund
- Focus on deep tech and AI spin-outs
- Seed investments £100K-500K
- Strong in construction tech and built environment

**Application Strategy:**
- Position as AI infrastructure company
- Leverage any UCL connections (Bartlett School of Architecture)
- Emphasize technical innovation (hybrid rules + LLM)

**Timeline:** Rolling applications

---

### UK Government Grants & Support

#### 1. Innovate UK Smart Grants
- **Amount:** £25K-500K (no equity taken)
- **Focus:** AI, construction innovation, productivity
- **Fit:** "AI for building safety compliance" aligns with government priorities
- **Timeline:** Quarterly funding rounds

**Application Strategy:**
- Position as R&D project (improving AI accuracy, expanding to Gateway 3)
- Emphasize: Job creation, UK construction productivity, building safety
- Partner with university (UCL Bartlett) for research credibility

---

#### 2. Construction Innovation Hub
- **Amount:** Varies (grants + partnerships)
- **Focus:** Digital transformation in UK construction
- **Fit:** AI-powered compliance directly addresses productivity
- **Network:** Connects to major contractors and developers

**Application Strategy:**
- Apply for innovation challenges
- Position as digital infrastructure for building safety
- Leverage for customer intros (Housing Associations, developers)

---

### Investor Outreach Timeline

**Weeks 1-4: Preparation**
- Finalize pitch deck (10 slides)
- Record demo video (3 minutes)
- Prepare financial model
- Get 3 customer LOIs or pilot commitments

**Weeks 5-8: Accelerator Applications**
- Submit to Seedcamp (rolling)
- Apply to Antler London (check cohort timing)
- Apply to Pi Labs (direct submission)
- Apply to L Marks (if timing aligns with intake)
- Apply to Entrepreneur First

**Weeks 9-12: Angel Outreach**
- LinkedIn outreach to 10 UK angels (from list above)
- Request 15-minute intro calls
- Warm intros via Hugo's network
- Target: 5-10 angel meetings

**Weeks 13-16: Close Round**
- Share terms with interested parties (SAFE or priced round)
- Aim for £100K-250K total
- Target: 2-3 angels + 1 accelerator
- Close within 2-4 weeks of term sheet

---

### UK Angel Syndicates to Consider

**1. Fuel Ventures (London)**
- Pre-seed fund + angel syndicate
- £100K-300K investments
- Very hands-on, focus on B2B SaaS

**2. SFC Capital (London)**
- SEIS/EIS fund (tax-advantaged for UK investors)
- £100K-1M seed investments
- Portfolio includes proptech

**3. Cornerstone VC (London)**
- Pre-seed/seed fund
- Focus on AI and vertical SaaS
- UK and European startups

**4. Ada Ventures (London)**
- Early-stage fund led by women VCs
- Focus on underrepresented founders
- Strong in B2B SaaS and impact

**5. Episode 1 (London)**
- Seed-stage VC (previously Connect Ventures)
- Portfolio includes proptech and SaaS
- £500K-2M investments (might be too early, but good to know)

---

## 6. FOUNDER TASK ALLOCATION

### George Clarke - Product & Technology (80-100% time)

**Primary Responsibilities:**

#### 1. Product Development (60%)
- Build and ship MVP improvements (security, testing, UX)
- Implement Phase 1 roadmap features
- Fix bugs and performance issues
- Iterate based on customer feedback

#### 2. AI & Compliance Engine (20%)
- Optimize LLM prompts for accuracy
- Refine 55 compliance rules based on pilot learnings
- Improve evidence extraction and citation quality
- Monitor AI costs and optimize usage

#### 3. Customer Pilot Support (15%)
- Onboard pilot customers (setup accounts, training)
- Troubleshoot technical issues during assessments
- Gather feedback on UX and accuracy
- Run demo calls with prospective customers

#### 4. Technical Documentation (5%)
- Write API docs (if exposing to partners)
- Maintain internal architecture docs
- Create troubleshooting guides

**Weekly Schedule:**
- Mon-Thu: Focus on product development (no meetings)
- Fri AM: Pilot customer support / demos
- Fri PM: Weekly sync with Hugo, investor prep

---

### Hugo Hiley - Commercial & Partnerships (15-20% time)

**Given Hugo's limited availability (demanding full-time role at Fospha), focus ONLY on high-leverage commercial activities.**

**Primary Responsibilities:**

#### 1. Business Development (50% of available time)
- Identify and reach out to target customers (20 contacts on list)
- Schedule and run intro calls/demos
- Negotiate pilot terms and LOIs
- Follow up with leads until signed

#### 2. Investor Outreach (30% of available time)
- Prepare pitch deck and financial model
- Apply to accelerators (Seedcamp, Antler, EF, Pi Labs)
- Reach out to angel investors for intros
- Run investor pitch calls

#### 3. Industry Validation (15% of available time)
- Attend key industry events (1-2 per month)
- Build relationships with fire safety consultants
- Gather market intelligence on competitors
- Validate pricing and positioning

#### 4. Strategic Planning (5% of available time)
- Weekly sync with George on priorities
- Review customer feedback and roadmap
- Adjust GTM strategy based on learnings

**Weekly Schedule:**
- 2-3 hours: Outreach to customers/investors (LinkedIn, email)
- 1-2 hours: Calls with prospects or investors
- 1 hour: Weekly sync with George
- TOTAL: ~5-6 hours/week until Fospha role ends

**Hugo Should NOT Spend Time On:**
- Product development or technical decisions (defer to George)
- Day-to-day customer support (George handles)
- Marketing content creation (outsource or defer)
- Accounting/admin (use tools like Xero, Stripe)

---

### Division of Labor - Who Owns What

| **Area** | **Owner** | **Notes** |
|----------|-----------|-----------|
| Product roadmap | George | Hugo provides input on customer needs |
| Technical architecture | George | Full ownership |
| Pilot customer acquisition | Hugo (lead), George (support) | Hugo finds customers, George demos |
| Investor fundraising | Hugo (lead), George (support) | Hugo runs process, George presents technical vision |
| Customer onboarding | George | Hugo introduces, George trains |
| Industry events | Hugo | George attends if high-value (e.g., BSR events) |
| Compliance rule accuracy | George | Hugo validates with industry contacts |
| Pricing strategy | Both | Iterate based on customer feedback |
| Partnership deals | Hugo | George provides technical feasibility input |
| Operational setup | George | Except email (Hugo handles) |

---

## 7. OPERATIONAL INFRASTRUCTURE SETUP

### Hugo Handles: Email & Domain Only (Week 1 - 90 minutes)

**Domain & Email Setup:**
- ✅ Register/configure attlee.ai domain
- ✅ Set up DNS (Cloudflare or Google Domains)
- ✅ Create Google Workspace account (£10/month for 2 users)
  - george@attlee.ai
  - hugo@attlee.ai
  - hello@attlee.ai (forwarding to both)
- ✅ Enable 2FA for security
- ✅ Set up email signatures for both founders

**Email Signature Template:**
```
Hugo Hiley
Co-Founder, Commercial
Attlee AI
hugo@attlee.ai | attlee.ai
AI-powered compliance for UK building safety
```

---

### George Handles: Everything Else

#### Week 1 Tasks (4-5 hours total)

**1. Business Bank Account (30 minutes)**
- **Recommended:** Tide (free, instant setup, no physical branch needed)
- **Alternative:** Monzo Business (free), Starling Bank Business
- Set up both founders as signatories
- Link to Stripe for payments

**2. Payment Processing - Stripe (45 minutes)**
- Create Stripe account (stripe.com)
- Add business details, bank account
- Enable subscriptions and invoicing
- Set up tax collection (UK VAT if applicable)
- Create 3 pricing tiers:
  - Starter: £299/month
  - Professional: £499/month
  - Enterprise: Custom pricing

**3. Accounting Software (30 minutes)**
- **Recommended:** Xero (£12/month) or FreeAgent (£19/month)
- Link to business bank account
- Set up categories: Software/SaaS, AI API costs, Hosting, Marketing

**4. Internal Communication - Slack (30 minutes)**
- Create Slack workspace (free for 2 people)
- Channels: #general, #product, #customers, #investors
- Integrate with GitHub (commits), Railway (deployments), Stripe (payments)

**5. CRM - Notion Database (60 minutes)**
- Create "Customer Pipeline" database
- Fields: Company, Contact Name, Email, Status (Lead/Demo/Pilot/Paid), Last Contact, Next Action
- Create "Investor Tracker" database
- Fields: Investor Name, Type (Angel/VC), Stage (Intro/Meeting/Term Sheet), Last Contact
- Populate with 20 target contacts from existing list

**6. Legal Basics - Terms & Contracts (45 minutes)**
- Use Termly or TermsFeed (free generator) for:
  - Privacy Policy
  - Terms of Service
  - Cookie Policy
- Create pilot agreement template (1 page):
  - Duration: 30-60 days, free trial
  - Customer provides feedback
  - Either party can terminate
- Create simple subscription agreement (use Stripe defaults)

---

#### Week 2 Tasks (3-4 hours total)

**7. LinkedIn Company Page (45 minutes)**
- Create Attlee AI company page
- Add logo, cover image, description
- Post 1: "Launching Attlee AI - AI-powered Gateway 2 compliance"
- Invite Hugo to follow and share

**8. Demo Booking - Calendly (30 minutes)**
- Create free Calendly account
- Set up "15-min Intro Call" event type
- Set up "30-min Demo" event type
- Link to Google Calendar
- Add to website CTA and email signature

**9. Email Templates (30 minutes)**
- Create Gmail canned responses:
  - Template 1: Initial outreach to prospects
  - Template 2: Follow-up after demo
  - Template 3: Pilot agreement send
  - Template 4: Investor intro request

**10. Investor Data Room - Google Drive (60 minutes)**
- Create folder: "Attlee AI Investor Materials"
- Subfolders:
  - Pitch Deck
  - Financial Model
  - Product Demo Video
  - Customer Testimonials
  - Company Docs (formation, cap table)
  - Legal (contracts, DPAs)

**11. Review Platforms (30 minutes)**
- Create profiles on:
  - G2 (B2B software reviews)
  - Capterra (software directory)
  - Product Hunt (plan launch for later)

**12. Press Kit (30 minutes)**
- Company description (2 sentences)
- Founder bios (50 words each)
- High-res logo (PNG + SVG)
- Product screenshots (3-5 images)
- Contact: hello@attlee.ai

---

### Summary Checklist for George

**Week 1 (Must-Have):**
- [ ] Business bank account (Tide or Monzo Business)
- [ ] Stripe account (payment processing)
- [ ] Xero accounting setup
- [ ] Slack workspace (internal comms)
- [ ] Notion CRM (customer + investor tracking)
- [ ] Basic contracts (pilot agreement, Terms of Service)

**Week 2 (Nice-to-Have):**
- [ ] LinkedIn company page + first post
- [ ] Calendly for demo booking
- [ ] Email templates (outreach, follow-up)
- [ ] Investor data room (Google Drive)
- [ ] Review platform profiles
- [ ] Press kit

---

### Cost Breakdown (Monthly)

**Essential (Month 1):**
- Google Workspace: £10/month (2 users) *Hugo sets up*
- Stripe: Free (2.9% + 20p per transaction)
- Tide Bank: Free
- Xero Accounting: £12/month
- Railway Hosting: ~£20-50/month (depends on usage)
- Anthropic API: ~£100-300/month (depends on assessment volume)
- **Total: ~£150-400/month**

**Optional (Month 2+):**
- Notion: Free (startup program)
- Calendly: Free (1 calendar)
- Slack: Free (2 people)
- Pipedrive CRM: £14/month (if needed)
- **Total: +£0-20/month**

**Marketing (Month 3+):**
- LinkedIn Ads: £500-1,000/month
- Google Ads: £500-1,000/month
- **Total: +£1,000-2,000/month (only if funded)**

---

### Who Owns What (Operational Tasks)

| **Task** | **Owner** | **Frequency** |
|----------|-----------|---------------|
| Email responses (hello@) | Both (shared inbox) | Daily |
| Customer pipeline updates | George | After each call |
| Investor tracker updates | Hugo | After each meeting |
| Invoicing customers | George | Monthly (automated via Stripe) |
| Expense tracking | George | Weekly (Xero) |
| Social media posts | Hugo | 1-2x per week |
| Demo bookings | Both (via Calendly) | Automated |
| Contract sending | George | As needed |
| Legal/compliance | George (lead), Hugo (input) | Quarterly review |
| Accounting/VAT | George or outsource | Quarterly |

---

## 8. 90 DAY EXECUTION PLAN

### Month 1 (Weeks 1-4): Secure MVP & Launch Pilots

#### Product Milestones (George)

**Week 1:**
- ✅ Security audit: Remove API keys from git, set environment variables
- ✅ Railway PostgreSQL setup and migration
- ✅ Add API rate limiting middleware
- ✅ Create onboarding documentation (1-page guide)
- ✅ Set up operational infrastructure (bank, Stripe, Xero, Slack, Notion)

**Week 2:**
- ✅ Write unit tests for all 55 compliance rules
- ✅ Integration test for full assessment workflow
- ✅ Fix any critical bugs found in testing
- ✅ Deploy to production with PostgreSQL
- ✅ Set up Calendly, LinkedIn, investor data room

**Week 3:**
- ✅ Run 10 test assessments with real documents
- ✅ Validate accuracy against manual review
- ✅ Optimize LLM prompts based on test results
- ✅ Polish results dashboard (clearer visualizations)

**Week 4:**
- ✅ Add error tracking and monitoring (Sentry/Railway logs)
- ✅ Create 5-minute demo video
- ✅ Set up uptime monitoring
- ✅ Prepare pilot customer accounts

---

#### Customer Milestones (Hugo)

**Week 1:**
- Finalize target customer list (20 contacts)
- LinkedIn outreach to 10 fire safety consultants
- Request warm intros from existing network
- Book 3-5 intro calls

**Week 2:**
- Run 5 intro calls with prospects
- Pitch: "Free pilot on your next 3 submissions"
- Send follow-up materials (deck, demo video)
- Target: 2 signed pilot agreements

**Week 3:**
- Continue outreach (10 more contacts)
- Follow up with Week 2 prospects
- Run demos for interested parties
- Target: 2 more pilot agreements (total 4)

**Week 4:**
- Onboard 4 pilot customers (with George)
- Set up accounts and provide training
- Schedule first assessment runs
- Gather initial feedback

---

#### Investor Milestones (Hugo)

**Week 1:**
- Finalize pitch deck (10 slides)
- Prepare financial model (unit economics)
- List target investors (angels + accelerators)

**Week 2:**
- Apply to Seedcamp (rolling applications)
- Apply to Antler and EF
- Research warm intro paths to angels

**Week 3:**
- Reach out to 3 angels via LinkedIn
- Request intro calls (15 minutes)
- Share deck and demo video

**Week 4:**
- Run 2-3 angel intro calls
- Present pilot traction
- Gauge interest level

---

### Month 2 (Weeks 5-8): Prove Value & Expand Pilots

#### Product Milestones (George)

**Week 5:**
- Implement DOCX export for document amendments (complete feature)
- Add email notifications (assessment complete, errors)
- Improve error messages (user-friendly)
- Add tooltips for compliance terms

**Week 6:**
- Optimize assessment speed (parallel rule evaluation)
- Target: Reduce from 2-5 min to <1 min
- Add caching for repeat documents
- Monitor AI costs and usage

**Week 7:**
- Implement usage analytics dashboard (for customers)
- Show: Assessments run, compliance trends, time saved
- Add admin panel (customer usage, system health)
- Prepare Stripe integration

**Week 8:**
- Stripe integration for subscriptions
- Set up pricing tiers (Starter/Pro/Enterprise)
- Test payment flows
- Prepare invoice generation

---

#### Customer Milestones (Hugo)

**Week 5:**
- Follow up with 4 pilot customers on first assessments
- Collect feedback: Accuracy, UX, time saved
- Identify issues or missing features
- Continue outreach (5 new prospects)

**Week 6:**
- Conduct mid-pilot reviews with customers
- Document: # of issues found, time saved, consultant validation
- Start preparing case study content
- Target: 2 more pilot signups (total 6)

**Week 7:**
- Run demos for 5 new prospects
- Emphasize: Pilot customer success stories
- Negotiate pilot-to-paid conversion terms
- Target: 1-2 paid commitments

**Week 8:**
- Convert 2 pilots to paying customers
- Target: £299-499/month subscriptions
- Capture testimonials and quotes
- Continue outreach (5 new prospects)

---

#### Investor Milestones (Hugo)

**Week 5:**
- Follow up with angels from Month 1
- Share pilot traction updates
- Schedule 2-3 more investor meetings

**Week 6:**
- Run investor pitches with pilot data
- Highlight: "4 pilot customers, X assessments run, Y accuracy"
- Refine pitch based on feedback

**Week 7:**
- Apply to Pi Labs, L Marks
- Continue angel outreach (3 more investors)
- Target: 2-3 serious conversations

**Week 8:**
- Negotiate terms with interested angels
- Target: £50K-100K commitments
- Prepare SAFE or priced round docs

---

### Month 3 (Weeks 9-12): Scale Pilots & Close Funding

#### Product Milestones (George)

**Week 9:**
- Implement team collaboration features
- Add: Sharing assessments, commenting, task assignment
- Improve mobile responsiveness
- Fix bugs from pilot feedback

**Week 10:**
- Add document comparison (version diff)
- Show changes between submission iterations
- Implement audit trail improvements
- Add regulatory update notifications

**Week 11:**
- Performance testing at scale (50 concurrent assessments)
- Optimize database queries
- Add CDN for static assets
- Prepare for higher traffic

**Week 12:**
- Launch white-label option (for consultancies)
- Custom branding, domain mapping
- API access for partners (beta)
- Finalize Gateway 3 roadmap

---

#### Customer Milestones (Hugo)

**Week 9:**
- Complete pilot programs (collect final data)
- Document case studies: Challenge, Solution, Results
- Record video testimonials (2-3 customers)
- Target: 4 paid conversions from pilots

**Week 10:**
- Launch outbound campaign with case studies
- Use testimonials in sales conversations
- Reach out to 10 new prospects
- Target: 5 new pilot signups

**Week 11:**
- Attend industry event (Building Safety Conference or FPA)
- Network with fire safety consultants and developers
- Run 1-2 demos at event
- Collect 10+ qualified leads

**Week 12:**
- Close Month 3 with 8-10 paying customers
- Target: £3K-5K MRR
- Prepare Q2 growth plan
- Identify partnership opportunities (architectural practices)

---

#### Investor Milestones (Hugo)

**Week 9:**
- Finalize investor pitch with Q1 traction
- Metrics: "8 paying customers, £4K MRR, 95% accuracy vs manual review"
- Run 3-4 investor meetings

**Week 10:**
- Negotiate final terms with interested angels
- Target: £100K-150K raised
- Prepare legal docs (SAFE agreement or priced round)

**Week 11:**
- Close angel round (£100K-250K total)
- Announce funding (LinkedIn, press release)
- Use PR boost for customer acquisition

**Week 12:**
- Plan use of funds: George full-time (6 months), customer acquisition, hosting
- Set Q2 goals: 20 customers, £10K MRR
- Prepare for accelerator (if accepted to Seedcamp/Antler)

---

## KEY SUCCESS METRICS

**End of Month 1:**
- ✅ 4 pilot customers running assessments
- ✅ 10 validated test assessments (accuracy confirmed)
- ✅ Security audit complete, PostgreSQL live
- ✅ 5 investor intro calls
- ✅ Operational infrastructure set up

**End of Month 2:**
- ✅ 6 total pilot customers
- ✅ 2 paid customers (£300-500/month each)
- ✅ Stripe integration live
- ✅ 1-2 case studies documented

**End of Month 3:**
- ✅ 8-10 paying customers
- ✅ £3K-5K MRR
- ✅ £100K-250K funding closed
- ✅ 3 video testimonials
- ✅ Accelerator applications submitted

---

## CRITICAL SUCCESS FACTORS

**Product:**
- Assessment accuracy must be 90%+ vs human review
- Assessment time must be <5 minutes (ideally <2 min)
- Zero security incidents (API keys protected, data encrypted)
- Export reliability must be 100% (every assessment generates reports)

**Customers:**
- Sign first paying customer by Week 8
- Convert 50%+ of pilots to paid by end of Month 3
- NPS score 50+ (customers would recommend)
- Zero churn in first 3 months

**Investors:**
- Secure at least £100K by end of Month 3
- Get accepted to 1+ UK accelerator (Seedcamp, Antler, EF, or Pi Labs)
- Build relationships with 5+ angels for future rounds

**Operational:**
- George commits full-time (or near full-time) by Month 2
- Hugo maintains 5-6 hours/week minimum on business development
- Weekly sync between founders (30-60 minutes)
- Monthly review of metrics and progress

---

## RISKS & MITIGATION

**Risk 1: No Pilot Customers in Month 1**
- Mitigation: Broaden outreach beyond fire consultants (add developers, HAs)
- Backup plan: Offer fully free assessments (no pilot commitment needed)
- George to run more demos personally

**Risk 2: Low Pilot-to-Paid Conversion**
- Mitigation: Collect feedback on why customers don't convert (price? features? trust?)
- Offer: "First month free" for paying customers
- Improve: Product based on feedback (missing features?)

**Risk 3: Funding Doesn't Close**
- Mitigation: Bootstrap longer (use Fospha salary + consulting income)
- Reduce burn: George part-time initially, scale up with revenue
- Alternative: Apply for Innovate UK grant or SBRI funding

**Risk 4: Technical Issues Block Pilots**
- Mitigation: Have 10 test assessments validated BEFORE onboarding pilots
- George provides white-glove support during pilot period
- Maintain backup manual process if system fails

**Risk 5: Hugo's Time Constraint**
- Mitigation: George takes on more customer-facing work (demos)
- Hire part-time BDR (business development rep) if funding closes
- Use automation for outreach (LinkedIn/email sequences)

---

## APPENDIX: PITCH DECK OUTLINE

**Slide 1: Cover**
- Company name: Attlee AI
- Tagline: AI-Powered Gateway 2 Compliance in Minutes
- Founders: George Clarke (Product/Tech), Hugo Hiley (Commercial)

**Slide 2: Problem**
- 40%+ Gateway 2 rejection rates
- £50K-200K delay costs per rejection
- Manual compliance checking takes 5-20 hours per project
- Consultants overwhelmed with demand

**Slide 3: Solution**
- AI-powered compliance platform
- 55 proprietary rules + Claude Sonnet 4.5 enrichment
- 2-5 minute assessment vs 5-20 hours manual
- Auto-generates £500-1,000 compliance matrices

**Slide 4: Product Demo**
- Screenshots of upload → assess → results flow
- Link to 3-minute demo video
- Show compliance matrix and gap analysis

**Slide 5: Traction**
- X pilot customers signed
- Y assessments run
- £Z MRR (if any paid customers)
- 95% accuracy vs manual review

**Slide 6: Market**
- £20M+ annual TAM (UK Gateway 2 submissions)
- 2,000+ submissions per year
- Expanding: Gateway 3, Building Assessment Certificates
- International: EU, Australia have similar regimes

**Slide 7: Business Model**
- Subscription: £299-499/month per user
- Per-assessment: £99-149 per pack
- Enterprise: £2K-5K/month for consultancies
- Target: £5K-10K MRR in 6 months

**Slide 8: Competition**
- vs Traditional Consultants: 10x faster, 5x cheaper
- vs Generic AI (ChatGPT): 55 proprietary rules, audit trail, no hallucinations
- vs Checklists/Templates: AI-powered, auto-extracts evidence

**Slide 9: Team**
- George Clarke: Product/Tech, AI engineering background
- Hugo Hiley: Commercial, construction industry experience
- Advisors: (TBD - fire safety expert, proptech advisor)

**Slide 10: Ask**
- Raising: £100K-250K pre-seed
- Use of funds: 50% product, 30% customer acquisition, 20% operations
- 6-month runway to £10K MRR and Series A readiness

---

**END OF OPERATING PLAN**

*This plan is a living document. Review and update monthly based on progress and market feedback.*

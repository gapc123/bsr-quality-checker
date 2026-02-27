# Landing Page Remediation Plan

## Issue Summary
User requested landing page copy explaining AI review principles, but the landing page was deleted in Project 1 (SaaS Removal - commit 9423945).

---

## Recommended Solution: Recreate Public Landing Page (Option A)

### Rationale
- Builds trust with potential clients and regulators
- Explains product principles clearly
- Positions tool for demos and external validation
- Maintains internal tool functionality
- Enables future expansion

---

## Implementation Plan

### Phase 1: Create Landing Page Structure (1 hour)
**File:** `/packages/frontend/src/pages/Landing.tsx`

**Sections:**
1. **Hero Section**
   - Attlee AI branding
   - Headline: "AI-Powered Building Safety Review & Triage"
   - Subheading: Product positioning
   - CTA: "Sign In" (for team members)

2. **Section 1: AI Review, Not AI Content Generation**
   - Clear heading
   - Core messaging (as specified by user)
   - Bullet points explaining agentic triage
   - Visual hierarchy

3. **Section 2: Continuous Improvement Through Real Outcomes**
   - Regulatory intelligence framing
   - Learning from outcomes
   - Building pattern recognition
   - Conservative risk approach

4. **Mission Statement**
   - "Our mission is to help get more safe homes built in the UK, faster"
   - Problem + solution framing

5. **Footer**
   - Contact information
   - Attlee.AI branding
   - Legal/disclaimer links

### Phase 2: Update Routing (15 minutes)
**File:** `/packages/frontend/src/App.tsx`

**Changes:**
```tsx
// Current: Root redirects to /clients
<Route path="/" element={<Navigate to="/clients" replace />} />

// New: Show landing to public, redirect authenticated users
<Route path="/" element={
  <SignedOut>
    <Landing />
  </SignedOut>
  <SignedIn>
    <Navigate to="/clients" replace />
  </SignedIn>
} />
```

### Phase 3: Copy Implementation (30 minutes)
**Write copy for both sections following user requirements:**

#### Section 1 Copy Requirements
- ✅ Not AI content creation
- ✅ AI review and triage at scale
- ✅ Understanding regulation beyond human capacity
- ✅ Identifying gaps, risks, inconsistencies
- ✅ Agentic only for: formatting, cross-referencing, clarity, structure
- ✅ Defers: expert judgement, document creation, sign-off, physical testing
- ✅ Reduces workload, not accountability

#### Section 2 Copy Requirements
- ✅ Learns from successful/failed submissions
- ✅ Regulator feedback integration
- ✅ Pattern recognition improvement
- ✅ Risk identification enhancement
- ✅ Confidence calibration
- ✅ Growing regulatory intelligence, not static rules

### Phase 4: Styling (30 minutes)
**Design principles:**
- Professional, institutional tone
- Trust-building visual hierarchy
- Readable typography
- Calm color palette (match existing slate/blue theme)
- Mobile responsive
- Accessibility compliant

### Phase 5: Testing (15 minutes)
- ✅ Public visitor sees landing page
- ✅ Authenticated user redirects to /clients
- ✅ "Sign In" button works
- ✅ All copy is readable and clear
- ✅ Mobile responsive
- ✅ No navigation errors

---

## Alternative: Quick Solution (Add to Sign-In Page)

If speed is critical, add the copy to the existing sign-in page:

**File:** `/packages/frontend/src/pages/SignIn.tsx`

**Approach:**
- Add two collapsible sections above sign-in form
- Same copy as landing page
- Less visual prominence
- Faster implementation (30 minutes)

**Trade-offs:**
- ❌ No public-facing page
- ❌ Less professional presentation
- ✅ Faster to implement
- ✅ Team members see it during onboarding

---

## Copy Draft (For Review)

### Section 1: AI Review, Not AI Content Generation

**Heading:** "Intelligent Review, Not Content Generation"

**Body:**
This system does not attempt to replace professional judgement or generate free-form compliance documents. Instead, it provides intelligent review and triage at a scale no individual human can achieve.

**What the AI Does:**
- Reviews documents across entire submission packs for consistency
- Understands building safety regulations at granular detail
- Identifies gaps, risks, and inconsistencies early in the process
- Cross-references requirements across dozens of documents simultaneously

**Agentic Behaviour (Where AI Acts Autonomously):**
- Formatting and structural consistency checks
- Cross-referencing between documents and regulations
- Language clarity and readability assessment
- Highlighting missing or incomplete sections

**What the AI Always Defers to Humans:**
- Professional engineering judgement
- Creation of new technical documents
- Final sign-off and accountability
- Physical testing, site inspections, or empirical evidence

**The Goal:** Reduce the human workload by handling repetitive review tasks, while keeping human expertise and accountability at the center of every submission.

---

### Section 2: Continuous Improvement Through Real Outcomes

**Heading:** "A Growing Regulatory Intelligence Layer"

**Body:**
Unlike static compliance checklists, this system learns from real regulatory outcomes. Every submission—whether successful or not—contributes to the system's understanding of what the Building Safety Regulator expects.

**What the System Learns From:**
- Successful Gateway 2 submissions and their common patterns
- Submissions that failed and the reasons why
- Direct feedback from BSR reviews and queries
- Changes in regulatory interpretation over time

**How This Improves the System:**
- **Pattern Recognition:** Better identification of what constitutes submission-ready documentation
- **Risk Identification:** Earlier detection of issues likely to trigger regulator queries
- **Confidence Calibration:** More accurate assessment of which areas need further review
- **Conservative Guidance:** The system becomes more cautious where regulatory standards remain ambiguous

**The Result:** Over time, the system becomes not just faster, but more accurate—helping teams anticipate regulator expectations before submission, reducing delays and rework.

---

## Timeline

**Total Effort:** ~2.5 hours

- Phase 1 (Structure): 1 hour
- Phase 2 (Routing): 15 minutes
- Phase 3 (Copy): 30 minutes
- Phase 4 (Styling): 30 minutes
- Phase 5 (Testing): 15 minutes

**Quick Alternative:** 30 minutes (add to sign-in page)

---

## Deliverables

1. ✅ Copy for Section 1 (above)
2. ✅ Copy for Section 2 (above)
3. 🔲 `Landing.tsx` component (pending user approval)
4. 🔲 Updated routing in `App.tsx`
5. 🔲 Styling and responsive design
6. 🔲 Testing and verification

---

## Approval Required

**User Decision Needed:**
1. Approve copy draft (or request revisions)?
2. Proceed with full landing page (Option A) or quick sign-in page (Option B)?
3. Any additional sections or messaging required?

**Once approved, implementation can proceed immediately.**

---

**Plan Created:** 2026-02-27
**Status:** Awaiting user decision

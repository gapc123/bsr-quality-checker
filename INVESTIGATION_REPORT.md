# Investigation Report: BSR Quality Checker - Carousel & Deterministic Rules Flow

## Executive Summary

**Status:** Real system is INTACT but BYPASSED by demo simplification.
**Root Cause:** Created simplified demo endpoints that bypass the production two-phase assessment engine.
**Current Blocker:** Database tables don't exist in Railway production environment.

---

## Architecture Overview

### Original Working System (Pre-Demo)

**Backend - Two-Phase Assessment:**
```
User uploads documents
  ↓
Phase 1: Deterministic Rules Engine (55 proprietary if-then checks)
  ├─ deterministic-rules.ts (3465 lines, commit 8c9c25c)
  ├─ Explicit pass/fail logic
  ├─ Evidence extraction
  └─ Outputs: DeterministicAssessment[]
  ↓
Phase 2: LLM Analysis (nuanced criteria)
  ├─ matrix-assessment.ts orchestrates both phases
  ├─ Uses Anthropic Claude for judgment-based criteria
  ├─ Enriches with proposed changes, remediation text
  └─ Outputs: Full FullAssessment with 55+ criteria
  ↓
matrix-report.ts generates summary + reports
```

**Frontend - Carousel Review Flow:**
```
Packs page → Create Pack → Upload Documents
  ↓
POST /api/packs/:id/versions/:vid/matrix-assess
  ↓
Results page (Results.tsx)
  ├─ Fetches /api/packs/:id/versions/:vid/matrix-report
  ├─ Renders CriterionCarousel.tsx (44KB component)
  ├─ User navigates criterion-by-criterion
  ├─ Shows pass/fail, evidence, reasoning, proposed changes
  └─ Export to PDF, document amendments
```

**Key Commits:**
- `8c9c25c` - Add 55-rule deterministic engine + two-phase assessment flow (Feb 24, 2026)
- `b2466b0` - Add prominent two-phase assessment breakdown in Results
- `7160243` - Add pre-linked regulatory references to all deterministic rules

### Current Demo System (Today's Changes)

**Files Created/Modified (Commit d0f68cd):**
1. `packages/backend/src/routes/quick-assess.ts` (NEW)
   - Mock endpoint returning 5 hardcoded fake results
   - Bypasses database, deterministic rules, LLM analysis

2. `packages/frontend/src/pages/MatrixAssessment.tsx` (NEW)
   - Simplified upload page
   - Calls `/api/quick-assess` instead of real flow
   - Shows 5 results (4 pass, 1 fail) - mocked data

3. `packages/frontend/src/App.tsx` (MODIFIED)
   - Changed default route after sign-in to `/assess` instead of `/clients`
   - Added MatrixAssessment to navigation

**Impact:**
- ❌ Users land on demo page, bypass real Packs workflow
- ❌ No deterministic rules execution (55 rules unused)
- ❌ No carousel navigation (CriterionCarousel unused)
- ❌ No two-phase assessment
- ❌ No document amendments, PDF exports

---

## What Changed: File-by-File Diff

### Files ADDED (should be removed or rewired):
```diff
+ packages/backend/src/routes/quick-assess.ts
  - Mock assessment endpoint
  - Returns 5 hardcoded criteria
  - No database, no rules engine

+ packages/frontend/src/pages/MatrixAssessment.tsx
  - Simplified demo page
  - Calls /api/quick-assess
  - Displays mock results inline (not carousel)
```

### Files MODIFIED (revert routing, keep rest intact):
```diff
M packages/backend/src/index.ts
  + Added quick-assess router (line 12, 46)

M packages/frontend/src/App.tsx
  + Imported MatrixAssessment component
  + Added /assess route
  + Changed default SignedIn redirect to /assess (was /clients)
  + Added "Matrix Assessment" to nav (first position)

M packages/frontend/src/pages/PacksList.tsx
  + Added prominent blue Matrix Assessment CTA box (commit c34eefa)
  - This is UI change, but can stay if desired
```

### Files INTACT (working implementation preserved):
```
✓ packages/backend/src/services/deterministic-rules.ts (3465 lines, 55 rules)
✓ packages/backend/src/services/matrix-assessment.ts (orchestration)
✓ packages/backend/src/services/matrix-report.ts
✓ packages/frontend/src/components/CriterionCarousel.tsx (44KB)
✓ packages/frontend/src/pages/Results.tsx
✓ packages/backend/src/routes/packs.ts
✓ packages/backend/src/routes/analysis.ts
```

---

## Current Blocker: Database Initialization

**Problem:** Railway deployment creates tables successfully but they don't persist.

**Evidence (Railway Logs):**
```
✅ Database created successfully
-rw-r--r-- 1 root root 168K Mar  3 12:40 /app/data/production.db
BSR Quality Checker API running on port 3001
```

But API calls fail:
```
Error creating pack: PrismaClientKnownRequestError:
The table `main.Pack` does not exist in the current database.
```

**Root Cause:**
- Database file created at `/app/data/production.db`
- No persistent volume mounted in Railway
- Database resets on container restart/redeploy

**Fix Required:**
Railway needs a persistent volume at `/app/data` OR use PostgreSQL instead of SQLite.

---

## Restoration Steps

### 1. Fix Database Persistence (Blocker)
**User must configure Railway:**
- Option A: Add persistent volume at `/app/data`
- Option B: Switch to Railway-provided PostgreSQL (update DATABASE_URL, schema.prisma)

### 2. Restore Default Routing (Backend Intact)
```typescript
// packages/frontend/src/App.tsx
// Change line 53:
- <Navigate to="/assess" replace />
+ <Navigate to="/clients" replace />

// Optionally remove /assess route and nav link (or keep for future simplified entry point)
```

### 3. Deprecate Mock Endpoint (or Keep as Quick Preview)
**Option A - Remove:**
```typescript
// packages/backend/src/index.ts
- import quickAssessRouter from './routes/quick-assess.js';
- app.use('/api/quick-assess', quickAssessRouter);
```

**Option B - Keep as Preview:**
- Rename to `/api/quick-preview`
- Add disclaimer "Demo results - not real assessment"
- Don't make it default landing page

### 4. Verify Real Flow Works
```bash
# After database fix:
1. Sign in → lands on /clients
2. Click "Packs" → Create new pack
3. Click pack → Upload PDF documents
4. Click "Run Matrix Assessment"
5. Wait 2-5 minutes
6. View Results → should show carousel with 55+ criteria
```

---

## Testing Checklist

### Backend Tests (Existing)
```bash
# Unit tests for deterministic rules
cd packages/backend
npm test -- deterministic-rules.test.ts

# Integration test for assessment workflow
cd packages/frontend
npm run test -- assessment-workflow.spec.ts
```

### Manual End-to-End Test
1. ✅ Create pack (POST /api/packs)
2. ✅ Upload documents (POST /api/packs/:id/upload)
3. ✅ Run assessment (POST /api/packs/:id/versions/:vid/matrix-assess)
4. ✅ Poll status (GET /api/packs/:id/versions/:vid/analyze/status)
5. ✅ Fetch results (GET /api/packs/:id/versions/:vid/matrix-report)
6. ✅ Verify carousel renders (CriterionCarousel component)
7. ✅ Check deterministic phase shows 55 rules
8. ✅ Check LLM phase shows nuanced criteria
9. ✅ Export PDF report

---

## Precise Root Causes

1. **Demo Simplification (User-Requested)**
   - User asked for "simplest product possible for demo"
   - Created mock endpoint to bypass database/rules/LLM
   - Intended as temporary demo tool

2. **Database Persistence (Infrastructure)**
   - Railway deployment doesn't have persistent volume
   - SQLite database resets on container restart
   - Prevents pack creation → blocks entire real workflow

3. **Routing Change (Side Effect)**
   - Changed default landing to demo page
   - Users don't discover real Packs workflow
   - Real system still works if accessed via /dashboard or /clients

---

## Next Steps

1. **User Action Required:**
   - Configure Railway persistent volume at `/app/data`
   - OR switch to PostgreSQL database

2. **Code Changes (After DB Fixed):**
   - Revert default route to `/clients` or `/dashboard`
   - Optionally remove `/assess` demo page
   - Test real flow: Pack → Upload → Assess → Results/Carousel

3. **No UI Changes Needed:**
   - Results.tsx already has carousel
   - CriterionCarousel.tsx already exists and works
   - All original UI components intact

---

## How to Test Locally

```bash
# 1. Ensure database exists
cd packages/backend
npx prisma db push

# 2. Start backend
npm run dev

# 3. Start frontend (separate terminal)
cd packages/frontend
npm run dev

# 4. Navigate to http://localhost:5173
# 5. Sign in
# 6. Go to /clients or /dashboard
# 7. Create pack → Upload PDF → Run assessment
# 8. Wait for completion → View results
# 9. Should see full carousel with 55+ criteria
```

---

## Summary

**What Broke:** Demo simplification bypassed the real two-phase assessment engine and carousel flow.
**What's Intact:** All backend logic (55 rules, LLM orchestration) and frontend UI (carousel, results page) still exist.
**Current Blocker:** Database persistence in Railway.
**Fix:** Configure Railway volume + revert default routing to Packs workflow.
**Result:** Full deterministic rules + LLM analysis with carousel navigation will work again.

---

**Investigation completed:** March 3, 2026
**Commits analyzed:** d0f68cd (demo), 8c9c25c (working system), 7ed66fb (latest)

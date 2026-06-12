# BSR Quality Checker — Loop State

_Last updated: 2026-06-12_

---

## P0 Bug: Quality check re-runs fail on ALL existing packs

**Symptom**: Re-running a quality check on any previously saved pack fails or produces
empty results. The Assess tab (fresh uploads) works fine.

---

## Root Cause (confirmed)

Two-part failure in the Quick-Assess save handler (`POST /api/assess/save`):

### Part 1 — Ghost documents with zero chunks (primary cause of empty re-runs)

`extractedText` was not included when serialising `packDocs` into `tempData.json`.
Document records were created in the DB with no chunks, so every subsequent
`runMatrixAssessment` call had `doc.chunks = []` for all documents, producing
an `extractedText: ""` and an assessment run on blank content.

Additionally, document creation was gated on `fs.existsSync(doc.filepath)`, so
if the temp file was already gone at save time, no DB record was created at all.

### Part 2 — Uploads lost to Railway ephemeral storage (cause of hard 400s)

Railway services have no persistent volume by default. The `/app/uploads/` and
`/app/temp-uploads/` directories are wiped on every redeploy. Packs saved before
any redeploy had their source PDFs deleted, and the old save handler would create
0 documents (guarded by `fs.existsSync`), leaving `packVersion.documents = []`.
The re-run route guards against this with a hard 400: "No documents in this version".

---

## Fixes — In Progress

### Fix 1 — Persist `extractedText` in tempData and always create chunks on save
**File**: `packages/backend/src/routes/quick-assess.ts`

Structured as three phases:

**Phase 1 (FS, outside transaction)**: For every doc in `tempData.packDocs`:
- If file present: `fs.copyFileSync` to uploads dir, then `processPDF()` for
  page-aware chunks with correct `pageRef` per page.
- If file gone (ephemeral FS): text-only fallback chunker using stored
  `extractedText`; `pageRef: 1`; warns. Fallback loop guarded by
  `while (advance > 0 && ...)` to prevent infinite loop if constants misconfigure.
- If `chunkRecords` is empty after either path (scanned/image PDF): still adds
  to `docsToSave` — document record is persisted so it is visible in the pack —
  and pushes filename to `unprocessableDocs` for gap-item injection.

**Phase 2 (in-memory)**: For each unprocessable filename, pushes a fully-formed
`AssessmentResult` gap item (`status: 'not_assessed'`, `category: 'Document
Processing'`) into `tempData.results.results` in-memory, before any DB write.

**Phase 3 (atomic transaction)**: `prisma.$transaction` writes all document
records + `packVersion.update(matrixAssessment)` together. A mid-loop crash
can no longer leave the assessment missing gap items while their documents exist.

### Fix 2 — Self-heal on first re-run + loud fail + gap items for empty docs
**File**: `packages/backend/src/services/analysis.ts`

- Self-heal block: for any doc with zero DB chunks whose file still exists,
  re-ingests via `processPDF()` and writes chunks. Warns explicitly if
  re-ingest still produces zero chunks (scanned PDF).
- Content guard: if ALL docs are empty after self-heal, throws a descriptive
  error naming both root causes (scanned PDF / Railway ephemeral FS).
- Only `docsWithContent` passed to `assessPackAgainstMatrix` — empty-text docs
  excluded from the engine to avoid contaminating evidence scoring.
- Gap items: after the engine returns, one `AssessmentResult` item
  (`status: 'not_assessed'`) is pushed into `assessment.results` for each
  empty doc, then the assessment is stored. Re-runs never silently omit a file.

---

## Verifier Status

- Pass 1: **FAIL** — pageRef corruption, over-reported doc count
- Pass 2: **PASS** — all pass-1 findings resolved
- Pass 3: **PASS** — gap-item requirement satisfied (user-added); transaction
  warning + infinite-loop guard identified as conditions
- Pass 4: **PASS** — both conditions resolved; two non-blocking backlog items noted

---

## Remaining Actions

| # | Action | Type | Status |
|---|--------|------|--------|
| 1 | Add Railway persistent volume at `/app/uploads` | Railway dashboard (infra) | Pending |
| 2 | Repair existing broken packs in production | Manual — re-save from Quick-Assess | Pending |
| 3 | `processPDF` call uses original `doc.filepath`; could use `newPath` (already copied) | Minor optimisation | Backlog |
| 4 | Refactor: replace `doc.chunks` mutation with `chunkOverrides` Map (Prisma type safety) | Type safety | Backlog |
| 5 | Refactor: extract fallback chunk constants from `ingestion.ts` constants | Code quality | Backlog |

**Broken packs**: Any pack saved before this fix with 0 documents in the DB cannot
be auto-repaired (temp files and tempData.json are gone). Users must re-run
Quick-Assess and save again.

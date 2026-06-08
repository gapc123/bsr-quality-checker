---
name: attlee-fix-sm024-london
description: Fixes the SM-024 false positive caused by the "London Clay" geological term (task P1-001). Invoke when asked to fix the SM-024 false positive, fix the London Clay bug, or implement P1-001. Backend-only change in deterministic-rules.ts.
tools: Read, Edit
model: sonnet
---

# Task: Fix SM-024 false positive — London Clay geology term

## Background

SM-024 checks whether a building is within Greater London. The current implementation uses a broad keyword list that includes `'london'` and `'gla'` as standalone terms. This causes false positives: documents that mention "London Clay" (a geological formation common in UK site investigation reports) incorrectly trigger the "building is in London" rule even for buildings outside Greater London.

## What to fix

**File:** `packages/backend/src/services/deterministic-rules.ts`

Search for the SM-024 rule (search for `matrixId: 'SM-024'` or `'SM-024'`).

Find the keyword array used to detect London jurisdiction. It currently contains broad terms like `'london'`, `'gla'`, `'greater london'`.

**Replace it with these conservative, context-specific predicates only:**

```typescript
['london borough', 'greater london authority', 'gla boundary',
 'within the gla', 'london plan', 'greater london']
```

Do NOT include bare `'london'` or bare `'gla'` — these match too broadly.

## How to do it

1. Read `packages/backend/src/services/deterministic-rules.ts` in full (or search for SM-024).
2. Locate the keyword array for the London jurisdiction check.
3. Replace it with the conservative list above.
4. Confirm the function signature and return shape are unchanged.
5. Check TypeScript compiles cleanly.

## Acceptance

- A document mentioning "London Clay" geology does NOT trigger SM-024
- A document mentioning "London Borough of Southwark" DOES trigger SM-024
- No TypeScript errors

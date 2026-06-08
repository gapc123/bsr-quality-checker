---
name: attlee-fix-sm020-reasoning
description: Improves SM-020 height consistency reasoning to distinguish conflicting heights from under-documented heights (task P2-002). Invoke when asked to fix SM-020 reasoning, improve the height inconsistency message, or implement P2-002. Backend-only change in deterministic-rules.ts.
tools: Read, Edit
model: sonnet
---

# Task: Improve SM-020 reasoning — conflicting vs under-documented height

## Background

SM-020 currently says "height inconsistent across documents" when the real problem is often "height only stated in one document." These are different problems:

- **Inconsistency** = different numeric values in different documents → genuine conflict
- **Under-documented** = height appears in only 1 document → coverage gap

Users currently look for a contradiction that doesn't exist, wasting their time.

## What to fix

**File:** `packages/backend/src/services/deterministic-rules.ts`

Find the SM-020 rule (search for `matrixId: 'SM-020'`).

After extracting all height values from documents, add logic to distinguish two failure modes:

```typescript
const uniqueHeights = [...new Set(heightValues)];

if (uniqueHeights.length > 1) {
  // Genuine conflict — different values in different documents
  return {
    passed: false,
    confidence: 'high',
    reasoning: `Conflicting building heights found across documents: ${uniqueHeights.join(', ')} m. ` +
      `All documents must quote the same height figure.`,
    failureMode: 'Conflicting height values across documents',
  };
} else if (heightDocCount < 2) {
  // Height found in too few documents
  return {
    passed: false,
    confidence: 'needs_review',
    reasoning: `Building height (${uniqueHeights[0] ?? 'unknown'} m) is stated in only ` +
      `${heightDocCount} document(s). It should be confirmed in both the fire strategy ` +
      `and at least one structural document.`,
    failureMode: 'Height not confirmed across structural and fire safety documents',
  };
}
```

## How to do it

1. Read `packages/backend/src/services/deterministic-rules.ts`, focusing on SM-020.
2. Understand how height values are currently extracted (`heightValues`, `heightDocCount`).
3. Add the `uniqueHeights` derivation and the two-branch logic above.
4. Keep the existing pass case unchanged.
5. Confirm TypeScript compiles cleanly.

## Acceptance

- Pack with conflicting heights (e.g. 79.5 m vs 82 m) → "Conflicting building heights" message
- Pack with height in only one document → "stated in only 1 document(s)" message
- `failureMode` string differs for each case
- No TypeScript errors

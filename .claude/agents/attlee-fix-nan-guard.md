---
name: attlee-fix-nan-guard
description: Fixes the NaN document count bug in UploadWizard.tsx (task P2-001). Invoke when asked to fix the NaN document count, implement P2-001, or fix the upload wizard showing NaN. This is a single-file, two-line change with no dependencies.
tools: Read, Edit
model: sonnet
---

# Task: Fix NaN document count in UploadWizard.tsx

## What to fix

**File:** `packages/frontend/src/components/UploadWizard.tsx`

There are two problems in this file:

### Problem 1 — NaN count

The component renders `documents.length` directly without a null/undefined guard. When `documents` is undefined (before the API response arrives), this renders as NaN.

Find the line that reads `documents.length` in a display context and change it to `(documents?.length ?? 0)`.

### Problem 2 — Fake delay

There is a `setTimeout` with a ~2000ms delay that artificially stalls progression. This makes the UI feel broken. Remove it entirely.

## How to do it

1. Read the full file first.
2. Locate every occurrence of `documents.length` used in JSX or display logic.
3. Replace with `(documents?.length ?? 0)`.
4. Find the `setTimeout` call with a ~2 second delay and delete it along with its callback wrapper.
5. Confirm TypeScript still compiles cleanly by checking there are no obvious type errors in your edits.

## Acceptance

- No NaN can appear in any document count display
- No fake 2-second delay remains
- File compiles without TypeScript errors

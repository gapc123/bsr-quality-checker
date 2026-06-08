---
name: attlee-fix-results-polling
description: Implements full polling loop in Results.tsx to replace the broken one-shot fetch (task P0-002). Invoke when asked to fix the Results page polling, implement P0-002, or fix the Results page showing no data while assessment runs. High-priority frontend fix.
tools: Read, Edit
model: sonnet
---

# Task: Implement full polling loop in Results.tsx

## Background

The Results page currently uses a single fetch to load the assessment result. If the assessment is still running when the page loads, it returns no data and never retries. Users see an empty page with no feedback. The fix is a polling loop that retries every 8 seconds until data arrives or 15 minutes pass.

## What to fix

**File:** `packages/frontend/src/pages/Results.tsx`

Constants to add near the top of the file:

```typescript
const POLL_INTERVAL_MS = 8_000;       // 8 seconds between polls
const POLL_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes max
```

State to add:

```typescript
type AssessmentStatus = 'loading' | 'running' | 'complete' | 'error';
const [assessmentStatus, setAssessmentStatus] = useState<AssessmentStatus>('loading');
```

Replace the single fetch with a polling loop in useEffect:

```typescript
useEffect(() => {
  let cancelled = false;
  const startTime = Date.now();

  async function poll() {
    while (!cancelled) {
      try {
        const res = await fetch(`/api/packs/${packId}/versions/${versionId}/assessment`, {
          credentials: 'include',
        });

        if (res.status === 401 || res.status === 403) {
          navigate('/sign-in');
          return;
        }

        if (!res.ok) {
          setAssessmentStatus('error');
          return;
        }

        const data = await res.json();

        if (data?.assessment?.criteria?.length > 0) {
          setAssessment(data.assessment);
          setAssessmentStatus('complete');
          return;
        }

        // Still running — check timeout
        if (Date.now() - startTime > POLL_TIMEOUT_MS) {
          setAssessmentStatus('error');
          return;
        }

        setAssessmentStatus('running');
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
      } catch (err) {
        setAssessmentStatus('error');
        return;
      }
    }
  }

  poll();
  return () => { cancelled = true; };
}, [packId, versionId, navigate]);
```

Update the render to use `assessmentStatus`:

- `loading` → full-page spinner with "Loading assessment..."
- `running` → full-page spinner with "Assessment in progress — checking back in a moment..."
- `error` → error message with retry button
- `complete` → existing results UI (unchanged)

## How to do it

1. Read `packages/frontend/src/pages/Results.tsx` in full.
2. Identify the existing fetch logic and state variables for assessment data.
3. Add the constants, update the state type, and replace the fetch with the polling loop above.
4. Update the JSX render to branch on `assessmentStatus`.
5. Confirm TypeScript compiles — ensure `navigate` is imported from `react-router-dom`.

## Acceptance

- Page shows "Assessment in progress" spinner while assessment is running
- Page polls every 8 seconds and updates when data arrives
- 401/403 redirects to `/sign-in`
- After 15 minutes without data, shows error state
- No TypeScript errors

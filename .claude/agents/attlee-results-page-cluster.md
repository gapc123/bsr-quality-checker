---
name: attlee-results-page-cluster
description: Implements the full Results page UX cluster — passing criteria toggle (P2-003), export button wired to /export/pdf (P2-004), and full-page criterion detail view (P2-006). Invoke when asked to implement all Results page improvements together, or when asked to implement P2-003 + P2-004 + P2-006 as a batch. These three tasks all modify Results.tsx and must be done together to avoid conflicts.
tools: Read, Edit, Bash
model: opus
---

# Task: Results Page UX Cluster (P2-003 + P2-004 + P2-006)

These three tasks all modify `packages/frontend/src/pages/Results.tsx` and must be implemented together to avoid merge conflicts and produce a coherent result.

Read CLAUDE.md in the project root first for full architecture context.

---

## Change 1 — Passing criteria toggle (P2-003)

**File:** `packages/frontend/src/components/ResultsDashboard.tsx`

Add a collapsible "Passing criteria" section below the failing criteria list.

Add state:

```typescript
const [showPassing, setShowPassing] = useState(false);
const passingCriteria = criteria.filter(
  c => c.status === 'meets' || c.status === 'PASS'
);
```

Add to render (below failing criteria):

```jsx
<button onClick={() => setShowPassing(p => !p)} className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-2 mt-6">
  {showPassing ? '▲ Hide' : '▼ Show'} passing criteria ({passingCriteria.length})
</button>

{showPassing && (
  <div className="mt-4 space-y-2">
    {passingCriteria.map(c => (
      <div key={c.criterionId ?? c.matrix_id} className="flex items-center gap-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
        <span className="text-green-600 font-semibold text-sm flex-shrink-0">✓ Pass</span>
        <span className="text-xs font-mono text-gray-400 flex-shrink-0">{c.criterionId ?? c.matrix_id}</span>
        <span className="text-sm text-gray-700">{c.title ?? c.matrix_title}</span>
      </div>
    ))}
  </div>
)}
```

Update the decision gate to show blocker count:

```typescript
const blockers = failingCriteria.filter(
  c => c.severity === 'critical' || c.severity === 'high' ||
       c.severity === 'CRITICAL' || c.severity === 'HIGH'
);
// In the gate display, when decisionGate === 'DO_NOT_SUBMIT' (or equivalent):
// Add: "{blockers.length} issue{blockers.length !== 1 ? 's' : ''} must be resolved before submission"
```

---

## Change 2 — Wire export button (P2-004)

**File:** `packages/frontend/src/pages/Results.tsx`

The export button likely already exists in the render. If not, add it to the page header.

Add the handler:

```typescript
const [exporting, setExporting] = useState(false);

const handleExport = async () => {
  setExporting(true);
  try {
    const res = await fetch(
      `/api/packs/${packId}/versions/${versionId}/export/pdf`,
      { credentials: 'include' }
    );
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `assessment-${packId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      console.error('Export failed:', res.status);
    }
  } finally {
    setExporting(false);
  }
};
```

Wire the button:

```jsx
<button
  onClick={handleExport}
  disabled={exporting}
  className="flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
>
  {exporting ? (
    <><span className="animate-spin">○</span> Exporting...</>
  ) : (
    <>↓ Export PDF</>
  )}
</button>
```

Also check `packages/backend/src/routes/export.ts` — if the route does not exist, add it:

```typescript
router.get('/packs/:packId/versions/:versionId/export/pdf', requireAuth, async (req, res) => {
  const packId = req.params.packId as string;
  const versionId = req.params.versionId as string;
  // Use the report service — check packages/backend/src/services/report.ts
  // Generate PDF and stream it back as application/pdf
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="assessment-${packId}.pdf"`);
  // ... call report service
});
```

---

## Change 3 — Full-page criterion detail (P2-006)

### Step 3a — New route in App.tsx
**File:** `packages/frontend/src/App.tsx` (or wherever routes are defined)

Add:
```jsx
<Route
  path="/results/:packId/:versionId/criterion/:criterionId"
  element={<CriterionDetailPage />}
/>
```

Import the new component at the top of the file.

### Step 3b — CriterionDetailPage.tsx already exists

Check if `packages/frontend/src/pages/CriterionDetailPage.tsx` exists. If it does and is a full-featured page, confirm and skip creation. If it doesn't exist, create it per the spec.

### Step 3c — Update criterion card click handler in Results.tsx

Remove any existing modal/popup open logic. Replace criterion card click handlers with:

```typescript
onClick={() => navigate(
  `/results/${packId}/${versionId}/criterion/${criterion.criterionId ?? criterion.matrix_id}`,
  { state: { scrollY: window.scrollY } }
)}
```

Add scroll restore on mount in Results.tsx:

```typescript
const location = useLocation(); // import from react-router-dom

useEffect(() => {
  const saved = location.state?.scrollY;
  if (saved) window.scrollTo(0, saved);
}, []);
```

Remove all modal/popup state variables and modal component JSX from Results.tsx. Remove the modal component import if it is no longer used elsewhere.

---

## Acceptance for the full cluster

- [ ] Passing criteria toggle shows/hides correctly
- [ ] Decision gate shows number of CRITICAL/HIGH blockers
- [ ] Export PDF button downloads the report (spinner while in-flight)
- [ ] Clicking a criterion navigates to `/results/:packId/:versionId/criterion/:criterionId`
- [ ] CriterionDetailPage renders full detail: reasoning, evidence, gaps, action, downloads
- [ ] Back button returns to Results with scroll position restored
- [ ] No modal/popup code remains in Results.tsx
- [ ] TypeScript compiles cleanly across all changed files

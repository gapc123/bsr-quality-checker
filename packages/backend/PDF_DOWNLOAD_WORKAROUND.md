# PDF Download Workaround Guide

**Issue**: The "Export Report" button in ResultsDashboard may not trigger downloads properly.

**Solution**: Use the "Save to Client" workflow instead.

---

## Workaround: Save to Client → Download from Clients Page

### Step-by-Step Instructions

1. **Run Assessment**
   - Upload documents
   - Click "Run Assessment"
   - Wait for results

2. **Save to Client**
   - Click "💾 Save to Client" button (in QuickAssess page)
   - OR click "Save to Client" in SimpleResultsView
   - Fill in client information
   - Click "Save"

3. **Navigate to Clients Page**
   - Go to `/clients` in the navigation
   - Find your client in the list

4. **Download Reports**
   - Click "Download Reports" button next to the pack
   - Downloads 3 files automatically:
     - Client Gap Analysis PDF ⚠️
     - Consultant Action Plan PDF ⚠️
     - Compliance Matrix Excel ✅

### ⚠️ Important: Some Downloads Will Fail

**Working**:
- ✅ Compliance Matrix Excel
- ✅ Submission Readiness Report (alternative endpoint)

**Not Working** (endpoints missing):
- ❌ Client Gap Analysis PDF
- ❌ Consultant Action Plan PDF

---

## Alternative: Use Browser DevTools

If the button doesn't trigger downloads, you can use the browser console:

### 1. Save Assessment First
Click "Save to Client" and note the Pack ID and Version ID

### 2. Open Browser Console
Press F12 → Console tab

### 3. Run Download Command

```javascript
// Replace with your actual Pack ID and Version ID
const packId = 'YOUR_PACK_ID';
const versionId = 'YOUR_VERSION_ID';

// Download Submission Readiness Report
fetch(`/api/packs/${packId}/versions/${versionId}/saved-assessment/submission-readiness/download`)
  .then(res => res.blob())
  .then(blob => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `submission-readiness-${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  });

// Download Compliance Matrix Excel
fetch(`/api/packs/${packId}/versions/${versionId}/saved-assessment/compliance-matrix/excel`)
  .then(res => res.blob())
  .then(blob => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-matrix-${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  });
```

---

## Alternative: Direct API Calls

### Using cURL (Terminal)

```bash
# Get Pack ID and Version ID from database or UI
PACK_ID="your-pack-id"
VERSION_ID="your-version-id"

# Download Submission Readiness PDF
curl "http://localhost:3001/api/packs/${PACK_ID}/versions/${VERSION_ID}/saved-assessment/submission-readiness/download" \
  -o "submission-readiness.pdf"

# Download Compliance Matrix Excel
curl "http://localhost:3001/api/packs/${PACK_ID}/versions/${VERSION_ID}/saved-assessment/compliance-matrix/excel" \
  -o "compliance-matrix.xlsx"
```

### Using Browser Address Bar

If you know your Pack ID and Version ID:

```
http://localhost:3001/api/packs/PACK_ID/versions/VERSION_ID/saved-assessment/submission-readiness/download
```

Paste in browser address bar → File downloads automatically

---

## How to Find Pack ID and Version ID

### Method 1: From URL
When viewing a pack, the URL contains the IDs:
```
http://localhost:5173/packs/abc123/versions/xyz789/results
                          ^^^^^^            ^^^^^^^
                         Pack ID         Version ID
```

### Method 2: From Browser Console
```javascript
// On the results page
console.log(window.location.pathname);
// Example: /packs/abc123/versions/xyz789/results
```

### Method 3: From Database
```bash
# If you have database access
npx prisma studio
# Browse Pack and PackVersion tables
```

---

## Why the Export Button Doesn't Work

### Possible Causes

1. **Frontend/Backend Mismatch**
   - Frontend calling old/deprecated endpoint
   - Backend routes changed but frontend not updated

2. **CORS Issues**
   - Browser blocking cross-origin requests
   - Check browser console for CORS errors

3. **Modal Not Opening**
   - ExportOptionsModal not rendering
   - JavaScript error preventing modal display

4. **Blob Download Blocked**
   - Browser security settings
   - Pop-up blocker interfering

### Debug Steps

1. **Check Browser Console** (F12)
   ```
   Look for:
   - Red error messages
   - Failed network requests
   - JavaScript errors
   ```

2. **Check Network Tab** (F12 → Network)
   ```
   When you click "Export Report":
   - Is a POST request made to /api/packs/.../submission-readiness/download?
   - What is the response status? (200, 404, 500?)
   - What is the response body?
   ```

3. **Check if Modal Opens**
   ```
   Click "Export Report"
   - Does ExportOptionsModal appear?
   - Can you select "Full Assessment Report"?
   - Does "Export PDF" button appear?
   ```

---

## Recommended Fix: Add Missing Endpoints

The ClientDetail page tries to download from endpoints that don't exist. Add these to `src/routes/export.ts`:

### 1. Client Gap Analysis Endpoint

```typescript
router.get(
  '/packs/:packId/versions/:versionId/saved-assessment/client-gap-analysis',
  async (req: Request, res: Response) => {
    try {
      const { versionId } = req.params;

      const version = await prisma.packVersion.findUnique({
        where: { id: versionId },
        include: { pack: { select: { name: true } } }
      });

      if (!version?.matrixAssessment) {
        res.status(404).json({ error: 'No saved assessment found' });
        return;
      }

      const assessment = typeof version.matrixAssessment === 'string'
        ? JSON.parse(version.matrixAssessment)
        : version.matrixAssessment;

      // Generate HTML using submission readiness template (same content)
      const html = generateSubmissionReadinessHTML(assessment);
      const tempFile = await generatePDFFromHTML(html, 'client-gap-analysis');

      const filename = `client-gap-analysis-${version.pack.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`;
      streamPDFToResponse(tempFile, res, filename);

    } catch (error) {
      console.error('[Export] Error generating client gap analysis:', error);
      res.status(500).json({ error: 'Failed to generate PDF' });
    }
  }
);
```

### 2. Consultant Action Plan Endpoint

```typescript
router.get(
  '/packs/:packId/versions/:versionId/saved-assessment/consultant-action-plan',
  async (req: Request, res: Response) => {
    try {
      const { versionId } = req.params;

      const version = await prisma.packVersion.findUnique({
        where: { id: versionId },
        include: { pack: { select: { name: true } } }
      });

      if (!version?.matrixAssessment) {
        res.status(404).json({ error: 'No saved assessment found' });
        return;
      }

      const assessment = typeof version.matrixAssessment === 'string'
        ? JSON.parse(version.matrixAssessment)
        : version.matrixAssessment;

      // Generate HTML using submission readiness template (same content)
      const html = generateSubmissionReadinessHTML(assessment);
      const tempFile = await generatePDFFromHTML(html, 'consultant-action-plan');

      const filename = `consultant-action-plan-${version.pack.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`;
      streamPDFToResponse(tempFile, res, filename);

    } catch (error) {
      console.error('[Export] Error generating consultant action plan:', error);
      res.status(500).json({ error: 'Failed to generate PDF' });
    }
  }
);
```

---

## Quick Fix: Update ClientDetail to Use Working Endpoint

**File**: `packages/frontend/src/pages/ClientDetail.tsx`

**Replace** lines 126-169 (client-gap-analysis and consultant-action-plan) with:

```typescript
// Download Submission Readiness Report (working endpoint)
const submissionReadinessUrl = `/api/packs/${packId}/versions/${versionId}/saved-assessment/submission-readiness/download`;
console.log(`[ClientDetail] Fetching submission readiness from: ${submissionReadinessUrl}`);

const submissionReadinessRes = await fetch(submissionReadinessUrl);
console.log(`[ClientDetail] Submission readiness response status: ${submissionReadinessRes.status}`);

if (!submissionReadinessRes.ok) {
  const errorText = await submissionReadinessRes.text();
  console.error(`[ClientDetail] Submission readiness error:`, errorText);
  throw new Error(`Failed to download submission readiness: ${errorText}`);
}

const submissionReadinessBlob = await submissionReadinessRes.blob();
const submissionReadinessBlobUrl = window.URL.createObjectURL(submissionReadinessBlob);
const submissionReadinessLink = document.createElement('a');
submissionReadinessLink.href = submissionReadinessBlobUrl;
submissionReadinessLink.download = `submission-readiness-${new Date().toISOString().split('T')[0]}.pdf`;
submissionReadinessLink.click();
window.URL.revokeObjectURL(submissionReadinessBlobUrl);

await new Promise(resolve => setTimeout(resolve, 500));
```

This downloads the working Submission Readiness PDF instead of the missing Client Gap Analysis.

---

## Summary

### ✅ Working Workaround (Right Now)

1. Save assessment to client
2. Go to Clients page
3. Use browser console to download:
   ```javascript
   fetch('/api/packs/YOUR_PACK_ID/versions/YOUR_VERSION_ID/saved-assessment/submission-readiness/download')
     .then(res => res.blob())
     .then(blob => {
       const url = window.URL.createObjectURL(blob);
       const a = document.createElement('a');
       a.href = url;
       a.download = 'report.pdf';
       a.click();
     });
   ```

### 🔧 Recommended Fixes

1. **Add missing endpoints** (client-gap-analysis, consultant-action-plan)
2. **OR update ClientDetail.tsx** to use submission-readiness endpoint
3. **Debug why Export Report button doesn't work** (check browser console)

### 📊 Current Status

| Endpoint | Status | Available From |
|----------|--------|----------------|
| Submission Readiness PDF | ✅ Working | Saved assessments |
| Compliance Matrix Excel | ✅ Working | Saved assessments |
| Client Gap Analysis PDF | ❌ Missing | Not available |
| Consultant Action Plan PDF | ❌ Missing | Not available |

The "Save to Client" approach works because it stores the assessment in the database, then downloads from stable GET endpoints rather than trying to download from the in-memory POST endpoint.

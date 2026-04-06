# PDF Download Guide

## Overview

The application provides two main PDF exports:
1. **Submission Readiness Report** (3-5 page summary PDF)
2. **Compliance Matrix Excel** (detailed audit spreadsheet)

---

## How Users Download PDFs

### User Interface Flow

1. **Navigate to Results Dashboard**
   - After assessment completes, user sees the results page
   - Dashboard shows submission gate, quick wins, issues table, etc.

2. **Click "Export Report" Button**
   - Location: Top action bar in ResultsDashboard component
   - Button text: "📄 Export Report"

3. **Select Export Format**
   - ExportOptionsModal appears with 6 options:
     - **Full Assessment Report** (PDF) ← Most common
     - Executive Summary (PDF)
     - Issues List (Excel/CSV)
     - Specialist Briefs Pack (PDF Bundle)
     - Action Items Tracker (Excel)
     - Client Presentation (PowerPoint - coming soon)

4. **Customize Settings** (for full report):
   - Include Dashboard Summary
   - Include Evidence Quotes
   - Include Action Plan
   - Include Specialist Briefs

5. **Click "Export PDF" Button**
   - Browser initiates download automatically
   - File saves to Downloads folder

---

## Technical Implementation

### Frontend → Backend Flow

```
User clicks "Export Report"
    ↓
ResultsDashboard.handleOpenExportModal()
    ↓
ExportOptionsModal renders
    ↓
User selects format and clicks export
    ↓
ResultsDashboard.handleExport(format, options)
    ↓
exportService.exportComplianceReport(packId, versionId, assessment)
    ↓
POST /api/packs/:packId/versions/:versionId/submission-readiness/download
    ↓
Backend generates PDF using Puppeteer
    ↓
Streams PDF back to browser
    ↓
Browser auto-downloads file
```

---

## Code Locations

### Frontend

**Export Service**
- File: `packages/frontend/src/services/exportService.ts`
- Functions:
  - `exportComplianceReport()` - Main PDF export (lines 23-58)
  - `exportComplianceMatrixExcel()` - Excel export (lines 89-126)
  - `exportEngagementBrief()` - Specialist brief PDF (lines 229-264)
  - `exportIssuesCSV()` - CSV export (lines 146-224)
  - `exportAssessmentJSON()` - JSON export (lines 269-299)

**UI Components**
- Export Modal: `packages/frontend/src/components/ExportOptionsModal.tsx`
- Results Dashboard: `packages/frontend/src/components/ResultsDashboard.tsx`
  - Export button: Line 447-452
  - handleExport function: Lines 256-304

### Backend

**API Routes**
- File: `packages/backend/src/routes/export.ts`
- Routes:
  - `POST /packs/:packId/versions/:versionId/submission-readiness/download` (lines 33-65)
  - `POST /packs/:packId/versions/:versionId/compliance-matrix/excel` (lines 73-110)
  - `GET /packs/:packId/versions/:versionId/saved-assessment/compliance-matrix/excel` (lines 117-179)
  - `GET /packs/:packId/versions/:versionId/saved-assessment/submission-readiness/download` (lines 186-243)

**PDF Generation**
- File: `packages/backend/src/utils/pdf-generator.ts`
- Functions:
  - `generatePDFFromHTML()` - Convert HTML to PDF using Puppeteer (lines 34-70)
  - `streamPDFToResponse()` - Stream PDF to browser (lines 79-97)

**PDF Template**
- File: `packages/backend/src/templates/submission-readiness-report.js`
- Function: `generateSubmissionReadinessHTML(assessment)` - Creates HTML for PDF

**Excel Generation**
- File: `packages/backend/src/services/excel-export.ts`
- Function: `generateComplianceMatrixExcel(matrix)` - Creates Excel workbook

**Matrix Service**
- File: `packages/backend/src/services/compliance-matrix.ts`
- Function: `generateComplianceMatrix(assessment, projectName)` - Prepares data for Excel

---

## API Endpoints

### 1. Generate PDF from Current Assessment

```http
POST /api/packs/:packId/versions/:versionId/submission-readiness/download
Content-Type: application/json

{
  "assessment": { /* full assessment object */ }
}

Response:
- Content-Type: application/pdf
- Content-Disposition: attachment; filename="submission-readiness-2026-03-13.pdf"
- Body: PDF binary stream
```

### 2. Generate Excel from Current Assessment

```http
POST /api/packs/:packId/versions/:versionId/compliance-matrix/excel
Content-Type: application/json

{
  "assessment": { /* full assessment object */ },
  "projectName": "Riverside Tower"
}

Response:
- Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
- Content-Disposition: attachment; filename="evidence-matrix-2026-03-13.xlsx"
- Body: Excel binary stream
```

### 3. Generate PDF from Saved Assessment

```http
GET /api/packs/:packId/versions/:versionId/saved-assessment/submission-readiness/download

Response: PDF from database-saved assessment
```

### 4. Generate Excel from Saved Assessment

```http
GET /api/packs/:packId/versions/:versionId/saved-assessment/compliance-matrix/excel

Response: Excel from database-saved assessment
```

---

## Testing PDF Downloads Locally

### 1. Start Local Server

```bash
cd packages/backend
npm run dev
```

Server runs on: `http://localhost:3001`

### 2. Run Frontend

```bash
cd packages/frontend
npm run dev
```

Frontend runs on: `http://localhost:5173`

### 3. Test Download Flow

1. Navigate to `http://localhost:5173`
2. Create a pack and upload test documents
3. Run assessment
4. Click "Export Report" button
5. Select "Full Assessment Report"
6. Click "Export PDF"
7. Check Downloads folder for `submission-readiness-YYYY-MM-DD.pdf`

### 4. Test API Directly with cURL

```bash
# Test health endpoint
curl http://localhost:3001/api/health

# Test PDF generation (requires assessment data)
curl -X POST http://localhost:3001/api/packs/test-pack-id/versions/test-version-id/submission-readiness/download \
  -H "Content-Type: application/json" \
  -d '{"assessment":{...}}' \
  --output test-report.pdf
```

---

## Troubleshooting

### Issue: "Failed to generate PDF"

**Symptoms**: Export button shows loading state, then error message

**Possible Causes**:
1. **Puppeteer not installed**
   - Solution: `cd packages/backend && npm install puppeteer`

2. **Missing Chrome/Chromium dependencies (Linux)**
   - Solution: Install system dependencies
   ```bash
   sudo apt-get install -y \
     chromium-browser \
     libx11-xcb1 \
     libxcomposite1 \
     libxdamage1 \
     libxi6 \
     libxtst6 \
     libnss3 \
     libcups2 \
     libxss1 \
     libxrandr2 \
     libasound2 \
     libatk1.0-0 \
     libatk-bridge2.0-0 \
     libpangocairo-1.0-0 \
     libgtk-3-0
   ```

3. **Memory limits (containers/VMs)**
   - Solution: Increase Node.js memory
   ```bash
   NODE_OPTIONS=--max-old-space-size=4096 npm run dev
   ```

4. **Template rendering error**
   - Check logs: `console.error('[Export] Error generating...')`
   - Verify assessment object has required fields

### Issue: "Download starts but file is corrupt"

**Possible Causes**:
1. **Stream interrupted**
   - Check network tab in browser DevTools
   - Verify response completes

2. **Wrong Content-Type header**
   - Should be: `application/pdf`
   - Check: `pdf-generator.ts:84`

3. **Temp file deleted prematurely**
   - Check cleanup timing in `streamPDFToResponse()`

### Issue: "Download button doesn't appear"

**Possible Causes**:
1. **Assessment not loaded**
   - Check: `assessment` prop passed to ResultsDashboard

2. **Modal not rendering**
   - Check: `showExportModal` state
   - Verify ExportOptionsModal import

3. **Button hidden by CSS**
   - Inspect element in browser DevTools

---

## Browser Download Behavior

### How Downloads Work

The export service uses this pattern:

```typescript
const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'submission-readiness-2026-03-13.pdf';
document.body.appendChild(a);
a.click();
document.body.removeChild(a);
window.URL.revokeObjectURL(url);
```

### Browser Settings

**Chrome/Edge**:
- Downloads go to: `~/Downloads/` (default)
- Settings → Downloads → Location

**Firefox**:
- Can prompt for save location
- Settings → General → Downloads

**Safari**:
- Downloads go to: `~/Downloads/`
- Preferences → General → File download location

---

## Key Files Reference

```
packages/
├── frontend/
│   └── src/
│       ├── services/
│       │   └── exportService.ts          ← Export API calls
│       └── components/
│           ├── ResultsDashboard.tsx      ← Export button & handler
│           └── ExportOptionsModal.tsx    ← Export UI modal
│
└── backend/
    └── src/
        ├── routes/
        │   └── export.ts                 ← API routes
        ├── services/
        │   ├── compliance-matrix.ts      ← Matrix data preparation
        │   └── excel-export.ts           ← Excel generation
        ├── templates/
        │   └── submission-readiness-report.js  ← PDF HTML template
        └── utils/
            └── pdf-generator.ts          ← Puppeteer wrapper
```

---

## Next Steps for Development

### Enhancements

1. **Add engagement brief export**
   - Template exists but not wired up
   - File: `engagement-brief-generator.ts`

2. **Add PowerPoint export**
   - Currently shows "coming soon" alert
   - Consider: pptxgenjs library

3. **Add batch export**
   - Generate all reports in one ZIP file
   - Consider: archiver or jszip

4. **Add email delivery**
   - Send PDFs directly to stakeholders
   - Integrate: Nodemailer or SendGrid

### Testing

1. **Add unit tests**
   - Test PDF generation with sample data
   - Verify Excel formatting

2. **Add E2E tests**
   - Playwright/Cypress: full download flow
   - Verify file downloads correctly

3. **Add visual regression tests**
   - Percy or Chromatic for PDF screenshots
   - Ensure consistent formatting

---

## Summary

**To download PDFs**:
1. Click "📄 Export Report" button
2. Select format (Full Assessment Report)
3. Configure options
4. Click "Export PDF"
5. File downloads automatically

**Backend flow**:
- POST request → export.ts route → generatePDFFromHTML → Puppeteer → Stream PDF

**Frontend flow**:
- Button click → handleExport → exportService → fetch → blob → auto-download

**All working correctly** ✅ (routes registered, Puppeteer installed, templates exist)

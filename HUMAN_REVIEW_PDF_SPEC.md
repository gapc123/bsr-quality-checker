# Human Review Required - PDF Export Specification

## Overview

This document specifies how to generate a separate, professional PDF report containing **only** the items that require human judgment. This PDF is designed for specialists (fire engineers, structural engineers, etc.) to review and sign off on items that AI cannot confidently assess.

## Purpose

- Provide a focused, printable checklist for human reviewers
- Separate complex judgment calls from routine AI assessments
- Enable professional sign-off and documentation
- Track reviewer decisions and reasoning

## Document Structure

```
┌─────────────────────────────────────────────────────┐
│                    COVER PAGE                        │
│  - Title: "Human Review Required"                   │
│  - Project name                                      │
│  - Assessment date                                   │
│  - Total items requiring review                      │
│  - Critical items count                              │
│  - BSR branding/logo                                 │
└─────────────────────────────────────────────────────┘
│
├─ TABLE OF CONTENTS
│   - Organized by document or specialist
│   - Page numbers for each section
│
├─ EXECUTIVE SUMMARY
│   - Overview of why human review is needed
│   - Breakdown by document
│   - Breakdown by urgency
│   - Breakdown by specialist required
│
├─ REVIEW CHECKLIST (Quick Reference)
│   - Single-page checklist with checkboxes
│   - Issue ID, title, document, urgency
│   - Space for reviewer initials and date
│
├─ DETAILED REVIEW ITEMS
│   └─ For each issue:
│       ├─ Issue Header
│       │   - Issue ID (e.g., FS-001)
│       │   - Urgency badge (🔴 CRITICAL)
│       │   - Document reference
│       │   - Page number(s)
│       │
│       ├─ Issue Title & Description
│       │   - Clear statement of the issue
│       │   - Regulatory requirement
│       │
│       ├─ Why Human Review Required
│       │   - Reasoning from AI
│       │   - Specific complexity factors
│       │   - What AI cannot determine
│       │
│       ├─ Context & Evidence
│       │   - Relevant text from document
│       │   - Regulatory references
│       │   - Related standards (e.g., BS 9999, ADB)
│       │
│       ├─ Key Questions for Reviewer
│       │   - Specific questions to guide review
│       │   - Decision points
│       │
│       ├─ Reviewer Decision Section
│       │   - [ ] Meets requirements
│       │   - [ ] Partial compliance
│       │   - [ ] Does not meet requirements
│       │   - [ ] Requires further investigation
│       │
│       ├─ Reviewer Notes
│       │   - Large text box for detailed notes
│       │   - Space for calculations if needed
│       │
│       └─ Sign-off
│           - Reviewer name: _______________
│           - Date: _______________
│           - Professional qualification: _______________
│
├─ APPENDIX A: Regulatory References
│   - Full text of referenced regulations
│   - Standard excerpts (BS 9999, Approved Document B, etc.)
│
├─ APPENDIX B: Document Cross-References
│   - Map of which documents contain which issues
│   - Page number index
│
└─ SIGN-OFF PAGE
    - Lead Reviewer signature
    - Date
    - Overall assessment recommendation
    - Space for caveats or conditions
```

## Page Layout

### Cover Page

```
┌────────────────────────────────────────────────────┐
│                                                     │
│        [BSR Logo]                                   │
│                                                     │
│                                                     │
│           HUMAN REVIEW REQUIRED                     │
│           Assessment Report                         │
│                                                     │
│                                                     │
│  Project: [Project Name]                           │
│  Assessment Date: [Date]                           │
│  Report Generated: [Date & Time]                   │
│                                                     │
│                                                     │
│  ╔═══════════════════════════════════════════╗    │
│  ║     REVIEW SUMMARY                         ║    │
│  ╠═══════════════════════════════════════════╣    │
│  ║  Total Items Requiring Review: XX          ║    │
│  ║  Critical Items: XX                        ║    │
│  ║  High Priority Items: XX                   ║    │
│  ║  Medium Priority Items: XX                 ║    │
│  ╚═══════════════════════════════════════════╝    │
│                                                     │
│                                                     │
│  This report contains items that require           │
│  professional human judgment due to complexity,    │
│  ambiguity, or regulatory interpretation needs.    │
│                                                     │
│                                                     │
│  CONFIDENTIAL - For Professional Review Only       │
│                                                     │
└────────────────────────────────────────────────────┘
```

### Executive Summary Page

```
┌────────────────────────────────────────────────────┐
│  EXECUTIVE SUMMARY                                  │
│  ─────────────────────────────────────────────────│
│                                                     │
│  Overview                                           │
│  This report identifies [XX] items from the BSR    │
│  assessment that require professional human        │
│  judgment. These items involve complex regulatory  │
│  interpretations, ambiguous documentation, or      │
│  engineering decisions beyond AI capability.       │
│                                                     │
│  ┌──────────────────────────────────────────────┐ │
│  │ Breakdown by Document                        │ │
│  ├──────────────────────────────────────────────┤ │
│  │ Fire Strategy               12 items         │ │
│  │ Structural Report            5 items         │ │
│  │ Drawings Package             3 items         │ │
│  │ MEP Design Report            2 items         │ │
│  └──────────────────────────────────────────────┘ │
│                                                     │
│  ┌──────────────────────────────────────────────┐ │
│  │ Breakdown by Urgency                         │ │
│  ├──────────────────────────────────────────────┤ │
│  │ 🔴 CRITICAL_BLOCKER          8 items         │ │
│  │ 🟡 HIGH_PRIORITY             10 items        │ │
│  │ 🔵 MEDIUM_PRIORITY           4 items         │ │
│  └──────────────────────────────────────────────┘ │
│                                                     │
│  ┌──────────────────────────────────────────────┐ │
│  │ Specialist Required                          │ │
│  ├──────────────────────────────────────────────┤ │
│  │ Fire Safety Engineer         12 items        │ │
│  │ Structural Engineer           5 items        │ │
│  │ MEP Engineer                  3 items        │ │
│  │ Architect                     2 items        │ │
│  └──────────────────────────────────────────────┘ │
│                                                     │
│  Critical Issues Requiring Immediate Review        │
│  • FS-001: Fire door widths - complex layout      │
│  • ST-003: Structural load assessment ambiguity   │
│  • [List all critical items]                      │
│                                                     │
└────────────────────────────────────────────────────┘
```

### Review Checklist (Quick Reference)

```
┌────────────────────────────────────────────────────┐
│  REVIEW CHECKLIST                     Page X of Y   │
│  ─────────────────────────────────────────────────│
│                                                     │
│  Instructions: Check box when review complete,     │
│  initial, and date. Full details on following pages│
│                                                     │
│  ┌─┬────────┬─────────────────┬──────────┬───────┐│
│  │☐│FS-001  │Fire door widths │🔴CRITICAL│Doc: FS││
│  │ │        │[12 words max]   │Fire Eng  │Pg: 45 ││
│  │ │Initials: _____ Date: _______                ││
│  ├─┼────────┼─────────────────┼──────────┼───────┤│
│  │☐│ST-003  │Structural loads │🔴CRITICAL│Doc: SR││
│  │ │        │ambiguous calc   │Struct Eng│Pg: 23 ││
│  │ │Initials: _____ Date: _______                ││
│  ├─┼────────┼─────────────────┼──────────┼───────┤│
│  │☐│FS-012  │Compartment size │🟡HIGH    │Doc: FS││
│  │ │        │interpretation   │Fire Eng  │Pg: 67 ││
│  │ │Initials: _____ Date: _______                ││
│  ├─┼────────┼─────────────────┼──────────┼───────┤│
│  │☐│ME-005  │Ventilation rate │🟡HIGH    │Doc: ME││
│  │ │        │unclear standard │MEP Eng   │Pg: 34 ││
│  │ │Initials: _____ Date: _______                ││
│  └─┴────────┴─────────────────┴──────────┴───────┘│
│                                                     │
│  [Continue for all items]                          │
│                                                     │
└────────────────────────────────────────────────────┘
```

### Detailed Review Item Page

```
┌────────────────────────────────────────────────────┐
│  🔴 CRITICAL BLOCKER          FS-001  Fire Strategy│
│  ─────────────────────────────────────────────────│
│                                                     │
│  FIRE DOOR WIDTHS - COMPLEX LAYOUT ASSESSMENT      │
│                                                     │
│  Document: Fire Safety Strategy Report             │
│  Page(s): 45-47                                    │
│  Section: 4.3 Means of Escape                      │
│  Regulatory: Approved Document B, BS 9999:2017     │
│                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  ISSUE DESCRIPTION                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                     │
│  The Fire Strategy states that fire doors in the   │
│  protected corridors are 900mm wide. However, the  │
│  layout shows doors serving areas with occupancy   │
│  exceeding 60 persons. Calculation of required     │
│  escape width based on occupancy density needs     │
│  verification against BS 9999:2017 Table 6.        │
│                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  WHY HUMAN REVIEW REQUIRED                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                     │
│  ⚠️ Complexity Factors:                            │
│                                                     │
│  • Multiple occupancy calculations required         │
│  • Cross-reference between drawings and strategy   │
│    document needed                                  │
│  • Professional judgment on occupancy density       │
│    assumptions                                      │
│  • Consideration of phased evacuation vs           │
│    simultaneous evacuation                          │
│  • Assessment of whether doors are 'final exits'   │
│    or intermediate doors                            │
│                                                     │
│  AI Limitation:                                     │
│  "Cannot reliably extract occupancy numbers from   │
│  architectural drawings without human verification │
│  of room use and density assumptions. Professional │
│  fire engineer judgment required for escape width  │
│  calculations in complex multi-use layouts."       │
│                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  CONTEXT & EVIDENCE                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                     │
│  Extract from Fire Strategy (Page 45):             │
│  "All doors leading from protected corridors to    │
│  the staircase enclosures are 900mm clear width,   │
│  meeting the minimum requirement for residential   │
│  buildings."                                        │
│                                                     │
│  Relevant Standard (BS 9999:2017, Table 6):        │
│  - Minimum door width: 750mm                        │
│  - For occupancy >60: calculate 5mm per person     │
│  - Final exits: minimum 1050mm for >220 persons    │
│                                                     │
│  Approved Document B, Section 3:                   │
│  "The width of escape routes and exits shall be    │
│  sufficient for the number of persons needing to   │
│  use them in an emergency."                        │
│                                                     │
│  Related Documents:                                 │
│  • Architectural Drawings: GA-100 (Floor plans)    │
│  • Occupancy Schedule: Schedule A (if available)   │
│                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  KEY QUESTIONS FOR REVIEWER                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                     │
│  1. What is the actual occupancy for areas served  │
│     by these doors?                                 │
│                                                     │
│  2. Are these doors classified as 'final exits' or │
│     intermediate doors within the escape route?    │
│                                                     │
│  3. Is the evacuation strategy simultaneous or     │
│     phased? How does this affect width calculation?│
│                                                     │
│  4. Do the 900mm doors meet BS 9999:2017 Table 6   │
│     requirements for the calculated occupancy?     │
│                                                     │
│  5. Are there any other factors (wheelchair users, │
│     bed evacuation) that affect required width?    │
│                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  REVIEWER DECISION                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                     │
│  After reviewing the fire strategy, drawings, and  │
│  occupancy data, I determine that:                 │
│                                                     │
│  ☐ Meets requirements                              │
│     Rationale: ________________________________    │
│     _________________________________________      │
│                                                     │
│  ☐ Partial compliance                              │
│     Rationale: ________________________________    │
│     _________________________________________      │
│     Required actions: _________________________    │
│     _________________________________________      │
│                                                     │
│  ☐ Does not meet requirements                      │
│     Rationale: ________________________________    │
│     _________________________________________      │
│     Required actions: _________________________    │
│     _________________________________________      │
│                                                     │
│  ☐ Requires further investigation                  │
│     Information needed: _______________________    │
│     _________________________________________      │
│                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  DETAILED REVIEWER NOTES                            │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                     │
│  [Large text box - minimum 10 lines]               │
│                                                     │
│  Space for:                                         │
│  • Calculations                                     │
│  • Cross-references to other documents             │
│  • Professional observations                        │
│  • Conditions or caveats                           │
│  • Follow-up items                                 │
│                                                     │
│  _________________________________________________  │
│  _________________________________________________  │
│  _________________________________________________  │
│  _________________________________________________  │
│  _________________________________________________  │
│  _________________________________________________  │
│  _________________________________________________  │
│  _________________________________________________  │
│  _________________________________________________  │
│  _________________________________________________  │
│                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  SIGN-OFF                                           │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                     │
│  Reviewer Name: _______________________________    │
│                                                     │
│  Professional Qualification: ___________________   │
│  (e.g., CEng, FIFireE, RIBA, etc.)                │
│                                                     │
│  Date: ___________________                         │
│                                                     │
│  Signature: _______________________________        │
│                                                     │
└────────────────────────────────────────────────────┘
```

### Final Sign-Off Page

```
┌────────────────────────────────────────────────────┐
│  OVERALL ASSESSMENT SIGN-OFF                        │
│  ─────────────────────────────────────────────────│
│                                                     │
│  Project: [Project Name]                           │
│  Assessment Date: [Date]                           │
│                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  REVIEW COMPLETION SUMMARY                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                     │
│  Total Items Reviewed: ___ of ___                  │
│                                                     │
│  Items Meeting Requirements: ___                   │
│  Items Partially Compliant: ___                    │
│  Items Not Meeting Requirements: ___               │
│  Items Requiring Further Investigation: ___        │
│                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  OVERALL RECOMMENDATION                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                     │
│  Based on human review of all items requiring      │
│  professional judgment, the overall assessment is: │
│                                                     │
│  ☐ READY FOR SUBMISSION                            │
│     All critical items resolved                    │
│                                                     │
│  ☐ READY WITH CONDITIONS                           │
│     Submission possible with caveats (list below)  │
│                                                     │
│  ☐ NOT READY - MINOR ISSUES                        │
│     Can be resolved in 1-2 weeks                   │
│                                                     │
│  ☐ NOT READY - MAJOR ISSUES                        │
│     Requires substantial rework (1+ months)        │
│                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  CONDITIONS / CAVEATS                               │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                     │
│  _________________________________________________  │
│  _________________________________________________  │
│  _________________________________________________  │
│  _________________________________________________  │
│  _________________________________________________  │
│                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  LEAD REVIEWER SIGN-OFF                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                     │
│  I confirm that I have reviewed all items in this  │
│  report requiring human judgment and have provided │
│  professional assessment based on current          │
│  regulations and engineering practice.             │
│                                                     │
│  Lead Reviewer Name: _____________________________  │
│                                                     │
│  Professional Qualification: _____________________  │
│                                                     │
│  Date: ___________________                         │
│                                                     │
│  Signature: _______________________________        │
│                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  ADDITIONAL REVIEWERS (IF APPLICABLE)               │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                     │
│  Reviewer 2: _____________________________________  │
│  Qualification: ___________________________________  │
│  Date: ____________ Signature: ___________________  │
│                                                     │
│  Reviewer 3: _____________________________________  │
│  Qualification: ___________________________________  │
│  Date: ____________ Signature: ___________________  │
│                                                     │
└────────────────────────────────────────────────────┘
```

## Data Filtering

The PDF should **only** include issues where:

```typescript
issue.confidence?.level === 'REQUIRES_HUMAN_JUDGEMENT' ||
issue.confidence?.can_system_act === false
```

## Sorting & Grouping

### Default Sort Order:
1. **By Urgency** (descending)
   - CRITICAL_BLOCKER
   - HIGH_PRIORITY
   - MEDIUM_PRIORITY
   - LOW_PRIORITY

2. **By Document** (alphabetical)

3. **By Issue ID** (alphanumeric)

### Alternative Grouping Options:

**Group by Specialist:**
- Fire Safety Engineer
- Structural Engineer
- MEP Engineer
- Architect
- Client/Developer

**Group by Document:**
- Fire Safety Strategy
- Structural Report
- Architectural Drawings
- MEP Report
- Other

## Styling Guidelines

### Typography:
- **Headings**: Helvetica Bold, 16pt
- **Subheadings**: Helvetica Bold, 12pt
- **Body Text**: Helvetica, 10pt
- **Monospace** (Issue IDs): Courier New, 10pt

### Colors:
- **Critical (🔴)**: RGB(220, 38, 38) - Red
- **High Priority (🟡)**: RGB(245, 158, 11) - Amber
- **Medium Priority (🔵)**: RGB(59, 130, 246) - Blue
- **Low Priority (⚪)**: RGB(156, 163, 175) - Gray

### Spacing:
- **Page margins**: 2cm all sides
- **Section spacing**: 12pt before/after
- **Line spacing**: 1.2

### Branding:
- BSR logo in header (top-right)
- Footer: "BSR Quality Checker | Human Review Report | Page X of Y"
- Confidentiality notice on each page

## Implementation Example (Node.js + PDFKit)

```javascript
const PDFDocument = require('pdfkit');
const fs = require('fs');

/**
 * Generate Human Review PDF
 * @param {AssessmentResult[]} issues - All assessment issues
 * @param {ProjectContext} projectContext - Project details
 * @param {string} outputPath - Where to save PDF
 */
async function generateHumanReviewPDF(issues, projectContext, outputPath) {
  // Filter only human review items
  const humanReviewIssues = issues.filter(issue =>
    issue.confidence?.level === 'REQUIRES_HUMAN_JUDGEMENT' ||
    issue.confidence?.can_system_act === false
  );

  // Sort by urgency (critical first)
  const urgencyOrder = {
    'CRITICAL_BLOCKER': 0,
    'HIGH_PRIORITY': 1,
    'MEDIUM_PRIORITY': 2,
    'LOW_PRIORITY': 3
  };

  humanReviewIssues.sort((a, b) => {
    const urgencyDiff = (urgencyOrder[a.triage?.urgency] || 99) -
                       (urgencyOrder[b.triage?.urgency] || 99);
    if (urgencyDiff !== 0) return urgencyDiff;

    // Then by document
    return (a.pack_evidence.document || '').localeCompare(b.pack_evidence.document || '');
  });

  // Create PDF
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    info: {
      Title: `Human Review Required - ${projectContext.projectName}`,
      Author: 'BSR Quality Checker',
      Subject: 'Items Requiring Professional Judgment',
      Keywords: 'BSR, Human Review, Assessment'
    }
  });

  doc.pipe(fs.createWriteStream(outputPath));

  // --- COVER PAGE ---
  addCoverPage(doc, humanReviewIssues, projectContext);

  // --- TABLE OF CONTENTS ---
  doc.addPage();
  addTableOfContents(doc, humanReviewIssues);

  // --- EXECUTIVE SUMMARY ---
  doc.addPage();
  addExecutiveSummary(doc, humanReviewIssues, projectContext);

  // --- REVIEW CHECKLIST ---
  doc.addPage();
  addReviewChecklist(doc, humanReviewIssues);

  // --- DETAILED REVIEW ITEMS ---
  humanReviewIssues.forEach((issue, index) => {
    doc.addPage();
    addDetailedReviewItem(doc, issue, index, humanReviewIssues.length);
  });

  // --- APPENDICES ---
  doc.addPage();
  addRegulatoryReferences(doc, humanReviewIssues);

  doc.addPage();
  addDocumentCrossReferences(doc, humanReviewIssues);

  // --- SIGN-OFF PAGE ---
  doc.addPage();
  addSignOffPage(doc, humanReviewIssues, projectContext);

  doc.end();
}

function addCoverPage(doc, issues, projectContext) {
  // Add logo
  // doc.image('path/to/bsr-logo.png', 450, 50, { width: 100 });

  doc.fontSize(28)
     .font('Helvetica-Bold')
     .text('HUMAN REVIEW REQUIRED', 50, 200, { align: 'center' });

  doc.fontSize(18)
     .text('Assessment Report', 50, 240, { align: 'center' });

  doc.fontSize(12)
     .font('Helvetica')
     .text(`Project: ${projectContext.projectName}`, 50, 300, { align: 'center' });

  doc.text(`Assessment Date: ${new Date().toLocaleDateString()}`, 50, 320, { align: 'center' });
  doc.text(`Report Generated: ${new Date().toLocaleString()}`, 50, 340, { align: 'center' });

  // Summary box
  const criticalCount = issues.filter(i => i.triage?.urgency === 'CRITICAL_BLOCKER').length;
  const highCount = issues.filter(i => i.triage?.urgency === 'HIGH_PRIORITY').length;
  const mediumCount = issues.filter(i => i.triage?.urgency === 'MEDIUM_PRIORITY').length;

  doc.rect(150, 380, 300, 150).stroke();

  doc.fontSize(14)
     .font('Helvetica-Bold')
     .text('REVIEW SUMMARY', 150, 395, { width: 300, align: 'center' });

  doc.fontSize(11)
     .font('Helvetica')
     .text(`Total Items Requiring Review: ${issues.length}`, 170, 430)
     .text(`Critical Items: ${criticalCount}`, 170, 450)
     .text(`High Priority Items: ${highCount}`, 170, 470)
     .text(`Medium Priority Items: ${mediumCount}`, 170, 490);

  doc.fontSize(9)
     .text('This report contains items that require professional human judgment', 50, 570, { align: 'center' })
     .text('due to complexity, ambiguity, or regulatory interpretation needs.', 50, 585, { align: 'center' });

  doc.fontSize(8)
     .text('CONFIDENTIAL - For Professional Review Only', 50, 750, { align: 'center' });
}

function addDetailedReviewItem(doc, issue, index, total) {
  // Header with urgency badge
  const urgencyColor = getUrgencyColor(issue.triage?.urgency);
  const urgencyEmoji = getUrgencyEmoji(issue.triage?.urgency);

  doc.fontSize(14)
     .font('Helvetica-Bold')
     .fillColor(urgencyColor)
     .text(`${urgencyEmoji} ${issue.triage?.urgency || 'UNASSESSED'}`, 50, 50);

  doc.fillColor('black')
     .fontSize(10)
     .text(`${issue.matrix_id}  |  ${issue.pack_evidence.document}`, 350, 55, { align: 'right' });

  // Issue title
  doc.fontSize(13)
     .font('Helvetica-Bold')
     .fillColor('black')
     .text(issue.matrix_title.toUpperCase(), 50, 80, { width: 500 });

  // Document reference
  doc.fontSize(9)
     .font('Helvetica')
     .text(`Document: ${issue.pack_evidence.document}`, 50, 110)
     .text(`Page(s): ${issue.pack_evidence.page_number || 'N/A'}`, 50, 125)
     .text(`Section: ${issue.pack_evidence.section || 'N/A'}`, 50, 140)
     .text(`Regulatory: ${issue.matrix_references?.join(', ') || 'N/A'}`, 50, 155);

  // Section: Issue Description
  addSection(doc, 'ISSUE DESCRIPTION', 185);
  doc.fontSize(9)
     .font('Helvetica')
     .text(issue.reasoning || 'No description available.', 50, 200, { width: 500, align: 'justify' });

  // Section: Why Human Review Required
  addSection(doc, 'WHY HUMAN REVIEW REQUIRED', 240);
  doc.fontSize(9)
     .font('Helvetica-Bold')
     .text('⚠️  Complexity Factors:', 50, 255);

  doc.font('Helvetica')
     .text(issue.confidence?.reasoning || 'Professional judgment required.', 50, 270, { width: 500 });

  doc.fontSize(8)
     .font('Helvetica-Oblique')
     .text('AI Limitation:', 50, 310)
     .font('Helvetica')
     .text(issue.confidence?.reasoning || 'Cannot assess without human expertise.', 50, 325, { width: 500 });

  // Section: Context & Evidence
  addSection(doc, 'CONTEXT & EVIDENCE', 360);
  if (issue.pack_evidence.text_evidence) {
    doc.fontSize(8)
       .font('Helvetica-Oblique')
       .text(`Extract from ${issue.pack_evidence.document}:`, 50, 375);

    doc.fontSize(8)
       .font('Helvetica')
       .text(issue.pack_evidence.text_evidence.substring(0, 300) + '...', 50, 390, { width: 500 });
  }

  // Section: Key Questions for Reviewer
  addSection(doc, 'KEY QUESTIONS FOR REVIEWER', 450);
  doc.fontSize(9)
     .font('Helvetica')
     .text('1. [Specific question based on issue type]', 50, 465)
     .text('2. [Decision points]', 50, 485)
     .text('3. [Additional considerations]', 50, 505);

  // Section: Reviewer Decision
  addSection(doc, 'REVIEWER DECISION', 540);

  const checkboxX = 60;
  let checkboxY = 555;

  drawCheckbox(doc, checkboxX, checkboxY);
  doc.fontSize(9).text('Meets requirements', checkboxX + 20, checkboxY + 2);

  checkboxY += 20;
  drawCheckbox(doc, checkboxX, checkboxY);
  doc.text('Partial compliance', checkboxX + 20, checkboxY + 2);

  checkboxY += 20;
  drawCheckbox(doc, checkboxX, checkboxY);
  doc.text('Does not meet requirements', checkboxX + 20, checkboxY + 2);

  checkboxY += 20;
  drawCheckbox(doc, checkboxX, checkboxY);
  doc.text('Requires further investigation', checkboxX + 20, checkboxY + 2);

  // Section: Reviewer Notes
  addSection(doc, 'DETAILED REVIEWER NOTES', 650);
  doc.rect(50, 665, 500, 80).stroke();

  // Sign-off
  addSection(doc, 'SIGN-OFF', 755);
  doc.fontSize(8)
     .text('Reviewer Name: _________________________________', 50, 770)
     .text('Professional Qualification: _________________________________', 300, 770)
     .text('Date: __________________', 50, 790)
     .text('Signature: _________________________________', 200, 790);
}

function addSection(doc, title, y) {
  doc.fontSize(10)
     .font('Helvetica-Bold')
     .text(title, 50, y);

  doc.moveTo(50, y + 12)
     .lineTo(550, y + 12)
     .stroke();
}

function drawCheckbox(doc, x, y) {
  doc.rect(x, y, 10, 10).stroke();
}

function getUrgencyColor(urgency) {
  switch (urgency) {
    case 'CRITICAL_BLOCKER': return '#DC2626';
    case 'HIGH_PRIORITY': return '#F59E0B';
    case 'MEDIUM_PRIORITY': return '#3B82F6';
    default: return '#9CA3AF';
  }
}

function getUrgencyEmoji(urgency) {
  switch (urgency) {
    case 'CRITICAL_BLOCKER': return '🔴';
    case 'HIGH_PRIORITY': return '🟡';
    case 'MEDIUM_PRIORITY': return '🔵';
    default: return '⚪';
  }
}

// Export function
module.exports = { generateHumanReviewPDF };
```

## API Endpoint

```typescript
// POST /api/packs/:packId/versions/:versionId/export/human-review
app.post('/api/packs/:packId/versions/:versionId/export/human-review', async (req, res) => {
  const { packId, versionId } = req.params;
  const { groupBy, includeAppendices } = req.body;

  // Fetch assessment
  const assessment = await getAssessment(packId, versionId);
  const projectContext = await getProjectContext(packId);

  // Generate PDF
  const pdfPath = `/tmp/human-review-${versionId}.pdf`;
  await generateHumanReviewPDF(
    assessment.results,
    projectContext,
    pdfPath
  );

  // Send to client
  res.contentType('application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="Human-Review-Required-${projectContext.projectName}.pdf"`);
  res.sendFile(pdfPath);
});
```

## Integration with HumanReviewTable Component

The HumanReviewTable component (already created) includes an "Export Human Review PDF" button:

```tsx
<button
  onClick={onExportPdf}
  className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
>
  📄 Export Human Review PDF
</button>
```

The parent component should implement `onExportPdf`:

```typescript
const handleExportHumanReviewPdf = async () => {
  try {
    const response = await fetch(
      `/api/packs/${packId}/versions/${versionId}/export/human-review`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupBy: 'urgency', // or 'document' or 'specialist'
          includeAppendices: true
        })
      }
    );

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Human-Review-Required-${projectName}.pdf`;
    a.click();
  } catch (error) {
    console.error('Failed to export Human Review PDF:', error);
  }
};
```

## Key Features

✅ **Focused**: Only items requiring human judgment
✅ **Professional**: Formatted for specialist sign-off
✅ **Actionable**: Clear questions and decision boxes
✅ **Trackable**: Checklist for progress monitoring
✅ **Branded**: Matches main assessment PDF branding
✅ **Comprehensive**: Includes all context needed for review
✅ **Signable**: Professional sign-off pages included

## Next Steps

1. Implement PDF generation backend using PDFKit or similar
2. Add thumbnail preview in HumanReviewTable
3. Add email functionality to send PDF to reviewers
4. Track PDF generation history
5. Allow re-generation after reviews are updated

---

This specification completes the human review tracking system alongside the HumanReviewTable component.

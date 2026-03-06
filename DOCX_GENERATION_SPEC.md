# DOCX Generation Specification

## Requirement: Editable Word Document Indistinguishable from PDF

The generated DOCX must be **visually identical** to the uploaded PDF while incorporating AI changes as Microsoft Word Track Changes.

---

## Core Requirements

### 1. Visual Fidelity
✅ Exact same branding (logos, colors, fonts)
✅ Identical page layout and margins
✅ Same heading styles and hierarchy
✅ Matching tables, lists, and formatting
✅ Preserved page breaks and spacing
✅ Same footer/header content

### 2. Track Changes Integration
✅ AI changes shown as Word track changes (insertions/deletions)
✅ Each change has a comment explaining the reasoning
✅ Changes grouped by confidence level (different colors)
✅ All changes attributed to "AI Assistant" author

### 3. Human Judgment Markers
✅ Areas requiring human judgment highlighted in RED
✅ Comments flagged with "⚠️ HUMAN REVIEW REQUIRED"
✅ Explanation of why AI cannot determine correct approach
✅ Links to relevant BSR regulations for context

### 4. Actionable Changes
✅ Each change can be individually accepted/rejected in Word
✅ Changes don't break document structure when accepted
✅ Changes preserve cross-references and formatting
✅ Acceptance checklist in cover page

---

## Technical Implementation

### Step 1: Extract PDF Structure

Use PDF parsing library (e.g., `pdf-lib`, `pdfjs-dist`, `pdf-parse`) to extract:

```javascript
{
  metadata: {
    title: "Fire Safety Strategy - Riverside Tower",
    author: "Engineering Firm Ltd",
    date: "2024-01-15",
    pages: 45
  },
  styles: {
    fonts: ["Arial", "Calibri", "Times New Roman"],
    colors: {
      primary: "#003366",
      secondary: "#CC0000",
      text: "#000000"
    },
    pageSize: "A4",
    margins: { top: 25.4, right: 25.4, bottom: 25.4, left: 25.4 } // mm
  },
  structure: [
    {
      type: "header",
      content: "FIRE SAFETY STRATEGY",
      style: "Heading1",
      page: 1
    },
    {
      type: "paragraph",
      content: "This document presents...",
      style: "BodyText",
      page: 1
    },
    {
      type: "section",
      title: "1. Introduction",
      style: "Heading2",
      page: 2,
      content: [...]
    },
    // ... rest of structure
  ],
  images: [
    {
      page: 1,
      position: { x: 50, y: 50 },
      src: "data:image/png;base64,..."
    }
  ],
  tables: [
    {
      page: 5,
      rows: 8,
      columns: 4,
      data: [[...], [...]]
    }
  ]
}
```

### Step 2: Generate Base DOCX

Use `docx` npm package to create Word document matching PDF structure:

```javascript
import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, Header, Footer } from 'docx';

const doc = new Document({
  creator: "BSR Quality Checker",
  title: metadata.title,
  description: "AI-revised document with track changes",

  styles: {
    default: {
      document: {
        run: {
          font: "Calibri",
          size: 22, // 11pt
        },
        paragraph: {
          spacing: { line: 276, before: 0, after: 120 }
        }
      }
    },
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        run: {
          font: "Arial",
          size: 32, // 16pt
          bold: true,
          color: "003366" // Company primary color
        },
        paragraph: {
          spacing: { before: 480, after: 240 }
        }
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        run: {
          font: "Arial",
          size: 28, // 14pt
          bold: true,
          color: "003366"
        },
        paragraph: {
          spacing: { before: 360, after: 180 }
        }
      },
      {
        id: "BodyText",
        name: "Body Text",
        basedOn: "Normal",
        run: {
          font: "Calibri",
          size: 22 // 11pt
        },
        paragraph: {
          spacing: { line: 276, after: 120 }
        }
      }
    ]
  },

  sections: [
    {
      properties: {
        page: {
          margin: {
            top: 720,    // 25.4mm in twips
            right: 720,
            bottom: 720,
            left: 720
          },
          size: {
            width: 11906,  // A4 width in twips
            height: 16838  // A4 height in twips
          }
        }
      },

      headers: {
        default: new Header({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "FIRE SAFETY STRATEGY",
                  font: "Arial",
                  size: 20,
                  bold: true,
                  color: "003366"
                })
              ],
              alignment: AlignmentType.CENTER
            })
          ]
        })
      },

      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Engineering Firm Ltd | Page ",
                  font: "Calibri",
                  size: 18,
                  color: "666666"
                }),
                // Page number field
              ],
              alignment: AlignmentType.CENTER
            })
          ]
        })
      },

      children: [
        // Document content goes here
      ]
    }
  ]
});
```

### Step 3: Add AI Changes as Track Changes

**High Confidence Changes** (Green - can_system_act: true):

```javascript
// Deletion (strikethrough)
new TextRun({
  text: "Fire doors shall be 800mm wide",
  strike: true,
  color: "FF0000", // Red for deletion
  revision: {
    id: 1,
    author: "AI Assistant",
    date: new Date(),
    type: "deletion"
  }
})

// Insertion (underline)
new TextRun({
  text: "Fire doors shall be minimum 850mm clear opening width in accordance with BS 9999:2017 clause 18.3",
  underline: { type: "single" },
  color: "0000FF", // Blue for insertion
  revision: {
    id: 2,
    author: "AI Assistant",
    date: new Date(),
    type: "insertion"
  }
})

// Add comment explaining change
new Comment({
  id: 2,
  author: "AI Assistant",
  date: new Date(),
  children: [
    new Paragraph({
      children: [
        new TextRun({
          text: "✅ HIGH CONFIDENCE\n\n",
          bold: true,
          color: "00AA00"
        }),
        new TextRun({
          text: "Reasoning: BS 9999:2017 specifies minimum 850mm clear opening width. Current specification of 800mm does not meet requirements.\n\n"
        }),
        new TextRun({
          text: "Evidence: Pack doc page 12 states '800mm'; BS 9999:2017 clause 18.3 requires 850mm minimum.\n\n"
        }),
        new TextRun({
          text: "Recommendation: Accept this change to ensure compliance."
        })
      ]
    })
  ]
})
```

**Medium Confidence Changes** (Amber - review recommended):

```javascript
new TextRun({
  text: "evacuation time of 2.5 minutes",
  strike: true,
  color: "FF0000",
  revision: {
    id: 3,
    author: "AI Assistant",
    date: new Date(),
    type: "deletion"
  }
})

new TextRun({
  text: "evacuation time of 3 minutes as per BS 9999 travel distance calculations",
  underline: { type: "single" },
  color: "FF6600", // Orange for medium confidence
  revision: {
    id: 4,
    author: "AI Assistant",
    date: new Date(),
    type: "insertion"
  }
})

new Comment({
  id: 4,
  author: "AI Assistant",
  date: new Date(),
  children: [
    new Paragraph({
      children: [
        new TextRun({
          text: "⚠️ MEDIUM CONFIDENCE - REVIEW RECOMMENDED\n\n",
          bold: true,
          color: "FF8800"
        }),
        new TextRun({
          text: "Reasoning: Calculated evacuation time based on maximum travel distance of 45m suggests 3 minutes is more appropriate than stated 2.5 minutes.\n\n"
        }),
        new TextRun({
          text: "Uncertainty: Depends on occupancy profile and stair capacity not fully detailed in submission. Verify against full calculations.\n\n"
        }),
        new TextRun({
          text: "Recommendation: Review against detailed evacuation calculations before accepting."
        })
      ]
    })
  ]
})
```

**Requires Human Judgment** (Red - AI cannot determine):

```javascript
// Highlight the section in red
new Paragraph({
  children: [
    new TextRun({
      text: "The means of escape strategy relies on a phased evacuation approach with simultaneous evacuation of the fire floor and floor above.",
      highlight: "red",
      font: "Calibri",
      size: 22
    })
  ]
})

new Comment({
  id: 5,
  author: "AI Assistant",
  date: new Date(),
  children: [
    new Paragraph({
      children: [
        new TextRun({
          text: "🔴 HUMAN JUDGMENT REQUIRED\n\n",
          bold: true,
          color: "CC0000"
        }),
        new TextRun({
          text: "Issue: Phased evacuation strategy requires professional judgment on:\n"
        }),
        new TextRun({
          text: "• Building height and occupancy warrant this approach\n"
        }),
        new TextRun({
          text: "• Fire service intervention time assumptions\n"
        }),
        new TextRun({
          text: "• Adequacy of fire-fighting shaft provision\n"
        }),
        new TextRun({
          text: "• Management procedures for alarm verification\n\n"
        }),
        new TextRun({
          text: "Regulatory Context:\n",
          bold: true
        }),
        new TextRun({
          text: "• BS 9999:2017 Section 8 - Phased evacuation criteria\n"
        }),
        new TextRun({
          text: "• Approved Document B Volume 2 - Section 5\n"
        }),
        new TextRun({
          text: "• BS 5839-1:2017 - Fire alarm system design for phased evacuation\n\n"
        }),
        new TextRun({
          text: "Required Action: Fire Safety Engineer must verify this strategy is appropriate for the specific building characteristics and occupancy profile. Cannot be auto-approved by AI.",
          color: "CC0000"
        })
      ]
    })
  ]
})
```

### Step 4: Generate Cover Page with Change Summary

```javascript
new Paragraph({
  children: [
    new TextRun({
      text: "AI-REVISED DOCUMENT\n",
      font: "Arial",
      size: 48,
      bold: true,
      color: "003366"
    })
  ],
  alignment: AlignmentType.CENTER,
  spacing: { after: 240 }
}),

new Paragraph({
  children: [
    new TextRun({
      text: "Change Summary\n\n",
      font: "Arial",
      size: 32,
      bold: true
    }),
    new TextRun({
      text: `Document: Fire Safety Strategy - Riverside Tower\n`,
      size: 22
    }),
    new TextRun({
      text: `Generated: ${new Date().toLocaleDateString()}\n`,
      size: 22
    }),
    new TextRun({
      text: `Total Changes Proposed: 24\n\n`,
      size: 22
    })
  ]
}),

new Paragraph({
  children: [
    new TextRun({
      text: "Change Breakdown:\n",
      bold: true,
      size: 24
    })
  ]
}),

new Table({
  rows: [
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph("Confidence Level")] }),
        new TableCell({ children: [new Paragraph("Count")] }),
        new TableCell({ children: [new Paragraph("Action Required")] })
      ]
    }),
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: "✅ High Confidence", color: "00AA00", bold: true })]
          })]
        }),
        new TableCell({ children: [new Paragraph("18")] }),
        new TableCell({ children: [new Paragraph("Review and accept")] })
      ]
    }),
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: "⚠️ Medium Confidence", color: "FF8800", bold: true })]
          })]
        }),
        new TableCell({ children: [new Paragraph("4")] }),
        new TableCell({ children: [new Paragraph("Verify against regulations")] })
      ]
    }),
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: "🔴 Human Judgment Required", color: "CC0000", bold: true })]
          })]
        }),
        new TableCell({ children: [new Paragraph("2")] }),
        new TableCell({ children: [new Paragraph("Professional review required")] })
      ]
    })
  ]
}),

new Paragraph({
  children: [
    new TextRun({
      text: "\n\nAcceptance Checklist\n",
      font: "Arial",
      size: 28,
      bold: true
    })
  ],
  pageBreakBefore: false
}),

new Paragraph({
  children: [
    new TextRun({
      text: "Systematically review each change:\n\n",
      size: 22
    })
  ]
}),

// Checklist items
new Paragraph({
  children: [
    new TextRun({ text: "☐ ", size: 24 }),
    new TextRun({ text: "1. Fire door widths updated to 850mm", size: 20 }),
    new TextRun({ text: " ✅ High Confidence", size: 18, color: "00AA00" })
  ],
  bullet: { level: 0 }
}),

new Paragraph({
  children: [
    new TextRun({ text: "☐ ", size: 24 }),
    new TextRun({ text: "2. Travel distances verified against BS 9999", size: 20 }),
    new TextRun({ text: " ✅ High Confidence", size: 18, color: "00AA00" })
  ],
  bullet: { level: 0 }
}),

// ... more checklist items

new Paragraph({
  children: [
    new TextRun({ text: "☐ ", size: 24 }),
    new TextRun({ text: "23. Evacuation time calculation reviewed", size: 20 }),
    new TextRun({ text: " ⚠️ Medium - Verify", size: 18, color: "FF8800" })
  ],
  bullet: { level: 0 }
}),

new Paragraph({
  children: [
    new TextRun({ text: "☐ ", size: 24 }),
    new TextRun({ text: "24. Phased evacuation strategy validated", size: 20 }),
    new TextRun({ text: " 🔴 Human Review Required", size: 18, color: "CC0000" })
  ],
  bullet: { level: 0 }
})
```

### Step 5: Add Section Divider Before Original Content

```javascript
new Paragraph({
  children: [
    new TextRun({
      text: "═══════════════════════════════════════════════════════\n",
      size: 24,
      color: "003366"
    })
  ],
  alignment: AlignmentType.CENTER,
  pageBreakBefore: true
}),

new Paragraph({
  children: [
    new TextRun({
      text: "ORIGINAL DOCUMENT WITH TRACK CHANGES\n",
      font: "Arial",
      size: 28,
      bold: true,
      color: "003366"
    })
  ],
  alignment: AlignmentType.CENTER,
  spacing: { after: 480 }
}),

new Paragraph({
  children: [
    new TextRun({
      text: "═══════════════════════════════════════════════════════\n",
      size: 24,
      color: "003366"
    })
  ],
  alignment: AlignmentType.CENTER,
  spacing: { after: 720 }
})
```

---

## Implementation Code Example

```javascript
// packages/backend/src/services/docxGenerator.js

const { Document, Packer } = require('docx');
const fs = require('fs');

async function generateRevisedDocx(assessmentResults, originalPdfPath) {
  // 1. Extract PDF structure
  const pdfStructure = await extractPdfStructure(originalPdfPath);

  // 2. Map assessment results to specific locations in document
  const changeMap = mapChangesToDocumentLocations(assessmentResults, pdfStructure);

  // 3. Create base document matching PDF styling
  const doc = createBaseDocument(pdfStructure);

  // 4. Add cover page with change summary
  const coverPage = createCoverPage(assessmentResults);
  doc.addSection(coverPage);

  // 5. Add original content with track changes
  for (const section of pdfStructure.sections) {
    const revisedSection = applyCChanges(section, changeMap[section.id]);
    doc.addSection(revisedSection);
  }

  // 6. Generate DOCX buffer
  const buffer = await Packer.toBuffer(doc);

  return buffer;
}

function applyTrackChanges(paragraph, changes) {
  const runs = [];

  for (const change of changes) {
    if (change.confidence.level === 'HIGH') {
      // Deletion
      runs.push(new TextRun({
        text: change.originalText,
        strike: true,
        color: "FF0000",
        revision: { id: change.id, author: "AI Assistant", type: "deletion" }
      }));

      // Insertion
      runs.push(new TextRun({
        text: change.proposedText,
        underline: { type: "single" },
        color: "0000FF",
        revision: { id: change.id + 1, author: "AI Assistant", type: "insertion" }
      }));

      // Comment
      paragraph.addComment(createComment(change, "HIGH"));

    } else if (change.confidence.level === 'MEDIUM') {
      // Similar but orange color for medium
      runs.push(new TextRun({
        text: change.originalText,
        strike: true,
        color: "FF0000",
        revision: { id: change.id, author: "AI Assistant", type: "deletion" }
      }));

      runs.push(new TextRun({
        text: change.proposedText,
        underline: { type: "single" },
        color: "FF6600",
        revision: { id: change.id + 1, author: "AI Assistant", type: "insertion" }
      }));

      paragraph.addComment(createComment(change, "MEDIUM"));

    } else {
      // REQUIRES_HUMAN_JUDGEMENT - highlight in red, no deletion/insertion
      runs.push(new TextRun({
        text: change.originalText,
        highlight: "red"
      }));

      paragraph.addComment(createComment(change, "HUMAN_REVIEW"));
    }
  }

  return runs;
}

function createComment(change, confidenceLevel) {
  const icon = {
    'HIGH': '✅',
    'MEDIUM': '⚠️',
    'HUMAN_REVIEW': '🔴'
  }[confidenceLevel];

  const title = {
    'HIGH': 'HIGH CONFIDENCE',
    'MEDIUM': 'MEDIUM CONFIDENCE - REVIEW RECOMMENDED',
    'HUMAN_REVIEW': 'HUMAN JUDGMENT REQUIRED'
  }[confidenceLevel];

  const color = {
    'HIGH': '00AA00',
    'MEDIUM': 'FF8800',
    'HUMAN_REVIEW': 'CC0000'
  }[confidenceLevel];

  return new Comment({
    id: change.id,
    author: "AI Assistant",
    date: new Date(),
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: `${icon} ${title}\n\n`,
            bold: true,
            color: color
          }),
          new TextRun({
            text: `Reasoning: ${change.reasoning}\n\n`
          }),
          confidenceLevel === 'HUMAN_REVIEW' ? new TextRun({
            text: `Why Human Review Needed: ${change.humanReviewReason}\n\n`,
            color: "CC0000"
          }) : null,
          new TextRun({
            text: `Regulatory Context:\n`,
            bold: true
          }),
          ...change.regulatoryReferences.map(ref => new TextRun({
            text: `• ${ref}\n`
          })),
          new TextRun({
            text: `\nRecommendation: ${change.recommendation}`
          })
        ].filter(Boolean)
      })
    ]
  });
}

module.exports = { generateRevisedDocx };
```

---

## API Endpoint

```javascript
// POST /api/packs/:packId/versions/:versionId/documents/:docId/revised
app.post('/api/packs/:packId/versions/:versionId/documents/:docId/revised', async (req, res) => {
  try {
    const { packId, versionId, docId } = req.params;
    const { acceptedChangeIds, settings } = req.body;

    // Get original PDF
    const originalPdf = await getDocumentPath(packId, docId);

    // Get assessment results for this document
    const assessmentResults = await getAssessmentResults(versionId, docId);

    // Filter to only include changes user wants (or all if generating for review)
    const changes = acceptedChangeIds
      ? assessmentResults.filter(r => acceptedChangeIds.includes(r.id))
      : assessmentResults;

    // Generate DOCX
    const docxBuffer = await generateRevisedDocx(changes, originalPdf, settings);

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${docId}_revised.docx"`);

    res.send(docxBuffer);

  } catch (error) {
    console.error('Error generating revised DOCX:', error);
    res.status(500).json({ error: 'Failed to generate document' });
  }
});
```

---

## Testing Checklist

### Visual Fidelity
- [ ] Open DOCX in Microsoft Word
- [ ] Compare side-by-side with original PDF
- [ ] Verify fonts match exactly
- [ ] Verify colors match (headers, body text)
- [ ] Verify page margins identical
- [ ] Verify headers/footers present and correct
- [ ] Verify company branding (logos, colors) present

### Track Changes
- [ ] Track changes visible when "Track Changes" enabled
- [ ] Deletions show as strikethrough in red
- [ ] Insertions show as underlined in blue/orange
- [ ] Each change has associated comment
- [ ] Comments explain reasoning clearly
- [ ] Can accept individual changes (right-click → Accept)
- [ ] Can reject individual changes (right-click → Reject)
- [ ] Can accept all changes (Review tab → Accept All)

### Confidence Levels
- [ ] High confidence changes in blue/green
- [ ] Medium confidence in orange
- [ ] Human review areas highlighted in red
- [ ] Comments clearly labeled with confidence level
- [ ] Icons visible (✅ ⚠️ 🔴)

### Human Review Markers
- [ ] Red highlighting on text needing review
- [ ] Comment says "HUMAN JUDGMENT REQUIRED"
- [ ] Explanation of why AI cannot determine correct approach
- [ ] Regulatory references included in comment
- [ ] Specific action items listed

### Cover Page
- [ ] Change summary table present
- [ ] Shows breakdown by confidence level
- [ ] Acceptance checklist included
- [ ] All changes listed with checkboxes
- [ ] Page break before original content

### Actionability
- [ ] Each change can be accepted individually
- [ ] Accepting change doesn't break formatting
- [ ] Comments remain after acceptance (for audit trail)
- [ ] Can save document with accepted changes
- [ ] Can export to PDF after accepting changes

---

## Example Output Structure

```
┌─────────────────────────────────────────────────────┐
│         REVISED DOCUMENT - COVER PAGE               │
│                                                     │
│  AI-REVISED DOCUMENT                                │
│  Fire Safety Strategy - Riverside Tower             │
│                                                     │
│  Change Summary:                                    │
│  ┌──────────────┬───────┬──────────────────┐      │
│  │ Confidence   │ Count │ Action           │      │
│  ├──────────────┼───────┼──────────────────┤      │
│  │ ✅ High      │  18   │ Review & accept  │      │
│  │ ⚠️ Medium    │   4   │ Verify first     │      │
│  │ 🔴 Human     │   2   │ Expert review    │      │
│  └──────────────┴───────┴──────────────────┘      │
│                                                     │
│  Acceptance Checklist:                              │
│  ☐ 1. Fire door widths ✅                          │
│  ☐ 2. Travel distances ✅                          │
│  ☐ 3. Evacuation time ⚠️                           │
│  ☐ 4. Phased evacuation 🔴                         │
│                                                     │
└─────────────────────────────────────────────────────┘

[PAGE BREAK]

┌─────────────────────────────────────────────────────┐
│    ORIGINAL DOCUMENT WITH TRACK CHANGES             │
│                                                     │
│  FIRE SAFETY STRATEGY                               │
│  Riverside Tower, London                            │
│                                                     │
│  1. Introduction                                    │
│                                                     │
│  This document presents the fire safety strategy   │
│  for Riverside Tower. Fire doors shall be          │
│  [800mm wide]←deleted in red with strikethrough    │
│  [minimum 850mm clear opening width in accordance  │
│   with BS 9999:2017 clause 18.3]←inserted in blue  │
│                                         ┌──────────┐│
│  [Comment bubble: ✅ HIGH CONFIDENCE   │          ││
│   Reasoning: BS 9999 requires 850mm... │          ││
│   Evidence: Pack doc page 12...        │          ││
│   Recommendation: Accept change]        └──────────┘│
│                                                     │
│  The means of escape strategy relies on             │
│  [phased evacuation]←highlighted in RED             │
│                                         ┌──────────┐│
│  [Comment: 🔴 HUMAN JUDGMENT REQUIRED  │          ││
│   Issue: Phased evacuation requires... │          ││
│   Regulatory Context:                  │          ││
│   • BS 9999 Section 8                  │          ││
│   • Approved Doc B Vol 2               │          ││
│   Action: Fire Engineer must verify]    └──────────┘│
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Dependencies

```json
{
  "dependencies": {
    "docx": "^8.5.0",
    "pdf-parse": "^1.1.1",
    "pdf-lib": "^1.17.1"
  }
}
```

---

## Success Criteria

✅ **Visual Fidelity**: User cannot tell DOCX from PDF visually
✅ **Track Changes**: All AI modifications shown as Word track changes
✅ **Clear Markers**: Human review areas obviously highlighted in RED
✅ **Actionable**: Every change can be accepted/rejected in Word
✅ **Audit Trail**: Comments remain after acceptance for compliance
✅ **Professional**: Branded, formatted, ready for client/BSR submission

---

This specification ensures the DOCX output is **indistinguishable from the PDF** while making AI changes **clearly visible and actionable** with obvious markers for **human judgment areas**.

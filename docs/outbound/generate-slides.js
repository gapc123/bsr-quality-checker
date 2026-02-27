const pptxgen = require('pptxgenjs');
const fs = require('fs');
const path = require('path');

const pptx = new pptxgen();

// Set presentation properties
pptx.author = 'Attlee.ai';
pptx.title = 'Attlee Investor Deck';
pptx.subject = 'AI-powered regulatory review for BSR Gateway 2';

// Define colors
const DARK_BG = '0f172a';
const BLUE_ACCENT = '3b82f6';
const YELLOW_ACCENT = 'fbbf24';
const RED = 'dc2626';
const GRAY = '64748b';
const LIGHT_GRAY = '94a3b8';

// Helper function to add image if it exists
function addImageIfExists(slide, imagePath, options) {
  const fullPath = path.join(__dirname, 'images', imagePath);
  if (fs.existsSync(fullPath)) {
    slide.addImage({ path: fullPath, ...options });
  }
}

// SLIDE 1: Title
let slide = pptx.addSlide();
slide.background = { color: DARK_BG };
slide.addText('Attlee.AI', { x: 0.5, y: 1.8, w: 9, h: 0.8, fontSize: 54, bold: true, color: '60a5fa', fontFace: 'Arial' });
slide.addText('BSR Quality Checker', { x: 0.5, y: 2.6, w: 9, h: 0.5, fontSize: 24, color: LIGHT_GRAY, fontFace: 'Arial' });
slide.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 3.2, w: 6, h: 0.6, fill: { color: 'f59e0b', transparency: 80 }, line: { color: 'f59e0b', width: 1 } });
slide.addText('Our mission: get more safe homes built, faster', { x: 0.6, y: 3.3, w: 5.8, h: 0.4, fontSize: 18, bold: true, color: YELLOW_ACCENT, fontFace: 'Arial' });
slide.addText('AI-powered regulatory review for BSR Gateway 2 submissions', { x: 0.5, y: 4, w: 9, h: 0.5, fontSize: 18, color: LIGHT_GRAY, fontFace: 'Arial' });
slide.addText('Reducing rejections, delays, and financing risk in UK housing delivery', { x: 0.5, y: 4.5, w: 9, h: 0.5, fontSize: 14, color: GRAY, fontFace: 'Arial' });
slide.addText('George Clarke & Hugo Hiley, Co-Founders', { x: 0.5, y: 5.2, w: 9, h: 0.3, fontSize: 14, color: GRAY, fontFace: 'Arial' });

// SLIDE 2: Scale of the Problem
slide = pptx.addSlide();
slide.addText('The Scale of the Problem', { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 32, bold: true, color: DARK_BG, fontFace: 'Arial' });
slide.addText('London cannot build homes at scale', { x: 0.5, y: 0.9, w: 9, h: 0.4, fontSize: 20, color: RED, fontFace: 'Arial' });

// Stats boxes
const stats2 = [
  { num: '88,000', label: 'Target homes/year' },
  { num: '5,891', label: '2024 starts' },
  { num: '94%', label: 'Below target' },
  { num: '40yr', label: 'Lowest level' }
];
stats2.forEach((stat, i) => {
  slide.addShape(pptx.shapes.RECTANGLE, { x: 0.5 + (i * 2.3), y: 1.5, w: 2.1, h: 1.2, fill: { color: 'fef2f2' }, line: { color: 'fecaca', width: 1 } });
  slide.addText(stat.num, { x: 0.5 + (i * 2.3), y: 1.6, w: 2.1, h: 0.6, fontSize: 28, bold: true, color: RED, align: 'center', fontFace: 'Arial' });
  slide.addText(stat.label, { x: 0.5 + (i * 2.3), y: 2.2, w: 2.1, h: 0.4, fontSize: 11, color: GRAY, align: 'center', fontFace: 'Arial' });
});

slide.addText('Worst of any major developed city this century', { x: 0.5, y: 3, w: 9, h: 0.4, fontSize: 16, color: DARK_BG, bullet: true, fontFace: 'Arial' });
slide.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 3.6, w: 9, h: 0.6, fill: { color: 'eff6ff' } });
slide.addText('This is not a planning failure. It is a delivery failure.', { x: 0.6, y: 3.7, w: 8.8, h: 0.4, fontSize: 14, bold: true, color: '1e40af', fontFace: 'Arial' });

// SLIDE 3: This Affects Everyone
slide = pptx.addSlide();
slide.addText('This Affects Everyone', { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 32, bold: true, color: DARK_BG, fontFace: 'Arial' });
slide.addText('The collapse is universal', { x: 0.5, y: 0.9, w: 9, h: 0.4, fontSize: 20, color: '334155', fontFace: 'Arial' });

const stats3 = [
  { num: '-79%', label: 'Private developers' },
  { num: '-85%', label: 'Affordable housing' },
  { num: '-94%', label: 'Council housing' },
  { num: '281,000', label: 'Approved, not built' }
];
stats3.forEach((stat, i) => {
  slide.addShape(pptx.shapes.RECTANGLE, { x: 0.5 + (i * 2.3), y: 1.5, w: 2.1, h: 1.2, fill: { color: 'fef2f2' }, line: { color: 'fecaca', width: 1 } });
  slide.addText(stat.num, { x: 0.5 + (i * 2.3), y: 1.6, w: 2.1, h: 0.6, fontSize: 28, bold: true, color: RED, align: 'center', fontFace: 'Arial' });
  slide.addText(stat.label, { x: 0.5 + (i * 2.3), y: 2.2, w: 2.1, h: 0.4, fontSize: 11, color: GRAY, align: 'center', fontFace: 'Arial' });
});

slide.addText([
  { text: '£120m of council-funded homes on hold', options: { bullet: true, paraSpaceAfter: 6 } },
  { text: '281,000 approved homes not being built', options: { bullet: true } }
], { x: 0.5, y: 3, w: 9, h: 0.8, fontSize: 16, color: DARK_BG, fontFace: 'Arial' });
slide.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 3.9, w: 9, h: 0.6, fill: { color: 'eff6ff' } });
slide.addText('Market and public sector actors cite the same bottleneck.', { x: 0.6, y: 4, w: 8.8, h: 0.4, fontSize: 14, bold: true, color: '1e40af', fontFace: 'Arial' });

// SLIDE 4: The Real Bottleneck
slide = pptx.addSlide();
slide.addText('The Real Bottleneck', { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 32, bold: true, color: DARK_BG, fontFace: 'Arial' });
slide.addText('Post-Grenfell regulation is necessary. The process is broken.', { x: 0.5, y: 0.9, w: 9, h: 0.4, fontSize: 18, color: '334155', fontFace: 'Arial' });

slide.addText('The new regulatory landscape:', { x: 0.5, y: 1.5, w: 4.5, h: 0.4, fontSize: 14, bold: true, color: DARK_BG, fontFace: 'Arial' });
slide.addText([
  { text: 'Building Safety Act 2022', options: { bullet: true, paraSpaceAfter: 4 } },
  { text: 'Building Safety Regulator (BSR) created', options: { bullet: true, paraSpaceAfter: 4 } },
  { text: 'Mandatory gateway between planning approval and construction start', options: { bullet: true } }
], { x: 0.5, y: 1.9, w: 4.5, h: 1.2, fontSize: 13, color: DARK_BG, fontFace: 'Arial' });

slide.addText('Reality today:', { x: 5.2, y: 1.5, w: 4.5, h: 0.4, fontSize: 14, bold: true, color: DARK_BG, fontFace: 'Arial' });
slide.addText([
  { text: 'Only ~1/3 of submissions approved', options: { bullet: true, paraSpaceAfter: 4 } },
  { text: 'Average review time: ~8 months', options: { bullet: true, paraSpaceAfter: 4 } },
  { text: 'Capital already committed when delays hit', options: { bullet: true, paraSpaceAfter: 4 } },
  { text: 'Financing costs inflate projects 15%+', options: { bullet: true } }
], { x: 5.2, y: 1.9, w: 4.5, h: 1.4, fontSize: 13, color: DARK_BG, fontFace: 'Arial' });

addImageIfExists(slide, 'ft-headline.jpeg', { x: 0.5, y: 3.4, w: 3.5, h: 1.3 });
addImageIfExists(slide, 'bbc-headline.jpeg', { x: 4.2, y: 3.4, w: 3.5, h: 1.3 });

// SLIDE 5: The Insight
slide = pptx.addSlide();
slide.addText('The Insight', { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 32, bold: true, color: DARK_BG, fontFace: 'Arial' });
slide.addText('Most Gateway 2 failures are not unsafe buildings.\nThey are unsafe submissions.', { x: 0.5, y: 1, w: 9, h: 0.8, fontSize: 22, bold: true, color: '1e40af', fontFace: 'Arial' });

slide.addText([
  { text: 'Missing documents', options: { bullet: true, paraSpaceAfter: 6 } },
  { text: 'Incomplete cross-references', options: { bullet: true, paraSpaceAfter: 6 } },
  { text: 'Inconsistent evidence across reports', options: { bullet: true, paraSpaceAfter: 6 } },
  { text: 'Errors found too late to fix cheaply', options: { bullet: true } }
], { x: 0.5, y: 2, w: 9, h: 1.4, fontSize: 18, color: DARK_BG, fontFace: 'Arial' });

slide.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 3.6, w: 9, h: 1.2, fill: { color: DARK_BG } });
slide.addText('There is no pre-submission intelligence layer.', { x: 0.7, y: 3.7, w: 8.6, h: 0.4, fontSize: 18, bold: true, color: 'ffffff', fontFace: 'Arial' });
slide.addText('Developers submit and hope. Rejections cost months. There is no systematic way to check readiness before engaging the regulator.', { x: 0.7, y: 4.2, w: 8.6, h: 0.5, fontSize: 14, color: LIGHT_GRAY, fontFace: 'Arial' });

// SLIDE 6: The Product
slide = pptx.addSlide();
slide.addText('The Product', { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 32, bold: true, color: DARK_BG, fontFace: 'Arial' });
slide.addText('Attlee: Pre-submission regulatory review for Gateway 2', { x: 0.5, y: 0.9, w: 9, h: 0.4, fontSize: 18, color: '334155', fontFace: 'Arial' });

addImageIfExists(slide, 'readiness-dashboard.jpeg', { x: 0.5, y: 1.5, w: 4.5, h: 2.8 });

slide.addText([
  { text: 'Proprietary BSR matrix', options: { bullet: true, paraSpaceAfter: 6 } },
  { text: '55 deterministic rules (explicit pass/fail)', options: { bullet: true, paraSpaceAfter: 6 } },
  { text: '13 AI-assessed judgement criteria', options: { bullet: true, paraSpaceAfter: 6 } },
  { text: 'Single readiness score before submission', options: { bullet: true } }
], { x: 5.2, y: 1.5, w: 4.5, h: 1.6, fontSize: 15, color: DARK_BG, fontFace: 'Arial' });

slide.addShape(pptx.shapes.RECTANGLE, { x: 5.2, y: 3.3, w: 4.5, h: 0.6, fill: { color: 'eff6ff' } });
slide.addText('This is regulatory infrastructure, not document review.', { x: 5.3, y: 3.4, w: 4.3, h: 0.4, fontSize: 12, bold: true, color: '1e40af', fontFace: 'Arial' });

// SLIDE 7: Why Defensible
slide = pptx.addSlide();
slide.addText('Why This Is Defensible', { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 32, bold: true, color: DARK_BG, fontFace: 'Arial' });
slide.addText('Purpose-built, not a ChatGPT wrapper', { x: 0.5, y: 0.9, w: 9, h: 0.4, fontSize: 18, color: '334155', fontFace: 'Arial' });

addImageIfExists(slide, 'auditability-details.jpeg', { x: 0.5, y: 1.5, w: 4.5, h: 2.8 });

slide.addText([
  { text: 'Every finding linked to:', options: { bullet: true, paraSpaceAfter: 4 } },
  { text: '    - Specific regulation', options: { paraSpaceAfter: 4, indentLevel: 1 } },
  { text: '    - Specific document', options: { paraSpaceAfter: 4, indentLevel: 1 } },
  { text: '    - Exact extract', options: { paraSpaceAfter: 8, indentLevel: 1 } },
  { text: 'Fully auditable', options: { bullet: true, paraSpaceAfter: 4 } },
  { text: 'Regulator-safe by design', options: { bullet: true } }
], { x: 5.2, y: 1.5, w: 4.5, h: 2, fontSize: 14, color: DARK_BG, fontFace: 'Arial' });

slide.addShape(pptx.shapes.RECTANGLE, { x: 5.2, y: 3.6, w: 4.5, h: 0.6, fill: { color: 'eff6ff' } });
slide.addText('No black box. Every decision is inspectable.', { x: 5.3, y: 3.7, w: 4.3, h: 0.4, fontSize: 12, bold: true, color: '1e40af', fontFace: 'Arial' });

// SLIDE 8: Agentic But Safe
slide = pptx.addSlide();
slide.addText('Agentic, But Safe', { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 32, bold: true, color: DARK_BG, fontFace: 'Arial' });
slide.addText('AI that knows its limits', { x: 0.5, y: 0.9, w: 9, h: 0.4, fontSize: 18, color: '334155', fontFace: 'Arial' });

slide.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 1.5, w: 4.5, h: 2.5, fill: { color: 'fef3c7' }, line: { color: 'f59e0b', width: 1 } });
slide.addText('!', { x: 0.7, y: 1.7, w: 0.4, h: 0.4, fontSize: 20, bold: true, color: '92400e', align: 'center', fontFace: 'Arial' });
slide.addText('Requires Human Intervention', { x: 1.2, y: 1.7, w: 3.5, h: 0.4, fontSize: 14, bold: true, color: '92400e', fontFace: 'Arial' });
slide.addText('This issue cannot be fixed by text changes alone. It may require:', { x: 0.7, y: 2.2, w: 4.1, h: 0.4, fontSize: 11, color: '78350f', fontFace: 'Arial' });
slide.addText([
  { text: 'Creating a new document or report', options: { bullet: true, paraSpaceAfter: 4 } },
  { text: 'Expert analysis or professional judgement', options: { bullet: true, paraSpaceAfter: 4 } },
  { text: 'Physical evidence, testing, or certifications', options: { bullet: true } }
], { x: 0.7, y: 2.6, w: 4.1, h: 1.2, fontSize: 11, color: '78350f', fontFace: 'Arial' });

slide.addText([
  { text: 'AI proposes fixes only when text changes are sufficient', options: { bullet: true, paraSpaceAfter: 6 } },
  { text: 'Flags when issues require:', options: { bullet: true, paraSpaceAfter: 4 } },
  { text: '    - New documents', options: { paraSpaceAfter: 4 } },
  { text: '    - Expert judgement', options: { paraSpaceAfter: 4 } },
  { text: '    - Physical testing', options: { paraSpaceAfter: 6 } },
  { text: 'Human always stays in control', options: { bullet: true } }
], { x: 5.2, y: 1.5, w: 4.5, h: 2, fontSize: 13, color: DARK_BG, fontFace: 'Arial' });

slide.addShape(pptx.shapes.RECTANGLE, { x: 5.2, y: 3.6, w: 4.5, h: 0.6, fill: { color: 'eff6ff' } });
slide.addText('Attlee reduces risk. It never invents compliance.', { x: 5.3, y: 3.7, w: 4.3, h: 0.4, fontSize: 12, bold: true, color: '1e40af', fontFace: 'Arial' });

// SLIDE 9: Human in the Loop
slide = pptx.addSlide();
slide.addText('Human-in-the-Loop Workflow', { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 32, bold: true, color: DARK_BG, fontFace: 'Arial' });
slide.addText('One click per criterion. You approve. We generate.', { x: 0.5, y: 0.9, w: 9, h: 0.4, fontSize: 18, color: '334155', fontFace: 'Arial' });

addImageIfExists(slide, 'actionable-changes.png', { x: 0.5, y: 1.5, w: 4.5, h: 2.8 });

slide.addText([
  { text: 'Review findings one-by-one', options: { bullet: true, paraSpaceAfter: 6 } },
  { text: 'Accept or skip each change', options: { bullet: true, paraSpaceAfter: 6 } },
  { text: 'Full transparency before generation', options: { bullet: true, paraSpaceAfter: 6 } },
  { text: 'See exactly what text will be added', options: { bullet: true } }
], { x: 5.2, y: 1.5, w: 4.5, h: 1.6, fontSize: 15, color: DARK_BG, fontFace: 'Arial' });

slide.addShape(pptx.shapes.RECTANGLE, { x: 5.2, y: 3.3, w: 4.5, h: 0.6, fill: { color: 'eff6ff' } });
slide.addText('This fits professional accountability models.', { x: 5.3, y: 3.4, w: 4.3, h: 0.4, fontSize: 12, bold: true, color: '1e40af', fontFace: 'Arial' });

// SLIDE 10: Outputs
slide = pptx.addSlide();
slide.addText('Outputs', { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 32, bold: true, color: DARK_BG, fontFace: 'Arial' });
slide.addText('From analysis to submission-ready documents', { x: 0.5, y: 0.9, w: 9, h: 0.4, fontSize: 18, color: '334155', fontFace: 'Arial' });

slide.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 1.5, w: 4.5, h: 2.8, fill: { color: 'ecfdf5' }, line: { color: '10b981', width: 1 } });
slide.addText('✓', { x: 0.7, y: 1.7, w: 0.4, h: 0.4, fontSize: 20, bold: true, color: '10b981', align: 'center', fontFace: 'Arial' });
slide.addText('Your Documents Are Ready', { x: 1.2, y: 1.7, w: 3.5, h: 0.4, fontSize: 14, bold: true, color: '065f46', fontFace: 'Arial' });
slide.addShape(pptx.shapes.RECTANGLE, { x: 0.7, y: 2.2, w: 4.1, h: 0.5, fill: { color: 'ffffff' }, line: { color: 'd1fae5', width: 1 } });
slide.addText('Amended Document (DOCX)', { x: 0.8, y: 2.3, w: 3.9, h: 0.3, fontSize: 12, bold: true, color: DARK_BG, fontFace: 'Arial' });
slide.addShape(pptx.shapes.RECTANGLE, { x: 0.7, y: 2.8, w: 4.1, h: 0.5, fill: { color: 'ffffff' }, line: { color: 'd1fae5', width: 1 } });
slide.addText('PDF Version', { x: 0.8, y: 2.9, w: 3.9, h: 0.3, fontSize: 12, bold: true, color: DARK_BG, fontFace: 'Arial' });
slide.addShape(pptx.shapes.RECTANGLE, { x: 0.7, y: 3.4, w: 4.1, h: 0.5, fill: { color: 'ffffff' }, line: { color: 'fef3c7', width: 1 } });
slide.addText('Outstanding Issues Report', { x: 0.8, y: 3.5, w: 3.9, h: 0.3, fontSize: 12, bold: true, color: DARK_BG, fontFace: 'Arial' });

slide.addText([
  { text: 'Clean submission pack with approved changes', options: { bullet: true, paraSpaceAfter: 6 } },
  { text: 'Separate list of unresolved issues', options: { bullet: true, paraSpaceAfter: 6 } },
  { text: 'Clear ownership for follow-up work', options: { bullet: true, paraSpaceAfter: 6 } },
  { text: 'Table of contents and explanatory front matter', options: { bullet: true } }
], { x: 5.2, y: 1.5, w: 4.5, h: 1.6, fontSize: 15, color: DARK_BG, fontFace: 'Arial' });

slide.addShape(pptx.shapes.RECTANGLE, { x: 5.2, y: 3.3, w: 4.5, h: 0.6, fill: { color: 'eff6ff' } });
slide.addText('Attlee completes the workflow, not just the analysis.', { x: 5.3, y: 3.4, w: 4.3, h: 0.4, fontSize: 12, bold: true, color: '1e40af', fontFace: 'Arial' });

// SLIDE 11: Business Model
slide = pptx.addSlide();
slide.addText('Business Model', { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 32, bold: true, color: DARK_BG, fontFace: 'Arial' });
slide.addText('Two complementary paths', { x: 0.5, y: 0.9, w: 9, h: 0.4, fontSize: 18, color: '334155', fontFace: 'Arial' });

// SaaS box
slide.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 1.5, w: 4.3, h: 2.8, fill: { color: 'f8fafc' }, line: { color: 'e2e8f0', width: 2 } });
slide.addText('SaaS', { x: 0.7, y: 1.7, w: 4, h: 0.5, fontSize: 20, bold: true, color: '334155', fontFace: 'Arial' });
slide.addText([
  { text: 'Self-service assessments', options: { bullet: true, paraSpaceAfter: 6 } },
  { text: 'Unlimited re-runs', options: { bullet: true, paraSpaceAfter: 6 } },
  { text: 'Annual licence per organisation', options: { bullet: true, paraSpaceAfter: 6 } },
  { text: 'Lower touch, scalable', options: { bullet: true } }
], { x: 0.7, y: 2.3, w: 4, h: 1.8, fontSize: 14, color: DARK_BG, fontFace: 'Arial' });

// Agency box
slide.addShape(pptx.shapes.RECTANGLE, { x: 5, y: 1.5, w: 4.5, h: 2.8, fill: { color: DARK_BG } });
slide.addText('Agency / Hybrid', { x: 5.2, y: 1.7, w: 4, h: 0.5, fontSize: 20, bold: true, color: '60a5fa', fontFace: 'Arial' });
slide.addText([
  { text: 'Full AI platform assessment', options: { bullet: true, paraSpaceAfter: 6 } },
  { text: 'Expert human review', options: { bullet: true, paraSpaceAfter: 6 } },
  { text: 'Remediation guidance call', options: { bullet: true, paraSpaceAfter: 6 } },
  { text: 'High-ACV, fast revenue', options: { bullet: true } }
], { x: 5.2, y: 2.3, w: 4, h: 1.8, fontSize: 14, color: 'cbd5e1', fontFace: 'Arial' });

slide.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 4.5, w: 9, h: 0.5, fill: { color: 'eff6ff' } });
slide.addText('Same platform. Different depth.', { x: 0.6, y: 4.55, w: 8.8, h: 0.4, fontSize: 14, bold: true, color: '1e40af', fontFace: 'Arial' });

// SLIDE 12: Founders
slide = pptx.addSlide();
slide.addText('Founders', { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 32, bold: true, color: DARK_BG, fontFace: 'Arial' });
slide.addText('Met at Blenheim Chalcot', { x: 0.5, y: 0.85, w: 9, h: 0.4, fontSize: 16, color: GRAY, fontFace: 'Arial' });

// Hugo
addImageIfExists(slide, 'hugo-hiley.jpeg', { x: 1.2, y: 1.4, w: 1.5, h: 1.5, rounding: true });
slide.addText('Hugo Hiley', { x: 0.5, y: 3, w: 4, h: 0.4, fontSize: 18, bold: true, color: DARK_BG, align: 'center', fontFace: 'Arial' });
slide.addText('Co-Founder (Commercial)', { x: 0.5, y: 3.4, w: 4, h: 0.3, fontSize: 12, color: BLUE_ACCENT, align: 'center', fontFace: 'Arial' });
slide.addText([
  { text: 'Led global sales at Fospha', options: { bullet: true, paraSpaceAfter: 3 } },
  { text: 'Deep enterprise B2B experience', options: { bullet: true, paraSpaceAfter: 3 } },
  { text: 'Qualified lawyer', options: { bullet: true } }
], { x: 0.5, y: 3.75, w: 4, h: 1, fontSize: 11, color: DARK_BG, fontFace: 'Arial' });

// George
addImageIfExists(slide, 'george-clarke.jpeg', { x: 6.2, y: 1.4, w: 1.5, h: 1.5, rounding: true });
slide.addText('George Clarke', { x: 5.5, y: 3, w: 4, h: 0.4, fontSize: 18, bold: true, color: DARK_BG, align: 'center', fontFace: 'Arial' });
slide.addText('Co-Founder (Product / Tech)', { x: 5.5, y: 3.4, w: 4, h: 0.3, fontSize: 12, color: BLUE_ACCENT, align: 'center', fontFace: 'Arial' });
slide.addText([
  { text: 'BC Centre for Generative AI', options: { bullet: true, paraSpaceAfter: 3 } },
  { text: 'AI products in regulated domains', options: { bullet: true, paraSpaceAfter: 3 } },
  { text: 'MSc, Imperial College London', options: { bullet: true } }
], { x: 5.5, y: 3.75, w: 4, h: 1, fontSize: 11, color: DARK_BG, fontFace: 'Arial' });

slide.addText('We combine enterprise commercial execution with deep product, AI, and regulatory system-building experience.', { x: 0.5, y: 4.8, w: 9, h: 0.4, fontSize: 12, color: '475569', align: 'center', fontFace: 'Arial' });

// SLIDE 13: Why Now
slide = pptx.addSlide();
slide.addText('Why Now', { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 32, bold: true, color: DARK_BG, fontFace: 'Arial' });

slide.addText('Why now', { x: 0.5, y: 1, w: 4.3, h: 0.4, fontSize: 20, bold: true, color: '334155', fontFace: 'Arial' });
slide.addText([
  { text: 'Regulation is permanent', options: { bullet: true, paraSpaceAfter: 6 } },
  { text: 'Complexity is increasing', options: { bullet: true, paraSpaceAfter: 6 } },
  { text: 'BSR capacity will not scale linearly', options: { bullet: true, paraSpaceAfter: 6 } },
  { text: 'Developers will pay for predictability', options: { bullet: true } }
], { x: 0.5, y: 1.5, w: 4.3, h: 1.6, fontSize: 15, color: DARK_BG, fontFace: 'Arial' });

slide.addText('Why us', { x: 5.2, y: 1, w: 4.3, h: 0.4, fontSize: 20, bold: true, color: '334155', fontFace: 'Arial' });
slide.addText([
  { text: 'Deep AI product experience from BC', options: { bullet: true, paraSpaceAfter: 6 } },
  { text: 'Enterprise sales capability proven at Fospha', options: { bullet: true, paraSpaceAfter: 6 } },
  { text: 'Regulatory systems expertise', options: { bullet: true, paraSpaceAfter: 6 } },
  { text: 'Already built and deployed the platform', options: { bullet: true } }
], { x: 5.2, y: 1.5, w: 4.3, h: 1.6, fontSize: 15, color: DARK_BG, fontFace: 'Arial' });

slide.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 3.5, w: 9, h: 1, fill: { color: DARK_BG } });
slide.addText('The regulatory burden is permanent. The question is who builds the infrastructure to manage it.', { x: 0.7, y: 3.7, w: 8.6, h: 0.6, fontSize: 16, bold: true, color: 'ffffff', fontFace: 'Arial' });

// SLIDE 14: Top Risk Themes (new slide)
slide = pptx.addSlide();
slide.addText('Top Risk Themes', { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 32, bold: true, color: DARK_BG, fontFace: 'Arial' });
slide.addText('What we find in every submission', { x: 0.5, y: 0.9, w: 9, h: 0.4, fontSize: 18, color: '334155', fontFace: 'Arial' });

addImageIfExists(slide, 'results-page.png', { x: 0.5, y: 1.5, w: 9, h: 3.5 });

// APPENDIX DIVIDER
slide = pptx.addSlide();
slide.background = { color: 'fef3c7' };
slide.addShape(pptx.shapes.RECTANGLE, { x: 3.5, y: 2, w: 3, h: 0.6, fill: { color: 'fbbf24' }, line: { color: '92400e', width: 1 } });
slide.addText('APPENDIX', { x: 3.5, y: 2.1, w: 3, h: 0.4, fontSize: 18, bold: true, color: '92400e', align: 'center', fontFace: 'Arial' });
slide.addText('Product Flow', { x: 0.5, y: 2.8, w: 9, h: 0.6, fontSize: 32, bold: true, color: DARK_BG, align: 'center', fontFace: 'Arial' });

// APPENDIX A: Upload & Assessment
slide = pptx.addSlide();
slide.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 0.3, w: 1.2, h: 0.4, fill: { color: 'fef3c7' } });
slide.addText('Appendix A', { x: 0.55, y: 0.35, w: 1.1, h: 0.3, fontSize: 11, bold: true, color: '92400e', fontFace: 'Arial' });
slide.addText('Step 1: Upload & Assessment', { x: 0.5, y: 0.8, w: 9, h: 0.6, fontSize: 28, bold: true, color: DARK_BG, fontFace: 'Arial' });

slide.addText([
  { text: '1. User uploads submission documents (PDF, DOCX)', options: { bullet: true, paraSpaceAfter: 8 } },
  { text: '2. System extracts and indexes all content', options: { bullet: true, paraSpaceAfter: 8 } },
  { text: '3. Two-phase assessment begins:', options: { bullet: true, paraSpaceAfter: 4 } },
  { text: '    • 55 deterministic rules (instant)', options: { paraSpaceAfter: 4 } },
  { text: '    • 13 AI judgement criteria (deep analysis)', options: { paraSpaceAfter: 8 } },
  { text: '4. Progress shown in real-time', options: { bullet: true } }
], { x: 0.5, y: 1.5, w: 4.5, h: 2.5, fontSize: 14, color: DARK_BG, fontFace: 'Arial' });

addImageIfExists(slide, 'assessment-progress.png', { x: 5.2, y: 1.3, w: 4.3, h: 3.2 });

// APPENDIX B: Results & Risk Dashboard
slide = pptx.addSlide();
slide.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 0.3, w: 1.2, h: 0.4, fill: { color: 'fef3c7' } });
slide.addText('Appendix B', { x: 0.55, y: 0.35, w: 1.1, h: 0.3, fontSize: 11, bold: true, color: '92400e', fontFace: 'Arial' });
slide.addText('Step 2: Results & Risk Dashboard', { x: 0.5, y: 0.8, w: 9, h: 0.6, fontSize: 28, bold: true, color: DARK_BG, fontFace: 'Arial' });

addImageIfExists(slide, 'results-page.png', { x: 0.5, y: 1.4, w: 5, h: 3.3 });

slide.addText([
  { text: 'Overall readiness score', options: { bullet: true, paraSpaceAfter: 8 } },
  { text: 'Pass / Partial / Fail breakdown', options: { bullet: true, paraSpaceAfter: 8 } },
  { text: 'Severity classification (High / Medium)', options: { bullet: true, paraSpaceAfter: 8 } },
  { text: 'Click any criterion for full details', options: { bullet: true, paraSpaceAfter: 8 } },
  { text: 'Evidence sources and reasoning shown', options: { bullet: true } }
], { x: 5.7, y: 1.5, w: 4, h: 2.5, fontSize: 13, color: DARK_BG, fontFace: 'Arial' });

// APPENDIX C: Criterion Detail
slide = pptx.addSlide();
slide.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 0.3, w: 1.2, h: 0.4, fill: { color: 'fef3c7' } });
slide.addText('Appendix C', { x: 0.55, y: 0.35, w: 1.1, h: 0.3, fontSize: 11, bold: true, color: '92400e', fontFace: 'Arial' });
slide.addText('Step 3: Criterion-Level Intelligence', { x: 0.5, y: 0.8, w: 9, h: 0.6, fontSize: 28, bold: true, color: DARK_BG, fontFace: 'Arial' });

addImageIfExists(slide, 'criteria-detail.jpeg', { x: 0.5, y: 1.4, w: 4.5, h: 3.3 });
addImageIfExists(slide, 'auditability-details.jpeg', { x: 5.2, y: 1.4, w: 4.3, h: 3.3 });

slide.addText('Every finding includes: status, severity, evidence extracts, regulatory reference, and reasoning', { x: 0.5, y: 4.8, w: 9, h: 0.3, fontSize: 12, color: GRAY, align: 'center', fontFace: 'Arial' });

// APPENDIX D: Review Carousel
slide = pptx.addSlide();
slide.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 0.3, w: 1.2, h: 0.4, fill: { color: 'fef3c7' } });
slide.addText('Appendix D', { x: 0.55, y: 0.35, w: 1.1, h: 0.3, fontSize: 11, bold: true, color: '92400e', fontFace: 'Arial' });
slide.addText('Step 4: Review & Accept Changes', { x: 0.5, y: 0.8, w: 9, h: 0.6, fontSize: 28, bold: true, color: DARK_BG, fontFace: 'Arial' });

addImageIfExists(slide, 'actionable-changes.png', { x: 1.5, y: 1.3, w: 7, h: 3.2 });

slide.addText([
  { text: 'Carousel shows one criterion at a time', options: { bullet: true } },
  { text: 'See: submission quote, regulation quote, proposed change', options: { bullet: true } },
  { text: 'One click to accept or skip each finding', options: { bullet: true } },
  { text: '"Requires Human Intervention" shown when AI cannot fix', options: { bullet: true } }
], { x: 0.5, y: 4.6, w: 9, h: 0.8, fontSize: 11, color: DARK_BG, fontFace: 'Arial' });

// APPENDIX E: Document Generation
slide = pptx.addSlide();
slide.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 0.3, w: 1.2, h: 0.4, fill: { color: 'fef3c7' } });
slide.addText('Appendix E', { x: 0.55, y: 0.35, w: 1.1, h: 0.3, fontSize: 11, bold: true, color: '92400e', fontFace: 'Arial' });
slide.addText('Step 5: Document Generation', { x: 0.5, y: 0.8, w: 9, h: 0.6, fontSize: 28, bold: true, color: DARK_BG, fontFace: 'Arial' });

// Flow diagram
slide.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 1.5, w: 2.5, h: 1, fill: { color: 'eff6ff' }, line: { color: BLUE_ACCENT, width: 2 } });
slide.addText('Accepted\nChanges', { x: 0.5, y: 1.7, w: 2.5, h: 0.6, fontSize: 14, bold: true, color: DARK_BG, align: 'center', fontFace: 'Arial' });

slide.addText('→', { x: 3.1, y: 1.8, w: 0.5, h: 0.5, fontSize: 28, color: BLUE_ACCENT, fontFace: 'Arial' });

slide.addShape(pptx.shapes.RECTANGLE, { x: 3.7, y: 1.5, w: 2.5, h: 1, fill: { color: DARK_BG } });
slide.addText('Attlee\nEngine', { x: 3.7, y: 1.7, w: 2.5, h: 0.6, fontSize: 14, bold: true, color: 'ffffff', align: 'center', fontFace: 'Arial' });

slide.addText('→', { x: 6.3, y: 1.8, w: 0.5, h: 0.5, fontSize: 28, color: BLUE_ACCENT, fontFace: 'Arial' });

slide.addShape(pptx.shapes.RECTANGLE, { x: 6.9, y: 1.5, w: 2.5, h: 1, fill: { color: 'ecfdf5' }, line: { color: '10b981', width: 2 } });
slide.addText('Ready\nDocuments', { x: 6.9, y: 1.7, w: 2.5, h: 0.6, fontSize: 14, bold: true, color: '065f46', align: 'center', fontFace: 'Arial' });

// Output documents
slide.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 3, w: 3, h: 1.8, fill: { color: 'f8fafc' }, line: { color: 'e2e8f0', width: 1 } });
slide.addText('Amended Document', { x: 0.6, y: 3.1, w: 2.8, h: 0.4, fontSize: 14, bold: true, color: DARK_BG, fontFace: 'Arial' });
slide.addText('• Editable Word format\n• Yellow-highlighted changes\n• Table of contents\n• Regulatory references', { x: 0.6, y: 3.5, w: 2.8, h: 1.2, fontSize: 10, color: GRAY, fontFace: 'Arial' });

slide.addShape(pptx.shapes.RECTANGLE, { x: 3.5, y: 3, w: 3, h: 1.8, fill: { color: 'f8fafc' }, line: { color: 'e2e8f0', width: 1 } });
slide.addText('PDF Version', { x: 3.6, y: 3.1, w: 2.8, h: 0.4, fontSize: 14, bold: true, color: DARK_BG, fontFace: 'Arial' });
slide.addText('• Clean submission-ready\n• Professional formatting\n• Same content as DOCX\n• For final review', { x: 3.6, y: 3.5, w: 2.8, h: 1.2, fontSize: 10, color: GRAY, fontFace: 'Arial' });

slide.addShape(pptx.shapes.RECTANGLE, { x: 6.5, y: 3, w: 3, h: 1.8, fill: { color: 'fef3c7' }, line: { color: 'f59e0b', width: 1 } });
slide.addText('Outstanding Issues', { x: 6.6, y: 3.1, w: 2.8, h: 0.4, fontSize: 14, bold: true, color: '92400e', fontFace: 'Arial' });
slide.addText('• Skipped criteria listed\n• Human intervention items\n• Clear ownership\n• Next steps defined', { x: 6.6, y: 3.5, w: 2.8, h: 1.2, fontSize: 10, color: '78350f', fontFace: 'Arial' });

// Save
const outputPath = path.join(__dirname, 'attlee-investor-deck.pptx');
pptx.writeFile({ fileName: outputPath })
  .then(() => {
    console.log(`PowerPoint saved to: ${outputPath}`);
    console.log('You can import this file directly into Google Slides.');
  })
  .catch(err => {
    console.error('Error creating PowerPoint:', err);
  });

/**
 * Client Gap Analysis Template (STANDALONE)
 *
 * For clients who want self-service gap analysis.
 * Complete, actionable document they can work from independently.
 * Includes:
 * - Visual state of play
 * - Actions required
 * - Missing information
 * - Who to engage
 * - Timeline and next steps
 *
 * UPDATED (GitHub Issue #3): Uses centralized owner role config
 * UPDATED (GitHub Issue #6): Includes detailed gap descriptions (what was found,
 * what is missing, what is needed) instead of just listing check titles
 */

import { detectSpecialistRoles } from '../config/owner-roles.js';
import { generateGapDescription } from '../services/compliance-enrichment.js';
import { getRegulatoryContext } from '../constants/regulatory-context.js';

export function generateClientGapAnalysisHTML(assessment: any): string {
  const allIssues = assessment.results.filter((r: any) =>
    r.status === 'does_not_meet' || r.status === 'partial'
  );

  // Group ALL failing issues with detailed descriptions — not just keyword-matched ones (P2A fix)
  interface DetailedGap {
    title: string;
    whatWasFound: string;
    whatIsMissing: string;
    whatIsNeeded: string;
    priority: string;
    clause: string;
  }

  const documentsNeeded: DetailedGap[] = [];
  const certificationsNeeded: DetailedGap[] = [];
  const informationNeeded: DetailedGap[] = [];
  const specialistsNeeded: Set<string> = new Set();

  allIssues.forEach((issue: any) => {
    const category = (issue.category || '').toLowerCase();
    const title = issue.matrix_title;
    const priority = issue.triage?.urgency || 'MEDIUM_PRIORITY';

    const gapDescription = generateGapDescription(issue);
    const regCtx = getRegulatoryContext(issue.matrix_id, issue.category || '');

    const detailedGap: DetailedGap = {
      title,
      whatWasFound: gapDescription.whatWasFound,
      whatIsMissing: gapDescription.whatIsMissing,
      whatIsNeeded: gapDescription.whatIsNeeded,
      priority: priority.replace(/_/g, ' '),
      clause: regCtx.clause,
    };

    // Categorise by issue category rather than keyword-scanning reasoning text
    if (category.includes('fire') || category.includes('struct') || category.includes('mep') || category.includes('acoustic')) {
      certificationsNeeded.push(detailedGap);
    } else if (
      issue.status === 'missing_information' ||
      issue.triage?.action_type === 'DOCUMENT_MISSING' ||
      category.includes('submission') || category.includes('design & access')
    ) {
      documentsNeeded.push(detailedGap);
    } else {
      informationNeeded.push(detailedGap);
    }

    // Extract specialist requirements using centralized config (GitHub Issue #3)
    const ownerType = issue.owner_type || issue.actions_required?.[0]?.owner_type;
    if (ownerType) {
      const detectedRoles = detectSpecialistRoles(ownerType);
      detectedRoles.forEach(role => specialistsNeeded.add(role));
    }
  });

  const critical = allIssues.filter((i: any) =>
    i.triage?.urgency === 'CRITICAL_BLOCKER' || i.triage?.blocks_submission
  );

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>BSR Submission - What We Need From You</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      line-height: 1.6;
      color: #1e293b;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .header {
      background: #1e40af;
      color: white;
      padding: 30px;
      margin: -40px -20px 40px -20px;
    }
    h1 {
      margin: 0 0 10px 0;
      font-size: 32px;
      font-weight: 600;
    }
    .subtitle {
      font-size: 18px;
      opacity: 0.9;
    }
    .alert-box {
      background: #fef2f2;
      border-left: 4px solid #dc2626;
      padding: 20px;
      margin: 30px 0;
    }
    .alert-box h2 {
      color: #991b1b;
      margin: 0 0 10px 0;
      font-size: 20px;
    }
    .section {
      margin: 40px 0;
    }
    .section h2 {
      color: #0f172a;
      font-size: 24px;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e2e8f0;
    }
    .checklist {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 20px;
      margin: 20px 0;
    }
    .checklist-item {
      display: flex;
      gap: 12px;
      padding: 12px 0;
      border-bottom: 1px solid #e2e8f0;
    }
    .checklist-item:last-child {
      border-bottom: none;
    }
    .checkbox {
      width: 20px;
      height: 20px;
      border: 2px solid #94a3b8;
      border-radius: 4px;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .priority-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .priority-critical {
      background: #fee2e2;
      color: #991b1b;
    }
    .priority-high {
      background: #fef3c7;
      color: #92400e;
    }
    .specialist-box {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      padding: 16px;
      margin: 10px 0;
    }
    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
      text-align: center;
      color: #64748b;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>BSR Submission Gap Analysis</h1>
    <div class="subtitle">What We Need From You</div>
    <div style="margin-top: 10px; font-size: 14px;">
      Generated: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
    </div>
  </div>

  <!-- STATE OF PLAY -->
  <div style="background: #f8fafc; border: 2px solid #cbd5e1; padding: 30px; margin: 30px 0;">
    <h2 style="margin: 0 0 20px 0; color: #0f172a; text-align: center;">📊 Where You Stand</h2>

    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 20px;">
      <div style="background: #d1fae5; border: 2px solid #10b981; padding: 20px; text-align: center; border-radius: 8px;">
        <div style="font-size: 48px; font-weight: 700; color: #059669;">
          ${assessment.results.filter((r: any) => r.status === 'meets').length}
        </div>
        <div style="font-size: 14px; color: #065f46; margin-top: 8px;">
          ✅ Criteria Met
        </div>
      </div>

      <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; text-align: center; border-radius: 8px;">
        <div style="font-size: 48px; font-weight: 700; color: #d97706;">
          ${allIssues.filter((r: any) => !critical.includes(r)).length}
        </div>
        <div style="font-size: 14px; color: #92400e; margin-top: 8px;">
          ⚠️ Items to Address
        </div>
      </div>

      <div style="background: ${critical.length > 0 ? '#fee2e2' : '#f0fdf4'}; border: 2px solid ${critical.length > 0 ? '#ef4444' : '#10b981'}; padding: 20px; text-align: center; border-radius: 8px;">
        <div style="font-size: 48px; font-weight: 700; color: ${critical.length > 0 ? '#dc2626' : '#059669'};">
          ${critical.length}
        </div>
        <div style="font-size: 14px; color: ${critical.length > 0 ? '#991b1b' : '#065f46'}; margin-top: 8px;">
          ${critical.length > 0 ? '🚨 Critical Blockers' : '✅ No Blockers'}
        </div>
      </div>
    </div>

    <div style="background: ${critical.length > 0 ? '#fef2f2' : '#f0fdf4'}; border-left: 4px solid ${critical.length > 0 ? '#ef4444' : '#10b981'}; padding: 15px; text-align: center;">
      <strong style="color: ${critical.length > 0 ? '#991b1b' : '#065f46'};">
        ${critical.length > 0
          ? `SUBMISSION BLOCKED - ${critical.length} critical ${critical.length === 1 ? 'item' : 'items'} must be resolved`
          : 'READY TO PROCEED - No critical blockers identified'
        }
      </strong>
    </div>
  </div>

  ${critical.length > 0 ? `
  <div class="alert-box">
    <h2>⚠️ Urgent: ${critical.length} Critical ${critical.length === 1 ? 'Item' : 'Items'}</h2>
    <p>These items will block your submission and must be addressed immediately.</p>
  </div>
  ` : ''}

  <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 30px 0;">
    <h3 style="margin: 0 0 10px 0; color: #065f46;">How to Use This Document</h3>
    <ol style="margin: 0; padding-left: 20px; color: #047857;">
      <li style="margin: 8px 0;">Review the checklist below</li>
      <li style="margin: 8px 0;">Delegate items to your team members</li>
      <li style="margin: 8px 0;">Contact the specialists listed</li>
      <li style="margin: 8px 0;">Send completed items back to us</li>
    </ol>
  </div>

  ${documentsNeeded.length > 0 ? `
  <div class="section">
    <h2>📄 Documents to Provide</h2>
    ${documentsNeeded.map(gap => `
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; margin: 12px 0; border-radius: 4px;">
        <div style="display: flex; align-items: baseline; gap: 12px; margin-bottom: 8px;">
          <div class="checkbox"></div>
          <strong style="color: #0f172a; font-size: 15px;">${gap.title}</strong>
        </div>
        <div style="margin-left: 32px; font-size: 14px; color: #475569;">
          <p style="margin: 6px 0;"><strong>Found:</strong> ${gap.whatWasFound}</p>
          <p style="margin: 6px 0;"><strong>Missing:</strong> ${gap.whatIsMissing}</p>
          <p style="margin: 6px 0;"><strong>Required:</strong> ${gap.whatIsNeeded}</p>
          <p style="margin: 6px 0 2px 0;"><span style="background: ${gap.priority.includes('CRITICAL') ? '#fee2e2' : '#fef3c7'}; color: ${gap.priority.includes('CRITICAL') ? '#991b1b' : '#92400e'}; padding: 2px 8px; border-radius: 3px; font-size: 12px; font-weight: 600;">${gap.priority}</span></p>
          <p style="margin: 4px 0 0 0; font-style: italic; font-size: 11px; color: #94a3b8;">${gap.clause}</p>
        </div>
      </div>
    `).join('')}
  </div>
  ` : ''}

  ${certificationsNeeded.length > 0 ? `
  <div class="section">
    <h2>🎓 Certifications & Test Reports</h2>
    ${certificationsNeeded.map(gap => `
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; margin: 12px 0; border-radius: 4px;">
        <div style="display: flex; align-items: baseline; gap: 12px; margin-bottom: 8px;">
          <div class="checkbox"></div>
          <strong style="color: #0f172a; font-size: 15px;">${gap.title}</strong>
        </div>
        <div style="margin-left: 32px; font-size: 14px; color: #475569;">
          <p style="margin: 6px 0;"><strong>Found:</strong> ${gap.whatWasFound}</p>
          <p style="margin: 6px 0;"><strong>Missing:</strong> ${gap.whatIsMissing}</p>
          <p style="margin: 6px 0;"><strong>Required:</strong> ${gap.whatIsNeeded}</p>
          <p style="margin: 6px 0 2px 0;"><span style="background: ${gap.priority.includes('CRITICAL') ? '#fee2e2' : '#fef3c7'}; color: ${gap.priority.includes('CRITICAL') ? '#991b1b' : '#92400e'}; padding: 2px 8px; border-radius: 3px; font-size: 12px; font-weight: 600;">${gap.priority}</span></p>
          <p style="margin: 4px 0 0 0; font-style: italic; font-size: 11px; color: #94a3b8;">${gap.clause}</p>
        </div>
      </div>
    `).join('')}
  </div>
  ` : ''}

  ${informationNeeded.length > 0 ? `
  <div class="section">
    <h2>ℹ️ Information to Confirm</h2>
    <p style="color: #64748b; margin-bottom: 20px;">
      The following items are listed as "TBC" or missing in your submission. Please provide confirmed details.
    </p>
    ${informationNeeded.map(gap => `
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; margin: 12px 0; border-radius: 4px;">
        <div style="display: flex; align-items: baseline; gap: 12px; margin-bottom: 8px;">
          <div class="checkbox"></div>
          <strong style="color: #0f172a; font-size: 15px;">${gap.title}</strong>
        </div>
        <div style="margin-left: 32px; font-size: 14px; color: #475569;">
          <p style="margin: 6px 0;"><strong>Found:</strong> ${gap.whatWasFound}</p>
          <p style="margin: 6px 0;"><strong>Missing:</strong> ${gap.whatIsMissing}</p>
          <p style="margin: 6px 0;"><strong>Required:</strong> ${gap.whatIsNeeded}</p>
          <p style="margin: 6px 0 2px 0;"><span style="background: ${gap.priority.includes('CRITICAL') ? '#fee2e2' : '#fef3c7'}; color: ${gap.priority.includes('CRITICAL') ? '#991b1b' : '#92400e'}; padding: 2px 8px; border-radius: 3px; font-size: 12px; font-weight: 600;">${gap.priority}</span></p>
          <p style="margin: 4px 0 0 0; font-style: italic; font-size: 11px; color: #94a3b8;">${gap.clause}</p>
        </div>
      </div>
    `).join('')}
  </div>
  ` : ''}

  ${specialistsNeeded.size > 0 ? `
  <div class="section">
    <h2>👥 Specialists to Engage</h2>
    <p style="color: #64748b; margin-bottom: 20px;">
      You will need input from the following specialists:
    </p>
    ${Array.from(specialistsNeeded).map(specialist => `
      <div class="specialist-box">
        <strong>${specialist}</strong>
        <p style="margin: 8px 0 0 0; font-size: 14px; color: #475569;">
          Required for technical sign-off and compliance verification
        </p>
      </div>
    `).join('')}
  </div>
  ` : ''}

  <div class="section">
    <h2>⏱️ Timeline</h2>
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px;">
      <p style="margin: 0; color: #78350f;">
        <strong>Priority Items:</strong> Please provide within 1 week<br>
        <strong>Standard Items:</strong> Please provide within 2 weeks<br>
        <strong>For Questions:</strong> Contact us immediately
      </p>
    </div>
  </div>

  <div class="section">
    <h2>📧 Next Steps</h2>
    <ol style="line-height: 2; color: #475569;">
      <li><strong>Review this checklist</strong> with your project team</li>
      <li><strong>Assign responsibilities</strong> for each item</li>
      <li><strong>Contact specialists</strong> listed above</li>
      <li><strong>Send completed items</strong> to us as you receive them</li>
      <li><strong>We will update</strong> the assessment as items are resolved</li>
    </ol>
  </div>

  <div class="footer">
    <p><strong>BSR Quality Checker</strong> • Client Gap Analysis</p>
    <p>For questions about this document, please contact your consultant.</p>
  </div>
</body>
</html>
  `.trim();
}

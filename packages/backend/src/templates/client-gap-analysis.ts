/**
 * Client Gap Analysis Template
 *
 * Simple, actionable checklist for clients showing what they need to provide.
 * Plain language, no technical jargon, immediately actionable.
 */

export function generateClientGapAnalysisHTML(assessment: any): string {
  const allIssues = assessment.results.filter((r: any) =>
    r.status === 'does_not_meet' || r.status === 'partial'
  );

  // Extract missing information
  const missingInfo = allIssues.filter((i: any) => {
    const reasoning = (i.reasoning || '').toLowerCase();
    const gaps = (i.gaps_identified || []).join(' ').toLowerCase();
    return (
      reasoning.includes('missing') ||
      reasoning.includes('not provided') ||
      reasoning.includes('tbc') ||
      reasoning.includes('to be confirmed') ||
      gaps.includes('missing')
    );
  });

  // Group by what needs to be obtained
  const documentsNeeded: string[] = [];
  const certificationsNeeded: string[] = [];
  const informationNeeded: string[] = [];
  const specialistsNeeded: Set<string> = new Set();

  missingInfo.forEach((issue: any) => {
    const reasoning = issue.reasoning || '';
    const title = issue.matrix_title;

    // Categorize what's needed
    if (reasoning.includes('certificate') || reasoning.includes('certification')) {
      certificationsNeeded.push(title);
    } else if (reasoning.includes('document') || title.includes('Document')) {
      documentsNeeded.push(title);
    } else {
      informationNeeded.push(title);
    }

    // Extract specialist requirements
    const action = issue.actions_required?.[0];
    if (action?.owner) {
      const owner = action.owner.toLowerCase();
      if (owner.includes('fire')) specialistsNeeded.add('Fire Safety Engineer');
      if (owner.includes('structural')) specialistsNeeded.add('Structural Engineer');
      if (owner.includes('mep')) specialistsNeeded.add('MEP Engineer');
      if (owner.includes('acoustic')) specialistsNeeded.add('Acoustic Consultant');
      if (owner.includes('architect')) specialistsNeeded.add('Architect');
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
    <div class="checklist">
      ${documentsNeeded.map(doc => `
        <div class="checklist-item">
          <div class="checkbox"></div>
          <div>${doc}</div>
        </div>
      `).join('')}
    </div>
  </div>
  ` : ''}

  ${certificationsNeeded.length > 0 ? `
  <div class="section">
    <h2>🎓 Certifications & Test Reports</h2>
    <div class="checklist">
      ${certificationsNeeded.map(cert => `
        <div class="checklist-item">
          <div class="checkbox"></div>
          <div>${cert}</div>
        </div>
      `).join('')}
    </div>
  </div>
  ` : ''}

  ${informationNeeded.length > 0 ? `
  <div class="section">
    <h2>ℹ️ Information to Confirm</h2>
    <p style="color: #64748b; margin-bottom: 20px;">
      The following items are listed as "TBC" or missing in your submission. Please provide confirmed details.
    </p>
    <div class="checklist">
      ${informationNeeded.map(info => `
        <div class="checklist-item">
          <div class="checkbox"></div>
          <div>${info}</div>
        </div>
      `).join('')}
    </div>
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

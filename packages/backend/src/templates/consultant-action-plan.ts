/**
 * Consultant Action Plan Template
 *
 * Detailed technical working document for consultants.
 * Includes all analysis, specialist requirements, critical path, technical references.
 * Optimized for executing work at pace.
 */

export function generateConsultantActionPlanHTML(assessment: any): string {
  const allIssues = assessment.results.filter((r: any) =>
    r.status === 'does_not_meet' || r.status === 'partial'
  );

  // Categorize by urgency and type
  const critical = allIssues.filter((i: any) =>
    i.triage?.urgency === 'CRITICAL_BLOCKER' || i.triage?.blocks_submission
  );
  const high = allIssues.filter((i: any) =>
    i.triage?.urgency === 'HIGH_PRIORITY' && !critical.includes(i)
  );
  const medium = allIssues.filter((i: any) =>
    i.triage?.urgency === 'MEDIUM_PRIORITY'
  );

  // Group by discipline
  const byDiscipline = new Map<string, any[]>();
  allIssues.forEach((issue: any) => {
    const category = issue.category || 'General';
    if (!byDiscipline.has(category)) {
      byDiscipline.set(category, []);
    }
    byDiscipline.get(category)!.push(issue);
  });

  // Extract specialist requirements
  const specialists = new Map<string, any[]>();
  allIssues.forEach((issue: any) => {
    const action = issue.actions_required?.[0];
    if (action?.owner) {
      if (!specialists.has(action.owner)) {
        specialists.set(action.owner, []);
      }
      specialists.get(action.owner)!.push(issue);
    }
  });

  // Quick wins
  const quickWins = allIssues.filter((i: any) => i.triage?.quick_win);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Consultant Action Plan - Internal</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      line-height: 1.5;
      color: #1e293b;
      max-width: 900px;
      margin: 0 auto;
      padding: 40px 20px;
      font-size: 14px;
    }
    .header {
      background: #0f172a;
      color: white;
      padding: 30px;
      margin: -40px -20px 40px -20px;
    }
    h1 {
      margin: 0 0 10px 0;
      font-size: 28px;
      font-weight: 700;
    }
    h2 {
      font-size: 20px;
      color: #0f172a;
      margin: 30px 0 15px 0;
      padding-bottom: 8px;
      border-bottom: 2px solid #e2e8f0;
    }
    h3 {
      font-size: 16px;
      color: #334155;
      margin: 20px 0 10px 0;
    }
    .status-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin: 25px 0;
    }
    .status-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 15px;
      text-align: center;
    }
    .status-card .number {
      font-size: 32px;
      font-weight: 700;
      display: block;
      margin-bottom: 5px;
    }
    .status-card .label {
      font-size: 11px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .status-card.critical { border-left: 4px solid #dc2626; }
    .status-card.critical .number { color: #dc2626; }
    .status-card.high { border-left: 4px solid #f59e0b; }
    .status-card.high .number { color: #d97706; }
    .status-card.medium { border-left: 4px solid #3b82f6; }
    .status-card.medium .number { color: #2563eb; }
    .status-card.quick { border-left: 4px solid #10b981; }
    .status-card.quick .number { color: #059669; }
    .issue {
      background: white;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #94a3b8;
      padding: 15px;
      margin-bottom: 12px;
      page-break-inside: avoid;
    }
    .issue.critical { border-left-color: #dc2626; }
    .issue.high { border-left-color: #f59e0b; }
    .issue-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 10px;
    }
    .issue-id {
      font-family: 'Monaco', monospace;
      font-size: 11px;
      background: #f1f5f9;
      color: #475569;
      padding: 3px 8px;
      border-radius: 3px;
    }
    .issue-title {
      font-weight: 600;
      color: #0f172a;
      margin: 5px 0;
    }
    .issue-details {
      font-size: 13px;
      color: #475569;
      margin: 8px 0;
    }
    .action-box {
      background: #eff6ff;
      border-left: 3px solid #3b82f6;
      padding: 10px 12px;
      margin-top: 10px;
      font-size: 12px;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 3px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .badge-critical { background: #fee2e2; color: #991b1b; }
    .badge-high { background: #fef3c7; color: #92400e; }
    .badge-medium { background: #dbeafe; color: #1e40af; }
    .badge-quick { background: #d1fae5; color: #065f46; }
    .specialist-section {
      background: #fefce8;
      border: 1px solid #fef08a;
      padding: 15px;
      margin: 15px 0;
    }
    .timeline {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      padding: 15px;
      margin: 20px 0;
    }
    .timeline-item {
      display: flex;
      gap: 15px;
      padding: 10px 0;
      border-bottom: 1px solid #e2e8f0;
    }
    .timeline-item:last-child { border-bottom: none; }
    .timeline-num {
      background: #0f172a;
      color: white;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      flex-shrink: 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 13px;
    }
    th {
      background: #f1f5f9;
      padding: 10px;
      text-align: left;
      font-weight: 600;
      border: 1px solid #e2e8f0;
    }
    td {
      padding: 10px;
      border: 1px solid #e2e8f0;
    }
    .page-break {
      page-break-before: always;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔧 Consultant Action Plan</h1>
    <div style="font-size: 14px; opacity: 0.9; margin-top: 5px;">
      Internal Working Document • ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
    </div>
    <div style="font-size: 12px; opacity: 0.7; margin-top: 10px;">
      Confidential • For consultant use only
    </div>
  </div>

  <div style="background: #dc2626; color: white; padding: 20px; margin-bottom: 30px;">
    <h2 style="margin: 0; color: white; border: none;">⚡ Critical Path Summary</h2>
    <p style="margin: 10px 0 0 0; font-size: 14px;">
      ${critical.length} critical ${critical.length === 1 ? 'blocker' : 'blockers'} must be resolved before submission.
      ${quickWins.length > 0 ? `${quickWins.length} quick ${quickWins.length === 1 ? 'win' : 'wins'} available for immediate impact.` : ''}
    </p>
  </div>

  <div class="status-grid">
    <div class="status-card critical">
      <span class="number">${critical.length}</span>
      <span class="label">Critical Blockers</span>
    </div>
    <div class="status-card high">
      <span class="number">${high.length}</span>
      <span class="label">High Priority</span>
    </div>
    <div class="status-card medium">
      <span class="number">${medium.length}</span>
      <span class="label">Medium Priority</span>
    </div>
    <div class="status-card quick">
      <span class="number">${quickWins.length}</span>
      <span class="label">Quick Wins</span>
    </div>
  </div>

  <h2>📋 Execution Timeline</h2>
  <div class="timeline">
    <div class="timeline-item">
      <div class="timeline-num">1</div>
      <div>
        <strong>Week 1: Critical Blockers</strong><br>
        <span style="color: #64748b; font-size: 12px;">
          Address ${critical.length} critical ${critical.length === 1 ? 'item' : 'items'}. Engage specialists immediately.
        </span>
      </div>
    </div>
    <div class="timeline-item">
      <div class="timeline-num">2</div>
      <div>
        <strong>Week 1-2: Quick Wins</strong><br>
        <span style="color: #64748b; font-size: 12px;">
          Complete ${quickWins.length} quick ${quickWins.length === 1 ? 'win' : 'wins'} in parallel. Low effort, high impact.
        </span>
      </div>
    </div>
    <div class="timeline-item">
      <div class="timeline-num">3</div>
      <div>
        <strong>Week 2-3: High Priority Items</strong><br>
        <span style="color: #64748b; font-size: 12px;">
          Resolve ${high.length} high priority ${high.length === 1 ? 'item' : 'items'}. Coordinate with client and specialists.
        </span>
      </div>
    </div>
    <div class="timeline-item">
      <div class="timeline-num">4</div>
      <div>
        <strong>Week 3-4: Final Review</strong><br>
        <span style="color: #64748b; font-size: 12px;">
          Complete medium priority items. Final quality check and re-assessment.
        </span>
      </div>
    </div>
  </div>

  ${quickWins.length > 0 ? `
  <h2>⚡ Quick Wins (Start Immediately)</h2>
  <p style="color: #64748b; margin-bottom: 15px;">
    Low effort, high impact items. Complete these first for immediate progress.
  </p>
  ${quickWins.map((issue: any) => {
    const action = issue.actions_required?.[0];
    return `
      <div class="issue">
        <div class="issue-header">
          <span class="issue-id">${issue.matrix_id}</span>
          <span class="badge badge-quick">⚡ Quick Win</span>
        </div>
        <div class="issue-title">${issue.matrix_title}</div>
        <div class="issue-details">${issue.reasoning}</div>
        ${action ? `
        <div class="action-box">
          <strong>Action:</strong> ${action.action}<br>
          <strong>Owner:</strong> ${action.owner} • <strong>Effort:</strong> ${action.effort}
          ${action.expected_benefit ? `<br><strong>Benefit:</strong> ${action.expected_benefit}` : ''}
        </div>
        ` : ''}
      </div>
    `;
  }).join('')}
  ` : ''}

  <div class="page-break"></div>
  <h2>🚨 Critical Blockers (Week 1 Priority)</h2>
  <p style="color: #64748b; margin-bottom: 15px;">
    These items WILL cause submission rejection. Must be resolved immediately.
  </p>
  ${critical.map((issue: any) => {
    const action = issue.actions_required?.[0];
    return `
      <div class="issue critical">
        <div class="issue-header">
          <span class="issue-id">${issue.matrix_id}</span>
          <span class="badge badge-critical">🔴 Critical</span>
        </div>
        <div class="issue-title">${issue.matrix_title}</div>
        <div class="issue-details">
          <strong>Analysis:</strong> ${issue.reasoning}<br>
          ${issue.gaps_identified && issue.gaps_identified.length > 0 ? `
            <strong>Gaps:</strong> ${issue.gaps_identified.join(', ')}<br>
          ` : ''}
          ${issue.confidence ? `
            <strong>Confidence:</strong> ${issue.confidence.level}<br>
          ` : ''}
        </div>
        ${action ? `
        <div class="action-box">
          <strong>Required Action:</strong> ${action.action}<br>
          <strong>Assigned To:</strong> ${action.owner}<br>
          <strong>Estimated Effort:</strong> ${action.effort}<br>
          ${action.expected_benefit ? `<strong>Expected Benefit:</strong> ${action.expected_benefit}<br>` : ''}
          ${issue.triage?.blocks_submission ? '<strong style="color: #dc2626;">⚠️ BLOCKS SUBMISSION</strong>' : ''}
        </div>
        ` : ''}
      </div>
    `;
  }).join('')}

  ${specialists.size > 0 ? `
  <div class="page-break"></div>
  <h2>👥 Specialist Engagement Plan</h2>
  ${Array.from(specialists.entries()).map(([specialist, issues]) => `
    <div class="specialist-section">
      <h3 style="margin-top: 0;">${specialist}</h3>
      <p style="font-size: 13px; color: #78350f; margin: 5px 0 15px 0;">
        <strong>${issues.length} ${issues.length === 1 ? 'item requires' : 'items require'}</strong> input from this specialist
      </p>
      <table>
        <thead>
          <tr>
            <th style="width: 120px;">ID</th>
            <th>Item</th>
            <th style="width: 100px;">Urgency</th>
            <th style="width: 120px;">Effort</th>
          </tr>
        </thead>
        <tbody>
          ${issues.map((issue: any) => `
            <tr>
              <td>${issue.matrix_id}</td>
              <td>${issue.matrix_title}</td>
              <td>
                <span class="badge ${
                  issue.triage?.urgency === 'CRITICAL_BLOCKER' ? 'badge-critical' :
                  issue.triage?.urgency === 'HIGH_PRIORITY' ? 'badge-high' : 'badge-medium'
                }">
                  ${issue.triage?.urgency?.replace('_', ' ') || 'MEDIUM'}
                </span>
              </td>
              <td>${issue.actions_required?.[0]?.effort || 'TBD'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `).join('')}
  ` : ''}

  ${byDiscipline.size > 0 ? `
  <div class="page-break"></div>
  <h2>🔍 Issues by Discipline</h2>
  ${Array.from(byDiscipline.entries()).map(([discipline, issues]) => `
    <h3>${discipline} (${issues.length} ${issues.length === 1 ? 'item' : 'items'})</h3>
    ${issues.map((issue: any) => {
      const action = issue.actions_required?.[0];
      return `
        <div class="issue ${
          issue.triage?.urgency === 'CRITICAL_BLOCKER' ? 'critical' :
          issue.triage?.urgency === 'HIGH_PRIORITY' ? 'high' : ''
        }">
          <div class="issue-header">
            <span class="issue-id">${issue.matrix_id}</span>
            <span class="badge ${
              issue.triage?.urgency === 'CRITICAL_BLOCKER' ? 'badge-critical' :
              issue.triage?.urgency === 'HIGH_PRIORITY' ? 'badge-high' : 'badge-medium'
            }">
              ${issue.triage?.urgency?.replace('_', ' ') || 'MEDIUM'}
            </span>
          </div>
          <div class="issue-title">${issue.matrix_title}</div>
          <div class="issue-details">${issue.reasoning}</div>
          ${action ? `
          <div class="action-box">
            <strong>Action:</strong> ${action.action}<br>
            <strong>Owner:</strong> ${action.owner} • <strong>Effort:</strong> ${action.effort}
          </div>
          ` : ''}
        </div>
      `;
    }).join('')}
  `).join('')}
  ` : ''}

  <div class="page-break"></div>
  <h2>📊 Work Breakdown Summary</h2>
  <table>
    <thead>
      <tr>
        <th>Discipline</th>
        <th>Critical</th>
        <th>High</th>
        <th>Medium</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${Array.from(byDiscipline.entries()).map(([discipline, issues]) => {
        const crit = issues.filter((i: any) => i.triage?.urgency === 'CRITICAL_BLOCKER').length;
        const hi = issues.filter((i: any) => i.triage?.urgency === 'HIGH_PRIORITY').length;
        const med = issues.filter((i: any) => i.triage?.urgency === 'MEDIUM_PRIORITY').length;
        return `
          <tr>
            <td><strong>${discipline}</strong></td>
            <td style="text-align: center;">${crit}</td>
            <td style="text-align: center;">${hi}</td>
            <td style="text-align: center;">${med}</td>
            <td style="text-align: center;"><strong>${issues.length}</strong></td>
          </tr>
        `;
      }).join('')}
      <tr style="background: #f8fafc; font-weight: 600;">
        <td>TOTAL</td>
        <td style="text-align: center;">${critical.length}</td>
        <td style="text-align: center;">${high.length}</td>
        <td style="text-align: center;">${medium.length}</td>
        <td style="text-align: center;">${allIssues.length}</td>
      </tr>
    </tbody>
  </table>

  <div style="margin-top: 40px; padding: 20px; background: #f0fdf4; border-left: 4px solid #10b981;">
    <h3 style="margin-top: 0; color: #065f46;">📝 Consultant Notes</h3>
    <ul style="color: #047857; line-height: 2;">
      <li>Prioritize critical blockers - these will reject the submission</li>
      <li>Quick wins provide immediate progress with minimal effort</li>
      <li>Engage specialists early to avoid delays</li>
      <li>Client gap analysis sent separately - track their progress</li>
      <li>Re-assess after each major update to track progress</li>
    </ul>
  </div>

  <div style="margin-top: 60px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 12px;">
    <p><strong>BSR Quality Checker</strong> • Consultant Action Plan</p>
    <p>Confidential • For internal consultant use only</p>
  </div>
</body>
</html>
  `.trim();
}

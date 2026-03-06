/**
 * Engagement Brief Generator
 *
 * Generates ready-to-send engagement briefs for specialists
 * Includes scope, deliverables, timeline, and regulatory context
 */

import React, { useMemo } from 'react';
import type { AssessmentResult, EngagementBrief } from '../types/assessment';

interface EngagementBriefGeneratorProps {
  specialist: string;
  issues: AssessmentResult[];
  projectName?: string;
  onBriefGenerated?: (brief: EngagementBrief) => void;
}

export const EngagementBriefGenerator: React.FC<EngagementBriefGeneratorProps> = ({
  specialist,
  issues,
  projectName = 'Your Project',
  onBriefGenerated
}) => {
  // Generate the engagement brief
  const brief = useMemo((): EngagementBrief => {
    // Categorize issues by urgency
    const criticalIssues = issues.filter(i => i.triage?.urgency === 'CRITICAL_BLOCKER');
    const highPriorityIssues = issues.filter(i => i.triage?.urgency === 'HIGH_PRIORITY');

    // Calculate estimated duration
    const hasMonthsEffort = issues.some(i => i.effort_assessment?.level === 'MONTHS');
    const hasWeeksEffort = issues.some(i => i.effort_assessment?.level === 'WEEKS');
    const estimatedDuration = hasMonthsEffort ? '1-3 months' : hasWeeksEffort ? '2-6 weeks' : '1-2 weeks';

    // Extract regulatory context
    const regulatoryContext: string[] = [];
    issues.forEach(issue => {
      if (issue.reference_evidence.found && issue.reference_evidence.doc_title) {
        const docTitle = issue.reference_evidence.doc_title;
        if (!regulatoryContext.includes(docTitle)) {
          regulatoryContext.push(docTitle);
        }
      }
    });

    // Build scope of work
    const scopeParts: string[] = [];

    // Group issues by action type
    const documentUpdates = issues.filter(i => i.triage?.action_type === 'DOCUMENT_UPDATE');
    const documentMissing = issues.filter(i => i.triage?.action_type === 'DOCUMENT_MISSING');
    const crossDocAlignment = issues.filter(i => i.triage?.action_type === 'CROSS_DOC_ALIGNMENT');
    const informationMissing = issues.filter(i => i.triage?.action_type === 'INFORMATION_MISSING');

    if (documentMissing.length > 0) {
      scopeParts.push(`Prepare ${documentMissing.length} missing document${documentMissing.length > 1 ? 's' : ''} required for BSR compliance`);
    }
    if (documentUpdates.length > 0) {
      scopeParts.push(`Update ${documentUpdates.length} existing document${documentUpdates.length > 1 ? 's' : ''} to address identified gaps`);
    }
    if (crossDocAlignment.length > 0) {
      scopeParts.push(`Resolve ${crossDocAlignment.length} cross-document alignment issue${crossDocAlignment.length > 1 ? 's' : ''}`);
    }
    if (informationMissing.length > 0) {
      scopeParts.push(`Provide ${informationMissing.length} missing information element${informationMissing.length > 1 ? 's' : ''}`);
    }

    const scopeOfWork = scopeParts.join('. ') + '.';

    // Build deliverables list
    const deliverables: string[] = [];
    issues.forEach(issue => {
      if (issue.actions_required.length > 0) {
        issue.actions_required.forEach(action => {
          const deliverable = `${action.action} (Expected benefit: ${action.expected_benefit})`;
          if (!deliverables.includes(deliverable)) {
            deliverables.push(deliverable);
          }
        });
      }
    });

    // If no specific actions, create generic deliverables
    if (deliverables.length === 0) {
      issues.forEach(issue => {
        deliverables.push(`Address ${issue.matrix_id}: ${issue.matrix_title}`);
      });
    }

    // Build brief text
    const briefText = generateBriefText(
      specialist,
      projectName,
      issues,
      criticalIssues,
      highPriorityIssues,
      scopeOfWork,
      deliverables,
      estimatedDuration,
      regulatoryContext
    );

    return {
      specialist_type: specialist,
      issues_to_address: issues.map(i => ({
        id: i.matrix_id,
        title: i.matrix_title,
        urgency: i.triage?.urgency || 'MEDIUM_PRIORITY'
      })),
      scope_of_work: scopeOfWork,
      deliverables,
      estimated_duration: estimatedDuration,
      regulatory_context: regulatoryContext,
      brief_text: briefText
    };
  }, [specialist, issues, projectName]);

  // Call callback when brief is generated
  React.useEffect(() => {
    if (onBriefGenerated) {
      onBriefGenerated(brief);
    }
  }, [brief, onBriefGenerated]);

  return null;
};

// Generate the full brief text
function generateBriefText(
  specialist: string,
  projectName: string,
  issues: AssessmentResult[],
  criticalIssues: AssessmentResult[],
  highPriorityIssues: AssessmentResult[],
  scopeOfWork: string,
  deliverables: string[],
  estimatedDuration: string,
  regulatoryContext: string[]
): string {
  const lines: string[] = [];

  // Subject line
  lines.push(`Subject: ${specialist} Engagement Required - ${projectName} BSR Gateway 2 Submission`);
  lines.push('');

  // Opening
  lines.push(`Dear ${specialist},`);
  lines.push('');
  lines.push(`We are preparing our Building Safety Regulator (BSR) Gateway 2 submission for ${projectName} and require your specialist input to address identified compliance gaps.`);
  lines.push('');

  // Urgency context
  if (criticalIssues.length > 0) {
    lines.push(`**CRITICAL: ${criticalIssues.length} issue${criticalIssues.length > 1 ? 's' : ''} identified as submission blocker${criticalIssues.length > 1 ? 's' : ''}**`);
    lines.push('');
  }

  // Overview
  lines.push('## Engagement Overview');
  lines.push('');
  lines.push(`Our AI-powered quality assessment has identified ${issues.length} issue${issues.length > 1 ? 's' : ''} requiring your expertise:`);
  if (criticalIssues.length > 0) {
    lines.push(`- ${criticalIssues.length} Critical Blocker${criticalIssues.length > 1 ? 's' : ''} (must resolve before submission)`);
  }
  if (highPriorityIssues.length > 0) {
    lines.push(`- ${highPriorityIssues.length} High Priority (recommended to address)`);
  }
  const mediumLowCount = issues.length - criticalIssues.length - highPriorityIssues.length;
  if (mediumLowCount > 0) {
    lines.push(`- ${mediumLowCount} Medium/Low Priority`);
  }
  lines.push('');

  // Scope of Work
  lines.push('## Scope of Work');
  lines.push('');
  lines.push(scopeOfWork);
  lines.push('');

  // Key Issues
  lines.push('## Key Issues to Address');
  lines.push('');

  // Show top 5 most critical/urgent issues
  const topIssues = [...criticalIssues, ...highPriorityIssues].slice(0, 5);
  topIssues.forEach((issue, idx) => {
    lines.push(`### ${idx + 1}. ${issue.matrix_title} (${issue.matrix_id})`);
    lines.push('');
    lines.push(`**Status:** ${issue.status.replace(/_/g, ' ').toUpperCase()}`);
    lines.push(`**Urgency:** ${issue.triage?.urgency || 'Not specified'}`);
    lines.push('');
    lines.push(`**Gap Identified:** ${issue.gaps_identified[0] || issue.reasoning}`);
    lines.push('');
    if (issue.actions_required.length > 0) {
      lines.push(`**Required Action:** ${issue.actions_required[0].action}`);
      lines.push(`**Expected Benefit:** ${issue.actions_required[0].expected_benefit}`);
      lines.push('');
    }
  });

  if (issues.length > 5) {
    lines.push(`*Plus ${issues.length - 5} additional issue${issues.length - 5 > 1 ? 's' : ''} (full list available in attached report)*`);
    lines.push('');
  }

  // Deliverables
  lines.push('## Expected Deliverables');
  lines.push('');
  deliverables.slice(0, 10).forEach((deliverable, idx) => {
    lines.push(`${idx + 1}. ${deliverable}`);
  });
  if (deliverables.length > 10) {
    lines.push(`*Plus ${deliverables.length - 10} additional deliverable${deliverables.length - 10 > 1 ? 's' : ''}*`);
  }
  lines.push('');

  // Timeline
  lines.push('## Timeline & Urgency');
  lines.push('');
  lines.push(`**Estimated Duration:** ${estimatedDuration}`);
  if (criticalIssues.length > 0) {
    lines.push(`**Submission Impact:** Cannot proceed to BSR submission until critical issues resolved`);
  } else if (highPriorityIssues.length > 0) {
    lines.push(`**Submission Impact:** Proceeding without these fixes may result in BSR queries and delays`);
  } else {
    lines.push(`**Submission Impact:** Resolving these issues will strengthen submission quality`);
  }
  lines.push('');

  // Regulatory Context
  if (regulatoryContext.length > 0) {
    lines.push('## Regulatory Context');
    lines.push('');
    lines.push('Your work should address requirements from:');
    regulatoryContext.forEach(context => {
      lines.push(`- ${context}`);
    });
    lines.push('');
  }

  // Next Steps
  lines.push('## Next Steps');
  lines.push('');
  lines.push('1. Please review this brief and the attached detailed assessment');
  lines.push('2. Confirm your availability and estimated timeline');
  lines.push('3. Let us know if you need any additional information or access to project documents');
  lines.push('4. We can schedule a call to discuss the issues in detail if helpful');
  lines.push('');

  // Closing
  lines.push('We appreciate your expertise in helping us achieve BSR compliance. Please let us know if you have any questions or need clarification on any of the issues identified.');
  lines.push('');
  lines.push('Best regards,');
  lines.push('[Your Name]');
  lines.push('[Your Company]');
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('*This brief was generated using AI-powered BSR quality assessment. All issues have been verified against Building Safety Act 2022 requirements and supporting regulations.*');

  return lines.join('\n');
}

export default EngagementBriefGenerator;

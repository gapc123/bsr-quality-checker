import { callClaude } from './claude.js';
import prisma from '../db/client.js';

const SERVICE_PACKAGES: Record<string, string> = {
  gap_assessment: 'Gap Assessment',
  full_pack_prep: 'Full Pack Preparation',
  compliance_review: 'Compliance Review',
  ongoing_support: 'Ongoing Support',
};

/**
 * Generate an AI summary for a single pack
 * Includes: service type, requirements, documents, assessment results, task progress
 */
export async function generatePackSummary(packId: string): Promise<string> {
  // Fetch all pack data
  const pack = await prisma.pack.findUnique({
    where: { id: packId },
    include: {
      client: true,
      tasks: {
        orderBy: { sortOrder: 'asc' },
      },
      versions: {
        orderBy: { versionNumber: 'desc' },
        take: 1,
        include: {
          documents: true,
          issues: true,
          fields: true,
        },
      },
    },
  });

  if (!pack) {
    throw new Error('Pack not found');
  }

  const latestVersion = pack.versions[0];
  const tasks = pack.tasks || [];
  const now = new Date();

  // Enhanced task breakdown
  const tasksByStatus = {
    not_started: tasks.filter((t) => t.status === 'not_started').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    blocked: tasks.filter((t) => t.status === 'blocked').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
  };

  const tasksByPriority = {
    high: tasks.filter((t) => t.priority === 'high').length,
    medium: tasks.filter((t) => t.priority === 'medium').length,
    low: tasks.filter((t) => t.priority === 'low').length,
  };

  // Identify critical tasks
  const overdueTasks = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed'
  );

  const dueSoonTasks = tasks.filter((t) => {
    if (!t.dueDate || t.status === 'completed') return false;
    const dueDate = new Date(t.dueDate);
    const daysUntil = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return daysUntil >= 0 && daysUntil <= 7;
  });

  const blockedTasks = tasks.filter((t) => t.status === 'blocked');

  const highPriorityPending = tasks.filter(
    (t) => t.priority === 'high' && t.status !== 'completed'
  );

  // Calculate progress
  const totalTasks = tasks.length;
  const completedTasks = tasksByStatus.completed;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Timeline info
  const daysRemaining = pack.targetCompletionDate
    ? Math.ceil((new Date(pack.targetCompletionDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Parse milestones
  let nextMilestone = null;
  if (pack.milestones) {
    try {
      const milestones = JSON.parse(pack.milestones);
      const upcomingMilestones = milestones.filter(
        (m: any) => !m.completedDate && m.targetDate && new Date(m.targetDate) >= now
      );
      if (upcomingMilestones.length > 0) {
        nextMilestone = upcomingMilestones[0];
      }
    } catch (e) {
      // Invalid JSON, skip
    }
  }

  // Team info
  const assignedMembers = new Set(
    tasks.filter((t) => t.assignedToName).map((t) => t.assignedToName)
  );

  const completedTasks_old = tasks.filter((t) => t.completed).length;

  // Build enhanced context for the LLM
  const context = {
    packName: pack.name,
    clientName: pack.client?.name || 'Unassigned',
    clientCompany: pack.client?.company || null,
    servicePackage: pack.servicePackage
      ? SERVICE_PACKAGES[pack.servicePackage] || pack.servicePackage
      : 'Not specified',
    requirements: pack.requirements || 'No requirements captured',

    // Enhanced task insights
    taskBreakdown: {
      total: totalTasks,
      byStatus: tasksByStatus,
      byPriority: tasksByPriority,
      progressPercent,
      overdueTasks: overdueTasks.map((t) => ({
        title: t.title,
        dueDate: t.dueDate,
        priority: t.priority,
        assignedTo: t.assignedToName,
      })),
      dueSoonTasks: dueSoonTasks.map((t) => ({
        title: t.title,
        dueDate: t.dueDate,
        priority: t.priority,
      })),
      blockedTasks: blockedTasks.map((t) => ({
        title: t.title,
        priority: t.priority,
      })),
      highPriorityPending: highPriorityPending.map((t) => ({
        title: t.title,
        status: t.status,
        dueDate: t.dueDate,
      })),
    },

    // Timeline info
    timeline: {
      status: pack.status,
      startedAt: pack.startedAt,
      targetCompletionDate: pack.targetCompletionDate,
      actualCompletionDate: pack.actualCompletionDate,
      daysRemaining,
      nextMilestone,
    },

    // Team info
    team: {
      leadAssignee: pack.leadName,
      assignedMembers: Array.from(assignedMembers),
    },

    // Document and assessment info (existing)
    documentsUploaded: latestVersion?.documents.length || 0,
    documentTypes: latestVersion?.documents.map((d) => d.docType || d.filename) || [],
    issueCount: {
      high: latestVersion?.issues.filter((i) => i.severity === 'high').length || 0,
      medium: latestVersion?.issues.filter((i) => i.severity === 'medium').length || 0,
      low: latestVersion?.issues.filter((i) => i.severity === 'low').length || 0,
    },
    projectDetails: latestVersion
      ? {
          projectName: latestVersion.projectName,
          borough: latestVersion.borough,
          buildingType: latestVersion.buildingType,
          height: latestVersion.height,
          storeys: latestVersion.storeys,
          targetDate: latestVersion.targetDate,
        }
      : null,
    hasAssessment: !!latestVersion?.matrixAssessment,
    versionCount: pack.versions.length || 0,
  };

  const systemPrompt = `You are an internal project assistant for a building safety consultancy. Generate a comprehensive, actionable summary of a client's submission pack status.

The summary should be 4-6 sentences that focus on:
1. Current Status & Progress: Pack status, where are we in the workflow, task completion percentage
2. Immediate Actions Needed: What needs attention NOW (overdue tasks, blocked tasks, high-priority pending items)
3. Timeline & Deadlines: Are we on track? Days remaining until target date? Upcoming milestones?
4. Team Activity: Who's leading, who's working on what
5. Risks & Blockers: Any impediments or concerns to highlight

CRITICAL: Be specific with numbers, dates, and action items. Highlight urgent issues clearly. Use natural language suitable for a busy team dashboard.`;

  const userPrompt = `Generate an enhanced pack summary based on this comprehensive data:

${JSON.stringify(context, null, 2)}

Write a detailed summary (4-6 sentences) that helps the team understand:
- Progress status and percentage
- Urgent action items (overdue/blocked tasks)
- Timeline health (on track, at risk, or delayed)
- Key team members involved
- Any blockers or risks

Make it actionable and highlight anything requiring immediate attention.`;

  const summary = await callClaude(systemPrompt, [{ role: 'user', content: userPrompt }], 500);

  // Cache the summary
  await prisma.pack.update({
    where: { id: packId },
    data: {
      aiSummary: summary.trim(),
      summaryUpdatedAt: new Date(),
    },
  });

  return summary.trim();
}

/**
 * Generate an AI summary for a client (aggregates all their packs)
 */
export async function generateClientSummary(clientId: string): Promise<string> {
  // Fetch client with all packs and their data
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      packs: {
        include: {
          tasks: true,
          versions: {
            orderBy: { versionNumber: 'desc' },
            take: 1,
            include: {
              documents: true,
              issues: true,
            },
          },
        },
      },
    },
  });

  if (!client) {
    throw new Error('Client not found');
  }

  const now = new Date();

  // Aggregate data across all packs with enhanced metrics
  const packSummaries = client.packs.map((pack) => {
    const latestVersion = pack.versions[0];
    const tasks = pack.tasks || [];
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    const overdueTasks = tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed'
    );
    const blockedTasks = tasks.filter((t) => t.status === 'blocked');
    const daysRemaining = pack.targetCompletionDate
      ? Math.ceil((new Date(pack.targetCompletionDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return {
      name: pack.name,
      status: pack.status,
      servicePackage: pack.servicePackage
        ? SERVICE_PACKAGES[pack.servicePackage] || pack.servicePackage
        : 'Not specified',
      requirements: pack.requirements,
      taskProgress:
        tasks.length > 0
          ? {
              completed: completedTasks,
              total: tasks.length,
              percent: Math.round((completedTasks / tasks.length) * 100),
            }
          : null,
      overdueTaskCount: overdueTasks.length,
      blockedTaskCount: blockedTasks.length,
      daysRemaining,
      timelineHealth:
        daysRemaining === null
          ? 'unknown'
          : daysRemaining < 0
          ? 'delayed'
          : daysRemaining <= 7
          ? 'at-risk'
          : 'on-track',
      leadAssignee: pack.leadName,
      documentsUploaded: latestVersion?.documents.length || 0,
      issues: {
        high: latestVersion?.issues.filter((i) => i.severity === 'high').length || 0,
        medium: latestVersion?.issues.filter((i) => i.severity === 'medium').length || 0,
        low: latestVersion?.issues.filter((i) => i.severity === 'low').length || 0,
      },
      hasAssessment: !!latestVersion?.matrixAssessment,
      projectName: latestVersion?.projectName,
      targetDate: pack.targetCompletionDate,
    };
  });

  const totalHighIssues = packSummaries.reduce((sum, p) => sum + p.issues.high, 0);
  const totalMediumIssues = packSummaries.reduce((sum, p) => sum + p.issues.medium, 0);
  const totalDocuments = packSummaries.reduce((sum, p) => sum + p.documentsUploaded, 0);
  const packsWithAssessments = packSummaries.filter((p) => p.hasAssessment).length;
  const totalOverdueTasks = packSummaries.reduce((sum, p) => sum + p.overdueTaskCount, 0);
  const totalBlockedTasks = packSummaries.reduce((sum, p) => sum + p.blockedTaskCount, 0);
  const packsAtRisk = packSummaries.filter((p) => p.timelineHealth === 'at-risk' || p.timelineHealth === 'delayed').length;
  const packsRequiringAttention = packSummaries.filter(
    (p) => p.overdueTaskCount > 0 || p.blockedTaskCount > 0 || p.timelineHealth === 'delayed'
  );

  const context = {
    clientName: client.name,
    company: client.company,
    contactEmail: client.contactEmail,
    notes: client.notes,
    totalPacks: client.packs.length,
    packsWithAssessments,
    totalDocuments,
    totalHighIssues,
    totalMediumIssues,

    // Enhanced metrics
    totalOverdueTasks,
    totalBlockedTasks,
    packsAtRisk,
    packsRequiringUrgentAttention: packsRequiringAttention.map((p) => ({
      name: p.name,
      status: p.status,
      overdueTaskCount: p.overdueTaskCount,
      blockedTaskCount: p.blockedTaskCount,
      timelineHealth: p.timelineHealth,
      daysRemaining: p.daysRemaining,
    })),

    packs: packSummaries,
  };

  const systemPrompt = `You are an internal project assistant for a building safety consultancy. Generate a comprehensive, actionable summary of a client's overall engagement status.

The summary should be 4-6 sentences that focus on:
1. Client identification and relationship overview
2. Portfolio health: Number of active projects, their statuses, and overall progress
3. Urgent items: Highlight packs requiring immediate attention (overdue tasks, delayed timelines)
4. Timeline assessment: How many packs are on track vs at risk vs delayed
5. Key priorities and action items across all projects

CRITICAL: Prioritize urgent issues. Be specific about which packs need attention and why. Include numbers and timelines.`;

  const userPrompt = `Generate an enhanced client summary based on this comprehensive data:

${JSON.stringify(context, null, 2)}

Write a detailed summary (4-6 sentences) that helps the team understand:
- Overall client engagement health
- Which packs need urgent attention and why
- Timeline status across all packs (on track vs at risk)
- Key action items and priorities
- Any patterns or concerns across the portfolio

Make it actionable and highlight anything requiring immediate attention.`;

  const summary = await callClaude(systemPrompt, [{ role: 'user', content: userPrompt }], 600);

  // Cache the summary
  await prisma.client.update({
    where: { id: clientId },
    data: {
      aiSummary: summary.trim(),
      summaryUpdatedAt: new Date(),
    },
  });

  return summary.trim();
}

/**
 * Get cached summary or generate fresh one
 */
export async function getPackSummary(
  packId: string,
  forceRefresh = false
): Promise<{ summary: string; updatedAt: Date | null }> {
  const pack = await prisma.pack.findUnique({
    where: { id: packId },
    select: { aiSummary: true, summaryUpdatedAt: true },
  });

  if (!pack) {
    throw new Error('Pack not found');
  }

  // Return cached if available and not forcing refresh
  if (pack.aiSummary && !forceRefresh) {
    return {
      summary: pack.aiSummary,
      updatedAt: pack.summaryUpdatedAt,
    };
  }

  // Generate fresh summary
  const summary = await generatePackSummary(packId);
  return {
    summary,
    updatedAt: new Date(),
  };
}

/**
 * Get cached client summary or generate fresh one
 */
export async function getClientSummary(
  clientId: string,
  forceRefresh = false
): Promise<{ summary: string; updatedAt: Date | null }> {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { aiSummary: true, summaryUpdatedAt: true },
  });

  if (!client) {
    throw new Error('Client not found');
  }

  // Return cached if available and not forcing refresh
  if (client.aiSummary && !forceRefresh) {
    return {
      summary: client.aiSummary,
      updatedAt: client.summaryUpdatedAt,
    };
  }

  // Generate fresh summary
  const summary = await generateClientSummary(clientId);
  return {
    summary,
    updatedAt: new Date(),
  };
}

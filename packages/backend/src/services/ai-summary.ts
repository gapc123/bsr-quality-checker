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
  const completedTasks = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;

  // Build context for the LLM
  const context = {
    packName: pack.name,
    clientName: pack.client?.name || 'Unassigned',
    clientCompany: pack.client?.company || null,
    servicePackage: pack.servicePackage
      ? SERVICE_PACKAGES[pack.servicePackage] || pack.servicePackage
      : 'Not specified',
    requirements: pack.requirements || 'No requirements captured',
    taskProgress: totalTasks > 0 ? `${completedTasks} of ${totalTasks}` : 'No tasks defined',
    taskList: tasks.map((t) => ({
      title: t.title,
      completed: t.completed,
    })),
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

  const systemPrompt = `You are an internal project assistant for a building safety consultancy. Generate a concise, professional summary of a client's submission pack status.

The summary should be 2-4 sentences that cover:
1. Client and project identification
2. Service type and key requirements
3. Current progress (documents, tasks, assessment status)
4. Any critical issues or next steps

Be factual and specific. Use natural language, not bullet points. Reference specific numbers and findings.`;

  const userPrompt = `Generate a pack summary based on this data:

${JSON.stringify(context, null, 2)}

Write a concise summary paragraph (2-4 sentences) suitable for display on a dashboard.`;

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

  // Aggregate data across all packs
  const packSummaries = client.packs.map((pack) => {
    const latestVersion = pack.versions[0];
    const tasks = pack.tasks || [];
    const completedTasks = tasks.filter((t) => t.completed).length;

    return {
      name: pack.name,
      servicePackage: pack.servicePackage
        ? SERVICE_PACKAGES[pack.servicePackage] || pack.servicePackage
        : 'Not specified',
      requirements: pack.requirements,
      taskProgress:
        tasks.length > 0 ? { completed: completedTasks, total: tasks.length } : null,
      documentsUploaded: latestVersion?.documents.length || 0,
      issues: {
        high: latestVersion?.issues.filter((i) => i.severity === 'high').length || 0,
        medium: latestVersion?.issues.filter((i) => i.severity === 'medium').length || 0,
        low: latestVersion?.issues.filter((i) => i.severity === 'low').length || 0,
      },
      hasAssessment: !!latestVersion?.matrixAssessment,
      projectName: latestVersion?.projectName,
      targetDate: latestVersion?.targetDate,
    };
  });

  const totalHighIssues = packSummaries.reduce((sum, p) => sum + p.issues.high, 0);
  const totalMediumIssues = packSummaries.reduce((sum, p) => sum + p.issues.medium, 0);
  const totalDocuments = packSummaries.reduce((sum, p) => sum + p.documentsUploaded, 0);
  const packsWithAssessments = packSummaries.filter((p) => p.hasAssessment).length;

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
    packs: packSummaries,
  };

  const systemPrompt = `You are an internal project assistant for a building safety consultancy. Generate a concise, professional summary of a client's overall engagement status.

The summary should be 3-5 sentences that cover:
1. Client identification and relationship overview
2. Number of active projects and their service types
3. Overall progress across all packs
4. Key issues or priorities requiring attention
5. Any patterns or notable observations

Be factual and specific. Use natural language. Highlight anything that needs attention.`;

  const userPrompt = `Generate a client summary based on this data:

${JSON.stringify(context, null, 2)}

Write a concise summary (3-5 sentences) suitable for display on a client overview dashboard.`;

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

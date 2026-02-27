import prisma from '../db/client.js';

interface TaskTemplate {
  title: string;
  description: string;
  category: string;
  priority: string;
  estimatedHours: number;
  dayOffset: number;
  dependsOnIndices: number[];
}

interface MilestoneTemplate {
  name: string;
  dayOffset: number;
}

/**
 * Calculate a date by adding business days (Monday-Friday) to a base date
 */
function addBusinessDays(startDate: Date, daysToAdd: number): Date {
  const result = new Date(startDate);
  let daysAdded = 0;

  while (daysAdded < daysToAdd) {
    result.setDate(result.getDate() + 1);
    // Check if it's a weekday (Monday = 1, Friday = 5)
    const dayOfWeek = result.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      // Not Sunday (0) or Saturday (6)
      daysAdded++;
    }
  }

  return result;
}

/**
 * Apply a service package template to a pack
 */
export async function applyTemplateToPack(
  packId: string,
  packageType: string,
  baseDate?: Date
): Promise<{
  tasksCreated: number;
  milestones: any[];
  targetCompletionDate: Date | null;
}> {
  // Get the template
  const template = await prisma.servicePackageTemplate.findUnique({
    where: { packageType },
  });

  if (!template) {
    throw new Error(`Template not found: ${packageType}`);
  }

  // Parse template data
  const taskTemplates: TaskTemplate[] = JSON.parse(template.taskTemplates);
  const milestoneTemplates: MilestoneTemplate[] = template.milestoneTemplates
    ? JSON.parse(template.milestoneTemplates)
    : [];
  const defaultTags: string[] = template.defaultTags ? JSON.parse(template.defaultTags) : [];

  // Use provided base date or current date
  const startDate = baseDate || new Date();

  // Create all tasks
  const createdTasks: any[] = [];
  const taskIdMap: Map<number, string> = new Map(); // Map template index to created task ID

  for (let i = 0; i < taskTemplates.length; i++) {
    const taskTemplate = taskTemplates[i];

    // Calculate due date
    const dueDate = taskTemplate.dayOffset > 0 ? addBusinessDays(startDate, taskTemplate.dayOffset) : null;

    // Create task (without dependencies first)
    const task = await prisma.packTask.create({
      data: {
        packId,
        title: taskTemplate.title,
        description: taskTemplate.description,
        category: taskTemplate.category,
        priority: taskTemplate.priority,
        estimatedHours: taskTemplate.estimatedHours,
        dueDate,
        sortOrder: i,
        tags: defaultTags.length > 0 ? JSON.stringify(defaultTags) : null,
        status: 'not_started',
        blockedByIds: null, // Will set after all tasks created
      },
    });

    createdTasks.push(task);
    taskIdMap.set(i, task.id);
  }

  // Now update dependencies
  for (let i = 0; i < taskTemplates.length; i++) {
    const taskTemplate = taskTemplates[i];

    if (taskTemplate.dependsOnIndices && taskTemplate.dependsOnIndices.length > 0) {
      // Map dependency indices to actual task IDs
      const blockedByIds = taskTemplate.dependsOnIndices
        .map((depIndex) => taskIdMap.get(depIndex))
        .filter((id): id is string => id !== undefined);

      if (blockedByIds.length > 0) {
        await prisma.packTask.update({
          where: { id: createdTasks[i].id },
          data: {
            blockedByIds: JSON.stringify(blockedByIds),
          },
        });
      }
    }
  }

  // Create milestones
  const milestones = milestoneTemplates.map((m) => ({
    name: m.name,
    targetDate: addBusinessDays(startDate, m.dayOffset).toISOString(),
    completedDate: null,
    assignedTo: null,
  }));

  // Calculate target completion date
  const maxDayOffset = Math.max(...taskTemplates.map((t) => t.dayOffset), 0);
  const targetCompletionDate = template.slaTargetDays
    ? addBusinessDays(startDate, template.slaTargetDays)
    : maxDayOffset > 0
    ? addBusinessDays(startDate, maxDayOffset)
    : null;

  // Update pack with milestones and target date
  await prisma.pack.update({
    where: { id: packId },
    data: {
      milestones: milestones.length > 0 ? JSON.stringify(milestones) : null,
      targetCompletionDate,
    },
  });

  return {
    tasksCreated: createdTasks.length,
    milestones,
    targetCompletionDate,
  };
}

-- Enhanced Task Management Schema Migration

-- Add new columns to PackTask table
ALTER TABLE "PackTask" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'not_started';
ALTER TABLE "PackTask" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "PackTask" ADD COLUMN "assignedTo" TEXT;
ALTER TABLE "PackTask" ADD COLUMN "assignedToName" TEXT;
ALTER TABLE "PackTask" ADD COLUMN "dueDate" TIMESTAMP(3);
ALTER TABLE "PackTask" ADD COLUMN "priority" TEXT NOT NULL DEFAULT 'medium';
ALTER TABLE "PackTask" ADD COLUMN "blockedByIds" TEXT;
ALTER TABLE "PackTask" ADD COLUMN "tags" TEXT;
ALTER TABLE "PackTask" ADD COLUMN "category" TEXT;
ALTER TABLE "PackTask" ADD COLUMN "estimatedHours" DOUBLE PRECISION;
ALTER TABLE "PackTask" ADD COLUMN "actualHours" DOUBLE PRECISION;

-- Migrate existing completed field to status field
UPDATE "PackTask" SET "status" = 'completed' WHERE "completed" = true;
UPDATE "PackTask" SET "status" = 'not_started' WHERE "completed" = false;

-- Create indices for performance
CREATE INDEX "PackTask_assignedTo_idx" ON "PackTask"("assignedTo");
CREATE INDEX "PackTask_status_idx" ON "PackTask"("status");
CREATE INDEX "PackTask_dueDate_idx" ON "PackTask"("dueDate");

-- Create TaskComment table
CREATE TABLE "TaskComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TaskComment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "PackTask"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indices for TaskComment
CREATE INDEX "TaskComment_taskId_idx" ON "TaskComment"("taskId");
CREATE INDEX "TaskComment_createdAt_idx" ON "TaskComment"("createdAt");

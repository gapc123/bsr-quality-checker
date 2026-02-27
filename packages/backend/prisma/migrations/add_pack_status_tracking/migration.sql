-- Add Pack Lifecycle Status Tracking

-- Add status fields to Pack table
ALTER TABLE "Pack" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'draft';
ALTER TABLE "Pack" ADD COLUMN "startedAt" TIMESTAMP(3);
ALTER TABLE "Pack" ADD COLUMN "targetCompletionDate" TIMESTAMP(3);
ALTER TABLE "Pack" ADD COLUMN "actualCompletionDate" TIMESTAMP(3);
ALTER TABLE "Pack" ADD COLUMN "leadAssignee" TEXT;
ALTER TABLE "Pack" ADD COLUMN "leadName" TEXT;
ALTER TABLE "Pack" ADD COLUMN "milestones" TEXT;

-- Create indices for Pack status fields
CREATE INDEX "Pack_status_idx" ON "Pack"("status");
CREATE INDEX "Pack_targetCompletionDate_idx" ON "Pack"("targetCompletionDate");
CREATE INDEX "Pack_leadAssignee_idx" ON "Pack"("leadAssignee");

-- Create PackStatusChange table
CREATE TABLE "PackStatusChange" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "packId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "changedBy" TEXT NOT NULL,
    "changedByName" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PackStatusChange_packId_fkey" FOREIGN KEY ("packId") REFERENCES "Pack"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indices for PackStatusChange
CREATE INDEX "PackStatusChange_packId_idx" ON "PackStatusChange"("packId");
CREATE INDEX "PackStatusChange_createdAt_idx" ON "PackStatusChange"("createdAt");

-- Migrate existing packs to draft status (already default)
-- No data migration needed as default handles it

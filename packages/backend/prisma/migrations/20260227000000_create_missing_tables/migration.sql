-- Create Client table if not exists
CREATE TABLE IF NOT EXISTS "Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "aiSummary" TEXT,
    "summaryUpdatedAt" TIMESTAMP(3)
);

-- Add client relationship to Pack if column doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='Pack' AND column_name='clientId') THEN
        ALTER TABLE "Pack" ADD COLUMN "clientId" TEXT;
        ALTER TABLE "Pack" ADD CONSTRAINT "Pack_clientId_fkey"
            FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END$$;

-- Create PackTask table if not exists
CREATE TABLE IF NOT EXISTS "PackTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "packId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PackTask_packId_fkey" FOREIGN KEY ("packId") REFERENCES "Pack"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create index
CREATE INDEX IF NOT EXISTS "PackTask_packId_idx" ON "PackTask"("packId");

-- Add updatedAt to Pack if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='Pack' AND column_name='updatedAt') THEN
        ALTER TABLE "Pack" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    END IF;
END$$;

-- Add other Pack columns if not exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='Pack' AND column_name='servicePackage') THEN
        ALTER TABLE "Pack" ADD COLUMN "servicePackage" TEXT;
        ALTER TABLE "Pack" ADD COLUMN "requirements" TEXT;
        ALTER TABLE "Pack" ADD COLUMN "aiSummary" TEXT;
        ALTER TABLE "Pack" ADD COLUMN "summaryUpdatedAt" TIMESTAMP(3);
    END IF;
END$$;

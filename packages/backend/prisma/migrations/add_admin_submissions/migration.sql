-- CreateTable: Organisation (admin panel - tracks submitting orgs)
CREATE TABLE "Organisation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "primaryEmail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isPilot" BOOLEAN NOT NULL DEFAULT false,
    "submissionCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Organisation_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Submission (admin panel - one record per compliance run)
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "processingTimeSeconds" INTEGER,
    "documentCount" INTEGER NOT NULL DEFAULT 0,
    "documentNames" TEXT NOT NULL DEFAULT '[]',
    "totalChecksRun" INTEGER NOT NULL DEFAULT 0,
    "checksPassed" INTEGER NOT NULL DEFAULT 0,
    "checksPartial" INTEGER NOT NULL DEFAULT 0,
    "checksFailed" INTEGER NOT NULL DEFAULT 0,
    "regulatoryReadinessScore" DOUBLE PRECISION,
    "failureCategories" TEXT,
    "apiCallsMade" INTEGER NOT NULL DEFAULT 0,
    "tokensInput" INTEGER NOT NULL DEFAULT 0,
    "tokensOutput" INTEGER NOT NULL DEFAULT 0,
    "estimatedApiCostGbp" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "errorMessage" TEXT,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Organisation_name_idx" ON "Organisation"("name");
CREATE INDEX "Organisation_createdAt_idx" ON "Organisation"("createdAt");

-- CreateIndex
CREATE INDEX "Submission_organisationId_idx" ON "Submission"("organisationId");
CREATE INDEX "Submission_createdAt_idx" ON "Submission"("createdAt");
CREATE INDEX "Submission_status_idx" ON "Submission"("status");

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_organisationId_fkey"
    FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

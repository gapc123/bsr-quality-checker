-- CreateTable
CREATE TABLE "quick_assess_jobs" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "progress" TEXT,
    "result" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quick_assess_jobs_pkey" PRIMARY KEY ("id")
);

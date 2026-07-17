-- Add crew review persistence columns to quick_assess_jobs
-- Allows specialist review results to survive server restarts and Railway container cycling

ALTER TABLE "quick_assess_jobs" ADD COLUMN "crewStatus" TEXT;
ALTER TABLE "quick_assess_jobs" ADD COLUMN "crewReview" TEXT;
ALTER TABLE "quick_assess_jobs" ADD COLUMN "crewError" TEXT;

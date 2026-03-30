-- CreateTable
CREATE TABLE "bsr_rejection_reasons" (
    "id" TEXT NOT NULL,
    "part" TEXT NOT NULL,
    "subParts" TEXT NOT NULL,
    "insufficientInfoItems" TEXT NOT NULL,
    "bsrExampleReasons" TEXT NOT NULL,
    "hasFeedback" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bsr_rejection_reasons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bsr_rejection_reasons_part_key" ON "bsr_rejection_reasons"("part");

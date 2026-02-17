-- CreateTable
CREATE TABLE "Pack" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PackVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "packId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectName" TEXT,
    "borough" TEXT,
    "buildingType" TEXT,
    "height" TEXT,
    "storeys" TEXT,
    "targetDate" DATETIME,
    CONSTRAINT "PackVersion_packId_fkey" FOREIGN KEY ("packId") REFERENCES "Pack" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "packVersionId" TEXT,
    "libraryType" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "filepath" TEXT NOT NULL,
    "docType" TEXT,
    "source" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Document_packVersionId_fkey" FOREIGN KEY ("packVersionId") REFERENCES "PackVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Chunk" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "pageRef" INTEGER NOT NULL,
    CONSTRAINT "Chunk_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExtractedField" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "packVersionId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "fieldValue" TEXT,
    "confidence" TEXT NOT NULL,
    "evidenceDocumentId" TEXT,
    "evidencePageRef" INTEGER,
    "evidenceQuote" TEXT,
    CONSTRAINT "ExtractedField_packVersionId_fkey" FOREIGN KEY ("packVersionId") REFERENCES "PackVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExtractedField_evidenceDocumentId_fkey" FOREIGN KEY ("evidenceDocumentId") REFERENCES "Document" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IssueAction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "packVersionId" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "finding" TEXT NOT NULL,
    "whyItMatters" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "ownerRole" TEXT NOT NULL,
    "effort" TEXT NOT NULL,
    "endUserConsideration" TEXT NOT NULL,
    "expectedBenefit" TEXT NOT NULL,
    "confidence" TEXT NOT NULL,
    "citations" TEXT NOT NULL,
    "evidence" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IssueAction_packVersionId_fkey" FOREIGN KEY ("packVersionId") REFERENCES "PackVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OutputArtifact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "packVersionId" TEXT NOT NULL,
    "artifactType" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OutputArtifact_packVersionId_fkey" FOREIGN KEY ("packVersionId") REFERENCES "PackVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "PackVersion_packId_versionNumber_key" ON "PackVersion"("packId", "versionNumber");

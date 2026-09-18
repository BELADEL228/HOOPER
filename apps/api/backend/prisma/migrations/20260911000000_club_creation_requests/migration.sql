CREATE TABLE "ClubCreationRequest" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "requesterId" TEXT NOT NULL,
  "clubName" TEXT NOT NULL,
  "shortName" TEXT,
  "city" TEXT NOT NULL,
  "country" TEXT NOT NULL DEFAULT 'Togo',
  "description" TEXT,
  "logoUrl" TEXT,
  "email" TEXT,
  "phoneNumber" TEXT,
  "website" TEXT,
  "foundedYear" INTEGER,
  "primaryColor" TEXT DEFAULT '#FF2A3B',
  "secondaryColor" TEXT DEFAULT '#FFB800',
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "adminNote" TEXT,
  "reviewedBy" TEXT,
  "reviewedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "ClubCreationRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "ClubCreationRequest_status_createdAt_idx" ON "ClubCreationRequest"("status", "createdAt");
CREATE INDEX "ClubCreationRequest_requesterId_idx" ON "ClubCreationRequest"("requesterId");

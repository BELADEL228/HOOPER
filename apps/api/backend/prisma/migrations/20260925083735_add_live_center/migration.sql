-- CreateTable
CREATE TABLE "LiveSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hostId" TEXT NOT NULL,
    "clubId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'SPORT',
    "thumbnailUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "startedAt" DATETIME,
    "endedAt" DATETIME,
    "scheduledAt" DATETIME,
    "peakViewers" INTEGER NOT NULL DEFAULT 0,
    "totalViews" INTEGER NOT NULL DEFAULT 0,
    "streamKey" TEXT NOT NULL,
    "hlsUrl" TEXT,
    "playbackUrl" TEXT,
    "isRecorded" BOOLEAN NOT NULL DEFAULT true,
    "isChatEnabled" BOOLEAN NOT NULL DEFAULT true,
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LiveSession_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LiveSession_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LiveComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LiveComment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LiveSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LiveComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "LiveSession_streamKey_key" ON "LiveSession"("streamKey");

-- CreateIndex
CREATE INDEX "LiveSession_hostId_idx" ON "LiveSession"("hostId");

-- CreateIndex
CREATE INDEX "LiveSession_clubId_idx" ON "LiveSession"("clubId");

-- CreateIndex
CREATE INDEX "LiveSession_status_idx" ON "LiveSession"("status");

-- CreateIndex
CREATE INDEX "LiveSession_scheduledAt_idx" ON "LiveSession"("scheduledAt");

-- CreateIndex
CREATE INDEX "LiveComment_sessionId_idx" ON "LiveComment"("sessionId");

-- CreateIndex
CREATE INDEX "LiveComment_createdAt_idx" ON "LiveComment"("createdAt");

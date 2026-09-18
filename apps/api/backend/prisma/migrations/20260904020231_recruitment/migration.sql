-- CreateTable
CREATE TABLE "RecruitmentPost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "minAge" INTEGER,
    "maxAge" INTEGER,
    "minHeightCm" INTEGER,
    "city" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RecruitmentPost_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RecruitmentApplication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recruitmentPostId" TEXT NOT NULL,
    "playerProfileId" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RecruitmentApplication_recruitmentPostId_fkey" FOREIGN KEY ("recruitmentPostId") REFERENCES "RecruitmentPost" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RecruitmentApplication_playerProfileId_fkey" FOREIGN KEY ("playerProfileId") REFERENCES "PlayerProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "RecruitmentPost_position_city_status_idx" ON "RecruitmentPost"("position", "city", "status");

-- CreateIndex
CREATE INDEX "RecruitmentApplication_playerProfileId_status_idx" ON "RecruitmentApplication"("playerProfileId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "RecruitmentApplication_recruitmentPostId_playerProfileId_key" ON "RecruitmentApplication"("recruitmentPostId", "playerProfileId");

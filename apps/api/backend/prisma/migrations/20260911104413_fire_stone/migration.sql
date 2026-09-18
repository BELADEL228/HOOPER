-- CreateTable
CREATE TABLE "Club" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortName" TEXT,
    "logoUrl" TEXT,
    "bannerUrl" TEXT,
    "description" TEXT,
    "city" TEXT NOT NULL DEFAULT 'Lomé',
    "country" TEXT NOT NULL DEFAULT 'Togo',
    "address" TEXT,
    "arena" TEXT,
    "email" TEXT,
    "phoneNumber" TEXT,
    "website" TEXT,
    "foundedYear" INTEGER,
    "primaryColor" TEXT DEFAULT '#FF2A3B',
    "secondaryColor" TEXT DEFAULT '#FFB800',
    "accentColor" TEXT DEFAULT '#38BDF8',
    "themeType" TEXT DEFAULT 'dark',
    "themeJson" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ClubMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clubId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClubMember_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClubMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Match" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT,
    "clubId" TEXT,
    "opponent" TEXT NOT NULL,
    "opponentLogo" TEXT NOT NULL,
    "isHome" BOOLEAN NOT NULL DEFAULT true,
    "matchDate" DATETIME NOT NULL,
    "time" TEXT NOT NULL DEFAULT '20:30',
    "venue" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'SENIOR',
    "status" TEXT NOT NULL DEFAULT 'UPCOMING',
    "scoreTeam" INTEGER,
    "scoreOpponent" INTEGER,
    "quarterScoresJson" TEXT,
    "summary" TEXT,
    "mvpPlayerName" TEXT,
    "videoUrl" TEXT,
    "photosJson" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Match_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Match_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Match" ("address", "category", "createdAt", "id", "isHome", "matchDate", "mvpPlayerName", "opponent", "opponentLogo", "photosJson", "quarterScoresJson", "scoreOpponent", "scoreTeam", "status", "summary", "time", "updatedAt", "venue", "videoUrl") SELECT "address", "category", "createdAt", "id", "isHome", "matchDate", "mvpPlayerName", "opponent", "opponentLogo", "photosJson", "quarterScoresJson", "scoreOpponent", "scoreTeam", "status", "summary", "time", "updatedAt", "venue", "videoUrl" FROM "Match";
DROP TABLE "Match";
ALTER TABLE "new_Match" RENAME TO "Match";
CREATE INDEX "Match_matchDate_idx" ON "Match"("matchDate");
CREATE INDEX "Match_status_idx" ON "Match"("status");
CREATE INDEX "Match_teamId_idx" ON "Match"("teamId");
CREATE INDEX "Match_clubId_idx" ON "Match"("clubId");
CREATE TABLE "new_Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "mediaType" TEXT,
    "authorId" TEXT NOT NULL,
    "clubId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Post_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Post" ("authorId", "content", "createdAt", "id", "mediaType", "mediaUrl", "updatedAt") SELECT "authorId", "content", "createdAt", "id", "mediaType", "mediaUrl", "updatedAt" FROM "Post";
DROP TABLE "Post";
ALTER TABLE "new_Post" RENAME TO "Post";
CREATE INDEX "Post_createdAt_idx" ON "Post"("createdAt");
CREATE INDEX "Post_authorId_idx" ON "Post"("authorId");
CREATE INDEX "Post_clubId_idx" ON "Post"("clubId");
CREATE TABLE "new_Team" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clubId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "description" TEXT,
    "city" TEXT NOT NULL DEFAULT 'Lomé',
    "category" TEXT NOT NULL DEFAULT 'SENIOR',
    "division" TEXT,
    "coachName" TEXT,
    "record" TEXT,
    "foundedYear" INTEGER,
    "primaryColor" TEXT DEFAULT '#FF2A3B',
    "secondaryColor" TEXT DEFAULT '#FFB800',
    "accentColor" TEXT DEFAULT '#38BDF8',
    "themeType" TEXT DEFAULT 'dark',
    "themeJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Team_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Team" ("accentColor", "category", "city", "createdAt", "description", "foundedYear", "id", "logoUrl", "name", "primaryColor", "secondaryColor", "slug", "themeJson", "themeType", "updatedAt") SELECT "accentColor", "category", "city", "createdAt", "description", "foundedYear", "id", "logoUrl", "name", "primaryColor", "secondaryColor", "slug", "themeJson", "themeType", "updatedAt" FROM "Team";
DROP TABLE "Team";
ALTER TABLE "new_Team" RENAME TO "Team";
CREATE UNIQUE INDEX "Team_name_key" ON "Team"("name");
CREATE UNIQUE INDEX "Team_slug_key" ON "Team"("slug");
CREATE INDEX "Team_city_idx" ON "Team"("city");
CREATE INDEX "Team_category_idx" ON "Team"("category");
CREATE INDEX "Team_clubId_idx" ON "Team"("clubId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Club_name_key" ON "Club"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Club_slug_key" ON "Club"("slug");

-- CreateIndex
CREATE INDEX "Club_city_idx" ON "Club"("city");

-- CreateIndex
CREATE INDEX "Club_country_idx" ON "Club"("country");

-- CreateIndex
CREATE INDEX "ClubMember_userId_idx" ON "ClubMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ClubMember_clubId_userId_key" ON "ClubMember"("clubId", "userId");

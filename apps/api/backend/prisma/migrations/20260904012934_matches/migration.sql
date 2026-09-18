/*
  Warnings:

  - Added the required column `updatedAt` to the `Match` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "MatchRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requesterTeamId" TEXT NOT NULL,
    "targetTeamId" TEXT NOT NULL,
    "proposedDate" DATETIME NOT NULL,
    "proposedTime" TEXT NOT NULL,
    "venue" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'SENIOR',
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MatchRequest_requesterTeamId_fkey" FOREIGN KEY ("requesterTeamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MatchRequest_targetTeamId_fkey" FOREIGN KEY ("targetTeamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Match" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Match" ("address", "id", "isHome", "matchDate", "mvpPlayerName", "opponent", "opponentLogo", "quarterScoresJson", "scoreOpponent", "scoreTeam", "status", "summary", "venue") SELECT "address", "id", "isHome", "matchDate", "mvpPlayerName", "opponent", "opponentLogo", "quarterScoresJson", "scoreOpponent", "scoreTeam", "status", "summary", "venue" FROM "Match";
DROP TABLE "Match";
ALTER TABLE "new_Match" RENAME TO "Match";
CREATE INDEX "Match_matchDate_idx" ON "Match"("matchDate");
CREATE INDEX "Match_status_idx" ON "Match"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "MatchRequest_targetTeamId_status_idx" ON "MatchRequest"("targetTeamId", "status");

-- CreateIndex
CREATE INDEX "MatchRequest_requesterTeamId_status_idx" ON "MatchRequest"("requesterTeamId", "status");

-- CreateTable
CREATE TABLE "ConversationRead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastReadAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ConversationRead_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ConversationRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "eventDate" DATETIME NOT NULL,
    "time" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "clubId" TEXT,
    CONSTRAINT "Event_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Event" ("description", "eventDate", "id", "location", "time", "title", "type") SELECT "description", "eventDate", "id", "location", "time", "title", "type" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
CREATE INDEX "Event_clubId_idx" ON "Event"("clubId");
CREATE TABLE "new_FinancialTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "type" TEXT NOT NULL,
    "userOrOrg" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PAYÉ',
    "userId" TEXT,
    "clubId" TEXT,
    CONSTRAINT "FinancialTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FinancialTransaction_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_FinancialTransaction" ("amount", "category", "date", "description", "id", "status", "type", "userId", "userOrOrg") SELECT "amount", "category", "date", "description", "id", "status", "type", "userId", "userOrOrg" FROM "FinancialTransaction";
DROP TABLE "FinancialTransaction";
ALTER TABLE "new_FinancialTransaction" RENAME TO "FinancialTransaction";
CREATE INDEX "FinancialTransaction_clubId_idx" ON "FinancialTransaction"("clubId");
CREATE INDEX "FinancialTransaction_userId_idx" ON "FinancialTransaction"("userId");
CREATE TABLE "new_PlayerProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "jerseyNumber" INTEGER NOT NULL,
    "position" TEXT NOT NULL,
    "heightCm" REAL NOT NULL,
    "weightKg" REAL NOT NULL,
    "age" INTEGER NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'SENIOR',
    "gender" TEXT NOT NULL DEFAULT 'MASCULIN',
    "photoUrl" TEXT,
    "experienceYears" INTEGER NOT NULL DEFAULT 0,
    "bio" TEXT,
    "ppg" REAL NOT NULL DEFAULT 0.0,
    "rpg" REAL NOT NULL DEFAULT 0.0,
    "apg" REAL NOT NULL DEFAULT 0.0,
    "spg" REAL NOT NULL DEFAULT 0.0,
    "bpg" REAL NOT NULL DEFAULT 0.0,
    "efficiency" REAL NOT NULL DEFAULT 0.0,
    "fgPct" REAL NOT NULL DEFAULT 0.0,
    "threePtPct" REAL NOT NULL DEFAULT 0.0,
    "ftPct" REAL NOT NULL DEFAULT 0.0,
    "achievementsJson" TEXT NOT NULL DEFAULT '[]',
    "skillsJson" TEXT NOT NULL DEFAULT '{}',
    CONSTRAINT "PlayerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PlayerProfile" ("achievementsJson", "age", "apg", "bio", "bpg", "category", "efficiency", "experienceYears", "fgPct", "ftPct", "gender", "heightCm", "id", "jerseyNumber", "photoUrl", "position", "ppg", "rpg", "skillsJson", "spg", "threePtPct", "userId", "weightKg") SELECT "achievementsJson", "age", "apg", "bio", "bpg", "category", "efficiency", "experienceYears", "fgPct", "ftPct", "gender", "heightCm", "id", "jerseyNumber", "photoUrl", "position", "ppg", "rpg", "skillsJson", "spg", "threePtPct", "userId", "weightKg" FROM "PlayerProfile";
DROP TABLE "PlayerProfile";
ALTER TABLE "new_PlayerProfile" RENAME TO "PlayerProfile";
CREATE UNIQUE INDEX "PlayerProfile_userId_key" ON "PlayerProfile"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ConversationRead_userId_idx" ON "ConversationRead"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationRead_conversationId_userId_key" ON "ConversationRead"("conversationId", "userId");

-- CreateTable
CREATE TABLE "ScoutEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scoutUserId" TEXT NOT NULL,
    "playerProfileId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScoutEntry_scoutUserId_fkey" FOREIGN KEY ("scoutUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ScoutEntry_playerProfileId_fkey" FOREIGN KEY ("playerProfileId") REFERENCES "PlayerProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ScoutEntry_playerProfileId_idx" ON "ScoutEntry"("playerProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "ScoutEntry_scoutUserId_playerProfileId_key" ON "ScoutEntry"("scoutUserId", "playerProfileId");

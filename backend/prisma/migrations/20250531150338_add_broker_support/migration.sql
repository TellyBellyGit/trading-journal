/*
  Warnings:

  - Added the required column `brokerId` to the `Trade` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Broker" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "accountType" TEXT,
    "accountId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "defaultCommission" REAL,
    "commissionType" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Trade" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "symbol" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "entryDate" DATETIME NOT NULL,
    "entryTime" TEXT NOT NULL,
    "entryPrice" REAL NOT NULL,
    "exitDate" DATETIME NOT NULL,
    "exitTime" TEXT NOT NULL,
    "exitPrice" REAL NOT NULL,
    "duration" TEXT NOT NULL,
    "pnl" REAL NOT NULL,
    "percentChange" REAL NOT NULL,
    "orderType" TEXT NOT NULL,
    "assessment" TEXT,
    "capital" REAL NOT NULL,
    "brokerId" INTEGER NOT NULL,
    "notes" TEXT,
    "strategy" TEXT,
    "riskReward" TEXT,
    "commission" REAL,
    "tags" TEXT,
    "tradeId" TEXT,
    "executionVenue" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Trade_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "Broker" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Trade" ("assessment", "capital", "commission", "createdAt", "direction", "duration", "entryDate", "entryPrice", "entryTime", "exitDate", "exitPrice", "exitTime", "id", "notes", "orderType", "percentChange", "pnl", "quantity", "riskReward", "strategy", "symbol", "tags", "updatedAt") SELECT "assessment", "capital", "commission", "createdAt", "direction", "duration", "entryDate", "entryPrice", "entryTime", "exitDate", "exitPrice", "exitTime", "id", "notes", "orderType", "percentChange", "pnl", "quantity", "riskReward", "strategy", "symbol", "tags", "updatedAt" FROM "Trade";
DROP TABLE "Trade";
ALTER TABLE "new_Trade" RENAME TO "Trade";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Broker_name_key" ON "Broker"("name");

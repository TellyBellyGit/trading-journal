-- CreateTable
CREATE TABLE "Trade" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

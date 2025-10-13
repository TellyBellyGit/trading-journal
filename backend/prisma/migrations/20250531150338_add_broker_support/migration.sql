-- CreateTable (Postgres)
CREATE TABLE "Broker" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "accountType" TEXT,
    "accountId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "defaultCommission" DOUBLE PRECISION,
    "commissionType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Seed a default broker to satisfy NOT NULL constraints safely
INSERT INTO "Broker" ("name", "displayName", "isActive", "createdAt", "updatedAt")
VALUES ('Default', 'Default', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Alter Trade table to add broker support and metadata
ALTER TABLE "Trade" ADD COLUMN "brokerId" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Trade" ADD COLUMN "tradeId" TEXT;
ALTER TABLE "Trade" ADD COLUMN "executionVenue" TEXT;

-- Add foreign key constraint
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "Broker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX "Broker_name_key" ON "Broker"("name");

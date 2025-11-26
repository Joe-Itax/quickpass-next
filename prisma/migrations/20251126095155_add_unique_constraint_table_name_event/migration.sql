/*
  Warnings:

  - You are about to drop the `Table` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Table" DROP CONSTRAINT "Table_eventId_fkey";

-- DropForeignKey
ALTER TABLE "TableAllocation" DROP CONSTRAINT "TableAllocation_tableId_fkey";

-- DropTable
DROP TABLE "Table";

-- CreateTable
CREATE TABLE "table" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "eventId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "table_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "table_eventId_name_key" ON "table"("eventId", "name");

-- AddForeignKey
ALTER TABLE "table" ADD CONSTRAINT "table_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableAllocation" ADD CONSTRAINT "TableAllocation_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "table"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

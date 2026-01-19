-- DropIndex
DROP INDEX "Terminal_eventId_name_key";

-- AlterTable
ALTER TABLE "Terminal" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

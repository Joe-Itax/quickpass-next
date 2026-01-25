-- AlterTable
ALTER TABLE "Invitation" ADD COLUMN     "email" TEXT,
ADD COLUMN     "isSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "whatsapp" TEXT,
ALTER COLUMN "peopleCount" SET DEFAULT 1;

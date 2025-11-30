-- AlterTable
ALTER TABLE "user" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "searchableName" TEXT NOT NULL DEFAULT '';

/*
  Warnings:

  - You are about to drop the column `isSent` on the `Invitation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Invitation" DROP COLUMN "isSent",
ADD COLUMN     "isSentEmail" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isSentWhatsapp" BOOLEAN NOT NULL DEFAULT false;

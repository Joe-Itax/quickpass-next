-- CreateEnum
CREATE TYPE "TemplateCategory" AS ENUM ('WEDDING', 'DEFENSE', 'GALA', 'STANDARD');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "invitationTemplateId" INTEGER;

-- CreateTable
CREATE TABLE "Template" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "category" "TemplateCategory" NOT NULL DEFAULT 'STANDARD',
    "layoutData" JSONB NOT NULL,
    "thumbnailUrl" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Template_slug_key" ON "Template"("slug");

-- CreateIndex
CREATE INDEX "Template_category_idx" ON "Template"("category");

-- CreateIndex
CREATE INDEX "Template_userId_idx" ON "Template"("userId");

-- CreateIndex
CREATE INDEX "Event_invitationTemplateId_idx" ON "Event"("invitationTemplateId");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_invitationTemplateId_fkey" FOREIGN KEY ("invitationTemplateId") REFERENCES "Template"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Template" ADD CONSTRAINT "Template_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

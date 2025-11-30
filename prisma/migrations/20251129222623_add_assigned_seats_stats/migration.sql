-- AlterTable
ALTER TABLE "EventStats" ADD COLUMN     "availableSeats" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalAssignedSeats" INTEGER NOT NULL DEFAULT 0;

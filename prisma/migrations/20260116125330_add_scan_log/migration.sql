-- CreateTable
CREATE TABLE "ScanLog" (
    "id" SERIAL NOT NULL,
    "eventCode" TEXT NOT NULL,
    "invitationId" INTEGER,
    "guestName" TEXT,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScanLog_pkey" PRIMARY KEY ("id")
);

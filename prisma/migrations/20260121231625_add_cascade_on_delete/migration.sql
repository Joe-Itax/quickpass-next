-- DropForeignKey
ALTER TABLE "EventAssignment" DROP CONSTRAINT "EventAssignment_eventId_fkey";

-- DropForeignKey
ALTER TABLE "EventStats" DROP CONSTRAINT "EventStats_eventId_fkey";

-- DropForeignKey
ALTER TABLE "Invitation" DROP CONSTRAINT "Invitation_eventId_fkey";

-- DropForeignKey
ALTER TABLE "ScanLog" DROP CONSTRAINT "ScanLog_terminalId_fkey";

-- DropForeignKey
ALTER TABLE "TableAllocation" DROP CONSTRAINT "TableAllocation_invitationId_fkey";

-- DropForeignKey
ALTER TABLE "TableAllocation" DROP CONSTRAINT "TableAllocation_tableId_fkey";

-- DropForeignKey
ALTER TABLE "Terminal" DROP CONSTRAINT "Terminal_eventId_fkey";

-- DropForeignKey
ALTER TABLE "table" DROP CONSTRAINT "table_eventId_fkey";

-- AddForeignKey
ALTER TABLE "EventAssignment" ADD CONSTRAINT "EventAssignment_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "table" ADD CONSTRAINT "table_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableAllocation" ADD CONSTRAINT "TableAllocation_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableAllocation" ADD CONSTRAINT "TableAllocation_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "table"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventStats" ADD CONSTRAINT "EventStats_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Terminal" ADD CONSTRAINT "Terminal_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanLog" ADD CONSTRAINT "ScanLog_terminalId_fkey" FOREIGN KEY ("terminalId") REFERENCES "Terminal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

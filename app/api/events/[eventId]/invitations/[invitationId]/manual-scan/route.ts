import { NextRequest, NextResponse } from "next/server";
import { requireEventAccess } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface Context {
  params: Promise<{
    eventId: string;
    invitationId: string;
  }>;
}

export async function POST(req: NextRequest, context: Context) {
  const { eventId: rawEventId, invitationId: rawInvitationId } =
    await context.params;
  const eventId = Number(rawEventId);
  const invitationId = Number(rawInvitationId);

  if (
    !Number.isInteger(eventId) ||
    eventId <= 0 ||
    !Number.isInteger(invitationId) ||
    invitationId <= 0
  ) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 });
  }

  const user = await requireEventAccess(req, eventId);
  if (user instanceof NextResponse) return user;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({
        where: { id: eventId },
        select: { eventCode: true },
      });

      if (!event) return { status: "event_not_found" as const };

      const invitation = await tx.invitation.findFirst({
        where: { id: invitationId, eventId },
        include: { allocations: { include: { table: true } } },
      });

      if (!invitation) return { status: "not_found" as const };

      if (invitation.scannedCount >= invitation.peopleCount) {
        await tx.scanLog.create({
          data: {
            eventCode: event.eventCode,
            invitationId: invitation.id,
            guestName: invitation.label,
            status: "ERROR",
            errorMessage: "Capacite atteinte - scan manuel",
            assignedTable: getAssignedTable(invitation),
          },
        });

        return { status: "full" as const, invitation };
      }

      const assignedTable = getAssignedTableForScanIndex(
        invitation,
        invitation.scannedCount,
      );
      const updated = await tx.invitation.update({
        where: { id: invitation.id },
        data: { scannedCount: { increment: 1 } },
      });

      await tx.scanLog.create({
        data: {
          eventCode: event.eventCode,
          invitationId: invitation.id,
          guestName: invitation.label,
          status: "SUCCESS",
          errorMessage: "Scan manuel admin",
          assignedTable,
        },
      });

      await tx.eventStats.update({
        where: { eventId },
        data: { totalScanned: { increment: 1 } },
      });

      return { status: "ok" as const, invitation: updated, assignedTable };
    });

    if (result.status === "event_not_found") {
      return NextResponse.json({ error: "Evenement introuvable" }, { status: 404 });
    }

    if (result.status === "not_found") {
      return NextResponse.json({ error: "Invitation introuvable" }, { status: 404 });
    }

    if (result.status === "full") {
      return NextResponse.json(
        {
          error: "Capacite atteinte",
          invitation: result.invitation,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      invitation: result.invitation,
      assignedTable: result.assignedTable,
    });
  } catch (error) {
    console.error("[MANUAL_SCAN]", error);
    return NextResponse.json(
      { error: "Erreur lors du scan manuel" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest, context: Context) {
  const { eventId: rawEventId, invitationId: rawInvitationId } =
    await context.params;
  const eventId = Number(rawEventId);
  const invitationId = Number(rawInvitationId);

  if (
    !Number.isInteger(eventId) ||
    eventId <= 0 ||
    !Number.isInteger(invitationId) ||
    invitationId <= 0
  ) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 });
  }

  const user = await requireEventAccess(req, eventId);
  if (user instanceof NextResponse) return user;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({
        where: { id: eventId },
        select: { eventCode: true },
      });

      if (!event) return { status: "event_not_found" as const };

      const invitation = await tx.invitation.findFirst({
        where: { id: invitationId, eventId },
        include: { allocations: { include: { table: true } } },
      });

      if (!invitation) return { status: "not_found" as const };
      if (invitation.scannedCount <= 0) {
        return { status: "empty" as const, invitation };
      }

      const assignedTable = getAssignedTableForScanIndex(
        invitation,
        invitation.scannedCount - 1,
      );
      const updated = await tx.invitation.update({
        where: { id: invitation.id },
        data: { scannedCount: { decrement: 1 } },
      });

      await tx.scanLog.create({
        data: {
          eventCode: event.eventCode,
          invitationId: invitation.id,
          guestName: invitation.label,
          status: "REVERSED",
          errorMessage: "Scan manuel annule par un administrateur",
          assignedTable,
        },
      });

      await tx.eventStats.update({
        where: { eventId },
        data: { totalScanned: { decrement: 1 } },
      });

      return { status: "ok" as const, invitation: updated, assignedTable };
    });

    if (result.status === "event_not_found") {
      return NextResponse.json({ error: "Evenement introuvable" }, { status: 404 });
    }

    if (result.status === "not_found") {
      return NextResponse.json({ error: "Invitation introuvable" }, { status: 404 });
    }

    if (result.status === "empty") {
      return NextResponse.json(
        {
          error: "Aucun scan a annuler",
          invitation: result.invitation,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      invitation: result.invitation,
      assignedTable: result.assignedTable,
    });
  } catch (error) {
    console.error("[MANUAL_SCAN_REVERSE]", error);
    return NextResponse.json(
      { error: "Erreur lors de l'annulation du scan manuel" },
      { status: 500 },
    );
  }
}

type InvitationWithAllocations = {
  allocations: Array<{
    seatsAssigned: number;
    table: { name: string; capacity: number };
  }>;
};

function getAssignedTable(invitation: InvitationWithAllocations) {
  return (
    invitation.allocations
      .map((allocation) => allocation.table.name)
      .filter(Boolean)
      .join(", ") || "Espace libre"
  );
}

function getAssignedTableForScanIndex(
  invitation: InvitationWithAllocations,
  scanIndex: number,
) {
  let tracker = 0;

  for (const allocation of invitation.allocations) {
    tracker += allocation.seatsAssigned;
    if (scanIndex < tracker) return allocation.table.name;
  }

  return "Espace libre";
}

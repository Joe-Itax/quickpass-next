import { NextRequest, NextResponse } from "next/server";
import { requireEventAccess } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { MANUAL_SCAN_TERMINAL_CODE } from "@/lib/scan-log-display";

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
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
      include: {
        event: { select: { eventCode: true } },
        allocations: { include: { table: true } },
      },
    });

    if (!invitation || invitation.eventId !== eventId) {
      return NextResponse.json(
        { error: "Invitation introuvable" },
        { status: 404 },
      );
    }

    const eventCode = invitation.event.eventCode;

    if (invitation.scannedCount >= invitation.peopleCount) {
      await prisma.scanLog.create({
        data: {
          eventCode,
          invitationId: invitation.id,
          guestName: invitation.label,
          status: "ERROR",
          errorMessage: "Capacite atteinte - scan manuel",
          terminalCode: MANUAL_SCAN_TERMINAL_CODE,
          assignedTable: getAssignedTable(invitation as any),
        },
      });

      return NextResponse.json(
        {
          error: "Capacite atteinte",
          invitation,
        },
        { status: 400 },
      );
    }

    const assignedTable = getAssignedTableForScanIndex(
      invitation as any,
      invitation.scannedCount,
    );

    const [updated] = await prisma.$transaction([
      prisma.invitation.update({
        where: { id: invitation.id },
        data: { scannedCount: { increment: 1 } },
      }),
      prisma.scanLog.create({
        data: {
          eventCode,
          invitationId: invitation.id,
          guestName: invitation.label,
          status: "SUCCESS",
          errorMessage: "Scan manuel admin",
          terminalCode: MANUAL_SCAN_TERMINAL_CODE,
          assignedTable,
        },
      }),
      prisma.eventStats.update({
        where: { eventId },
        data: { totalScanned: { increment: 1 } },
      }),
    ]);

    return NextResponse.json({
      success: true,
      invitation: updated,
      assignedTable,
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
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
      include: {
        event: { select: { eventCode: true } },
        allocations: { include: { table: true } },
      },
    });

    if (!invitation || invitation.eventId !== eventId) {
      return NextResponse.json(
        { error: "Invitation introuvable" },
        { status: 404 },
      );
    }

    const eventCode = invitation.event.eventCode;

    if (invitation.scannedCount <= 0) {
      return NextResponse.json(
        {
          error: "Aucun scan a annuler",
          invitation,
        },
        { status: 400 },
      );
    }

    const assignedTable = getAssignedTableForScanIndex(
      invitation as any,
      invitation.scannedCount - 1,
    );

    const [updated] = await prisma.$transaction([
      prisma.invitation.update({
        where: { id: invitation.id },
        data: { scannedCount: { decrement: 1 } },
      }),
      prisma.scanLog.create({
        data: {
          eventCode,
          invitationId: invitation.id,
          guestName: invitation.label,
          status: "REVERSED",
          errorMessage: "Scan manuel annule par un administrateur",
          terminalCode: MANUAL_SCAN_TERMINAL_CODE,
          assignedTable,
        },
      }),
      prisma.eventStats.update({
        where: { eventId },
        data: { totalScanned: { decrement: 1 } },
      }),
    ]);

    return NextResponse.json({
      success: true,
      invitation: updated,
      assignedTable,
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

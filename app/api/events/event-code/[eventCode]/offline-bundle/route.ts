import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface EventContext {
  params: Promise<{ eventCode: string }>;
}

/**
 * GET /api/events/event-code/[eventCode]/offline-bundle?terminalCode=xxx
 * Télécharge toutes les invitations nécessaires au scan hors-ligne.
 */
export async function GET(req: NextRequest, context: EventContext) {
  const { eventCode } = await context.params;
  const terminalCode = req.nextUrl.searchParams.get("terminalCode");

  if (!terminalCode) {
    return NextResponse.json(
      { error: "terminalCode requis" },
      { status: 400 },
    );
  }

  try {
    const terminal = await prisma.terminal.findFirst({
      where: {
        code: terminalCode,
        isActive: true,
        deletedAt: null,
        event: {
          eventCode,
          deletedAt: null,
          status: { not: "CANCELLED" },
        },
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            eventCode: true,
            status: true,
          },
        },
      },
    });

    if (!terminal) {
      return NextResponse.json(
        { error: "Terminal ou événement invalide" },
        { status: 404 },
      );
    }

    const [invitations, tables] = await Promise.all([
      prisma.invitation.findMany({
        where: { eventId: terminal.event.id },
        select: {
          id: true,
          eventId: true,
          label: true,
          peopleCount: true,
          scannedCount: true,
          qrCode: true,
          allocations: {
            select: {
              seatsAssigned: true,
              table: { select: { id: true, name: true } },
            },
          },
        },
      }),
      prisma.table.findMany({
        where: { eventId: terminal.event.id },
        select: {
          id: true,
          eventId: true,
          name: true,
          capacity: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      event: terminal.event,
      terminal: {
        id: terminal.id,
        code: terminal.code,
        name: terminal.name,
      },
      invitations: invitations.map((inv) => ({
        id: inv.id,
        eventId: inv.eventId,
        label: inv.label,
        peopleCount: inv.peopleCount,
        scannedCount: inv.scannedCount,
        qrCode: inv.qrCode,
        allocations: inv.allocations.map((a) => ({
          tableId: a.table.id,
          tableName: a.table.name,
          seatsAssigned: a.seatsAssigned,
        })),
      })),
      tables,
    });
  } catch (err) {
    console.error("[OFFLINE_BUNDLE]", err);
    return NextResponse.json(
      { error: "Erreur lors du chargement du bundle" },
      { status: 500 },
    );
  }
}

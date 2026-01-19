import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { qrDecode } from "@/lib/qr";

export const dynamic = "force-dynamic";

interface EventContext {
  params: Promise<{
    eventCode: string;
  }>;
}

export async function POST(req: NextRequest, context: EventContext) {
  const { eventCode } = await context.params;

  try {
    const { qr, terminalCode } = await req.json();
    if (!qr || !terminalCode)
      return NextResponse.json(
        { error: "qr or terminalCode missing" },
        { status: 400 },
      );

    const terminal = await prisma.terminal.findUnique({
      where: { code: terminalCode },
    });

    if (!terminal || !terminal.isActive || terminal.deletedAt) {
      return NextResponse.json(
        {
          error: "Ce terminal est désactivé ou n'existe plus.",
        },
        { status: 403 },
      );
    }

    const eventToScan = await prisma.event.findUnique({
      where: { eventCode },
    });

    if (!eventToScan) {
      return NextResponse.json(
        { error: "L'event n'existe pas" },
        { status: 404 },
      );
    }

    let payload;
    try {
      payload = await qrDecode(qr);
    } catch (e) {
      console.log("Erreur: ", e);

      await prisma.scanLog.create({
        data: {
          eventCode,
          status: "ERROR",
          errorMessage: "QR Decode Failed",
          terminalCode: terminalCode,
          terminalId: terminal.id,
        },
      });
      return NextResponse.json(
        { error: "Invalid QR payload" },
        { status: 400 },
      );
    }

    const { invitationId, eventId: payloadEventId } = payload as {
      invitationId?: number | string;
      eventId?: number | string;
    };

    if (Number(payloadEventId) !== eventToScan.id) {
      // LOG D'ERREUR : Mauvais événement
      await prisma.scanLog.create({
        data: {
          eventCode,
          status: "ERROR",
          errorMessage: "QR n'appartenant pas à cet événement.",
          terminalCode: terminalCode,
          terminalId: terminal.id,
        },
      });
      return NextResponse.json(
        { error: "QR n'appartenant pas à cet événement." },
        { status: 400 },
      );
    }

    const res = await prisma.$transaction(async (tx) => {
      const inv = await tx.invitation.findUnique({
        where: { id: Number(invitationId) },
        include: { allocations: { include: { table: true } } },
      });

      if (!inv) return { status: "not_found" };

      // 1. Vérification de la capacité
      if (inv.scannedCount >= inv.peopleCount) {
        // LOG D'ERREUR : Capacité atteinte
        await tx.scanLog.create({
          data: {
            eventCode,
            invitationId: inv.id,
            guestName: inv.label,
            status: "ERROR",
            errorMessage: "Capacité atteinte",
            terminalCode: terminalCode,
            terminalId: terminal.id,
          },
        });

        // Préparer la liste de toutes les tables pour l'affichage d'erreur
        const uniqueTables = Array.from(
          new Set(inv.allocations.map((a) => a.table.name)),
        ).join(", ");

        return {
          status: "full",
          invitation: {
            label: inv.label,
            scannedCount: inv.scannedCount,
            peopleCount: inv.peopleCount,
            assignedTable: uniqueTables,
          },
        };
      }

      // 2. Déterminer la table pour ce scan précis
      let assignedTableLabel = "Espace libre";
      const currentScanIndex = inv.scannedCount;
      let tracker = 0;

      for (const alloc of inv.allocations) {
        tracker += alloc.seatsAssigned;
        if (currentScanIndex < tracker) {
          assignedTableLabel = alloc.table.name;
          break;
        }
      }

      // 3. Mise à jour Succès
      const updated = await tx.invitation.update({
        where: { id: inv.id },
        data: { scannedCount: { increment: 1 } },
      });

      // LOG DE SUCCÈS
      await tx.scanLog.create({
        data: {
          eventCode,
          invitationId: inv.id,
          guestName: inv.label,
          status: "SUCCESS",
          terminalCode: terminalCode,
          terminalId: terminal.id,
        },
      });

      await tx.eventStats.update({
        where: { eventId: eventToScan.id },
        data: { totalScanned: { increment: 1 } },
      });

      return {
        status: "ok",
        invitation: {
          label: updated.label,
          peopleCount: updated.peopleCount,
          scannedCount: updated.scannedCount,
          assignedTable: assignedTableLabel,
        },
      };
    });

    if (res.status === "not_found") {
      await prisma.scanLog.create({
        data: {
          eventCode,
          status: "ERROR",
          errorMessage: "Invitation not found",
          terminalCode: terminalCode,
          terminalId: terminal.id,
        },
      });
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 },
      );
    }

    if (res.status === "full") {
      return NextResponse.json(
        { error: "Capacité atteinte", invitation: res.invitation },
        { status: 400 },
      );
    }

    return NextResponse.json(res.invitation);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Error scanning", details: String(err) },
      { status: 500 },
    );
  }
}

// eventCode :mariage-tresor-2
// terminalCode :jared_z154p

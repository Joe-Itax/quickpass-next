import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { qrDecode } from "@/lib/qr";
import { requireAdmin } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // 1. Protection Admin : Seul un administrateur peut utiliser le scanner universel
  const user = await requireAdmin(req);
  if (user instanceof NextResponse) return user;

  try {
    const { qr } = await req.json();
    if (!qr) return NextResponse.json({ error: "QR missing" }, { status: 400 });

    // 2. Décodage du QR
    const payload = await qrDecode(qr);
    if (typeof payload !== "object" || payload === null) {
      return NextResponse.json({ error: "Invalid QR format" }, { status: 400 });
    }

    const { invitationId } = payload as {
      invitationId?: number | string;
      eventId?: number | string;
    };

    if (!invitationId) {
      return NextResponse.json(
        { error: "Incomplete QR payload" },
        { status: 400 },
      );
    }

    // 3. Récupération globale : Invitation + Event + Tables
    const invitation = await prisma.invitation.findUnique({
      where: { id: Number(invitationId) },
      include: {
        event: true, // On récupère l'événement lié de manière dynamique
        allocations: {
          include: { table: true },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation non reconnue par le système" },
        { status: 404 },
      );
    }

    // 4. Récupération de l'historique des scans réussis
    const previousScans = await prisma.scanLog.findMany({
      where: {
        invitationId: invitation.id,
        status: "SUCCESS",
      },
      include: {
        terminal: {
          select: { name: true, code: true },
        },
      },
      orderBy: { scannedAt: "desc" },
    });

    // 5. Construction de la réponse universelle
    return NextResponse.json({
      isValid: true,
      event: {
        id: invitation.event.id,
        name: invitation.event.name,
        status: invitation.event.status,
        date: invitation.event.date,
        location: invitation.event.location,
        fullLocation: invitation.event.fullLocation,
        eventCode: invitation.event.eventCode,
      },
      guest: {
        id: invitation.id,
        name: invitation.label,
        email: invitation.email,
        whatsapp: invitation.whatsapp,
        peopleCount: invitation.peopleCount,
        scannedCount: invitation.scannedCount,
        // Liste unique des noms de tables
        tables: Array.from(
          new Set(invitation.allocations.map((a) => a.table.name)),
        ),
        totalSeatsAssigned: invitation.allocations.reduce(
          (sum, a) => sum + a.seatsAssigned,
          0,
        ),
      },
      scanHistory: previousScans.map((log) => ({
        scannedAt: log.scannedAt,
        terminalName: log.terminal?.name || "Terminal Inconnu",
        terminalCode: log.terminal?.code || log.terminalCode || "N/A",
      })),
      scanStatus: {
        hasBeenScanned: invitation.scannedCount > 0,
        canBeScanned: invitation.scannedCount < invitation.peopleCount,
        remainingScans: Math.max(
          invitation.peopleCount - invitation.scannedCount,
          0,
        ),
      },
    });
  } catch (err) {
    console.error("[UNIVERSAL_SCAN_ERROR]", err);
    return NextResponse.json(
      { error: "Erreur lors de la vérification", details: String(err) },
      { status: 500 },
    );
  }
}

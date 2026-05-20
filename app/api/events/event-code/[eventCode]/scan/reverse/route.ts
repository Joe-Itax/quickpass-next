import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrNull } from "@/lib/auth-guards";
import { qrDecode } from "@/lib/qr";

export const dynamic = "force-dynamic";

interface EventContext {
  params: Promise<{
    eventCode: string;
  }>;
}

export async function POST(req: NextRequest, context: EventContext) {
  const { eventCode } = await context.params;

  // 1. Vérifier la session utilisateur
  const session = await getSessionOrNull(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Extraire les données
  const { qr, terminalCode } = await req.json();
  if (!qr || !terminalCode) {
    return NextResponse.json(
      { error: "qr and terminalCode are required" },
      { status: 400 },
    );
  }

  try {
    // 3. Vérifier le terminal
    const terminal = await prisma.terminal.findUnique({
      where: { code: terminalCode },
      include: { event: true },
    });

    if (!terminal || !terminal.isActive || terminal.deletedAt) {
      return NextResponse.json(
        { error: "Terminal invalide ou désactivé" },
        { status: 403 },
      );
    }

    if (terminal.event.eventCode !== eventCode) {
      return NextResponse.json(
        { error: "Terminal non autorisé pour cet événement" },
        { status: 403 },
      );
    }

    // 4. Décoder le QR
    let payload: unknown;
    try {
      payload = await qrDecode(qr);
    } catch {
      return NextResponse.json({ error: "QR invalide" }, { status: 400 });
    }

    const { invitationId, eventId: payloadEventId } = payload as {
      invitationId?: number;
      eventId?: number;
    };

    if (Number(payloadEventId) !== terminal.event.id) {
      return NextResponse.json(
        { error: "QR n'appartenant pas à cet événement" },
        { status: 400 },
      );
    }

    // 5. Transaction : décrémenter scannedCount, ajouter log, mettre à jour stats
    const result = await prisma.$transaction(async (tx) => {
      const invitation = await tx.invitation.findUnique({
        where: { id: Number(invitationId) },
      });

      if (!invitation) {
        throw new Error("Invitation introuvable");
      }

      if (invitation.scannedCount <= 0) {
        throw new Error("Aucun scan à annuler pour cette invitation");
      }

      const updated = await tx.invitation.update({
        where: { id: invitation.id },
        data: { scannedCount: { decrement: 1 } },
      });

      // Log de l'annulation
      await tx.scanLog.create({
        data: {
          eventCode,
          terminalCode,
          terminalId: terminal.id,
          invitationId: invitation.id,
          guestName: invitation.label,
          status: "REVERSED",
          errorMessage: "Scan annulé par un administrateur",
        },
      });

      // Mise à jour des stats
      await tx.eventStats.update({
        where: { eventId: terminal.event.id },
        data: { totalScanned: { decrement: 1 } },
      });

      return updated;
    });

    return NextResponse.json({
      success: true,
      invitation: {
        id: result.id,
        label: result.label,
        scannedCount: result.scannedCount,
        peopleCount: result.peopleCount,
      },
    });
  } catch (err) {
    console.error("[REVERSE_SCAN]", err);
    const message =
      err instanceof Error
        ? err.message
        : "Erreur lors de l'annulation du scan";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { eventCode, terminalCode, sessionToken } = await req.json();

    if (!eventCode || !terminalCode) {
      return NextResponse.json(
        { error: "Code d'événement et code terminal requis." },
        { status: 400 },
      );
    }

    // On cherche le terminal ET on valide l'état de l'événement lié
    const terminal = await prisma.terminal.findFirst({
      where: {
        code: terminalCode,
        deletedAt: null, // L'événement et le terminal ne doivent pas être supprimés
        event: {
          eventCode: eventCode,
          deletedAt: null,
          status: { not: "CANCELLED" },
        },
      },
      include: {
        event: {
          select: {
            name: true,
            status: true,
          },
        },
      },
    });

    if (!terminal) {
      return NextResponse.json(
        { error: "Accès refusé : terminal invalide ou événement suspendu" },
        { status: 404 },
      );
    }

    // Si le terminal est désactivé
    if (!terminal.isActive) {
      if (terminal.isSessionActive) {
        await prisma.terminal.update({
          where: { id: terminal.id },
          data: {
            isSessionActive: false,
            sessionToken: null,
          },
        });
      }
      return NextResponse.json(
        {
          error:
            "La session de ce terminal a été arrêtée. Veuillez contacter le gestionnaire de cet événement ou un administrateur.",
          sessionEnded: true,
        },
        { status: 403 },
      );
    }

    // SCÉNARIO 1 : Vérification d'une session existante (Heartbeat / SessionToken fourni)
    if (sessionToken) {
      if (terminal.isSessionActive && terminal.sessionToken === sessionToken) {
        await prisma.terminal.update({
          where: { id: terminal.id },
          data: { lastActiveAt: new Date() },
        });

        return NextResponse.json({
          success: true,
          eventName: terminal.event.name,
          terminalName: terminal.name,
          sessionToken: terminal.sessionToken,
        });
      }

      // Si la session a été arrêtée
      return NextResponse.json(
        {
          error:
            "La session de ce terminal a été arrêtée. Veuillez contacter le gestionnaire de cet événement ou un administrateur.",
          sessionEnded: true,
        },
        { status: 401 },
      );
    }

    // SCÉNARIO 2 : Nouvelle tentative d'activation (aucun sessionToken transmis)
    if (terminal.isSessionActive) {
      return NextResponse.json(
        {
          error:
            "Une session est déjà active sur ce terminal. Si vous pensez qu'il s'agit d'une erreur, veuillez contacter un administrateur.",
        },
        { status: 409 },
      );
    }

    // Aucune session active -> Création d'une nouvelle session
    const newSessionToken = crypto.randomUUID();
    await prisma.terminal.update({
      where: { id: terminal.id },
      data: {
        isSessionActive: true,
        sessionToken: newSessionToken,
        sessionStartedAt: new Date(),
        lastActiveAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      eventName: terminal.event.name,
      terminalName: terminal.name,
      sessionToken: newSessionToken,
    });
  } catch (error) {
    console.error("Erreur validation access: ", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { eventCode, terminalCode } = await req.json();

    // On cherche le terminal ET on valide l'état de l'événement lié
    const terminal = await prisma.terminal.findFirst({
      where: {
        code: terminalCode,
        isActive: true,
        deletedAt: null,
        event: {
          eventCode: eventCode,
          deletedAt: null, // L'événement ne doit pas être supprimé logiquement
          status: { not: "CANCELLED" }, // L'événement ne doit pas être annulé
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
      // Pour des raisons de sécurité, on reste vague sur la raison (code erroné ou event clos)
      return NextResponse.json(
        { error: "Accès refusé : terminal invalide ou événement suspendu" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      eventName: terminal.event.name,
      terminalName: terminal.name,
    });
  } catch (error) {
    console.error("Erreur validation access: ", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { eventCode, terminalCode } = await req.json();

    const terminal = await prisma.terminal.findFirst({
      where: {
        code: terminalCode,
        isActive: true,
        deletedAt: null,
        event: { eventCode: eventCode }, // Vérifie que le terminal appartient à l'event
      },
      include: { event: true },
    });

    if (!terminal) {
      return NextResponse.json(
        { error: "Accès invalide ou terminal désactivé" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      eventName: terminal.event.name,
      terminalName: terminal.name,
    });
  } catch (error) {
    console.log("Erreur: ", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

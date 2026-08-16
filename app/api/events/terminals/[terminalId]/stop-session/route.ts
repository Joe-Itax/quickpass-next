import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";

interface TerminalContext {
  params: Promise<{
    terminalId: string;
  }>;
}

export async function POST(req: NextRequest, context: TerminalContext) {
  const admin = await requireAdmin(req);
  if (!admin || admin instanceof NextResponse) return admin;

  try {
    const params = await context.params;
    const terminalId = Number(params.terminalId);

    if (isNaN(terminalId)) {
      return NextResponse.json(
        { error: "Identifiant de terminal invalide" },
        { status: 400 },
      );
    }

    const terminal = await prisma.terminal.findUnique({
      where: { id: terminalId },
    });

    if (!terminal) {
      return NextResponse.json(
        { error: "Terminal introuvable" },
        { status: 404 },
      );
    }

    await prisma.terminal.update({
      where: { id: terminalId },
      data: {
        isSessionActive: false,
        sessionToken: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Session du terminal arrêtée avec succès.",
    });
  } catch (error) {
    console.error("Erreur arrêt de session terminal:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'arrêt de la session." },
      { status: 500 },
    );
  }
}

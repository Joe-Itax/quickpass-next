import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEventAccess } from "@/lib/auth-guards";

interface TerminalContext {
  params: Promise<{
    terminalId: string;
  }>;
}

// MODIFICATION
export async function PATCH(req: NextRequest, context: TerminalContext) {
  try {
    const params = await context.params;
    const id = Number(params.terminalId);
    const { name, code, isActive } = await req.json();

    const terminal = await prisma.terminal.findUnique({
      where: { id },
      select: { id: true, eventId: true },
    });

    if (!terminal) {
      return NextResponse.json(
        { error: "Terminal introuvable" },
        { status: 404 },
      );
    }

    const userAccess = await requireEventAccess(req, terminal.eventId);
    if (userAccess instanceof NextResponse) return userAccess;

    const updateData: {
      name?: string;
      code?: string;
      isActive?: boolean;
      isSessionActive?: boolean;
      sessionToken?: null;
    } = {};

    if (name) updateData.name = name.trim();

    if (code) {
      const trimmedCode = code.trim();
      // Vérifier si le code est déjà utilisé par un autre terminal
      const existing = await prisma.terminal.findFirst({
        where: {
          code: trimmedCode,
          id: { not: id },
        },
      });
      if (existing) {
        return NextResponse.json(
          { error: "Ce code terminal est déjà utilisé par un autre terminal." },
          { status: 400 },
        );
      }
      updateData.code = trimmedCode;
    }

    if (typeof isActive === "boolean") {
      updateData.isActive = isActive;
      // Si le terminal est désactivé, sa session (si active) s'arrête illico
      if (isActive === false) {
        updateData.isSessionActive = false;
        updateData.sessionToken = null;
      }
    }

    const updated = await prisma.terminal.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.log("Erreur: ", error);
    return NextResponse.json({ error: "Erreur modification" }, { status: 500 });
  }
}

// SOFT DELETE
export async function DELETE(req: NextRequest, context: TerminalContext) {
  try {
    const params = await context.params;
    const id = Number(params.terminalId);

    const terminal = await prisma.terminal.findUnique({
      where: { id },
      select: { id: true, eventId: true },
    });

    if (!terminal) {
      return NextResponse.json(
        { error: "Terminal introuvable" },
        { status: 404 },
      );
    }

    const userAccess = await requireEventAccess(req, terminal.eventId);
    if (userAccess instanceof NextResponse) return userAccess;

    await prisma.terminal.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
        isSessionActive: false,
        sessionToken: null,
      },
    });

    return NextResponse.json({ message: "Terminal archivé" });
  } catch (error) {
    console.log("Erreur: ", error);
    return NextResponse.json({ error: "Erreur suppression" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    const { name, isActive } = await req.json();

    const updated = await prisma.terminal.update({
      where: { id },
      data: {
        name,
        isActive,
      },
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

    await prisma.terminal.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    return NextResponse.json({ message: "Terminal archivé" });
  } catch (error) {
    console.log("Erreur: ", error);
    return NextResponse.json({ error: "Erreur suppression" }, { status: 500 });
  }
}

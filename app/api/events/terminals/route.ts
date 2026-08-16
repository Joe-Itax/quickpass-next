import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateTerminalCode } from "@/lib/generate-terminal-code";
import { requireAuth, requireEventAccess } from "@/lib/auth-guards";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user || user instanceof NextResponse) return user;

  const isAdmin = user.role === "ADMIN";

  try {
    const events = await prisma.event.findMany({
      where: {
        deletedAt: null,
        status: { not: "CANCELLED" },
        // Si admin -> tous les événements avec terminaux.
        // Si user normal -> seulement les événements auxquels l'utilisateur est assigné !
        ...(isAdmin
          ? { terminals: { some: {} } }
          : {
              assignments: { some: { userId: user.id } },
              terminals: { some: { deletedAt: null } },
            }),
      },
      include: {
        terminals: {
          where: isAdmin ? {} : { deletedAt: null },
          orderBy: [
            { deletedAt: "desc" },
            { createdAt: "desc" },
          ],
        },
      },
    });
    return NextResponse.json(events);
  } catch (error) {
    console.log("Erreur: ", error);

    return NextResponse.json(
      { error: "Erreur lors de la récupération" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user || user instanceof NextResponse) return user;

  try {
    const { name, eventId } = await req.json();

    if (!name || !eventId) {
      return NextResponse.json(
        { error: "Données manquantes" },
        { status: 400 },
      );
    }

    const numericEventId = Number(eventId);

    // Vérifier que l'utilisateur est soit ADMIN, soit affecté à cet événement !
    const access = await requireEventAccess(req, numericEventId);
    if (access instanceof NextResponse) return access;

    const terminalCode = generateTerminalCode(name);

    const terminal = await prisma.terminal.create({
      data: {
        name: name.trim(),
        code: terminalCode,
        eventId: numericEventId,
      },
    });

    return NextResponse.json(terminal);
  } catch (error: unknown) {
    if (error instanceof Object && "code" in error && error.code === "P2002") {
      return NextResponse.json(
        { error: "Un terminal avec ce nom existe déjà pour cet événement" },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

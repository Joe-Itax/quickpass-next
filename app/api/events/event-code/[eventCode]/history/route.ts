import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface EventContext {
  params: Promise<{
    eventCode: string;
  }>;
}

export async function GET(req: NextRequest, context: EventContext) {
  const { eventCode } = await context.params;

  try {
    // On récupère les 100 derniers logs pour cet événement spécifique
    const logs = await prisma.scanLog.findMany({
      where: {
        eventCode: eventCode,
      },
      orderBy: {
        scannedAt: "desc", // Les plus récents en haut
      },
      take: 100,
      include: {
        terminal: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(logs);
  } catch (err) {
    console.error("Error fetching scan logs:", err);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'historique" },
      { status: 500 },
    );
  }
}

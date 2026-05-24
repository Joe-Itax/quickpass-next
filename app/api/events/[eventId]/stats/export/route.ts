import { NextRequest, NextResponse } from "next/server";
import { requireEventAccess } from "@/lib/auth-guards";
import {
  buildEventStatsWorkbookBuffer,
  EventStatsExportError,
  getEventStatsExportContentType,
  getEventStatsExportFileName,
} from "@/lib/event-stats-export";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface EventContext {
  params: Promise<{
    eventId: string;
  }>;
}

export async function GET(req: NextRequest, context: EventContext) {
  const { eventId: rawEventId } = await context.params;
  const eventId = Number(rawEventId);

  if (!Number.isInteger(eventId) || eventId <= 0) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 });
  }

  const user = await requireEventAccess(req, eventId);
  if (user instanceof NextResponse) return user;

  let eventName = ``;
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { name: true },
  });

  if (event) {
    eventName = event.name;
  }

  try {
    const buffer = await buildEventStatsWorkbookBuffer(eventId);
    const fileName = getEventStatsExportFileName(eventId, eventName);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": getEventStatsExportContentType(),
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": String(buffer.byteLength),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof EventStatsExportError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    console.error("[EVENT_STATS_EXPORT]", error);
    return NextResponse.json(
      { error: "Erreur lors de la generation du bilan Excel" },
      { status: 500 },
    );
  }
}

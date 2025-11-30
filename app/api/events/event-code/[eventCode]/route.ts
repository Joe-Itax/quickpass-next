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

  const event = await prisma.event.findUnique({
    where: { eventCode },
    include: {
      tables: true,
      invitations: { include: { allocations: true } },
      stats: true,
      assignments: { include: { user: true } },
    },
  });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(event);
}

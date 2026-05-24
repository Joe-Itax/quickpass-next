import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEventAccess } from "@/lib/auth-guards";
import { triggerWhatsappWorker } from "@/lib/whatsapp-queue";

interface EventContext {
  params: Promise<{
    eventId: string;
  }>;
}

export async function GET(req: NextRequest, context: EventContext) {
  const params = await context.params;
  const eventId = Number(params.eventId);

  const user = await requireEventAccess(req, eventId);
  if (user instanceof NextResponse) return user;

  const eventIdString = String(eventId);

  const [items, grouped] = await Promise.all([
    prisma.whatsappQueue.findMany({
      where: { eventId: eventIdString },
      orderBy: { createdAt: "desc" },
      take: 250,
    }),
    prisma.whatsappQueue.groupBy({
      by: ["status"],
      where: { eventId: eventIdString },
      _count: { _all: true },
    }),
  ]);

  const guestIds = items
    .map((item) => Number(item.guestId))
    .filter((id) => Number.isFinite(id));

  const guests = await prisma.invitation.findMany({
    where: { id: { in: guestIds }, eventId },
    select: { id: true, label: true, whatsapp: true },
  });

  const guestById = new Map(guests.map((guest) => [String(guest.id), guest]));
  const summary = {
    PENDING: 0,
    PROCESSING: 0,
    COMPLETED: 0,
    FAILED: 0,
  };

  for (const row of grouped) {
    summary[row.status] = row._count._all;
  }

  return NextResponse.json({
    summary,
    total: items.length,
    items: items.map((item) => ({
      ...item,
      guest: guestById.get(item.guestId) || null,
    })),
  });
}

export async function POST(req: NextRequest, context: EventContext) {
  const params = await context.params;
  const eventId = Number(params.eventId);

  const user = await requireEventAccess(req, eventId);
  if (user instanceof NextResponse) return user;

  const worker = await triggerWhatsappWorker();

  return NextResponse.json({
    success: worker.ok,
    workerNotified: worker.ok,
    workerError: worker.ok ? undefined : worker.error,
  });
}

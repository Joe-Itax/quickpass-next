import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEventAccess } from "@/lib/auth-guards";
import { triggerWhatsappWorker } from "@/lib/whatsapp-queue";

interface QueueContext {
  params: Promise<{
    eventId: string;
    queueId: string;
  }>;
}

export async function POST(req: NextRequest, context: QueueContext) {
  const params = await context.params;
  const eventId = Number(params.eventId);

  const user = await requireEventAccess(req, eventId);
  if (user instanceof NextResponse) return user;

  const item = await prisma.whatsappQueue.findUnique({
    where: { id: params.queueId },
  });

  if (!item || item.eventId !== String(eventId)) {
    return NextResponse.json(
      { error: "Message WhatsApp introuvable" },
      { status: 404 },
    );
  }

  await prisma.whatsappQueue.update({
    where: { id: item.id },
    data: {
      status: "PENDING",
      attempts: 0,
      errorMessage: null,
    },
  });

  const worker = await triggerWhatsappWorker();

  return NextResponse.json({
    success: true,
    workerNotified: worker.ok,
    workerError: worker.ok ? undefined : worker.error,
  });
}

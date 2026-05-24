import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEventAccess } from "@/lib/auth-guards";
import {
  isValidWhatsappPhone,
  queueWhatsappInvitations,
} from "@/lib/whatsapp-queue";

interface EventContext {
  params: Promise<{
    eventId: string;
  }>;
}

export async function POST(req: NextRequest, context: EventContext) {
  const params = await context.params;
  const eventId = Number(params.eventId);

  const user = await requireEventAccess(req, eventId);
  if (user instanceof NextResponse) return user;

  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        name: true,
        date: true,
        location: true,
        description: true,
        fullLocation: true,
        invitationMessage: true,
        invitations: true,
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Evenement non trouve" },
        { status: 404 },
      );
    }

    const guests = event.invitations.filter(
      (guest) => isValidWhatsappPhone(guest.whatsapp) && !!guest.qrCode,
    );

    if (guests.length === 0) {
      return NextResponse.json(
        { error: "Aucun invite avec numero WhatsApp valide et QR code." },
        { status: 400 },
      );
    }

    const result = await queueWhatsappInvitations({
      event,
      guests,
    });

    return NextResponse.json({
      success: true,
      queued: result.queued,
      workerNotified: result.worker.ok,
      workerError: result.worker.ok ? undefined : result.worker.error,
    });
  } catch (error) {
    console.error("WhatsApp queue error:", error);
    return NextResponse.json(
      { error: "Echec de la planification WhatsApp" },
      { status: 500 },
    );
  }
}

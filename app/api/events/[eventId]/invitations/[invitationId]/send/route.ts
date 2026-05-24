import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEventAccess } from "@/lib/auth-guards";
import { sendBulkEventEmail } from "@/lib/brevo";
import {
  isValidWhatsappPhone,
  queueWhatsappInvitations,
} from "@/lib/whatsapp-queue";

interface Context {
  params: Promise<{
    eventId: string;
    invitationId: string;
  }>;
}

export async function POST(req: NextRequest, context: Context) {
  const params = await context.params;
  const eventId = Number(params.eventId);
  const guestId = Number(params.invitationId);

  const user = await requireEventAccess(req, eventId);
  if (user instanceof NextResponse) return user;

  try {
    const { channel } = await req.json();

    if (channel !== "email" && channel !== "whatsapp") {
      return NextResponse.json({ error: "Canal invalide" }, { status: 400 });
    }

    const guest = await prisma.invitation.findUnique({
      where: { id: guestId, eventId },
      include: { allocations: true },
    });

    if (!guest) {
      return NextResponse.json({ error: "Invite non trouve" }, { status: 404 });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        name: true,
        date: true,
        location: true,
        fullLocation: true,
        invitationMessage: true,
        description: true,
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Evenement introuvable" },
        { status: 404 },
      );
    }

    const formattedDate =
      new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "long",
        timeStyle: "short",
        timeZone: "Africa/Kinshasa",
      }).format(event.date) + " (heure de Kinshasa)";

    if (channel === "email") {
      if (!guest.email || !guest.email.includes("@")) {
        return NextResponse.json({ error: "Email invalide" }, { status: 400 });
      }

      const results = await sendBulkEventEmail([
        {
          email: guest.email,
          label: guest.label,
          qrData: guest.qrCode || "",
          eventName: event.name,
          eventDate: formattedDate,
          eventLocation: `${event.location} (${event.fullLocation || ""})`,
          customMessage:
            event.invitationMessage || event.description || "Vous etes invite !",
          invitationUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/invitation/${guest.qrCode}`,
          seats: guest.peopleCount || 1,
        },
      ]);

      if (results[0].status === "fulfilled") {
        await prisma.invitation.update({
          where: { id: guestId },
          data: { isSentEmail: true },
        });
        return NextResponse.json({ success: true });
      }

      return NextResponse.json(
        { error: "Echec de l'envoi Email" },
        { status: 500 },
      );
    }

    if (!isValidWhatsappPhone(guest.whatsapp) || !guest.qrCode) {
      return NextResponse.json(
        { error: "Numero WhatsApp invalide ou QR code manquant" },
        { status: 400 },
      );
    }

    const result = await queueWhatsappInvitations({
      event,
      guests: [guest],
    });

    return NextResponse.json({
      success: true,
      queued: result.queued,
      workerNotified: result.worker.ok,
      workerError: result.worker.ok ? undefined : result.worker.error,
    });
  } catch (error) {
    console.error("Send Single Error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

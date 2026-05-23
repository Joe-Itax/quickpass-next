import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEventAccess } from "@/lib/auth-guards";
import { sendBulkEventEmail } from "@/lib/brevo";
import { sendBulkEventWhatsapp } from "@/lib/whatsapp";

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
      return NextResponse.json({ error: "Invité non trouvé" }, { status: 404 });
    }

    if (guest.allocations.length === 0) {
      return NextResponse.json(
        { error: "Assignez d'abord l'invité à une table." },
        { status: 403 }
      );
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        name: true,
        date: true,
        location: true,
        fullLocation: true,
        invitationMessage: true,
        description: true,
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Événement introuvable" }, { status: 404 });
    }

    const formattedDate =
      new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "long",
        timeStyle: "short",
        timeZone: "Africa/Kinshasa",
      }).format(event.date) + " (heure de Kinshasa)";

    let success = false;

    if (channel === "email") {
      if (!guest.email || !guest.email.includes("@")) {
        return NextResponse.json({ error: "Email invalide" }, { status: 400 });
      }

      const emailPayload = [
        {
          email: guest.email,
          label: guest.label,
          qrData: guest.qrCode || "",
          eventName: event.name,
          eventDate: formattedDate,
          eventLocation: `${event.location} (${event.fullLocation || ""})`,
          customMessage:
            event.invitationMessage || event.description || "Vous êtes invité !",
          invitationUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/invitation/${guest.qrCode}`,
          seats: guest.peopleCount || 1,
        },
      ];

      const results = await sendBulkEventEmail(emailPayload);
      if (results[0].status === "fulfilled") {
        success = true;
        await prisma.invitation.update({
          where: { id: guestId },
          data: { isSentEmail: true },
        });
      }
    } else if (channel === "whatsapp") {
      if (!guest.whatsapp) {
        return NextResponse.json({ error: "Numéro WhatsApp invalide" }, { status: 400 });
      }

      const waPayload = [
        {
          whatsapp: guest.whatsapp,
          label: guest.label,
          qrData: guest.qrCode || "",
          eventName: event.name,
          eventDate: formattedDate,
          eventfullLocation: `${event.location} (${event.fullLocation || ""})`,
          invitationMessage:
            event.invitationMessage || event.description || "Vous êtes invité !",
          invitationLink: `${process.env.NEXT_PUBLIC_BASE_URL}/invitation/${guest.qrCode}`,
        },
      ];

      const results = await sendBulkEventWhatsapp(waPayload);
      if (results[0].status === "fulfilled") {
        success = true;
        await prisma.invitation.update({
          where: { id: guestId },
          data: { isSentWhatsapp: true },
        });
      } else {
        console.error("Erreur WhatsApp Zavu:", results[0].reason);
        return NextResponse.json(
          { error: "Échec de l'envoi WhatsApp via Zavu" },
          { status: 500 }
        );
      }
    }

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      console.log("Erreur lors de l'envoi: ", )
      return NextResponse.json({ error: "Échec de l'envoi" }, { status: 500 });
    }
  } catch (error) {
    console.error("Send Single Error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

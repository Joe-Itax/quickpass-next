import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEventAccess } from "@/lib/auth-guards";
import { sendBulkEventEmail } from "@/lib/brevo";

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
    const body = await req.json().catch(() => ({}));
    const sendMode = body?.sendMode === "unsent" ? "unsent" : "all";

    // 1. Vérification du plan de table
    const unassignedCount = await prisma.invitation.count({
      where: { eventId, allocations: { none: {} } },
    });

    if (unassignedCount > 0) {
      return NextResponse.json(
        { error: "Diffusion bloquée : Assignez tous les invités à une table." },
        { status: 403 },
      );
    }

    // 2. Récupération de l'événement avec tous les nouveaux champs
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

    if (!event)
      return NextResponse.json(
        { error: "Événement non trouvé" },
        { status: 404 },
      );

    // Formatage de la date
    const formattedDate =
      new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "long",
        timeStyle: "short",
        timeZone: "Africa/Kinshasa",
      }).format(event.date) + " (heure de Kinshasa)";

    // 3. Récupération les invités
    const guests = await prisma.invitation.findMany({
      where: {
        eventId,
        email: { not: null, contains: "@" },
        ...(sendMode === "unsent" ? { isSentEmail: false } : {}),
      },
    });

    if (guests.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Aucun email valide.",
      });
    }

    // 4. Préparation des données pour Brevo
    const emailPayload = guests.map((g) => ({
      email: g.email!,
      label: g.label,
      qrData: g.qrCode || "",
      eventName: event.name,
      eventDate: formattedDate,
      eventLocation: `${event.location} (${event.fullLocation || ""})`,
      customMessage:
        event.invitationMessage || event.description || "Vous êtes invité !",
      invitationUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/invitation/${g.qrCode}`,
      seats: g.peopleCount || 1,
    }));

    // 5. Envoi
    const results = await sendBulkEventEmail(emailPayload);

    // 6. Mise à jour de la DB
    const successIds = guests
      .filter((_, index) => results[index].status === "fulfilled")
      .map((g) => g.id);

    if (successIds.length > 0) {
      await prisma.invitation.updateMany({
        where: { id: { in: successIds } },
        data: { isSentEmail: true },
      });
    }

    return NextResponse.json({
      success: true,
      count: successIds.length,
      failed: guests.length - successIds.length,
      mode: sendMode,
    });
  } catch (error) {
    console.error("Brevo Error:", error);
    return NextResponse.json(
      { error: "Échec de la diffusion" },
      { status: 500 },
    );
  }
}

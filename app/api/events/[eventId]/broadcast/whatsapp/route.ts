import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEventAccess } from "@/lib/auth-guards";
import { sendBulkEventWhatsapp } from "@/lib/whatsapp";

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
    // 1. Vérification critique du flux
    const unassignedCount = await prisma.invitation.count({
      where: {
        eventId,
        allocations: { none: {} },
      },
    });

    if (unassignedCount > 0) {
      return NextResponse.json(
        {
          error:
            "Diffusion bloquée : Tous les invités doivent être assignés à une table avant l'envoi.",
        },
        { status: 403 },
      );
    }

    // 2. Data de l'événement
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        name: true,
        date: true,
        location: true,
        description: true,
        fullLocation: true,
        invitationMessage: true,
      },
    });

    if (!event)
      return NextResponse.json(
        { error: "Événement non trouvé" },
        { status: 404 },
      );

    // Formatage de la date (ex: 15 août 2024)
    const formattedDate = new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(event.date);

    // 3. Cibler les éligibles (WhatsApp renseigné et non envoyé)
    const guests = await prisma.invitation.findMany({
      where: {
        eventId,
        whatsapp: { not: null },
        isSentWhatsapp: false,
      },
    });

    // Filtre frontend re-vérifié en backend (longueur minimale d'un numéro)
    const eligibleGuests = guests.filter(
      (g) => g.whatsapp && g.whatsapp.length >= 9,
    );

    if (eligibleGuests.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Aucun numéro WhatsApp en attente d'envoi.",
      });
    }

    // 4. Mapping vers l'interface stricte
    const whatsappPayload = eligibleGuests.map((g) => ({
      whatsapp: g.whatsapp!,
      label: g.label,
      qrData: g.qrCode || "",
      eventName: event.name,
      eventDate: formattedDate,
      eventfullLocation: event.fullLocation || event.location,
      invitationMessage:
        event.invitationMessage ||
        event.description ||
        `Nous sommes ravis de vous compter parmi nous !`,
      invitationLink: g.qrCode || "",
    }));

    // 5. Exécution via l'abstraction
    const results = await sendBulkEventWhatsapp(whatsappPayload);

    // DEBUG (À virer en prod)
    results.forEach((res, i) => {
      if (res.status === "rejected") {
        console.error(
          `Erreur Zavu sur ${whatsappPayload[i].whatsapp}:`,
          res.reason,
        );
      }
    });

    // 6. Validation en DB uniquement des promesses résolues
    const successIds = eligibleGuests
      .filter((_, index) => results[index].status === "fulfilled")
      .map((g) => g.id);

    if (successIds.length > 0) {
      await prisma.invitation.updateMany({
        where: { id: { in: successIds } },
        data: { isSentWhatsapp: true },
      });
    }

    return NextResponse.json({
      success: true,
      count: successIds.length,
      totalRequested: eligibleGuests.length,
      failed: eligibleGuests.length - successIds.length,
    });
  } catch (error: unknown) {
    console.error("WhatsApp Broadcast Error:", error);
    return NextResponse.json(
      { error: "Échec critique de la diffusion WhatsApp" },
      { status: 500 },
    );
  }
}

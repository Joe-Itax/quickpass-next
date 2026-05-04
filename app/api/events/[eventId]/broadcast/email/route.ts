// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { requireEventAccess } from "@/lib/auth-guards";
// import { sendBulkEventEmail } from "@/lib/brevo";

// interface EventContext {
//   params: Promise<{
//     eventId: string;
//   }>;
// }

// export async function POST(req: NextRequest, context: EventContext) {
//   const params = await context.params;
//   const eventId = Number(params.eventId);

//   const user = await requireEventAccess(req, eventId);
//   if (user instanceof NextResponse) return user;

//   try {
//     // 1. Récupérer l'événement pour avoir son nom
//     const event = await prisma.event.findUnique({
//       where: { id: eventId },
//       select: { name: true },
//     });

//     if (!event)
//       return NextResponse.json(
//         { error: "Événement non trouvé" },
//         { status: 404 },
//       );

//     // 2. On récupère les invités éligibles
//     const guests = await prisma.invitation.findMany({
//       where: {
//         eventId,
//         email: { not: null, contains: "@" },
//         isSentEmail: false,
//       },
//     });

//     if (guests.length === 0) {
//       return NextResponse.json({ message: "Aucun nouvel email à envoyer" });
//     }

//     // 3. Préparation des données (on ajoute eventName)
//     const emailPayload = guests.map((g) => ({
//       email: g.email!,
//       label: g.label,
//       qrData: g.qrCode || "",
//       eventName: event.name, // Crucial pour le template Brevo
//     }));

//     // 4. Envoi et mise à jour
//     const results = await sendBulkEventEmail(emailPayload);

//     const successIds = guests
//       .filter((_, index) => results[index].status === "fulfilled")
//       .map((g) => g.id);

//     await prisma.invitation.updateMany({
//       where: { id: { in: successIds } },
//       data: { isSentEmail: true },
//     });

//     return NextResponse.json({
//       success: true,
//       count: successIds.length,
//       totalRequested: guests.length,
//     });
//   } catch (error: unknown) {
//     console.error("Brevo Broadcast Error:", error);
//     return NextResponse.json(
//       { error: "Échec de la diffusion email" },
//       { status: 500 },
//     );
//   }
// }
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
    // 1. Vérification critique : Y a-t-il des invités non assignés ?
    // On bloque la diffusion si le plan de table n'est pas terminé.
    const unassignedCount = await prisma.invitation.count({
      where: {
        eventId,
        allocations: {
          none: {}, // Aucune allocation associée = invité non assigné
        },
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

    // 2. Récupérer l'événement
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { name: true },
    });

    if (!event)
      return NextResponse.json(
        { error: "Événement non trouvé" },
        { status: 404 },
      );

    // 3. Récupérer les invités éligibles (Email présent et non encore envoyé)
    const guests = await prisma.invitation.findMany({
      where: {
        eventId,
        email: { not: null, contains: "@" },
        isSentEmail: false,
      },
    });

    if (guests.length === 0) {
      return NextResponse.json({
        success: true,
        message:
          "Aucun nouvel email à envoyer ou tous les contacts sont invalides.",
      });
    }

    // 4. Préparation des données pour Brevo
    const emailPayload = guests.map((g) => ({
      email: g.email!,
      label: g.label,
      qrData: g.qrCode || "",
      eventName: event.name,
    }));

    // 5. Envoi via le service Brevo
    const results = await sendBulkEventEmail(emailPayload);

    // LOG DE DEBUG : À supprimer après correction
    results.forEach((res, i) => {
      if (res.status === "rejected") {
        console.error(
          `Erreur sur l'invité ${emailPayload[i].email}:`,
          res.reason,
        );
      }
    });

    // 6. Filtrer uniquement les succès pour mettre à jour la DB
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
      totalRequested: guests.length,
      failed: guests.length - successIds.length,
    });
  } catch (error: unknown) {
    console.error("Brevo Broadcast Error:", error);
    return NextResponse.json(
      { error: "Échec de la diffusion email" },
      { status: 500 },
    );
  }
}

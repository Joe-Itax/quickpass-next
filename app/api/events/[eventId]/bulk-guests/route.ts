import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEventAccess } from "@/lib/auth-guards";
import { qrEncode } from "@/lib/qr";

export const dynamic = "force-dynamic";

interface EventContext {
  params: Promise<{ eventId: string }>;
}

export async function POST(req: NextRequest, context: EventContext) {
  const { eventId: rawEventId } = await context.params;
  const eventId = Number(rawEventId);

  // Sécurité : Vérification des accès
  const user = await requireEventAccess(req, eventId);
  if (user instanceof NextResponse) return user;

  try {
    const { guests } = await req.json();

    console.log("Bulk guests payload:", guests);

    if (!Array.isArray(guests) || guests.length === 0) {
      return NextResponse.json(
        { error: "Liste d'invités vide ou invalide" },
        { status: 400 },
      );
    }

    const result = await prisma.$transaction(
      async (tx) => {
        let totalNewPeople = 0;
        const createdInvitations = [];

        for (const guest of guests) {
          // 1. Création de l'invitation (sans allocations pour l'import Excel simple)
          const inv = await tx.invitation.create({
            data: {
              label: guest.label,
              peopleCount: guest.peopleCount || 1,
              email: guest.email || null,
              whatsapp: guest.whatsapp || null,
              eventId: eventId,
            },
          });

          // 2. Génération du QR Code unique
          const payload = {
            invitationId: inv.id,
            eventId: eventId,
            ts: Date.now(),
          };
          const qr = await qrEncode(payload);

          // 3. Mise à jour de l'invitation avec son QR
          const updatedInv = await tx.invitation.update({
            where: { id: inv.id },
            data: { qrCode: qr },
          });

          totalNewPeople += guest.peopleCount || 1;
          createdInvitations.push(updatedInv);
        }

        // 4. Mise à jour globale des stats de l'événement
        await tx.eventStats.update({
          where: { eventId },
          data: {
            totalInvitations: { increment: createdInvitations.length },
            totalPeople: { increment: totalNewPeople },
          },
        });

        return {
          count: createdInvitations.length,
          totalPeople: totalNewPeople,
        };
      },
      {
        timeout: 15000, // On augmente le timeout pour les gros fichiers (15s)
      },
    );

    return NextResponse.json(result);
  } catch (err) {
    console.error("Bulk Import Error:", err);
    return NextResponse.json(
      { error: "Erreur lors de l'importation massive", details: String(err) },
      { status: 500 },
    );
  }
}

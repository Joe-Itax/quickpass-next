import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEventAccess } from "@/lib/auth-guards";

interface EventContext {
  params: Promise<{
    eventId: string;
    tableId: string;
  }>;
}

export async function POST(req: NextRequest, context: EventContext) {
  const params = await context.params;
  const eventId = Number(params.eventId);
  const tableId = Number(params.tableId);

  const user = await requireEventAccess(req, eventId);
  if (user instanceof NextResponse) return user;

  try {
    const { guestIds } = await req.json(); // Reçoit [12, 45, 67]

    if (!Array.isArray(guestIds)) {
      return NextResponse.json({ error: "IDs invalides" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Récupérer les infos de la table pour la capacité
      const table = await tx.table.findUnique({
        where: { id: tableId },
        include: { allocations: true },
      });

      if (!table) throw new Error("Table non trouvée");

      // 2. Calculer l'occupation actuelle
      const currentOccupied = table.allocations.reduce(
        (sum, a) => sum + a.seatsAssigned,
        0,
      );

      // 3. Récupérer les invités pour connaître leur peopleCount
      const guestsToAssign = await tx.invitation.findMany({
        where: { id: { in: guestIds } },
      });

      const newSeatsNeeded = guestsToAssign.reduce(
        (sum, g) => sum + g.peopleCount,
        0,
      );

      // 4. Vérification de sécurité finale
      if (currentOccupied + newSeatsNeeded > table.capacity) {
        throw new Error("Capacité de la table dépassée !");
      }

      // 5. Créer les allocations
      for (const guest of guestsToAssign) {
        await tx.tableAllocation.create({
          data: {
            invitationId: guest.id,
            tableId: tableId,
            seatsAssigned: guest.peopleCount,
          },
        });
      }

      // 6. Mise à jour des statistiques de l'événement
      await tx.eventStats.update({
        where: { eventId },
        data: {
          totalAssignedSeats: { increment: newSeatsNeeded },
          availableSeats: { decrement: newSeatsNeeded },
        },
      });

      return { success: true, assigned: guestsToAssign.length };
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "An unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEventAccess } from "@/lib/auth-guards";
import { qrEncode } from "@/lib/qr";
import type { Invitation } from "@prisma/client";

export const dynamic = "force-dynamic";

interface EventContext {
  params: Promise<{ eventId: string }>;
}

// Type étendu pour l'invitation avec le nombre de sièges assignés
type InvitationWithSeats = Invitation & {
  totalSeatsAssigned: number;
};

export async function POST(req: NextRequest, context: EventContext) {
  const { eventId: rawEventId } = await context.params;
  const eventId = Number(rawEventId);

  const user = await requireEventAccess(req, eventId);
  if (user instanceof NextResponse) return user;

  try {
    const { guests } = await req.json();

    if (!Array.isArray(guests) || guests.length === 0) {
      return NextResponse.json(
        { error: "Liste d'invités vide ou invalide" },
        { status: 400 },
      );
    }

    const result = await prisma.$transaction(
      async (tx) => {
        // ----- 1. Préparer les tables existantes -----
        const existingTables = await tx.table.findMany({
          where: { eventId },
          include: {
            allocations: {
              select: { seatsAssigned: true },
            },
          },
        });

        const tableNameMap = new Map<
          string,
          { id: number; capacity: number; assigned: number }
        >();
        for (const t of existingTables) {
          const alreadyAssigned = t.allocations.reduce(
            (sum, a) => sum + a.seatsAssigned,
            0,
          );
          tableNameMap.set(t.name, {
            id: t.id,
            capacity: t.capacity,
            assigned: alreadyAssigned,
          });
        }

        // ----- 2. Créer les tables manquantes (capacité par défaut : 4) -----
        const uniqueTableNames = [
          ...new Set(
            guests
              .filter((g: { tableName: string }) => g.tableName)
              .map((g: { tableName: string }) => g.tableName),
          ),
        ];

        for (const tableName of uniqueTableNames) {
          if (!tableNameMap.has(tableName)) {
            const newTable = await tx.table.create({
              data: {
                name: tableName,
                capacity: 4,
                eventId,
              },
            });
            tableNameMap.set(tableName, {
              id: newTable.id,
              capacity: 4,
              assigned: 0,
            });
          }
        }

        // ----- 3. Traiter les invités et ajuster les capacités -----
        let totalNewPeople = 0;
        const createdInvitations: InvitationWithSeats[] = [];

        for (const guest of guests) {
          const inv = await tx.invitation.create({
            data: {
              label: guest.label,
              peopleCount: guest.peopleCount || 1,
              email: guest.email || null,
              whatsapp: guest.whatsapp || null,
              eventId,
            },
          });

          const payload = {
            invitationId: inv.id,
            eventId,
            ts: Date.now(),
          };
          const qr = await qrEncode(payload);
          const updatedInv = await tx.invitation.update({
            where: { id: inv.id },
            data: { qrCode: qr },
          });

          let totalSeatsAssigned = 0;
          if (guest.tableName) {
            const tableInfo = tableNameMap.get(guest.tableName);
            if (tableInfo) {
              const seatsToAdd = guest.peopleCount || 1;
              const newTotalAssigned = tableInfo.assigned + seatsToAdd;

              if (newTotalAssigned > tableInfo.capacity) {
                await tx.table.update({
                  where: { id: tableInfo.id },
                  data: { capacity: newTotalAssigned },
                });
                tableInfo.capacity = newTotalAssigned;
              }

              await tx.tableAllocation.create({
                data: {
                  invitationId: inv.id,
                  tableId: tableInfo.id,
                  seatsAssigned: seatsToAdd,
                },
              });

              tableInfo.assigned = newTotalAssigned;
              totalSeatsAssigned = seatsToAdd;
            }
          }

          totalNewPeople += guest.peopleCount || 1;
          // On enrichit l'objet Prisma avec la propriété temporaire
          createdInvitations.push({
            ...updatedInv,
            totalSeatsAssigned,
          });
        }

        // ----- 4. Mise à jour des stats -----
        const totalSeatsAssigned = createdInvitations.reduce(
          (sum, inv) => sum + inv.totalSeatsAssigned,
          0,
        );

        await tx.eventStats.update({
          where: { eventId },
          data: {
            totalInvitations: { increment: createdInvitations.length },
            totalPeople: { increment: totalNewPeople },
            totalAssignedSeats: { increment: totalSeatsAssigned },
          },
        });

        const capacityAgg = await tx.table.aggregate({
          _sum: { capacity: true },
          where: { eventId },
        });
        await tx.eventStats.update({
          where: { eventId },
          data: {
            totalCapacity: capacityAgg._sum.capacity ?? 0,
          },
        });

        return {
          count: createdInvitations.length,
          totalPeople: totalNewPeople,
          invitations: createdInvitations,
        };
      },
      { timeout: 20000 },
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

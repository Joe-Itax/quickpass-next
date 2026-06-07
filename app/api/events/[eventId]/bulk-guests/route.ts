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
          {
            id: number;
            capacity: number;
            assigned: number;
            needsCapacityUpdate: boolean;
          }
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
            needsCapacityUpdate: false,
          });
        }

        // ----- 2. Créer les tables manquantes -----
        const uniqueTableNames = [
          ...new Set(
            guests
              .filter((g: { tableName: string }) => g.tableName)
              .map((g: { tableName: string }) => g.tableName),
          ),
        ] as string[];

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
              needsCapacityUpdate: false,
            });
          }
        }

        // ----- 3. Création des invités en BULK (1 seule requête) -----
        let totalNewPeople = 0;

        const guestsDataToCreate = guests.map((g) => ({
          label: g.label,
          peopleCount: g.peopleCount || 1,
          email: g.email || null,
          whatsapp: g.whatsapp || null,
          eventId,
        }));

        // createManyAndReturn est très rapide et retourne les IDs
        const createdInvitations = await tx.invitation.createManyAndReturn({
          data: guestsDataToCreate,
        });

        // Générer les QR codes rapidement en mémoire
        const qrUpdates = await Promise.all(
          createdInvitations.map(async (inv) => {
            const qr = await qrEncode({
              invitationId: inv.id,
              eventId,
              ts: Date.now(),
            });
            return { id: inv.id, qrCode: qr };
          }),
        );

        // Mettre à jour tous les QR Codes d'un seul coup via requête SQL Raw (Bulk Update)
        const updateIds = qrUpdates.map((q) => q.id);
        const updateQrs = qrUpdates.map((q) => q.qrCode);

        if (updateIds.length > 0) {
          await tx.$executeRaw`
            UPDATE "Invitation"
            SET "qrCode" = data."qrCode"
            FROM (
              SELECT 
                unnest(${updateIds}::int[]) as id, 
                unnest(${updateQrs}::text[]) as "qrCode"
            ) AS data
            WHERE "Invitation".id = data.id
          `;
        }

        // ----- 4. Traiter les allocations de tables en BULK -----
        const allocationsToCreate: {
          invitationId: number;
          tableId: number;
          seatsAssigned: number;
        }[] = [];

        for (let i = 0; i < guests.length; i++) {
          const guest = guests[i];
          const inv = createdInvitations[i];

          totalNewPeople += guest.peopleCount || 1;

          if (guest.tableName) {
            const tableInfo = tableNameMap.get(guest.tableName);
            if (tableInfo) {
              const seatsToAdd = guest.peopleCount || 1;
              tableInfo.assigned += seatsToAdd;
              if (tableInfo.assigned > tableInfo.capacity) {
                tableInfo.capacity = tableInfo.assigned;
                tableInfo.needsCapacityUpdate = true;
              }

              allocationsToCreate.push({
                invitationId: inv.id,
                tableId: tableInfo.id,
                seatsAssigned: seatsToAdd,
              });
            }
          }
        }

        if (allocationsToCreate.length > 0) {
          await tx.tableAllocation.createMany({
            data: allocationsToCreate,
          });
        }

        // ----- 5. On Met à jour les capacités des tables modifiées EN LOT -----
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const [_, info] of Array.from(tableNameMap.entries())) {
          if (info.needsCapacityUpdate) {
            await tx.table.update({
              where: { id: info.id },
              data: { capacity: info.capacity },
            });
          }
        }

        // ----- 6. Mise à jour des stats -----
        const totalSeatsAssigned = allocationsToCreate.reduce(
          (sum, a) => sum + a.seatsAssigned,
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
      { timeout: 120000 },
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

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

    // Helper pour ignorer les lignes de consignes/notes d'explication
    const isIgnoredRow = (rawText: string) => {
      if (!rawText) return false;
      const lower = String(rawText).trim().toLowerCase();
      return (
        lower.startsWith("note") ||
        lower.startsWith("instruction") ||
        lower.startsWith("consigne") ||
        lower.startsWith("remarque") ||
        lower.includes("col a") ||
        lower.includes("col b") ||
        lower.includes("obligatoire")
      );
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const validGuests = guests.filter((g: any) => g?.label && !isIgnoredRow(g.label));

    if (validGuests.length === 0) {
      return NextResponse.json(
        { error: "Aucun invité valide trouvé dans la liste" },
        { status: 400 },
      );
    }

    // Validation stricte aux normes du système
    const validationErrors: string[] = [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    validGuests.forEach((g: any, index: number) => {
      const row = index + 2; // Numéro de ligne Excel correspondant
      if (!g.label || typeof g.label !== "string" || !g.label.trim()) {
        validationErrors.push(
          `Ligne ${row}, Colonne A (Nom) : Le nom de l'invité est obligatoire.`,
        );
      }
      if (g.peopleCount !== undefined && g.peopleCount !== null) {
        const count = Number(g.peopleCount);
        if (isNaN(count) || !Number.isInteger(count) || count < 1) {
          validationErrors.push(
            `Ligne ${row}, Colonne B (PAX) : Le nombre de places '${g.peopleCount}' doit être un nombre entier positif au moins égal à 1.`,
          );
        }
      }
      if (g.email && typeof g.email === "string" && g.email.trim()) {
        const emailTrimmed = g.email.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
          validationErrors.push(
            `Ligne ${row}, Colonne C (Email) : L'adresse email '${g.email}' est invalide.`,
          );
        }
      }
      if (g.whatsapp && typeof g.whatsapp === "string" && g.whatsapp.trim()) {
        const cleanWhatsapp = g.whatsapp.replace(/\s+/g, "");
        if (!/^\+?[0-9().-]{7,24}$/.test(cleanWhatsapp)) {
          validationErrors.push(
            `Ligne ${row}, Colonne D (WhatsApp) : Le numéro de téléphone '${g.whatsapp}' est invalide (au moins 7 chiffres).`,
          );
        }
      }
    });

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: "Fichier/données non conformes aux normes du système",
          errors: validationErrors,
        },
        { status: 422 },
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
            validGuests
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

        const guestsDataToCreate = validGuests.map((g) => ({
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

        for (let i = 0; i < validGuests.length; i++) {
          const guest = validGuests[i];
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

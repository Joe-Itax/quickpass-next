import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEventAccess } from "@/lib/auth-guards";
import { qrEncode } from "@/lib/qr";

export const dynamic = "force-dynamic";

type TableRow = {
  id?: number | null;
  name: string;
  capacity: number;
};

type GuestRow = {
  id?: number | null;
  label: string;
  peopleCount: number;
  email?: string | null;
  whatsapp?: string | null;
  tableName?: string | null;
};

type ValidationError = {
  sheet: "guests" | "tables";
  row: number;
  column: string;
  message: string;
};

interface EventContext {
  params: Promise<{ eventId: string }>;
}

export async function POST(req: NextRequest, context: EventContext) {
  const { eventId: rawEventId } = await context.params;
  const eventId = Number(rawEventId);

  const user = await requireEventAccess(req, eventId);
  if (user instanceof NextResponse) return user;

  const payload = (await req.json().catch(() => null)) as {
    guests?: GuestRow[];
    tables?: TableRow[];
  } | null;

  const guests = payload?.guests ?? [];
  const tables = payload?.tables ?? [];
  const errors = validatePayload(guests, tables);

  if (errors.length > 0) {
    return NextResponse.json(
      { error: "Validation echouee", errors },
      { status: 422 },
    );
  }

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const tableNameMap = new Map<
          string,
          { id: number; capacity: number }
        >();
        const tableIdsToKeep: number[] = [];
        const assignedCapacityByTable = getAssignedCapacityByTable(guests);

        for (const row of tables) {
          const name = normalizeName(row.name);
          const capacity = Math.max(
            1,
            assignedCapacityByTable.get(name.toLocaleLowerCase("fr-FR")) ??
              Math.round(Number(row.capacity)),
          );

          const table = row.id
            ? await tx.table.update({
                where: { id: row.id, eventId },
                data: { name, capacity },
              })
            : await tx.table.upsert({
                where: { eventId_name: { eventId, name } },
                create: { eventId, name, capacity },
                update: { capacity },
              });

          tableNameMap.set(name.toLocaleLowerCase("fr-FR"), {
            id: table.id,
            capacity: table.capacity,
          });
          tableIdsToKeep.push(table.id);
        }

        const submittedGuestIds = guests
          .map((guest) => guest.id)
          .filter((id): id is number => Number.isInteger(id));

        await tx.invitation.deleteMany({
          where: {
            eventId,
            id: {
              notIn: submittedGuestIds.length > 0 ? submittedGuestIds : [0],
            },
          },
        });

        // 1. Supprimer d'un coup toutes les allocations des invités existants
        if (submittedGuestIds.length > 0) {
          await tx.tableAllocation.deleteMany({
            where: { invitationId: { in: submittedGuestIds } },
          });
        }

        const finalInvitations: { id: number; data: GuestRow }[] = [];

        // Séparation : Créations vs Mises à jour
        const guestsToUpdate = guests.filter((g) => !!g.id);
        const guestsToCreate = guests.filter((g) => !g.id);

        // --- BULK UPDATE pour les existants ---
        if (guestsToUpdate.length > 0) {
          const updateIds = guestsToUpdate.map((g) => g.id as number);
          const updateLabels = guestsToUpdate.map((g) =>
            normalizeName(g.label),
          );
          const updatePeopleCounts = guestsToUpdate.map((g) =>
            Math.max(1, Math.round(Number(g.peopleCount))),
          );
          const updateEmails = guestsToUpdate.map((g) =>
            normalizeNullable(g.email),
          );
          const updateWhatsapps = guestsToUpdate.map((g) =>
            normalizeNullable(g.whatsapp),
          );

          await tx.$executeRaw`
            UPDATE "Invitation"
            SET 
              label = data.label,
              "peopleCount" = data."peopleCount",
              email = data.email,
              whatsapp = data.whatsapp
            FROM (
              SELECT 
                unnest(${updateIds}::int[]) as id,
                unnest(${updateLabels}::text[]) as label,
                unnest(${updatePeopleCounts}::int[]) as "peopleCount",
                unnest(${updateEmails}::text[]) as email,
                unnest(${updateWhatsapps}::text[]) as whatsapp
            ) AS data
            WHERE "Invitation".id = data.id AND "Invitation"."eventId" = ${eventId}
          `;

          guestsToUpdate.forEach((g) => {
            finalInvitations.push({ id: g.id as number, data: g });
          });
        }

        // --- BULK CREATE pour les nouveaux ---
        if (guestsToCreate.length > 0) {
          const guestsDataToCreate = guestsToCreate.map((g) => ({
            label: normalizeName(g.label),
            peopleCount: Math.max(1, Math.round(Number(g.peopleCount))),
            email: normalizeNullable(g.email),
            whatsapp: normalizeNullable(g.whatsapp),
            eventId,
          }));

          const created = await tx.invitation.createManyAndReturn({
            data: guestsDataToCreate,
          });

          // Génération des QR codes
          const qrUpdates = await Promise.all(
            created.map(async (inv) => {
              const qr = await qrEncode({
                invitationId: inv.id,
                eventId,
                ts: Date.now(),
              });
              return { id: inv.id, qrCode: qr };
            }),
          );

          // Bulk Update des QR codes via executeRaw
          const qrIds = qrUpdates.map((q) => q.id);
          const qrCodes = qrUpdates.map((q) => q.qrCode);

          await tx.$executeRaw`
            UPDATE "Invitation"
            SET "qrCode" = data."qrCode"
            FROM (
              SELECT 
                unnest(${qrIds}::int[]) as id, 
                unnest(${qrCodes}::text[]) as "qrCode"
            ) AS data
            WHERE "Invitation".id = data.id
          `;

          for (let i = 0; i < guestsToCreate.length; i++) {
            finalInvitations.push({
              id: created[i].id,
              data: guestsToCreate[i],
            });
          }
        }

        // 2. Créer toutes les allocations en une seule requête (Bulk Insert)
        const allocationsToCreate = [];
        for (const item of finalInvitations) {
          const tableName = normalizeName(item.data.tableName);
          if (tableName) {
            const tableInfo = tableNameMap.get(
              tableName.toLocaleLowerCase("fr-FR"),
            );
            if (tableInfo) {
              allocationsToCreate.push({
                invitationId: item.id,
                tableId: tableInfo.id,
                seatsAssigned: Math.max(
                  1,
                  Math.round(Number(item.data.peopleCount)),
                ),
              });
            }
          }
        }

        if (allocationsToCreate.length > 0) {
          await tx.tableAllocation.createMany({
            data: allocationsToCreate,
          });
        }

        await tx.table.deleteMany({
          where: {
            eventId,
            id: { notIn: tableIdsToKeep.length > 0 ? tableIdsToKeep : [0] },
            allocations: { none: {} },
          },
        });

        const [eventTables, eventInvitations, allocations, scannedAgg] =
          await Promise.all([
            tx.table.findMany({ where: { eventId } }),
            tx.invitation.findMany({ where: { eventId } }),
            tx.tableAllocation.findMany({ where: { invitation: { eventId } } }),
            tx.invitation.aggregate({
              where: { eventId },
              _sum: { scannedCount: true },
            }),
          ]);

        for (const table of eventTables) {
          const assigned = allocations
            .filter((allocation) => allocation.tableId === table.id)
            .reduce((total, allocation) => total + allocation.seatsAssigned, 0);

          if (assigned > table.capacity) {
            await tx.table.update({
              where: { id: table.id },
              data: { capacity: assigned },
            });
            table.capacity = assigned;
          }
        }

        const totalPeople = eventInvitations.reduce(
          (total, invitation) => total + invitation.peopleCount,
          0,
        );
        const totalAssignedSeats = allocations.reduce(
          (total, allocation) => total + allocation.seatsAssigned,
          0,
        );
        const totalCapacity = eventTables.reduce(
          (total, table) => total + table.capacity,
          0,
        );

        await tx.eventStats.upsert({
          where: { eventId },
          create: {
            eventId,
            totalInvitations: eventInvitations.length,
            totalPeople,
            totalScanned: scannedAgg._sum.scannedCount ?? 0,
            totalAssignedSeats,
            totalCapacity,
            availableSeats: Math.max(0, totalCapacity - totalAssignedSeats),
          },
          update: {
            totalInvitations: eventInvitations.length,
            totalPeople,
            totalScanned: scannedAgg._sum.scannedCount ?? 0,
            totalAssignedSeats,
            totalCapacity,
            availableSeats: Math.max(0, totalCapacity - totalAssignedSeats),
          },
        });

        return {
          guests: eventInvitations.length,
          tables: eventTables.length,
        };
      },
      { timeout: 120000 },
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Excel save error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'enregistrement du tableur" },
      { status: 500 },
    );
  }
}

function validatePayload(guests: GuestRow[], tables: TableRow[]) {
  const errors: ValidationError[] = [];
  const tableNames = new Set<string>();
  const guestTableNames = new Set<string>();

  tables.forEach((table, index) => {
    const row = index + 1;
    const name = normalizeName(table.name);

    if (!name) {
      errors.push({
        sheet: "tables",
        row,
        column: "Nom",
        message: "Nom requis.",
      });
    }
    if (name && tableNames.has(name.toLocaleLowerCase("fr-FR"))) {
      errors.push({
        sheet: "tables",
        row,
        column: "Nom",
        message: "Nom de table duplique.",
      });
    }
    if (name) tableNames.add(name.toLocaleLowerCase("fr-FR"));
    if (
      !Number.isInteger(Number(table.capacity)) ||
      Number(table.capacity) < 1
    ) {
      errors.push({
        sheet: "tables",
        row,
        column: "Capacite",
        message: "Capacite entiere positive requise.",
      });
    }
  });

  guests.forEach((guest, index) => {
    const row = index + 1;
    const label = normalizeName(guest.label);
    const email = normalizeNullable(guest.email);
    const whatsapp = normalizeNullable(guest.whatsapp);
    const tableName = normalizeName(guest.tableName);

    if (!label) {
      errors.push({
        sheet: "guests",
        row,
        column: "Nom",
        message: "Nom requis.",
      });
    }
    if (
      !Number.isInteger(Number(guest.peopleCount)) ||
      Number(guest.peopleCount) < 1
    ) {
      errors.push({
        sheet: "guests",
        row,
        column: "PAX",
        message: "Nombre entier positif requis.",
      });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({
        sheet: "guests",
        row,
        column: "Email",
        message: "Format email invalide.",
      });
    }
    if (whatsapp && !/^\+?[0-9\s().-]{7,24}$/.test(whatsapp)) {
      errors.push({
        sheet: "guests",
        row,
        column: "WhatsApp",
        message: "Numero WhatsApp invalide.",
      });
    }
    if (tableName) guestTableNames.add(tableName.toLocaleLowerCase("fr-FR"));
  });

  for (const tableName of guestTableNames) {
    if (!tableNames.has(tableName)) {
      errors.push({
        sheet: "guests",
        row:
          guests.findIndex(
            (guest) =>
              normalizeName(guest.tableName).toLocaleLowerCase("fr-FR") ===
              tableName,
          ) + 1,
        column: "Table",
        message: "La table doit exister dans le tableau Tables.",
      });
    }
  }

  return errors;
}

function getAssignedCapacityByTable(guests: GuestRow[]) {
  const assigned = new Map<string, number>();

  for (const guest of guests) {
    const tableName = normalizeName(guest.tableName).toLocaleLowerCase("fr-FR");
    if (!tableName) continue;
    assigned.set(
      tableName,
      (assigned.get(tableName) ?? 0) +
        Math.max(1, Number(guest.peopleCount) || 1),
    );
  }

  return assigned;
}

function normalizeName(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function normalizeNullable(value: unknown) {
  const normalized = normalizeName(value);
  return normalized || null;
}

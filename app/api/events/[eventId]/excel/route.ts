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

  const payload = (await req.json().catch(() => null)) as
    | { guests?: GuestRow[]; tables?: TableRow[] }
    | null;

  const guests = payload?.guests ?? [];
  const tables = payload?.tables ?? [];
  const errors = validatePayload(guests, tables);

  if (errors.length > 0) {
    return NextResponse.json({ error: "Validation echouee", errors }, { status: 422 });
  }

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const tableNameMap = new Map<string, { id: number; capacity: number }>();
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
            id: { notIn: submittedGuestIds.length > 0 ? submittedGuestIds : [0] },
          },
        });

        for (const row of guests) {
          const data = {
            label: normalizeName(row.label),
            peopleCount: Math.max(1, Math.round(Number(row.peopleCount))),
            email: normalizeNullable(row.email),
            whatsapp: normalizeNullable(row.whatsapp),
            eventId,
          };

          const invitation = row.id
            ? await tx.invitation.update({
                where: { id: row.id, eventId },
                data,
              })
            : await tx.invitation.create({ data });

          if (!invitation.qrCode) {
            const qrCode = await qrEncode({
              invitationId: invitation.id,
              eventId,
              ts: Date.now(),
            });
            await tx.invitation.update({
              where: { id: invitation.id },
              data: { qrCode },
            });
          }

          await tx.tableAllocation.deleteMany({
            where: { invitationId: invitation.id },
          });

          const tableName = normalizeName(row.tableName);
          if (tableName) {
            const tableInfo = tableNameMap.get(tableName.toLocaleLowerCase("fr-FR"));
            if (tableInfo) {
              await tx.tableAllocation.create({
                data: {
                  invitationId: invitation.id,
                  tableId: tableInfo.id,
                  seatsAssigned: data.peopleCount,
                },
              });
            }
          }
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
      { timeout: 30000 },
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
      errors.push({ sheet: "tables", row, column: "Nom", message: "Nom requis." });
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
    if (!Number.isInteger(Number(table.capacity)) || Number(table.capacity) < 1) {
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
      errors.push({ sheet: "guests", row, column: "Nom", message: "Nom requis." });
    }
    if (!Number.isInteger(Number(guest.peopleCount)) || Number(guest.peopleCount) < 1) {
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
      (assigned.get(tableName) ?? 0) + Math.max(1, Number(guest.peopleCount) || 1),
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

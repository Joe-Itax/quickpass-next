import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEventAccess } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

interface EventContext {
  params: Promise<{
    eventId: string;
    tableId: string;
  }>;
}

export async function GET(req: NextRequest, context: EventContext) {
  const params = await context.params;
  const eventId = Number(params.eventId);
  const tableId = Number(params.tableId);

  const user = await requireEventAccess(req, eventId);
  if (user instanceof NextResponse) return user;

  try {
    const table = await prisma.table.findUnique({
      where: { id: tableId },
    });
    if (!table) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }
    return NextResponse.json(table);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Error fetching table", details: String(err) },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, context: EventContext) {
  const params = await context.params;
  const eventId = Number(params.eventId);
  const tableId = Number(params.tableId);

  const user = await requireEventAccess(req, eventId);
  if (user instanceof NextResponse) return user;

  const body = await req.json();
  const { name, capacity } = body;

  try {
    const old = await prisma.table.findUnique({ where: { id: tableId } });
    if (!old)
      return NextResponse.json({ error: "Table not found" }, { status: 404 });

    // Vérifier si le nouveau nom est déjà utilisé par une autre table du même événement
    if (name && name !== old.name) {
      const existingTable = await prisma.table.findFirst({
        where: {
          eventId,
          name: {
            equals: name,
            mode: "insensitive",
          },
          NOT: {
            id: tableId, // Exclure la table actuelle de la vérification
          },
        },
      });

      if (existingTable) {
        return NextResponse.json(
          {
            error: `Une table avec le nom "${name}" existe déjà pour cet événement`,
          },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const upd = await tx.table.update({
        where: { id: tableId },
        data: { name, capacity },
      });

      // Si la capacité a changé, recalculer le totalCapacity de manière fiable
      if (typeof capacity === "number" && capacity !== old.capacity) {
        const capacityAgg = await tx.table.aggregate({
          _sum: { capacity: true },
          where: { eventId },
        });

        await tx.eventStats.upsert({
          where: { eventId },
          create: {
            eventId,
            totalCapacity: capacityAgg._sum.capacity ?? 0,
            totalInvitations: 0,
            totalScanned: 0,
            totalPeople: 0,
          },
          update: {
            totalCapacity: capacityAgg._sum.capacity ?? 0,
          },
        });
      }

      return upd;
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);

    // Gérer les erreurs de contrainte unique de Prisma
    if (err instanceof Error && err.message.includes("Unique constraint")) {
      return NextResponse.json(
        {
          error: `Une table avec le nom "${name}" existe déjà pour cet événement`,
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Error updating table" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, context: EventContext) {
  const params = await context.params;
  const eventId = Number(params.eventId);
  const tableId = Number(params.tableId);

  const user = await requireEventAccess(req, eventId);
  if (user instanceof NextResponse) return user;

  try {
    await prisma.$transaction(async (tx) => {
      const old = await tx.table.findUnique({ where: { id: tableId } });
      if (!old) throw new Error("not found");
      // remove allocations on this table and decrement eventStats totalCapacity and maybe handle orphaned allocations
      await tx.tableAllocation.deleteMany({ where: { tableId } });
      await tx.table.delete({ where: { id: tableId } });
      await tx.eventStats.update({
        where: { eventId },
        data: { totalCapacity: { decrement: old.capacity } },
      });
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Error deleting table" },
      { status: 500 }
    );
  }
}

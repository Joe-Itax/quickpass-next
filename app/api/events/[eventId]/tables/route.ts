import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEventAccess } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

interface EventContext {
  params: Promise<{
    eventId: number;
  }>;
}

export async function GET(req: NextRequest, context: EventContext) {
  const params = await context.params;
  const eventId = Number(params.eventId);

  try {
    const user = await requireEventAccess(req, eventId);
    if (user instanceof NextResponse) return user;

    const tables = await prisma.table.findMany({ where: { eventId } });
    return NextResponse.json(tables);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error fetching tables" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, context: EventContext) {
  const params = await context.params;
  const eventId = Number(params.eventId);

  const user = await requireEventAccess(req, eventId);
  if (user instanceof NextResponse) return user;

  const { name, capacity } = await req.json();
  if (!name || typeof capacity !== "number")
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  try {
    const result = await prisma.$transaction(async (tx) => {
      const table = await tx.table.create({
        data: { name, capacity, eventId },
      });

      // Recalculer le totalCapacity
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

      return table;
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error(err);

    // Gérer l'erreur de contrainte unique
    if (err instanceof Error && err.message.includes("Unique constraint")) {
      return NextResponse.json(
        {
          error: `Une table avec le nom "${name}" existe déjà pour cet événement`,
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Error creating table" },
      { status: 500 }
    );
  }
}

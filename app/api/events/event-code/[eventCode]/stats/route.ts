import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface EventContext {
  params: Promise<{
    eventCode: string;
  }>;
}

export async function GET(req: NextRequest, context: EventContext) {
  const { eventCode } = await context.params;

  try {
    const stats = await prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({
        where: { eventCode },
        select: { id: true },
      });

      if (!event) {
        throw new Error(`Event ${eventCode} not found`);
      }

      // Calcul des stats
      const [totalInvitations, scannedAgg, capacityAgg, peopleAgg] =
        await Promise.all([
          tx.invitation.count({ where: { eventId: event.id } }),
          tx.invitation.aggregate({
            _sum: { scannedCount: true },
            where: { eventId: event.id },
          }),
          tx.table.aggregate({
            _sum: { capacity: true },
            where: { eventId: event.id },
          }),
          tx.invitation.aggregate({
            _sum: { peopleCount: true },
            where: { eventId: event.id },
          }),
        ]);

      const totalScanned = scannedAgg._sum.scannedCount ?? 0;
      const totalCapacity = capacityAgg._sum.capacity ?? 0;
      const totalPeople = peopleAgg._sum.peopleCount ?? 0;

      console.log(`📊 Stats computed for event ${event.id}:`, {
        invitations: totalInvitations,
        scanned: totalScanned,
        capacity: totalCapacity,
        people: totalPeople,
      });

      // Mise à jour atomique
      return await tx.eventStats.upsert({
        where: { eventId: event.id },
        create: {
          eventId: event.id,
          totalInvitations,
          totalCapacity,
          totalScanned,
          totalPeople,
        },
        update: {
          totalInvitations,
          totalCapacity,
          totalScanned,
          totalPeople,
          updatedAt: new Date(),
        },
      });
    });

    return NextResponse.json(stats);
  } catch (err) {
    console.error("Error computing stats:", err);
    return NextResponse.json(
      {
        error: "Error computing stats",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, context: EventContext) {
  const { eventCode } = await context.params;

  try {
    const stats = await prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({ where: { eventCode } });

      if (!event) {
        return NextResponse.json(
          {
            error: "L'event n'existe pas",
          },
          {
            status: 404,
          }
        );
      }
      const [totalInvitations, scannedAgg, capacityAgg, peopleAgg] =
        await Promise.all([
          tx.invitation.count({ where: { eventId: event.id } }),
          tx.invitation.aggregate({
            _sum: { scannedCount: true },
            where: { eventId: event.id },
          }),
          tx.table.aggregate({
            _sum: { capacity: true },
            where: { eventId: event.id },
          }),
          tx.invitation.aggregate({
            _sum: { peopleCount: true },
            where: { eventId: event.id },
          }),
        ]);

      const totalScanned = scannedAgg._sum.scannedCount ?? 0;
      const totalCapacity = capacityAgg._sum.capacity ?? 0;
      const totalPeople = peopleAgg._sum.peopleCount ?? 0;

      const updatedStats = await tx.eventStats.upsert({
        where: { eventId: event.id },
        create: {
          eventId: event.id,
          totalInvitations,
          totalCapacity,
          totalScanned,
          totalPeople,
        },
        update: {
          totalInvitations,
          totalCapacity,
          totalScanned,
          totalPeople,
          updatedAt: new Date(),
        },
      });

      return updatedStats;
    });

    return NextResponse.json(stats);
  } catch (err) {
    console.error("Error recomputing stats:", err);
    return NextResponse.json(
      { error: "Error recomputing stats" },
      { status: 500 }
    );
  }
}

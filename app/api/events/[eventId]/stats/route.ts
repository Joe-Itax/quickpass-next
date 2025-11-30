// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { requireEventAccess } from "@/lib/auth-guards";

// export const dynamic = "force-dynamic";

// interface EventContext {
//   params: Promise<{
//     eventId: string;
//   }>;
// }

// export async function GET(req: NextRequest, context: EventContext) {
//   const params = await context.params;
//   const eventId = Number(params.eventId);

//   const user = await requireEventAccess(req, eventId);
//   if (user instanceof NextResponse) return user;

//   try {
//     const stats = await prisma.$transaction(async (tx) => {
//       const event = await tx.event.findUnique({
//         where: { id: eventId },
//         select: { id: true },
//       });

//       if (!event) {
//         throw new Error(`Event ${eventId} not found`);
//       }

//       // Calcul des stats
//       const [totalInvitations, scannedAgg, capacityAgg, peopleAgg] =
//         await Promise.all([
//           tx.invitation.count({ where: { eventId } }),
//           tx.invitation.aggregate({
//             _sum: { scannedCount: true },
//             where: { eventId },
//           }),
//           tx.table.aggregate({
//             _sum: { capacity: true },
//             where: { eventId },
//           }),
//           tx.invitation.aggregate({
//             _sum: { peopleCount: true },
//             where: { eventId },
//           }),
//         ]);

//       const totalScanned = scannedAgg._sum.scannedCount ?? 0;
//       const totalCapacity = capacityAgg._sum.capacity ?? 0;
//       const totalPeople = peopleAgg._sum.peopleCount ?? 0;

//       console.log(`📊 Stats computed for event ${eventId}:`, {
//         invitations: totalInvitations,
//         scanned: totalScanned,
//         capacity: totalCapacity,
//         people: totalPeople,
//       });

//       // Mise à jour atomique
//       return await tx.eventStats.upsert({
//         where: { eventId },
//         create: {
//           eventId,
//           totalInvitations,
//           totalCapacity,
//           totalScanned,
//           totalPeople,
//         },
//         update: {
//           totalInvitations,
//           totalCapacity,
//           totalScanned,
//           totalPeople,
//           updatedAt: new Date(),
//         },
//       });
//     });

//     return NextResponse.json(stats);
//   } catch (err) {
//     console.error("Error computing stats:", err);
//     return NextResponse.json(
//       {
//         error: "Error computing stats",
//         details: err instanceof Error ? err.message : String(err),
//       },
//       { status: 500 }
//     );
//   }
// }

// export async function POST(req: NextRequest, context: EventContext) {
//   const params = await context.params;
//   const eventId = Number(params.eventId);

//   const user = await requireEventAccess(req, eventId);
//   if (user instanceof NextResponse) return user;

//   try {
//     const stats = await prisma.$transaction(async (tx) => {
//       const [totalInvitations, scannedAgg, capacityAgg, peopleAgg] =
//         await Promise.all([
//           tx.invitation.count({ where: { eventId } }),
//           tx.invitation.aggregate({
//             _sum: { scannedCount: true },
//             where: { eventId },
//           }),
//           tx.table.aggregate({
//             _sum: { capacity: true },
//             where: { eventId },
//           }),
//           tx.invitation.aggregate({
//             _sum: { peopleCount: true },
//             where: { eventId },
//           }),
//         ]);

//       const totalScanned = scannedAgg._sum.scannedCount ?? 0;
//       const totalCapacity = capacityAgg._sum.capacity ?? 0;
//       const totalPeople = peopleAgg._sum.peopleCount ?? 0;

//       const updatedStats = await tx.eventStats.upsert({
//         where: { eventId },
//         create: {
//           eventId,
//           totalInvitations,
//           totalCapacity,
//           totalScanned,
//           totalPeople,
//         },
//         update: {
//           totalInvitations,
//           totalCapacity,
//           totalScanned,
//           totalPeople,
//           updatedAt: new Date(),
//         },
//       });

//       return updatedStats;
//     });

//     return NextResponse.json(stats);
//   } catch (err) {
//     console.error("Error recomputing stats:", err);
//     return NextResponse.json(
//       { error: "Error recomputing stats" },
//       { status: 500 }
//     );
//   }
// }
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEventAccess } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

interface EventContext {
  params: Promise<{
    eventId: string;
  }>;
}

export async function GET(req: NextRequest, context: EventContext) {
  const params = await context.params;
  const eventId = Number(params.eventId);

  const user = await requireEventAccess(req, eventId);
  if (user instanceof NextResponse) return user;

  try {
    const stats = await prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({
        where: { id: eventId },
        select: { id: true },
      });

      if (!event) {
        throw new Error(`Event ${eventId} not found`);
      }

      // Calcul des stats CORRECT
      const [
        totalInvitations,
        scannedAgg,
        capacityAgg,
        peopleAgg,
        allocationsAgg,
      ] = await Promise.all([
        tx.invitation.count({ where: { eventId } }),
        tx.invitation.aggregate({
          _sum: { scannedCount: true },
          where: { eventId },
        }),
        tx.table.aggregate({
          _sum: { capacity: true },
          where: { eventId },
        }),
        tx.invitation.aggregate({
          _sum: { peopleCount: true },
          where: { eventId },
        }),
        // Calcul des places déjà assignées
        tx.tableAllocation.aggregate({
          _sum: { seatsAssigned: true },
          where: { table: { eventId } },
        }),
      ]);

      const totalScanned = scannedAgg._sum.scannedCount ?? 0;
      const totalCapacity = capacityAgg._sum.capacity ?? 0;
      const totalPeople = peopleAgg._sum.peopleCount ?? 0;
      const totalAssignedSeats = allocationsAgg._sum.seatsAssigned ?? 0;
      const availableSeats = totalCapacity - totalAssignedSeats;

      console.log(`📊 Stats computed for event ${eventId}:`, {
        invitations: totalInvitations,
        scanned: totalScanned,
        capacity: totalCapacity,
        people: totalPeople,
        assignedSeats: totalAssignedSeats,
        availableSeats: availableSeats,
      });

      // Mise à jour atomique
      return await tx.eventStats.upsert({
        where: { eventId },
        create: {
          eventId,
          totalInvitations,
          totalCapacity,
          totalScanned,
          totalPeople,
          totalAssignedSeats,
          availableSeats,
        },
        update: {
          totalInvitations,
          totalCapacity,
          totalScanned,
          totalPeople,
          totalAssignedSeats,
          availableSeats,
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

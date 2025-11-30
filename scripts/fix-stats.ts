import { prisma } from "@/lib/prisma";

async function fixAllStats() {
  const events = await prisma.event.findMany({
    include: { stats: true },
  });

  for (const event of events) {
    console.log(`Fixing stats for event: ${event.name}`);

    const [
      totalInvitations,
      scannedAgg,
      capacityAgg,
      peopleAgg,
      allocationsAgg,
    ] = await Promise.all([
      prisma.invitation.count({ where: { eventId: event.id } }),
      prisma.invitation.aggregate({
        _sum: { scannedCount: true },
        where: { eventId: event.id },
      }),
      prisma.table.aggregate({
        _sum: { capacity: true },
        where: { eventId: event.id },
      }),
      prisma.invitation.aggregate({
        _sum: { peopleCount: true },
        where: { eventId: event.id },
      }),
      prisma.tableAllocation.aggregate({
        _sum: { seatsAssigned: true },
        where: { table: { eventId: event.id } },
      }),
    ]);

    const totalScanned = scannedAgg._sum.scannedCount ?? 0;
    const totalCapacity = capacityAgg._sum.capacity ?? 0;
    const totalPeople = peopleAgg._sum.peopleCount ?? 0;
    const totalAssignedSeats = allocationsAgg._sum.seatsAssigned ?? 0;
    const availableSeats = totalCapacity - totalAssignedSeats;

    await prisma.eventStats.upsert({
      where: { eventId: event.id },
      create: {
        eventId: event.id,
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

    console.log(`✅ Fixed stats for ${event.name}`);
  }
}

fixAllStats().catch(console.error);

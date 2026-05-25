import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEventAccess, requireAdmin } from "@/lib/auth-guards";
import { EventStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

interface EventContext {
  params: Promise<{
    eventId: string;
  }>;
}

export async function GET(req: NextRequest, context: EventContext) {
  const { eventId } = await context.params;
  const id = Number(eventId);
  if (Number.isNaN(id))
    return NextResponse.json({ error: "ID invalide" }, { status: 400 });

  const user = await requireEventAccess(req, id);
  if (user instanceof NextResponse) return user;

  const statusFilter =
    user.role === "ADMIN"
      ? {}
      : {
          status: { in: ["UPCOMING", "ONGOING", "FINISHED"] as EventStatus[] },
          deletedAt: null,
        };

  const event = await prisma.event.findFirst({
    where: { id, ...statusFilter },
    include: {
      tables: true,
      invitations: {
        include: {
          allocations: {
            include: {
              table: true,
            },
          },
        },
      },
      stats: true,
      assignments: { include: { user: true } },
      terminals: true,
      invitationTemplate: {
        select: {
          id: true,
          name: true,
          layoutData: true,
        },
      },
    },
  });

  if (!event)
    return NextResponse.json(
      { error: "Événement introuvable ou archivé" },
      { status: 404 },
    );
  const totalScanned = event.invitations.reduce(
    (sum, invitation) => sum + invitation.scannedCount,
    0,
  );

  const availableSeats = event.stats
    ? event.stats.totalCapacity - event.stats.totalAssignedSeats
    : undefined;

  const eventWithStats = {
    ...event,
    stats: {
      ...event.stats,
      totalScanned,
      availableSeats,
    },
  };

  return NextResponse.json(eventWithStats);
}

export async function PATCH(req: NextRequest, context: EventContext) {
  const { eventId } = await context.params;
  const id = Number(eventId);

  if (Number.isNaN(id))
    return NextResponse.json({ error: "ID invalide" }, { status: 400 });

  const user = await requireEventAccess(req, id);
  if (user instanceof NextResponse) return user;

  try {
    const body = await req.json();

    // Nettoyage strict du payload pour ne garder que les scalaires
    // On ignore explicitement les relations pour éviter les crashs Prisma
    const {
      id: _id,
      tables,
      invitations,
      stats,
      assignments,
      terminals,
      createdBy,
      createdById: _createdById,
      createdAt,
      updatedAt,
      ...cleanData
    } = body;

    // Conversion de date si elle est présente
    if (cleanData.date) {
      cleanData.date = new Date(cleanData.date);
    }

    const updated = await prisma.event.update({
      where: { id },
      data: {
        ...cleanData,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Update error:", err);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest, context: EventContext) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const { eventId } = await context.params;
  const id = Number(eventId);

  try {
    await prisma.event.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: "CANCELLED",
      },
    });

    return NextResponse.json({
      message: "Événement marqué pour suppression (archivage de 30 jours).",
    });
  } catch (err) {
    console.error("Delete error:", err);
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 },
    );
  }
}

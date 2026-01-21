import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEventAccess, requireAdmin } from "@/lib/auth-guards";
// import { slugify } from "@/utils/slugify";
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
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });

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
    },
  });
  if (!event)
    return NextResponse.json(
      { error: "Événement introuvable ou archivé" },
      { status: 404 },
    );
  return NextResponse.json(event);
}

export async function PATCH(req: NextRequest, context: EventContext) {
  const { eventId } = await context.params;
  const id = Number(eventId);

  if (Number.isNaN(id))
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const user = await requireEventAccess(req, id);
  if (user instanceof NextResponse) return user;

  try {
    const body = await req.json();

    // 1. NETTOYAGE DU PAYLOAD
    // On extrait uniquement les champs scalaires de l'Event pour éviter l'erreur Prisma
    // On ignore les relations comme 'tables', 'invitations', 'stats', 'terminals'
    const {
      id: _id,
      tables,
      invitations,
      stats,
      assignments,
      terminals,
      createdAt,
      updatedAt,
      ...cleanData
    } = body;

    const updatePayload = { ...cleanData };

    if (cleanData.name) {
      // updatePayload.eventCode = `${slugify(cleanData.name)}-${id}`;
    }

    const updated = await prisma.event.update({
      where: { id },
      data: updatePayload,
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Update error:", err);
    return NextResponse.json({ error: "Error updating" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: EventContext) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const { eventId } = await context.params;
  const id = Number(eventId);

  try {
    // LOGIQUE DE SOFT DELETE (30 JOURS)
    // Au lieu de supprimer les lignes dans la DB, on marque l'event comme supprimé.
    // Les terminaux, invitations etc. restent liés mais l'event n'apparaîtra plus.
    await prisma.event.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: "CANCELLED",
      },
    });

    return NextResponse.json({
      message:
        "Evénement marqué pour suppression. Il sera définitivement supprimer dans 30 jours.",
    });
  } catch (err) {
    console.error("Delete error:", err);
    return NextResponse.json(
      { error: "Error deleting event" },
      { status: 500 },
    );
  }
}

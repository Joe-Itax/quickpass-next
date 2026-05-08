import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrNull, requireAuth } from "@/lib/auth-guards";
import { slugify } from "@/utils/slugify";
import { EventStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getSessionOrNull(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = session.user;

  const statusFilter =
    user.role === "ADMIN"
      ? {}
      : {
          status: { in: ["UPCOMING", "ONGOING", "FINISHED"] as EventStatus[] },
          deletedAt: null,
        };

  const where =
    user.role === "ADMIN"
      ? {}
      : {
          OR: [
            { createdById: user.id },
            { assignments: { some: { userId: user.id } } },
          ],
          ...statusFilter,
        };

  const events = await prisma.event.findMany({
    where,
    orderBy: { date: "desc" },
    include: {
      tables: true,
      invitations: true,
      assignments: true,
      stats: true,
    },
  });

  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user || user instanceof NextResponse) return user;

  try {
    const body = await req.json();
    const {
      name,
      description,
      date,
      location,
      fullLocation,
      invitationMessage,
      durationHours,
    } = body;

    // Validation
    if (
      !name ||
      !description ||
      !date ||
      !location ||
      !fullLocation ||
      !invitationMessage
    ) {
      return NextResponse.json(
        {
          error:
            "Tous les champs, y compris l'adresse complète et le message d'invitation, sont requis.",
        },
        { status: 400 },
      );
    }

    const created = await prisma.$transaction(async (tx) => {
      const temp = await tx.event.create({
        data: {
          name,
          description,
          date: new Date(date),
          location,
          fullLocation,
          invitationMessage,
          durationHours: durationHours || 24,
          eventCode: "tmp",
          createdById: user.id,
        },
      });

      if (user.role !== "ADMIN") {
        await tx.eventAssignment.upsert({
          where: { userId_eventId: { userId: user.id, eventId: temp.id } },
          update: {},
          create: { userId: user.id, eventId: temp.id },
        });
      }

      const code = `${slugify(name)}-${temp.id}`;
      const updated = await tx.event.update({
        where: { id: temp.id },
        data: { eventCode: code },
      });

      await tx.eventStats.create({
        data: {
          eventId: temp.id,
          totalInvitations: 0,
          totalCapacity: 0,
          totalScanned: 0,
        },
      });
      return updated;
    });

    return NextResponse.json(created);
  } catch (err) {
    console.error("Create error:", err);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'événement" },
      { status: 500 },
    );
  }
}

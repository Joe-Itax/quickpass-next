import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

interface EventContext {
  params: Promise<{
    eventId: string;
  }>;
}

export async function GET(req: NextRequest, context: EventContext) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const params = await context.params;
  const eventId = Number(params.eventId);

  const { usersId } = await req.json();

  console.log("usersId: ", usersId);
  // usersId doit être un tableau d'IDs d'utilisateurs
  if (!Array.isArray(usersId)) {
    return NextResponse.json(
      { error: "usersId must be an array of user IDs" },
      { status: 400 }
    );
  }

  try {
    const assignments = await prisma.eventAssignment.findMany({
      where: { userId: { in: usersId }, eventId },
      select: {
        id: true,
        eventId: true,
        userId: true,
        assignedAt: true,
        event: {
          select: {
            id: true,
            name: true,
            eventCode: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(assignments);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Error fetching assignments" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, context: EventContext) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const params = await context.params;
  const eventId = Number(params.eventId);

  const { userId } = await req.json();
  if (!userId)
    return NextResponse.json({ error: "userId required" }, { status: 400 });

  try {
    const assignment = await prisma.eventAssignment.upsert({
      where: { userId_eventId: { userId: userId, eventId } },
      update: {},
      create: { userId: userId, eventId },
    });
    return NextResponse.json(assignment);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error assigning" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: EventContext) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const { userId } = await req.json();

  const params = await context.params;
  const eventId = Number(params.eventId);

  if (!userId)
    return NextResponse.json({ error: "userId required" }, { status: 400 });

  try {
    await prisma.eventAssignment.delete({
      where: { userId_eventId: { userId: userId, eventId } },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error unassigning" }, { status: 500 });
  }
}

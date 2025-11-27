import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

interface EventContext {
  params: Promise<{
    eventId: string;
  }>;
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

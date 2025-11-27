import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEventAccess, requireAdmin } from "@/lib/auth-guards";
import { slugify } from "@/utils/slugify";

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

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      tables: true,
      invitations: { include: { allocations: true } },
      stats: true,
      assignments: { include: { user: true } },
    },
  });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
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
    const data = await req.json();
    // if name changed, regenerate code
    const updatePayload = { ...data };
    if (data.name) {
      updatePayload.eventCode = `${slugify(data.name)}-${id}`;
    }
    const updated = await prisma.event.update({
      where: { id },
      data: updatePayload,
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Error updating", details: String(err) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, context: EventContext) {
  // only global ADMIN can delete
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const { eventId } = await context.params;
  const id = Number(eventId);
  if (Number.isNaN(id))
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    await prisma.$transaction(async (tx) => {
      await tx.tableAllocation.deleteMany({
        where: { table: { eventId: id } },
      });
      await tx.table.deleteMany({ where: { eventId: id } });
      await tx.invitation.deleteMany({ where: { eventId: id } });
      await tx.eventAssignment.deleteMany({ where: { eventId: id } });
      await tx.eventStats.deleteMany({ where: { eventId: id } });
      await tx.event.delete({ where: { id } });
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Error deleting event" },
      { status: 500 }
    );
  }
}

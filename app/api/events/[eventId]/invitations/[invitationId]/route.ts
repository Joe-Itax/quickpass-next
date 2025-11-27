import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEventAccess } from "@/lib/auth-guards";
import { qrEncode } from "@/lib/qr";

export const dynamic = "force-dynamic";

interface EventContext {
  params: Promise<{
    eventId: string;
    invitationId: string;
  }>;
}

export async function PATCH(req: NextRequest, context: EventContext) {
  const params = await context.params;
  const eventId = Number(params.eventId);
  const invitationId = Number(params.invitationId);

  const user = await requireEventAccess(req, eventId);
  if (user instanceof NextResponse) return user;

  try {
    const body = await req.json();
    const { label, peopleCount, allocations } = body;

    const updated = await prisma.$transaction(async (tx) => {
      const base: {
        label?: string;
        peopleCount?: number;
      } = {};
      if (label) base.label = label;
      if (typeof peopleCount === "number") base.peopleCount = peopleCount;

      await tx.invitation.update({ where: { id: invitationId }, data: base });

      // handle allocations: naive approach - delete existing and recreate
      if (Array.isArray(allocations)) {
        await tx.tableAllocation.deleteMany({
          where: { invitationId },
        });
        for (const a of allocations) {
          await tx.tableAllocation.create({
            data: {
              invitationId,
              tableId: a.tableId,
              seatsAssigned: a.seatsAssigned,
            },
          });
        }
      }

      // regenerate QR after update
      const payload = { invitationId, eventId };
      const qr = await qrEncode(payload);
      await tx.invitation.update({
        where: { id: invitationId },
        data: { qrCode: qr },
      });

      return tx.invitation.findUnique({
        where: { id: invitationId },
        include: { allocations: true },
      });
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Error updating invitation", details: String(err) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, context: EventContext) {
  const params = await context.params;
  const eventId = Number(params.eventId);
  const invitationId = Number(params.invitationId);
  const user = await requireEventAccess(req, eventId);
  if (user instanceof NextResponse) return user;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.tableAllocation.deleteMany({ where: { invitationId } });
      await tx.invitation.delete({ where: { id: invitationId } });
      await tx.eventStats.update({
        where: { eventId },
        data: { totalInvitations: { decrement: 1 } },
      });
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Error deleting invitation" },
      { status: 500 }
    );
  }
}

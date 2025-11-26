import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEventAccess } from "@/lib/auth-guards";
import { qrEncode } from "@/lib/qr";

export const dynamic = "force-dynamic";

interface EventContext {
  params: Promise<{
    eventId: number;
  }>;
}

export async function GET(req: NextRequest, context: EventContext) {
  const params = await context.params;
  const eventId = Number(params.eventId);
  const user = await requireEventAccess(req, eventId);
  if (user instanceof NextResponse) return user;

  const invites = await prisma.invitation.findMany({
    where: { eventId },
    include: { allocations: true },
  });
  return NextResponse.json(invites);
}

export async function POST(req: NextRequest, context: EventContext) {
  const params = await context.params;
  const eventId = Number(params.eventId);

  const user = await requireEventAccess(req, eventId);
  if (user instanceof NextResponse) return user;

  try {
    const { label, peopleCount, allocations } = await req.json();
    if (!label || typeof peopleCount !== "number")
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

    const result = await prisma.$transaction(async (tx) => {
      const inv = await tx.invitation.create({
        data: {
          label,
          peopleCount,
          eventId,
        },
      });

      // create allocations if any
      if (Array.isArray(allocations) && allocations.length > 0) {
        for (const a of allocations) {
          // a: { tableId, seatsAssigned }
          await tx.tableAllocation.create({
            data: {
              invitationId: inv.id,
              tableId: a.tableId,
              seatsAssigned: a.seatsAssigned,
            },
          });
        }
      }

      // update stats totalInvitations and totalPeople
      await tx.eventStats.update({
        where: { eventId },
        data: {
          totalInvitations: { increment: 1 },
          totalCapacity: { increment: peopleCount },
        },
      });

      // generate QR
      const payload = {
        invitationId: inv.id,
        eventId: inv.eventId,
        ts: Date.now(),
      };
      const qr = await qrEncode(payload);

      await tx.invitation.update({
        where: { id: inv.id },
        data: { qrCode: qr },
      });

      return tx.invitation.findUnique({
        where: { id: inv.id },
        include: { allocations: true },
      });
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Error creating invitation", details: String(err) },
      { status: 500 }
    );
  }
}

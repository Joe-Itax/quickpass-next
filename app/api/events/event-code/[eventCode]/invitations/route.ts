import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { qrEncode } from "@/lib/qr";

export const dynamic = "force-dynamic";

interface EventContext {
  params: Promise<{
    eventCode: string;
  }>;
}

export async function GET(req: NextRequest, context: EventContext) {
  const { eventCode } = await context.params;

  try {
    const invites = await prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({ where: { eventCode } });
      if (!event) {
        return NextResponse.json(
          {
            error: "L'event n'existe pas",
          },
          {
            status: 404,
          }
        );
      }

      const invitesS = await tx.invitation.findMany({
        where: { eventId: event.id },
        select: {
          allocations: {
            select: {
              id: true,
              invitationId: true,
              table: true,
              seatsAssigned: true,
            },
          },
          id: true,
          label: true,
          peopleCount: true,
          scannedCount: true,
          eventId: true,
          createdAt: true,
          updatedAt: true,
          userId: true,
        },
      });

      return invitesS;
    });
    // const invites = await prisma.invitation.findMany({
    //   where: { eventId },
    //   include: { allocations: true },
    // });
    return NextResponse.json(invites);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Error creating invitation", details: String(err) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, context: EventContext) {
  const { eventCode } = await context.params;
  // const eventId = Number(params.eventId);

  // const user = await requireEventAccess(req, eventId);
  // if (user instanceof NextResponse) return user;

  try {
    const { label, peopleCount, allocations } = await req.json();
    if (!label || typeof peopleCount !== "number")
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

    const result = await prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({ where: { eventCode } });
      if (!event) {
        return NextResponse.json(
          {
            error: "L'event n'existe pas",
          },
          {
            status: 404,
          }
        );
      }

      const inv = await tx.invitation.create({
        data: {
          label,
          peopleCount,
          eventId: event.id,
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
        where: { eventId: event.id },
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

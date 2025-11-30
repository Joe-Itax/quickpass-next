import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { qrDecode } from "@/lib/qr";

export const dynamic = "force-dynamic";

interface EventContext {
  params: Promise<{
    eventCode: string;
  }>;
}

export async function POST(req: NextRequest, context: EventContext) {
  const { eventCode } = await context.params;

  try {
    const { qr } = await req.json();
    if (!qr) return NextResponse.json({ error: "qr missing" }, { status: 400 });

    const eventToScan = await prisma.event.findUnique({
      where: { eventCode },
    });

    if (!eventToScan) {
      return NextResponse.json(
        {
          error: "L'event n'existe pas",
        },
        {
          status: 404,
        }
      );
    }

    const payload = await qrDecode(qr); // { invitationId, eventId, ts }
    if (typeof payload !== "object" || payload === null) {
      return NextResponse.json(
        { error: "Invalid QR payload" },
        { status: 400 }
      );
    }
    const { invitationId, eventId: payloadEventId } = payload as {
      invitationId?: number | string;
      eventId?: number | string;
      ts?: unknown;
    };

    if (Number(payloadEventId) !== eventToScan.id) {
      return NextResponse.json(
        { error: "QR belongs to another event" },
        { status: 400 }
      );
    }

    // transactionally increment scannedCount while checking capacity
    const res = await prisma.$transaction(async (tx) => {
      const inv = await tx.invitation.findUnique({
        where: { id: Number(invitationId) },
      });
      if (!inv) return { status: "not_found" };

      if (inv.scannedCount >= inv.peopleCount)
        return { status: "full", invitation: inv };

      const updated = await tx.invitation.update({
        where: { id: inv.id },
        data: { scannedCount: { increment: 1 } },
      });

      await tx.eventStats.update({
        where: { id: eventToScan.id },
        data: { totalScanned: { increment: 1 } },
      });
      return { status: "ok", invitation: updated };
    });

    if (res.status === "not_found")
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    if (res.status === "full")
      return NextResponse.json({ error: "Capacity reached" }, { status: 400 });

    return NextResponse.json(res.invitation);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Error scanning", details: String(err) },
      { status: 500 }
    );
  }
}

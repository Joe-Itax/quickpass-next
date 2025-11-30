import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { qrDecode } from "@/lib/qr";
import { requireEventAccess } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

interface EventContext {
  params: Promise<{
    eventId: string;
  }>;
}

export async function POST(req: NextRequest, context: EventContext) {
  const params = await context.params;
  const eventId = Number(params.eventId);

  const user = await requireEventAccess(req, eventId);
  // if (user instanceof NextResponse) return user;

  try {
    const { qr } = await req.json();
    if (!qr) return NextResponse.json({ error: "qr missing" }, { status: 400 });

    const payload = await qrDecode(qr); // { invitationId, eventId, ts }
    if (typeof payload !== "object" || payload === null) {
      return NextResponse.json({ error: "Invalid QR payload" }, { status: 400 });
    }
    const { invitationId, eventId: payloadEventId } = payload as {
      invitationId?: number | string;
      eventId?: number | string;
      ts?: unknown;
    };

    if (Number(payloadEventId) !== eventId) {
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
        where: { eventId },
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

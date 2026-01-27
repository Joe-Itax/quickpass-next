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

export async function GET(req: NextRequest, context: EventContext) {
  const params = await context.params;
  const eventId = Number(params.eventId);
  const invitationId = Number(params.invitationId);

  const user = await requireEventAccess(req, eventId);
  if (user instanceof NextResponse) return user;

  try {
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
      include: {
        allocations: {
          select: {
            table: {
              select: {
                name: true,
                capacity: true,
              },
            },
            seatsAssigned: true,
          },
        },
        event: {
          select: {
            eventCode: true,
          },
        },
      },
    });
    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(invitation);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Error fetching invitation", details: String(err) },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest, context: EventContext) {
  const params = await context.params;
  const eventId = Number(params.eventId);
  const invitationId = Number(params.invitationId);

  const user = await requireEventAccess(req, eventId);
  if (user instanceof NextResponse) return user;

  try {
    const body = await req.json();
    const { label, peopleCount, tableAssignments, whatsapp, email } = body;

    const updated = await prisma.$transaction(async (tx) => {
      // Récupérer l'invitation actuelle pour calculer les différences
      const currentInvitation = await tx.invitation.findUnique({
        where: { id: invitationId },
        include: { allocations: true },
      });

      if (!currentInvitation) {
        throw new Error("Invitation not found");
      }

      const base: {
        label?: string;
        peopleCount?: number;
        whatsapp?: string;
        email?: string;
      } = {};
      if (label) base.label = label;
      if (typeof peopleCount === "number") base.peopleCount = peopleCount;
      if (whatsapp !== undefined) base.whatsapp = whatsapp;
      if (email !== undefined) base.email = email;

      await tx.invitation.update({ where: { id: invitationId }, data: base });

      // Calculer les changements d'assignation
      let oldTotalSeats = 0;
      let newTotalSeats = 0;

      // Calculer les sièges actuels
      oldTotalSeats = currentInvitation.allocations.reduce(
        (sum, alloc) => sum + alloc.seatsAssigned,
        0,
      );

      // Supprimer les assignations existantes
      await tx.tableAllocation.deleteMany({
        where: { invitationId },
      });

      // Créer les nouvelles assignations
      if (Array.isArray(tableAssignments)) {
        for (const a of tableAssignments) {
          await tx.tableAllocation.create({
            data: {
              invitationId,
              tableId: a.tableId,
              seatsAssigned: a.seatsAssigned,
            },
          });
          newTotalSeats += a.seatsAssigned;
        }
      }

      // Mettre à jour les stats
      const peopleCountDiff =
        (peopleCount || currentInvitation.peopleCount) -
        currentInvitation.peopleCount;
      const seatsDiff = newTotalSeats - oldTotalSeats;

      await tx.eventStats.update({
        where: { eventId },
        data: {
          totalPeople: { increment: peopleCountDiff },
          totalAssignedSeats: { increment: seatsDiff },
          availableSeats: { decrement: seatsDiff },
        },
      });
// <AddTable eventId={eventId} />
      // regenerate QR after update
      const payload = { invitationId, eventId };
      const qr = await qrEncode(payload);
      await tx.invitation.update({
        where: { id: invitationId },
        data: { qrCode: qr },
      });

      return tx.invitation.findUnique({
        where: { id: invitationId },
        include: { allocations: { include: { table: true } } },
      });
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Error updating invitation", details: String(err) },
      { status: 500 },
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
      // Récupérer l'invitation avant suppression pour les stats
      const invitation = await tx.invitation.findUnique({
        where: { id: invitationId },
        include: { allocations: true },
      });

      if (!invitation) return;

      const totalSeats = invitation.allocations.reduce(
        (sum, alloc) => sum + alloc.seatsAssigned,
        0,
      );

      await tx.tableAllocation.deleteMany({ where: { invitationId } });
      await tx.invitation.delete({ where: { id: invitationId } });

      // Mettre à jour les stats
      await tx.eventStats.update({
        where: { eventId },
        data: {
          totalInvitations: { decrement: 1 },
          totalPeople: { decrement: invitation.peopleCount },
          totalAssignedSeats: { decrement: totalSeats },
          availableSeats: { increment: totalSeats },
        },
      });
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Error deleting invitation" },
      { status: 500 },
    );
  }
}

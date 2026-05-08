import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ qrCode: string }> },
) {
  try {
    const { qrCode } = await params;

    const invitation = await prisma.invitation.findUnique({
      where: { qrCode },
      select: {
        id: true,
        label: true,
        peopleCount: true,
        qrCode: true,
        event: {
          select: {
            name: true,
            date: true,
            location: true,
            fullLocation: true,
            invitationMessage: true,
          },
        },
        allocations: {
          select: {
            seatsAssigned: true,
            table: { select: { name: true } },
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation introuvable" },
        { status: 404 },
      );
    }

    return NextResponse.json(invitation);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

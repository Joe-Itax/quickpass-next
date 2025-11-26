import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/auth-guards";
import { slugify } from "@/utils/slugify";

export async function GET(req: NextRequest) {
  const userCheck = await requireAdmin(req);
  if (userCheck instanceof NextResponse) return userCheck;
  const session = await auth.api.getSession({ headers: req.headers });
  const user = session?.user;

  const where = {
    createdBy: {
      id: user?.id,
    },
  };

  const events = await prisma.event.findMany({
    orderBy: { date: "desc" },
    include: {
      tables: true,
      invitations: true,
      assignments: true,
      stats: true,
    },
    where: user?.role === "ADMIN" ? {} : where,
  });
  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  try {
    const body = await req.json();
    const { name, description, date, location } = body;
    if (!name || !description || !date || !location)
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const created = await prisma.$transaction(async (tx) => {
      const temp = await tx.event.create({
        data: {
          name,
          description,
          date: new Date(date),
          location,
          eventCode: "tmp",
          createdById: admin.id,
        },
      });
      const code = `${slugify(name)}-${temp.id}`;
      const updated = await tx.event.update({
        where: { id: temp.id },
        data: { eventCode: code },
      });
      // create stats row
      await tx.eventStats.create({
        data: {
          eventId: temp.id,
          totalInvitations: 0,
          totalCapacity: 0,
          totalScanned: 0,
        },
      });
      return updated;
    });

    return NextResponse.json(created);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Error creating event" },
      { status: 500 }
    );
  }
}

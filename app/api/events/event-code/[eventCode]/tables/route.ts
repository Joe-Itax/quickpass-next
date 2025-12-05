import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
// import { requireEventAccess } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

interface EventContext {
  params: Promise<{
    eventCode: string;
  }>;
}

export async function GET(req: NextRequest, context: EventContext) {
  const { eventCode } = await context.params;

  try {
    // const user = await requireEventAccess(req, eventId);
    // if (user instanceof NextResponse) return user;

    const tables = await prisma.table.findMany({
      where: { event: { eventCode } },
    });
    return NextResponse.json(tables);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error fetching tables" },
      { status: 500 }
    );
  }
}

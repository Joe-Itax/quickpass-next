import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function getSessionOrNull(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    return session ?? null;
  } catch {
    return null;
  }
}

export async function requireAuth(req: NextRequest) {
  const session = await getSessionOrNull(req);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // return console.log("requireAuth: no session");
  return session.user;
}

export async function requireAdmin(req: NextRequest) {
  const session = await getSessionOrNull(req);
  if (!session)
    return NextResponse.json(
      { error: "Unauthorized", message: "Veuillez vous authentifié !" },
      { status: 401 }
    );
  // return console.log("requireAdmin: no session");
  if (session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Forbidden", message: "Accès uniquement aux ADMIN !" },
      { status: 403 }
    );
  }
  return session.user;
}

/**
 * requireEventAccess: checks that user is ADMIN (global) or assigned to event
 * returns user or NextResponse JSON on error.
 */
export async function requireEventAccess(req: NextRequest, eventId: number) {
  const session = await getSessionOrNull(req);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // return console.log("requireEventAccess: no session");
  const user = session.user;
  if (user.role === "ADMIN") return user; // global admin ok

  const assign = await prisma.eventAssignment.findUnique({
    where: { userId_eventId: { userId: user.id, eventId } },
  });

  if (!assign)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return user;
}

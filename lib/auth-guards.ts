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
      { status: 401 },
    );
  // return console.log("requireAdmin: no session");
  if (session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Forbidden", message: "Accès uniquement aux ADMIN !" },
      { status: 403 },
    );
  }
  return session.user;
}

/**
 * requireEventAccess:
 * 1. Vérifie l'authentification.
 * 2. Vérifie que l'événement n'est pas supprimé/annulé (sauf pour l'ADMIN).
 * 3. Vérifie que l'utilisateur est ADMIN (global) ou assigné à l'événement.
 */
export async function requireEventAccess(req: NextRequest, eventId: number) {
  const session = await getSessionOrNull(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user;

  // 1. Récupérer l'événement pour vérifier son statut
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { status: true, deletedAt: true },
  });

  if (!event) {
    return NextResponse.json(
      { error: "Événement introuvable" },
      { status: 404 },
    );
  }

  // 2. Logique de blocage pour les événements CANCELLED ou Soft-Deleted
  // Si l'event est annulé ou supprimé, seul l'ADMIN global peut encore y accéder
  if (
    (event.status === "CANCELLED" || event.deletedAt !== null) &&
    user.role !== "ADMIN"
  ) {
    return NextResponse.json(
      {
        error: "Forbidden",
        message: "Cet événement a été annulé ou supprimé.",
      },
      { status: 403 },
    );
  }

  // 3. Vérification des permissions d'accès
  if (user.role === "ADMIN") return user; // L'admin global passe toujours (après check status)

  const assign = await prisma.eventAssignment.findUnique({
    where: { userId_eventId: { userId: user.id, eventId } },
  });

  if (!assign) {
    return NextResponse.json(
      {
        error: "Forbidden",
        message: "Vous n'avez pas la permission d'accéder à cet événement.",
      },
      { status: 403 },
    );
  }

  return user;
}

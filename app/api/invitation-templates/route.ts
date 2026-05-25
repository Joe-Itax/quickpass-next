import { NextRequest, NextResponse } from "next/server";
import { getSessionOrNull } from "@/lib/auth-guards";
import {
  getEventInvitationTemplateId,
  InvitationTemplateAccessError,
  listAccessibleInvitationTemplates,
} from "@/lib/invitation-template-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSessionOrNull(req);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const eventId = Number(req.nextUrl.searchParams.get("eventId"));
    const templates = await listAccessibleInvitationTemplates(session.user);
    const selectedTemplateId = Number.isInteger(eventId)
      ? await getEventInvitationTemplateId(eventId, session.user)
      : null;

    return NextResponse.json({ templates, selectedTemplateId });
  } catch (error) {
    if (error instanceof InvitationTemplateAccessError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    console.error("[INVITATION_TEMPLATES_GET]", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des modeles" },
      { status: 500 },
    );
  }
}

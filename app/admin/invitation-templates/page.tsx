import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listAccessibleInvitationTemplates } from "@/lib/invitation-template-service";
import { TemplateLibraryClient } from "./template-library-client";

type TemplatesPageProps = {
  searchParams: Promise<{
    eventId?: string;
  }>;
};

export default async function InvitationTemplatesPage({
  searchParams,
}: TemplatesPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/login");

  const { eventId: rawEventId } = await searchParams;
  const eventId = rawEventId ? Number(rawEventId) : undefined;
  const templates = await listAccessibleInvitationTemplates(session.user);

  return (
    <TemplateLibraryClient
      templates={templates}
      currentUserId={session.user.id}
      userRole={session.user.role}
      eventId={Number.isInteger(eventId) ? eventId : undefined}
    />
  );
}

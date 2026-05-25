import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  getEditableInvitationTemplate,
  InvitationTemplateAccessError,
} from "@/lib/invitation-template-service";
import { TemplateEditor } from "./template-editor";

type TemplateEditPageProps = {
  params: Promise<{
    templateId: string;
  }>;
};

export default async function TemplateEditPage({
  params,
}: TemplateEditPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/login");

  const { templateId: rawTemplateId } = await params;
  const templateId = Number(rawTemplateId);

  if (!Number.isInteger(templateId)) notFound();

  let template;

  try {
    template = await getEditableInvitationTemplate(templateId, session.user);
  } catch (error) {
    if (
      error instanceof InvitationTemplateAccessError &&
      error.status === 404
    ) {
      notFound();
    }

    redirect("/admin/invitation-templates");
  }

  return <TemplateEditor template={template} />;
}

"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import {
  cloneInvitationTemplateForUser,
  createBlankInvitationTemplate,
  deleteInvitationTemplate,
  InvitationTemplateAccessError,
  saveInvitationTemplate,
  setEventInvitationTemplate,
} from "@/lib/invitation-template-service";
import type { InvitationTemplateSaveInput } from "@/types/invitation-template";

type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status: number };

export async function createBlankInvitationTemplateAction(): Promise<
  ActionResult<{ id: number }>
> {
  try {
    const user = await getActionUser();
    const template = await createBlankInvitationTemplate(user);
    revalidateTemplatePaths();
    return { ok: true, data: { id: template.id } };
  } catch (error) {
    return actionError(error);
  }
}

export async function cloneInvitationTemplateAction(
  templateId: number,
): Promise<ActionResult<{ id: number }>> {
  try {
    const user = await getActionUser();
    const template = await cloneInvitationTemplateForUser(templateId, user);
    revalidateTemplatePaths();
    return { ok: true, data: { id: template.id } };
  } catch (error) {
    return actionError(error);
  }
}

export async function saveInvitationTemplateAction(
  templateId: number,
  input: InvitationTemplateSaveInput,
): Promise<ActionResult<{ id: number }>> {
  try {
    const user = await getActionUser();
    const template = await saveInvitationTemplate(templateId, user, input);
    revalidateTemplatePaths();
    return { ok: true, data: { id: template.id } };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteInvitationTemplateAction(
  templateId: number,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const user = await getActionUser();
    await deleteInvitationTemplate(templateId, user);
    revalidateTemplatePaths();
    return { ok: true, data: { success: true } };
  } catch (error) {
    return actionError(error);
  }
}

export async function installEventInvitationTemplateAction(
  eventId: number,
  templateId: number | null,
): Promise<ActionResult<{ eventId: number; templateId: number | null }>> {
  try {
    const user = await getActionUser();
    const event = await setEventInvitationTemplate(eventId, templateId, user);

    revalidatePath(`/admin/events/${eventId}`);
    revalidatePath("/admin/invitation-templates");

    return {
      ok: true,
      data: { eventId: event.id, templateId: event.invitationTemplateId },
    };
  } catch (error) {
    return actionError(error);
  }
}

async function getActionUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new InvitationTemplateAccessError("Session expiree.", 401);
  }

  return session.user;
}

function revalidateTemplatePaths() {
  revalidatePath("/admin/invitation-templates");
}

function actionError(error: unknown): ActionResult<never> {
  if (error instanceof InvitationTemplateAccessError) {
    return { ok: false, error: error.message, status: error.status };
  }

  console.error("[INVITATION_TEMPLATE_ACTION]", error);
  return {
    ok: false,
    error: "Une erreur est survenue pendant l'operation.",
    status: 500,
  };
}

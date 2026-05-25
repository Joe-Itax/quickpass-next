import { Prisma } from "@prisma/client";

const EVENT_SCALAR_FIELDS = [
  "name",
  "description",
  "durationHours",
  "location",
  "fullLocation",
  "invitationMessage",
  "eventCode",
  "status",
  "deletedAt",
] as const;

export function buildEventUpdateData(
  payload: Record<string, unknown>,
): Prisma.EventUpdateInput {
  const data: Prisma.EventUpdateInput = {};

  for (const field of EVENT_SCALAR_FIELDS) {
    if (field in payload) {
      (data as Record<string, unknown>)[field] = payload[field];
    }
  }

  if ("date" in payload && payload.date) {
    data.date = new Date(String(payload.date));
  }

  if ("invitationTemplateId" in payload) {
    const templateId = payload.invitationTemplateId;

    if (templateId !== undefined) {
      const templateIdNumber = Number(templateId);

      if (templateId === null || templateId === "") {
        data.invitationTemplate = { disconnect: true };
      } else if (Number.isFinite(templateIdNumber)) {
        data.invitationTemplate = { connect: { id: templateIdNumber } };
      }
    }
  }

  return data;
}

import { Prisma, TemplateCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  createEmptyInvitationLayout,
  normalizeInvitationLayout,
} from "@/lib/invitation-template-layout";
import { SYSTEM_INVITATION_TEMPLATES } from "@/lib/invitation-template-presets";
import type {
  InvitationTemplateSaveInput,
  InvitationTemplateSummary,
} from "@/types/invitation-template";

type TemplateUser = {
  id: string;
  role?: string | null;
};

export class InvitationTemplateAccessError extends Error {
  constructor(
    message: string,
    public readonly status = 403,
  ) {
    super(message);
    this.name = "InvitationTemplateAccessError";
  }
}

export async function ensureSystemInvitationTemplates() {
  await Promise.all(
    SYSTEM_INVITATION_TEMPLATES.map((template) =>
      prisma.template.upsert({
        where: { slug: template.slug },
        update: {
          name: template.name,
          category: template.category,
          layoutData: template.layoutData as unknown as Prisma.InputJsonValue,
          userId: null,
          isPublic: true,
        },
        create: {
          slug: template.slug,
          name: template.name,
          category: template.category,
          layoutData: template.layoutData as unknown as Prisma.InputJsonValue,
          userId: null,
          isPublic: true,
        },
      }),
    ),
  );
}

export async function listAccessibleInvitationTemplates(user: TemplateUser) {
  await ensureSystemInvitationTemplates();

  const templates = await prisma.template.findMany({
    where: {
      OR: [{ userId: user.id }, { userId: null }, { isPublic: true }],
    },
    orderBy: [{ userId: "desc" }, { category: "asc" }, { updatedAt: "desc" }],
  });

  return templates.map(serializeTemplate);
}

export async function getEditableInvitationTemplate(
  templateId: number,
  user: TemplateUser,
) {
  const template = await prisma.template.findUnique({
    where: { id: templateId },
  });

  if (!template) {
    throw new InvitationTemplateAccessError("Modele introuvable.", 404);
  }

  if (template.userId !== user.id) {
    throw new InvitationTemplateAccessError(
      "Copiez ce modele public avant de le modifier.",
      403,
    );
  }

  return serializeTemplate(template);
}

export async function createBlankInvitationTemplate(user: TemplateUser) {
  const template = await prisma.template.create({
    data: {
      name: "Modele sans titre",
      category: TemplateCategory.STANDARD,
      userId: user.id,
      layoutData: createEmptyInvitationLayout() as unknown as Prisma.InputJsonValue,
    },
  });

  return serializeTemplate(template);
}

export async function cloneInvitationTemplateForUser(
  templateId: number,
  user: TemplateUser,
) {
  const source = await prisma.template.findUnique({
    where: { id: templateId },
  });

  if (!source) {
    throw new InvitationTemplateAccessError("Modele introuvable.", 404);
  }

  if (source.userId && source.userId !== user.id && !source.isPublic) {
    throw new InvitationTemplateAccessError(
      "Ce modele appartient a un autre utilisateur.",
      403,
    );
  }

  if (source.userId === user.id) return serializeTemplate(source);

  const copy = await prisma.template.create({
    data: {
      name: `${source.name} - copie`,
      category: source.category,
      userId: user.id,
      layoutData: normalizeInvitationLayout(
        source.layoutData,
      ) as unknown as Prisma.InputJsonValue,
      thumbnailUrl: source.thumbnailUrl,
    },
  });

  return serializeTemplate(copy);
}

export async function saveInvitationTemplate(
  templateId: number,
  user: TemplateUser,
  input: InvitationTemplateSaveInput,
) {
  const existing = await prisma.template.findUnique({
    where: { id: templateId },
    select: { userId: true },
  });

  if (!existing) {
    throw new InvitationTemplateAccessError("Modele introuvable.", 404);
  }

  if (existing.userId !== user.id) {
    throw new InvitationTemplateAccessError(
      "Vous ne pouvez modifier que vos propres modeles.",
      403,
    );
  }

  const updated = await prisma.template.update({
    where: { id: templateId },
    data: {
      name: sanitizeTemplateName(input.name),
      category: input.category,
      isPublic: input.isPublic,
      layoutData: normalizeInvitationLayout(
        input.layoutData,
      ) as unknown as Prisma.InputJsonValue,
    },
  });

  return serializeTemplate(updated);
}

export async function deleteInvitationTemplate(
  templateId: number,
  user: TemplateUser,
) {
  const existing = await prisma.template.findUnique({
    where: { id: templateId },
    select: { userId: true, isPublic: true, layoutData: true },
  });

  if (!existing) {
    throw new InvitationTemplateAccessError("Modele introuvable.", 404);
  }

  const isOwner = existing.userId === user.id;
  const isAdmin = user.role === "ADMIN";
  const isPublicTemplate = existing.userId === null || existing.isPublic;

  // Owner can delete own templates, Admin can delete any public template
  if (!isOwner && !(isAdmin && isPublicTemplate)) {
    throw new InvitationTemplateAccessError(
      "Vous ne pouvez supprimer que vos propres modeles.",
      403,
    );
  }

  // Clean up Vercel Blob images from the layout
  await cleanupTemplateBlobImages(existing.layoutData);

  await prisma.template.delete({
    where: { id: templateId },
  });
}

/**
 * Extract all Vercel Blob URLs from a template layout and delete them.
 */
async function cleanupTemplateBlobImages(layoutData: unknown) {
  try {
    const { del } = await import("@vercel/blob");
    const layout = layoutData as Record<string, unknown> | null;
    if (!layout) return;

    const urls: string[] = [];

    // Check canvas background image
    const canvas = layout.canvas as Record<string, unknown> | undefined;
    if (
      canvas?.backgroundImageUrl &&
      typeof canvas.backgroundImageUrl === "string" &&
      canvas.backgroundImageUrl.includes("vercel-storage.com")
    ) {
      urls.push(canvas.backgroundImageUrl);
    }

    // Check all image elements
    const elements = layout.elements as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(elements)) {
      for (const el of elements) {
        if (
          el.type === "image" &&
          typeof el.src === "string" &&
          el.src.includes("vercel-storage.com")
        ) {
          urls.push(el.src);
        }
      }
    }

    if (urls.length > 0) {
      await del(urls);
    }
  } catch (error) {
    console.error("[BLOB_CLEANUP_ERROR]", error);
    // Don't block deletion if blob cleanup fails
  }
}

export async function setEventInvitationTemplate(
  eventId: number,
  templateId: number | null,
  user: TemplateUser,
) {
  await assertEventAccess(user, eventId);

  if (templateId !== null) {
    await assertTemplateAccess(user, templateId);
  }

  return prisma.event.update({
    where: { id: eventId },
    data: { invitationTemplateId: templateId },
    select: { id: true, invitationTemplateId: true },
  });
}

export async function getEventInvitationTemplateId(
  eventId: number,
  user: TemplateUser,
) {
  await assertEventAccess(user, eventId);

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { invitationTemplateId: true },
  });

  return event?.invitationTemplateId ?? null;
}

function serializeTemplate(template: {
  id: number;
  name: string;
  slug: string | null;
  category: TemplateCategory;
  layoutData: Prisma.JsonValue;
  thumbnailUrl: string | null;
  userId: string | null;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}): InvitationTemplateSummary {
  return {
    id: template.id,
    name: template.name,
    slug: template.slug,
    category: template.category,
    layoutData: normalizeInvitationLayout(template.layoutData),
    thumbnailUrl: template.thumbnailUrl,
    userId: template.userId,
    isPublic: template.userId === null || template.isPublic,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
  };
}

async function assertTemplateAccess(user: TemplateUser, templateId: number) {
  const template = await prisma.template.findUnique({
    where: { id: templateId },
    select: { userId: true, isPublic: true },
  });

  if (!template) {
    throw new InvitationTemplateAccessError("Modele introuvable.", 404);
  }

  if (
    template.userId !== null &&
    template.userId !== user.id &&
    !template.isPublic
  ) {
    throw new InvitationTemplateAccessError(
      "Ce modele n'est pas disponible pour votre compte.",
      403,
    );
  }
}

async function assertEventAccess(user: TemplateUser, eventId: number) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      createdById: true,
      status: true,
      deletedAt: true,
      assignments: { where: { userId: user.id }, select: { id: true } },
    },
  });

  if (!event) {
    throw new InvitationTemplateAccessError("Evenement introuvable.", 404);
  }

  if (
    (event.status === "CANCELLED" || event.deletedAt !== null) &&
    user.role !== "ADMIN"
  ) {
    throw new InvitationTemplateAccessError(
      "Cet evenement a ete annule ou archive.",
      403,
    );
  }

  if (
    user.role !== "ADMIN" &&
    event.createdById !== user.id &&
    event.assignments.length === 0
  ) {
    throw new InvitationTemplateAccessError(
      "Vous n'avez pas acces a cet evenement.",
      403,
    );
  }
}

function sanitizeTemplateName(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.slice(0, 80) : "Modele sans titre";
}

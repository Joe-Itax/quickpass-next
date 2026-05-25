import type { TemplateCategory } from "@prisma/client";

export type InvitationTemplateElementType = "text" | "variable" | "image" | "qrcode";
export type InvitationTextAlign = "left" | "center" | "right";
export type InvitationObjectFit = "cover" | "contain" | "fill";
export type InvitationFontFamily = string;

export type InvitationTemplateCanvas = {
  width: number;
  height: number;
  backgroundColor: string;
  backgroundImageUrl?: string;
  borderRadius: number;
  borderWidth?: number;
  borderColor?: string;
};

export type InvitationTemplateElementBase = {
  id: string;
  type: InvitationTemplateElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  opacity: number;
};

export type InvitationTemplateTextStyle = {
  fontFamily: InvitationFontFamily;
  fontSize: number;
  color: string;
  fontWeight: number;
  textAlign: InvitationTextAlign;
  lineHeight: number;
  letterSpacing: number;
};

export type InvitationTemplateTextElement = InvitationTemplateElementBase & {
  type: "text" | "variable";
  content: string;
  style: InvitationTemplateTextStyle;
};

export type InvitationTemplateImageElement = InvitationTemplateElementBase & {
  type: "image";
  src: string;
  alt?: string;
  objectFit: InvitationObjectFit;
};

export type InvitationTemplateQRCodeElement = InvitationTemplateElementBase & {
  type: "qrcode";
  fgColor: string;
  bgColor: string;
};

export type InvitationTemplateElement =
  | InvitationTemplateTextElement
  | InvitationTemplateImageElement
  | InvitationTemplateQRCodeElement;

export type InvitationTemplateLayout = {
  version: 1;
  canvas: InvitationTemplateCanvas;
  elements: InvitationTemplateElement[];
};

export type InvitationGuestData = {
  name: string;
  table?: string | null;
  peopleCount?: number;
  email?: string | null;
  whatsapp?: string | null;
  seatsAssigned?: number;
  qrCodeData?: string;
};

export type InvitationTemplateSummary = {
  id: number;
  name: string;
  slug: string | null;
  category: TemplateCategory;
  layoutData: InvitationTemplateLayout;
  thumbnailUrl: string | null;
  userId: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
};

export type InvitationTemplateSaveInput = {
  name: string;
  category: TemplateCategory;
  layoutData: InvitationTemplateLayout;
  isPublic: boolean;
};

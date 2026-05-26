import type { TemplateCategory } from "@prisma/client";

export type InvitationTemplateElementType =
  | "text"
  | "variable"
  | "image"
  | "qrcode"
  | "shape"
  | "link";
export type InvitationTextAlign = "left" | "center" | "right";
export type InvitationFontStyle = "normal" | "italic";
export type InvitationTextDecoration = "none" | "underline";
export type InvitationTextTransform =
  | "none"
  | "uppercase"
  | "lowercase"
  | "sentence"
  | "capitalize";
export type InvitationObjectFit = "cover" | "contain" | "fill";
export type InvitationFontFamily = string;
export type InvitationQRCodeErrorCorrection = "L" | "M" | "Q" | "H";
export type InvitationShapeFillType = "solid" | "gradient";

export type InvitationTemplateShadow = {
  enabled: boolean;
  x: number;
  y: number;
  blur: number;
  color: string;
  opacity: number;
};

export type InvitationImageFilters = {
  brightness: number;
  contrast: number;
  grayscale: number;
};

export type InvitationTemplateCanvas = {
  width: number;
  height: number;
  backgroundColor: string;
  backgroundImageUrl?: string;
  backgroundImageX?: number;
  backgroundImageY?: number;
  backgroundImageScale?: number;
  backgroundImageBrightness?: number;
  backgroundImageContrast?: number;
  backgroundImageGrayscale?: number;
  backgroundImageLocked?: boolean;
  showSafeZone?: boolean;
  safeZoneInset?: number;
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
  locked?: boolean;
  shadow?: InvitationTemplateShadow;
};

export type InvitationTemplateTextStyle = {
  fontFamily: InvitationFontFamily;
  fontSize: number;
  color: string;
  fontWeight: number;
  fontStyle?: InvitationFontStyle;
  textDecoration?: InvitationTextDecoration;
  textTransform?: InvitationTextTransform;
  textAlign: InvitationTextAlign;
  lineHeight: number;
  letterSpacing: number;
  gradientEnabled?: boolean;
  gradientFrom?: string;
  gradientTo?: string;
  gradientAngle?: number;
};

export type InvitationTemplateTextElement = InvitationTemplateElementBase & {
  type: "text" | "variable";
  content: string;
  richContent?: string;
  style: InvitationTemplateTextStyle;
};

export type InvitationTemplateLinkElement = InvitationTemplateElementBase & {
  type: "link";
  content: string;
  richContent?: string;
  href: string;
  style: InvitationTemplateTextStyle;
};

export type InvitationTemplateImageElement = InvitationTemplateElementBase & {
  type: "image";
  src: string;
  alt?: string;
  objectFit: InvitationObjectFit;
  filters?: InvitationImageFilters;
};

export type InvitationTemplateQRCodeElement = InvitationTemplateElementBase & {
  type: "qrcode";
  fgColor: string;
  bgColor: string;
  eccLevel: InvitationQRCodeErrorCorrection;
  showLogo: boolean;
};

export type InvitationTemplateShapeElement = InvitationTemplateElementBase & {
  type: "shape";
  fillType: InvitationShapeFillType;
  fillColor: string;
  gradientFrom: string;
  gradientTo: string;
  gradientAngle: number;
  borderRadius: number;
};

export type InvitationTemplateElement =
  | InvitationTemplateTextElement
  | InvitationTemplateLinkElement
  | InvitationTemplateImageElement
  | InvitationTemplateQRCodeElement
  | InvitationTemplateShapeElement;

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

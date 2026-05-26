import type {
  InvitationFontFamily,
  InvitationFontStyle,
  InvitationImageFilters,
  InvitationGuestData,
  InvitationObjectFit,
  InvitationQRCodeErrorCorrection,
  InvitationShapeFillType,
  InvitationTemplateElement,
  InvitationTemplateImageElement,
  InvitationTemplateLinkElement,
  InvitationTemplateQRCodeElement,
  InvitationTemplateLayout,
  InvitationTemplateShadow,
  InvitationTemplateShapeElement,
  InvitationTemplateTextElement,
  InvitationTextAlign,
  InvitationTextDecoration,
  InvitationTextTransform,
} from "@/types/invitation-template";

export const INVITATION_TEMPLATE_FONTS: InvitationFontFamily[] = [
  "Inter",
  "Courgette",
  "Great Vibes",
  "Georgia",
  "Arial",
  "Playfair Display",
  "Montserrat",
  "Lora",
  "Dancing Script",
  "Pacifico",
  "Cinzel",
  "Alex Brush",
  "Pinyon Script",
  "Lato",
  "Roboto",
  "Open Sans",
  "Poppins",
  "Oswald",
  "Raleway",
  "Sacramento",
  "Parisienne",
  "Satisfy",
  "Allura",
  "Cormorant Garamond",
  "Josefin Sans",
];

export const INVITATION_TEMPLATE_FONT_LABELS: Record<string, string> = {
  Inter: "Inter",
  Courgette: "Courgette",
  "Great Vibes": "Great Vibes",
  Georgia: "Georgia",
  Arial: "Arial",
  "Playfair Display": "Playfair Display",
  Montserrat: "Montserrat",
  Lora: "Lora",
  "Dancing Script": "Dancing Script",
  Pacifico: "Pacifico",
  Cinzel: "Cinzel",
  "Alex Brush": "Alex Brush",
  "Pinyon Script": "Pinyon Script",
  Lato: "Lato",
  Roboto: "Roboto",
  "Open Sans": "Open Sans",
  Poppins: "Poppins",
  Oswald: "Oswald",
  Raleway: "Raleway",
  Sacramento: "Sacramento",
  Parisienne: "Parisienne",
  Satisfy: "Satisfy",
  Allura: "Allura",
  "Cormorant Garamond": "Cormorant Garamond",
  "Josefin Sans": "Josefin Sans",
};

export const INVITATION_TEMPLATE_CATEGORY_LABELS = {
  WEDDING: "Mariage",
  DEFENSE: "Soutenance",
  GALA: "Gala",
  STANDARD: "Standard",
} as const;

export const INVITATION_TEMPLATE_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_INVITATION_BUCKET ||
  process.env.BLOB_READ_WRITE_TOKEN ||
  "YambiPass" ||
  "invitation-assets";

const HEX_COLOR_RE = /^#[0-9a-f]{6}$/i;
const DEFAULT_SHADOW: InvitationTemplateShadow = {
  enabled: false,
  x: 0,
  y: 4,
  blur: 12,
  color: "#000000",
  opacity: 0.35,
};
const DEFAULT_IMAGE_FILTERS: InvitationImageFilters = {
  brightness: 100,
  contrast: 100,
  grayscale: 0,
};

export function createEmptyInvitationLayout(): InvitationTemplateLayout {
  return {
    version: 1,
    canvas: {
      width: 4,
      height: 5,
      backgroundColor: "#111827",
      borderRadius: 28,
    },
    elements: [],
  };
}

export function createTextElement(
  options: Partial<InvitationTemplateTextElement> & {
    content: string;
    fontFamily?: InvitationFontFamily;
    fontSize?: number;
    color?: string;
    fontWeight?: number;
    fontStyle?: InvitationFontStyle;
    textDecoration?: InvitationTextDecoration;
    textAlign?: InvitationTextAlign;
  },
): InvitationTemplateTextElement {
  return {
    id: options.id || createElementId(),
    type: options.type === "variable" ? "variable" : "text",
    content: options.content,
    richContent: options.richContent,
    x: clampPosition(options.x ?? 16),
    y: clampPosition(options.y ?? 18),
    width: clampSize(options.width ?? 68),
    height: clampSize(options.height ?? 10),
    rotation: clampNumber(options.rotation ?? 0, -360, 360),
    zIndex: clampNumber(options.zIndex ?? 1, 0, 999),
    opacity: clampNumber(options.opacity ?? 1, 0, 1),
    locked: Boolean(options.locked),
    shadow: sanitizeShadow(options.shadow),
    style: {
      fontFamily: sanitizeFont(options.fontFamily),
      fontSize: clampNumber(options.fontSize ?? 4, 1, 18),
      color: sanitizeColor(options.color, "#111827"),
      fontWeight: clampNumber(options.fontWeight ?? 700, 100, 900),
      fontStyle: sanitizeFontStyle(options.fontStyle ?? options.style?.fontStyle),
      textDecoration: sanitizeTextDecoration(
        options.textDecoration ?? options.style?.textDecoration,
      ),
      textTransform: sanitizeTextTransform(options.style?.textTransform),
      textAlign: sanitizeTextAlign(options.textAlign),
      lineHeight: clampNumber(options.style?.lineHeight ?? 1.1, 0.7, 2),
      letterSpacing: clampNumber(options.style?.letterSpacing ?? 0, -0.05, 0.3),
      gradientEnabled: Boolean(options.style?.gradientEnabled),
      gradientFrom: sanitizeColor(options.style?.gradientFrom, "#F59E0B"),
      gradientTo: sanitizeColor(options.style?.gradientTo, "#FFFFFF"),
      gradientAngle: clampNumber(Number(options.style?.gradientAngle) || 90, 0, 360),
    },
  };
}

export function createLinkElement(
  options: Partial<InvitationTemplateLinkElement> & {
    content?: string;
    href?: string;
    fontFamily?: InvitationFontFamily;
    fontSize?: number;
    color?: string;
    fontWeight?: number;
    fontStyle?: InvitationFontStyle;
    textDecoration?: InvitationTextDecoration;
    textAlign?: InvitationTextAlign;
  } = {},
): InvitationTemplateLinkElement {
  return {
    id: options.id || createElementId(),
    type: "link",
    content: options.content ?? "Votre lien",
    richContent: options.richContent,
    href: sanitizeHref(options.href),
    x: clampPosition(options.x ?? 16),
    y: clampPosition(options.y ?? 18),
    width: clampSize(options.width ?? 60),
    height: clampSize(options.height ?? 10),
    rotation: clampNumber(options.rotation ?? 0, -360, 360),
    zIndex: clampNumber(options.zIndex ?? 1, 0, 999),
    opacity: clampNumber(options.opacity ?? 1, 0, 1),
    locked: Boolean(options.locked),
    shadow: sanitizeShadow(options.shadow),
    style: {
      fontFamily: sanitizeFont(options.fontFamily ?? options.style?.fontFamily),
      fontSize: clampNumber(options.fontSize ?? options.style?.fontSize ?? 4, 1, 18),
      color: sanitizeColor(options.color ?? options.style?.color, "#FFFFFF"),
      fontWeight: clampNumber(
        options.fontWeight ?? options.style?.fontWeight ?? 700,
        100,
        900,
      ),
      fontStyle: sanitizeFontStyle(options.fontStyle ?? options.style?.fontStyle),
      textDecoration: sanitizeTextDecoration(
        options.textDecoration ?? options.style?.textDecoration ?? "underline",
      ),
      textTransform: sanitizeTextTransform(options.style?.textTransform),
      textAlign: sanitizeTextAlign(options.textAlign ?? options.style?.textAlign),
      lineHeight: clampNumber(options.style?.lineHeight ?? 1.1, 0.7, 2),
      letterSpacing: clampNumber(options.style?.letterSpacing ?? 0, -0.05, 0.3),
      gradientEnabled: Boolean(options.style?.gradientEnabled),
      gradientFrom: sanitizeColor(options.style?.gradientFrom, "#F59E0B"),
      gradientTo: sanitizeColor(options.style?.gradientTo, "#FFFFFF"),
      gradientAngle: clampNumber(Number(options.style?.gradientAngle) || 90, 0, 360),
    },
  };
}

export function createImageElement(
  src: string,
  options: Partial<InvitationTemplateImageElement> = {},
): InvitationTemplateImageElement {
  return {
    id: options.id || createElementId(),
    type: "image",
    src,
    alt: options.alt || "Image invitation",
    x: clampPosition(options.x ?? 16),
    y: clampPosition(options.y ?? 22),
    width: clampSize(options.width ?? 68),
    height: clampSize(options.height ?? 28),
    rotation: clampNumber(options.rotation ?? 0, -360, 360),
    zIndex: clampNumber(options.zIndex ?? 1, 0, 999),
    opacity: clampNumber(options.opacity ?? 1, 0, 1),
    locked: Boolean(options.locked),
    shadow: sanitizeShadow(options.shadow),
    objectFit: sanitizeObjectFit(options.objectFit),
    filters: sanitizeImageFilters(options.filters),
  };
}

export function createQRCodeElement(
  options: Partial<InvitationTemplateQRCodeElement> = {},
): InvitationTemplateQRCodeElement {
  return {
    id: options.id || createElementId(),
    type: "qrcode",
    x: clampPosition(options.x ?? 30),
    y: clampPosition(options.y ?? 40),
    width: clampSize(options.width ?? 40),
    height: clampSize(options.height ?? 40),
    rotation: clampNumber(options.rotation ?? 0, -360, 360),
    zIndex: clampNumber(options.zIndex ?? 1, 0, 999),
    opacity: clampNumber(options.opacity ?? 1, 0, 1),
    locked: Boolean(options.locked),
    shadow: sanitizeShadow(options.shadow),
    fgColor: sanitizeColor(options.fgColor, "#000000"),
    bgColor: sanitizeColor(options.bgColor, "#ffffff"),
    eccLevel: sanitizeQRCodeErrorCorrection(options.eccLevel),
    showLogo: options.showLogo !== false,
  };
}

export function createShapeElement(
  options: Partial<InvitationTemplateShapeElement> = {},
): InvitationTemplateShapeElement {
  return {
    id: options.id || createElementId(),
    type: "shape",
    x: clampPosition(options.x ?? 22),
    y: clampPosition(options.y ?? 30),
    width: clampSize(options.width ?? 36),
    height: clampSize(options.height ?? 36),
    rotation: clampNumber(options.rotation ?? 0, -360, 360),
    zIndex: clampNumber(options.zIndex ?? 1, 0, 999),
    opacity: clampNumber(options.opacity ?? 1, 0, 1),
    locked: Boolean(options.locked),
    shadow: sanitizeShadow(options.shadow),
    fillType: sanitizeShapeFillType(options.fillType),
    fillColor: sanitizeColor(options.fillColor, "#F59E0B"),
    gradientFrom: sanitizeColor(options.gradientFrom, "#F59E0B"),
    gradientTo: sanitizeColor(options.gradientTo, "#FFFFFF"),
    gradientAngle: clampNumber(options.gradientAngle ?? 135, 0, 360),
    borderRadius: clampNumber(options.borderRadius ?? 12, 0, 100),
  };
}

export function normalizeInvitationLayout(
  value: unknown,
): InvitationTemplateLayout {
  if (!isRecord(value)) return createEmptyInvitationLayout();

  const canvas = isRecord(value.canvas) ? value.canvas : {};
  const rawElements = Array.isArray(value.elements) ? value.elements : [];

  return {
    version: 1,
    canvas: {
      width: clampNumber(Number(canvas.width) || 4, 1, 100),
      height: clampNumber(Number(canvas.height) || 5, 1, 100),
      backgroundColor: sanitizeColor(canvas.backgroundColor, "#111827"),
      backgroundImageUrl:
        typeof canvas.backgroundImageUrl === "string"
          ? canvas.backgroundImageUrl
          : undefined,
      backgroundImageX: clampNumber(numberOr(canvas.backgroundImageX, 50), 0, 100),
      backgroundImageY: clampNumber(numberOr(canvas.backgroundImageY, 50), 0, 100),
      backgroundImageScale: clampNumber(
        numberOr(canvas.backgroundImageScale, 100),
        20,
        300,
      ),
      backgroundImageBrightness: clampNumber(
        numberOr(canvas.backgroundImageBrightness, 100),
        0,
        200,
      ),
      backgroundImageContrast: clampNumber(
        numberOr(canvas.backgroundImageContrast, 100),
        0,
        200,
      ),
      backgroundImageGrayscale: clampNumber(
        numberOr(canvas.backgroundImageGrayscale, 0),
        0,
        100,
      ),
      backgroundImageLocked: Boolean(canvas.backgroundImageLocked),
      showSafeZone: Boolean(canvas.showSafeZone),
      safeZoneInset: clampNumber(numberOr(canvas.safeZoneInset, 6), 0, 30),
      borderRadius: clampNumber(Number(canvas.borderRadius) || 0, 0, 64),
      borderWidth: clampNumber(Number(canvas.borderWidth) || 0, 0, 20),
      borderColor: typeof canvas.borderColor === "string" ? canvas.borderColor : undefined,
    },
    elements: rawElements
      .map(normalizeElement)
      .filter((element): element is InvitationTemplateElement => !!element),
  };
}

export function resolveInvitationText(
  content: string,
  guestData: InvitationGuestData,
  eventData?: {
    name?: string;
    description?: string;
    date?: string;
    durationHours?: number;
    location?: string;
    fullLocation?: string | null;
    invitationMessage?: string | null;
    peopleCount?: number;
  },
) {
  return content
    .replaceAll("{{guest_name}}", guestData.name || "")
    .replaceAll("{{guest_email}}", guestData.email || "")
    .replaceAll("{{guest_whatsapp}}", guestData.whatsapp || "")
    .replaceAll("{{guest_qrcode}}", guestData.qrCodeData || "")
    .replaceAll("{{guest_table}}", guestData.table || "Sans table")
    .replaceAll("{{guest_seats}}", guestData.seatsAssigned?.toString() || "1")
    .replaceAll(
      "{{guest_people_count}}",
      eventData?.peopleCount?.toString() ||
        guestData.peopleCount?.toString() ||
        "1",
    )
    .replaceAll("{{event_name}}", eventData?.name || "Nom de l'événement")
    .replaceAll("{{event_description}}", eventData?.description || "Description de l'événement")
    .replaceAll("{{event_date}}", eventData?.date || "Date")
    .replaceAll("{{event_duration}}", eventData?.durationHours?.toString() || "24")
    .replaceAll("{{event_location}}", eventData?.location || "Lieu")
    .replaceAll("{{event_full_location}}", eventData?.fullLocation || "")
    .replaceAll("{{event_message}}", eventData?.invitationMessage || "");
}

function normalizeElement(value: unknown) {
  if (!isRecord(value)) return null;

  if (value.type === "image" && typeof value.src === "string") {
    return createImageElement(value.src, {
      id: typeof value.id === "string" ? value.id : undefined,
      alt: typeof value.alt === "string" ? value.alt : undefined,
      x: Number(value.x),
      y: Number(value.y),
      width: Number(value.width),
      height: Number(value.height),
      rotation: Number(value.rotation),
      zIndex: Number(value.zIndex),
      opacity: Number(value.opacity),
      locked: Boolean(value.locked),
      shadow: value.shadow as InvitationTemplateShadow,
      objectFit: value.objectFit as InvitationObjectFit,
      filters: value.filters as InvitationImageFilters,
    });
  }

  if (
    (value.type === "text" || value.type === "variable") &&
    typeof value.content === "string"
  ) {
    const style = isRecord(value.style) ? value.style : {};

    return createTextElement({
      id: typeof value.id === "string" ? value.id : undefined,
      type: value.type,
      content: value.content,
      richContent:
        typeof value.richContent === "string" ? value.richContent : undefined,
      x: Number(value.x),
      y: Number(value.y),
      width: Number(value.width),
      height: Number(value.height),
      rotation: Number(value.rotation),
      zIndex: Number(value.zIndex),
      opacity: Number(value.opacity),
      locked: Boolean(value.locked),
      shadow: value.shadow as InvitationTemplateShadow,
      fontFamily: style.fontFamily as InvitationFontFamily,
      fontSize: Number(style.fontSize),
      color: typeof style.color === "string" ? style.color : undefined,
      fontWeight: Number(style.fontWeight),
      fontStyle: style.fontStyle as InvitationFontStyle,
      textDecoration: style.textDecoration as InvitationTextDecoration,
      textAlign: style.textAlign as InvitationTextAlign,
      style: {
        fontFamily: sanitizeFont(style.fontFamily as InvitationFontFamily),
        fontSize: Number(style.fontSize),
        color: sanitizeColor(style.color, "#111827"),
        fontWeight: Number(style.fontWeight),
        fontStyle: sanitizeFontStyle(style.fontStyle),
        textDecoration: sanitizeTextDecoration(style.textDecoration),
        textTransform: sanitizeTextTransform(style.textTransform),
        textAlign: sanitizeTextAlign(style.textAlign as InvitationTextAlign),
        lineHeight: Number(style.lineHeight),
        letterSpacing: Number(style.letterSpacing),
        gradientEnabled: Boolean(style.gradientEnabled),
        gradientFrom: sanitizeColor(style.gradientFrom, "#F59E0B"),
        gradientTo: sanitizeColor(style.gradientTo, "#FFFFFF"),
        gradientAngle: clampNumber(Number(style.gradientAngle) || 90, 0, 360),
      },
    });
  }

  if (value.type === "link" && typeof value.content === "string") {
    const style = isRecord(value.style) ? value.style : {};

    return createLinkElement({
      id: typeof value.id === "string" ? value.id : undefined,
      content: value.content,
      richContent:
        typeof value.richContent === "string" ? value.richContent : undefined,
      href: typeof value.href === "string" ? value.href : undefined,
      x: Number(value.x),
      y: Number(value.y),
      width: Number(value.width),
      height: Number(value.height),
      rotation: Number(value.rotation),
      zIndex: Number(value.zIndex),
      opacity: Number(value.opacity),
      locked: Boolean(value.locked),
      shadow: value.shadow as InvitationTemplateShadow,
      fontFamily: style.fontFamily as InvitationFontFamily,
      fontSize: Number(style.fontSize),
      color: typeof style.color === "string" ? style.color : undefined,
      fontWeight: Number(style.fontWeight),
      fontStyle: style.fontStyle as InvitationFontStyle,
      textDecoration: style.textDecoration as InvitationTextDecoration,
      textAlign: style.textAlign as InvitationTextAlign,
      style: {
        fontFamily: sanitizeFont(style.fontFamily as InvitationFontFamily),
        fontSize: Number(style.fontSize),
        color: sanitizeColor(style.color, "#FFFFFF"),
        fontWeight: Number(style.fontWeight),
        fontStyle: sanitizeFontStyle(style.fontStyle),
        textDecoration: sanitizeTextDecoration(style.textDecoration),
        textTransform: sanitizeTextTransform(style.textTransform),
        textAlign: sanitizeTextAlign(style.textAlign as InvitationTextAlign),
        lineHeight: Number(style.lineHeight),
        letterSpacing: Number(style.letterSpacing),
        gradientEnabled: Boolean(style.gradientEnabled),
        gradientFrom: sanitizeColor(style.gradientFrom, "#F59E0B"),
        gradientTo: sanitizeColor(style.gradientTo, "#FFFFFF"),
        gradientAngle: clampNumber(Number(style.gradientAngle) || 90, 0, 360),
      },
    });
  }

  if (value.type === "qrcode") {
    return createQRCodeElement({
      id: typeof value.id === "string" ? value.id : undefined,
      x: Number(value.x),
      y: Number(value.y),
      width: Number(value.width),
      height: Number(value.height),
      rotation: Number(value.rotation),
      zIndex: Number(value.zIndex),
      opacity: Number(value.opacity),
      locked: Boolean(value.locked),
      shadow: value.shadow as InvitationTemplateShadow,
      fgColor: typeof value.fgColor === "string" ? value.fgColor : undefined,
      bgColor: typeof value.bgColor === "string" ? value.bgColor : undefined,
      eccLevel: value.eccLevel as InvitationQRCodeErrorCorrection,
      showLogo: value.showLogo !== false,
    });
  }

  if (value.type === "shape") {
    return createShapeElement({
      id: typeof value.id === "string" ? value.id : undefined,
      x: Number(value.x),
      y: Number(value.y),
      width: Number(value.width),
      height: Number(value.height),
      rotation: Number(value.rotation),
      zIndex: Number(value.zIndex),
      opacity: Number(value.opacity),
      locked: Boolean(value.locked),
      shadow: value.shadow as InvitationTemplateShadow,
      fillType: value.fillType as InvitationShapeFillType,
      fillColor: typeof value.fillColor === "string" ? value.fillColor : undefined,
      gradientFrom:
        typeof value.gradientFrom === "string" ? value.gradientFrom : undefined,
      gradientTo: typeof value.gradientTo === "string" ? value.gradientTo : undefined,
      gradientAngle: Number(value.gradientAngle),
      borderRadius: Number(value.borderRadius),
    });
  }

  return null;
}

function sanitizeFont(value: unknown): InvitationFontFamily {
  return INVITATION_TEMPLATE_FONTS.includes(value as InvitationFontFamily)
    ? (value as InvitationFontFamily)
    : "Inter";
}

function sanitizeTextAlign(value: unknown): InvitationTextAlign {
  return value === "left" || value === "right" || value === "center"
    ? value
    : "center";
}

function sanitizeFontStyle(value: unknown): InvitationFontStyle {
  return value === "italic" ? "italic" : "normal";
}

function sanitizeTextDecoration(value: unknown): InvitationTextDecoration {
  return value === "underline" ? "underline" : "none";
}

function sanitizeTextTransform(value: unknown): InvitationTextTransform {
  return value === "uppercase" ||
    value === "lowercase" ||
    value === "sentence" ||
    value === "capitalize"
    ? value
    : "none";
}

function sanitizeObjectFit(value: unknown): InvitationObjectFit {
  return value === "contain" || value === "fill" || value === "cover"
    ? value
    : "cover";
}

function sanitizeShapeFillType(value: unknown): InvitationShapeFillType {
  return value === "gradient" ? "gradient" : "solid";
}

function sanitizeQRCodeErrorCorrection(
  value: unknown,
): InvitationQRCodeErrorCorrection {
  return value === "L" || value === "M" || value === "Q" || value === "H"
    ? value
    : "H";
}

function sanitizeShadow(value: unknown): InvitationTemplateShadow {
  const shadow = isRecord(value) ? value : {};

  return {
    enabled: Boolean(shadow.enabled),
    x: clampNumber(numberOr(shadow.x, DEFAULT_SHADOW.x), -40, 40),
    y: clampNumber(numberOr(shadow.y, DEFAULT_SHADOW.y), -40, 40),
    blur: clampNumber(numberOr(shadow.blur, DEFAULT_SHADOW.blur), 0, 80),
    color: sanitizeColor(shadow.color, DEFAULT_SHADOW.color),
    opacity: clampNumber(numberOr(shadow.opacity, DEFAULT_SHADOW.opacity), 0, 1),
  };
}

function sanitizeImageFilters(value: unknown): InvitationImageFilters {
  const filters = isRecord(value) ? value : {};

  return {
    brightness: clampNumber(
      numberOr(filters.brightness, DEFAULT_IMAGE_FILTERS.brightness),
      0,
      200,
    ),
    contrast: clampNumber(
      numberOr(filters.contrast, DEFAULT_IMAGE_FILTERS.contrast),
      0,
      200,
    ),
    grayscale: clampNumber(
      numberOr(filters.grayscale, DEFAULT_IMAGE_FILTERS.grayscale),
      0,
      100,
    ),
  };
}

function sanitizeColor(value: unknown, fallback: string) {
  return typeof value === "string" && HEX_COLOR_RE.test(value)
    ? value
    : fallback;
}

function sanitizeHref(value: unknown) {
  if (typeof value !== "string") return "https://";
  const trimmed = value.trim();
  if (!trimmed) return "https://";
  if (/^(https?:\/\/|mailto:|tel:)/i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/")) return trimmed;

  return `https://${trimmed.replace(/^\/+/, "")}`;
}

function numberOr(value: unknown, fallback: number) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function clampPosition(value: number) {
  return clampNumber(Number.isFinite(value) ? value : 0, -200, 200);
}

function clampSize(value: number) {
  return clampNumber(Number.isFinite(value) ? value : 10, 2, 200);
}

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function createElementId() {
  return `el_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

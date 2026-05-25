import type {
  InvitationFontFamily,
  InvitationGuestData,
  InvitationObjectFit,
  InvitationTemplateElement,
  InvitationTemplateImageElement,
  InvitationTemplateQRCodeElement,
  InvitationTemplateLayout,
  InvitationTemplateTextElement,
  InvitationTextAlign,
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
    textAlign?: InvitationTextAlign;
  },
): InvitationTemplateTextElement {
  return {
    id: options.id || createElementId(),
    type: options.type === "variable" ? "variable" : "text",
    content: options.content,
    x: clampPercent(options.x ?? 16),
    y: clampPercent(options.y ?? 18),
    width: clampSize(options.width ?? 68),
    height: clampSize(options.height ?? 10),
    rotation: clampNumber(options.rotation ?? 0, -180, 180),
    zIndex: clampNumber(options.zIndex ?? 1, 0, 999),
    opacity: clampNumber(options.opacity ?? 1, 0, 1),
    style: {
      fontFamily: sanitizeFont(options.fontFamily),
      fontSize: clampNumber(options.fontSize ?? 4, 1, 18),
      color: sanitizeColor(options.color, "#111827"),
      fontWeight: clampNumber(options.fontWeight ?? 700, 100, 900),
      textAlign: sanitizeTextAlign(options.textAlign),
      lineHeight: clampNumber(options.style?.lineHeight ?? 1.1, 0.7, 2),
      letterSpacing: clampNumber(options.style?.letterSpacing ?? 0, -0.05, 0.3),
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
    x: clampPercent(options.x ?? 16),
    y: clampPercent(options.y ?? 22),
    width: clampSize(options.width ?? 68),
    height: clampSize(options.height ?? 28),
    rotation: clampNumber(options.rotation ?? 0, -180, 180),
    zIndex: clampNumber(options.zIndex ?? 1, 0, 999),
    opacity: clampNumber(options.opacity ?? 1, 0, 1),
    objectFit: sanitizeObjectFit(options.objectFit),
  };
}

export function createQRCodeElement(
  options: Partial<InvitationTemplateQRCodeElement> = {},
): InvitationTemplateQRCodeElement {
  return {
    id: options.id || createElementId(),
    type: "qrcode",
    x: clampPercent(options.x ?? 30),
    y: clampPercent(options.y ?? 40),
    width: clampSize(options.width ?? 40),
    height: clampSize(options.height ?? 40),
    rotation: clampNumber(options.rotation ?? 0, -180, 180),
    zIndex: clampNumber(options.zIndex ?? 1, 0, 999),
    opacity: clampNumber(options.opacity ?? 1, 0, 1),
    fgColor: sanitizeColor(options.fgColor, "#000000"),
    bgColor: sanitizeColor(options.bgColor, "#ffffff"),
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
      objectFit: value.objectFit as InvitationObjectFit,
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
      x: Number(value.x),
      y: Number(value.y),
      width: Number(value.width),
      height: Number(value.height),
      rotation: Number(value.rotation),
      zIndex: Number(value.zIndex),
      opacity: Number(value.opacity),
      fontFamily: style.fontFamily as InvitationFontFamily,
      fontSize: Number(style.fontSize),
      color: typeof style.color === "string" ? style.color : undefined,
      fontWeight: Number(style.fontWeight),
      textAlign: style.textAlign as InvitationTextAlign,
      style: {
        fontFamily: sanitizeFont(style.fontFamily as InvitationFontFamily),
        fontSize: Number(style.fontSize),
        color: sanitizeColor(style.color, "#111827"),
        fontWeight: Number(style.fontWeight),
        textAlign: sanitizeTextAlign(style.textAlign as InvitationTextAlign),
        lineHeight: Number(style.lineHeight),
        letterSpacing: Number(style.letterSpacing),
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
      fgColor: typeof value.fgColor === "string" ? value.fgColor : undefined,
      bgColor: typeof value.bgColor === "string" ? value.bgColor : undefined,
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

function sanitizeObjectFit(value: unknown): InvitationObjectFit {
  return value === "contain" || value === "fill" || value === "cover"
    ? value
    : "cover";
}

function sanitizeColor(value: unknown, fallback: string) {
  return typeof value === "string" && HEX_COLOR_RE.test(value)
    ? value
    : fallback;
}

function clampPercent(value: number) {
  return clampNumber(Number.isFinite(value) ? value : 0, 0, 100);
}

function clampSize(value: number) {
  return clampNumber(Number.isFinite(value) ? value : 10, 2, 100);
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

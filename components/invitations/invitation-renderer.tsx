"use client";

import { QRCodeCanvas } from "qrcode.react";
import { cn } from "@/lib/utils";
import {
  normalizeInvitationLayout,
  resolveInvitationText,
} from "@/lib/invitation-template-layout";
import type {
  InvitationGuestData,
  InvitationImageFilters,
  InvitationTemplateElement,
  InvitationTemplateLinkElement,
  InvitationTemplateLayout,
  InvitationTemplateShadow,
  InvitationTemplateTextElement,
  InvitationTextTransform,
} from "@/types/invitation-template";

type InvitationEventData = Parameters<typeof resolveInvitationText>[2];

type InvitationRendererProps = {
  templateData: InvitationTemplateLayout | unknown;
  guestData: InvitationGuestData;
  eventData?: InvitationEventData;
  className?: string;
  interactive?: boolean;
  selectedElementId?: string | null;
  onSelectElement?: (id: string) => void;
  onPointerDownElement?: (
    event: React.PointerEvent<HTMLDivElement>,
    element: InvitationTemplateElement,
  ) => void;
  renderResizeHandle?: (element: InvitationTemplateElement) => React.ReactNode;
};

export function InvitationRenderer({
  templateData,
  guestData,
  eventData,
  className,
  interactive = false,
  selectedElementId,
  onSelectElement,
  onPointerDownElement,
  renderResizeHandle,
}: InvitationRendererProps) {
  const layout = normalizeInvitationLayout(templateData);
  const aspectRatio = `${layout.canvas.width} / ${layout.canvas.height}`;

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-white shadow-2xl",
        interactive && "select-none",
        className,
      )}
      style={{
        aspectRatio,
        containerType: "inline-size",
        backgroundColor: layout.canvas.backgroundColor,
        borderRadius: layout.canvas.borderRadius,
        borderWidth: layout.canvas.borderWidth ? `${layout.canvas.borderWidth}px` : undefined,
        borderColor: layout.canvas.borderColor,
        borderStyle: layout.canvas.borderWidth ? "solid" : undefined,
        boxSizing: "border-box",
      }}
    >
      {layout.canvas.backgroundImageUrl ? (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `url(${layout.canvas.backgroundImageUrl})`,
            backgroundPosition: `${layout.canvas.backgroundImageX ?? 50}% ${layout.canvas.backgroundImageY ?? 50}%`,
            backgroundRepeat: "no-repeat",
            backgroundSize: `${layout.canvas.backgroundImageScale ?? 100}%`,
            filter: imageFilter({
              brightness: layout.canvas.backgroundImageBrightness ?? 100,
              contrast: layout.canvas.backgroundImageContrast ?? 100,
              grayscale: layout.canvas.backgroundImageGrayscale ?? 0,
            }),
            zIndex: 0,
          }}
        />
      ) : null}

      {layout.elements.map((element) => (
        <TemplateElement
          key={element.id}
          element={element}
          guestData={guestData}
          eventData={eventData}
          interactive={interactive}
          isSelected={selectedElementId === element.id}
          onSelectElement={onSelectElement}
          onPointerDownElement={onPointerDownElement}
          renderResizeHandle={renderResizeHandle}
        />
      ))}

      {interactive && layout.canvas.showSafeZone ? (
        <div
          className="pointer-events-none absolute border border-dashed border-primary/70"
          style={{
            inset: `${layout.canvas.safeZoneInset ?? 6}%`,
            zIndex: 1000,
          }}
        />
      ) : null}
    </div>
  );
}

function TemplateElement({
  element,
  guestData,
  eventData,
  interactive,
  isSelected,
  onSelectElement,
  onPointerDownElement,
  renderResizeHandle,
}: {
  element: InvitationTemplateElement;
  guestData: InvitationGuestData;
  eventData?: InvitationEventData;
  interactive: boolean;
  isSelected: boolean;
  onSelectElement?: (id: string) => void;
  onPointerDownElement?: (
    event: React.PointerEvent<HTMLDivElement>,
    element: InvitationTemplateElement,
  ) => void;
  renderResizeHandle?: (element: InvitationTemplateElement) => React.ReactNode;
}) {
  const isTextElement = isTextLikeElement(element);

  return (
    <div
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? "Element du template" : undefined}
      className={cn(
        "absolute",
        interactive &&
          !element.locked &&
          "cursor-move touch-none outline-none",
        interactive && element.locked && "cursor-default outline-none",
        isSelected && "ring-2 ring-amber-400 ring-offset-2 ring-offset-black/80",
      )}
      style={{
        left: `${element.x}%`,
        top: `${element.y}%`,
        width: `${element.width}%`,
        height: `${element.height}%`,
        zIndex: element.zIndex,
        opacity: element.opacity,
        transform: `rotate(${element.rotation}deg)`,
        boxShadow: isTextElement ? undefined : cssShadow(element.shadow),
      }}
      onPointerDown={(event) => {
        if (!interactive) return;
        event.stopPropagation();
        onSelectElement?.(element.id);
        if (element.locked) return;
        onPointerDownElement?.(event, element);
      }}
      onClick={(event) => {
        if (!interactive) return;
        event.stopPropagation();
        onSelectElement?.(element.id);
      }}
    >
      {element.type === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={element.src}
          alt={element.alt || "Invitation asset"}
          className="pointer-events-none size-full"
          style={{
            filter: imageFilter(element.filters),
            objectFit: element.objectFit,
          }}
        />
      ) : element.type === "qrcode" ? (
        <div
          className="flex size-full items-center justify-center overflow-hidden"
          style={{
            backgroundColor: element.bgColor,
            padding: "6%",
          }}
        >
          <QRCodeCanvas
            value={guestData.qrCodeData || "YAMBIPASS_PREVIEW_QR_CODE"}
            bgColor={element.bgColor}
            fgColor={element.fgColor}
            level={element.eccLevel}
            imageSettings={
              element.showLogo
                ? {
                    src: "/logo-app/icon-1024.png",
                    height: 28,
                    width: 28,
                    excavate: true,
                  }
                : undefined
            }
            style={{ width: "100%", height: "100%" }}
          />
        </div>
      ) : element.type === "shape" ? (
        <div
          className="size-full"
          style={{
            background:
              element.fillType === "gradient"
                ? `linear-gradient(${element.gradientAngle}deg, ${element.gradientFrom}, ${element.gradientTo})`
                : element.fillColor,
            borderRadius: `${element.borderRadius}%`,
          }}
        />
      ) : isTextElement ? (
        <TextLikeElementContent
          element={element}
          guestData={guestData}
          eventData={eventData}
          interactive={interactive}
        />
      ) : null}

      {isSelected ? renderResizeHandle?.(element) : null}
    </div>
  );
}

function TextLikeElementContent({
  element,
  guestData,
  eventData,
  interactive,
}: {
  element: InvitationTemplateTextElement | InvitationTemplateLinkElement;
  guestData: InvitationGuestData;
  eventData?: InvitationEventData;
  interactive: boolean;
}) {
  const content = element.richContent ? (
    <span
      dangerouslySetInnerHTML={{
        __html: sanitizeRichText(
          transformHtmlTextCase(
            resolveInvitationText(element.richContent, guestData, eventData),
            element.style.textTransform,
          ),
        ),
      }}
    />
  ) : (
    transformTextCase(
      resolveInvitationText(element.content, guestData, eventData),
      element.style.textTransform,
    )
  );

  return (
    <div
      className="flex size-full items-center"
      style={{
        justifyContent:
          element.style.textAlign === "left"
            ? "flex-start"
            : element.style.textAlign === "right"
              ? "flex-end"
              : "center",
        textAlign: element.style.textAlign,
        fontFamily: fontStack(element.style.fontFamily),
        fontSize: `${element.style.fontSize}cqw`,
        color: element.style.gradientEnabled ? "transparent" : element.style.color,
        backgroundImage: element.style.gradientEnabled
          ? `linear-gradient(${element.style.gradientAngle ?? 90}deg, ${element.style.gradientFrom ?? "#F59E0B"}, ${element.style.gradientTo ?? "#FFFFFF"})`
          : undefined,
        backgroundClip: element.style.gradientEnabled ? "text" : undefined,
        WebkitBackgroundClip: element.style.gradientEnabled ? "text" : undefined,
        fontWeight: element.style.fontWeight,
        fontStyle: element.style.fontStyle ?? "normal",
        lineHeight: element.style.lineHeight,
        letterSpacing: `${element.style.letterSpacing}em`,
        textDecoration: element.style.textDecoration ?? "none",
        whiteSpace: "pre-wrap",
        overflowWrap: "anywhere",
        textShadow: cssShadow(element.shadow),
      }}
    >
      {element.type === "link" && !interactive ? (
        <a
          href={safeHref(element.href)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-inherit"
          style={{ textDecoration: "inherit" }}
        >
          {content}
        </a>
      ) : (
        <span>{content}</span>
      )}
    </div>
  );
}

function isTextLikeElement(
  element: InvitationTemplateElement,
): element is InvitationTemplateTextElement | InvitationTemplateLinkElement {
  return (
    element.type === "text" ||
    element.type === "variable" ||
    element.type === "link"
  );
}

function imageFilter(filters?: InvitationImageFilters) {
  const brightness = filters?.brightness ?? 100;
  const contrast = filters?.contrast ?? 100;
  const grayscale = filters?.grayscale ?? 0;

  return `brightness(${brightness}%) contrast(${contrast}%) grayscale(${grayscale}%)`;
}

function cssShadow(shadow?: InvitationTemplateShadow) {
  if (!shadow?.enabled) return undefined;

  return `${shadow.x}cqw ${shadow.y}cqw ${shadow.blur}cqw ${hexToRgba(
    shadow.color,
    shadow.opacity,
  )}`;
}

function hexToRgba(hex: string, opacity: number) {
  const normalized = hex.replace("#", "");
  const red = parseInt(normalized.slice(0, 2), 16);
  const green = parseInt(normalized.slice(2, 4), 16);
  const blue = parseInt(normalized.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}

function sanitizeRichText(value: string) {
  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}

function safeHref(value: string) {
  const trimmed = value.trim();
  if (/^(https?:\/\/|mailto:|tel:|\/)/i.test(trimmed)) return trimmed;

  return "https://";
}

function transformHtmlTextCase(
  html: string,
  transform: InvitationTextTransform = "none",
) {
  return html
    .split(/(<[^>]+>)/g)
    .map((part) =>
      part.startsWith("<") ? part : transformTextCase(part, transform),
    )
    .join("");
}

function transformTextCase(
  value: string,
  transform: InvitationTextTransform = "none",
) {
  if (transform === "uppercase") return value.toLocaleUpperCase("fr-FR");
  if (transform === "lowercase") return value.toLocaleLowerCase("fr-FR");
  if (transform === "capitalize") {
    return value.replace(/\p{L}[\p{L}'-]*/gu, (word) =>
      word.charAt(0).toLocaleUpperCase("fr-FR") +
      word.slice(1).toLocaleLowerCase("fr-FR"),
    );
  }
  if (transform === "sentence") {
    const lowered = value.toLocaleLowerCase("fr-FR");

    return lowered.replace(/(^|[.!?]\s+)(\p{L})/gu, (match, prefix, letter) =>
      `${prefix}${letter.toLocaleUpperCase("fr-FR")}`,
    );
  }

  return value;
}

function fontStack(fontFamily: string) {
  if (fontFamily === "Great Vibes") return "var(--font-great-vibes), Georgia, serif";
  if (fontFamily === "Courgette") return "var(--font-courgette), Georgia, serif";
  if (fontFamily === "Georgia") return "Georgia, serif";
  if (fontFamily === "Arial") return "Arial, sans-serif";
  
  // Nouveaux Google Fonts injectés via la balise <link> dans le layout
  const googleFonts = [
    "Playfair Display", "Montserrat", "Lora", "Dancing Script", "Pacifico",
    "Cinzel", "Alex Brush", "Pinyon Script", "Lato", "Roboto", "Open Sans",
    "Poppins", "Oswald", "Raleway", "Sacramento", "Parisienne", "Satisfy",
    "Allura", "Cormorant Garamond", "Josefin Sans"
  ];
  
  if (googleFonts.includes(fontFamily)) {
    return `"${fontFamily}", sans-serif`;
  }

  return "var(--font-invitation-inter), var(--font-geist-sans), Arial, sans-serif";
}

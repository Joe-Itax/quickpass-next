"use client";

import { QRCodeSVG } from "qrcode.react";
import { cn } from "@/lib/utils";
import {
  normalizeInvitationLayout,
  resolveInvitationText,
} from "@/lib/invitation-template-layout";
import type {
  InvitationGuestData,
  InvitationTemplateElement,
  InvitationTemplateLayout,
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
        backgroundImage: layout.canvas.backgroundImageUrl
          ? `url(${layout.canvas.backgroundImageUrl})`
          : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        borderRadius: layout.canvas.borderRadius,
        borderWidth: layout.canvas.borderWidth ? `${layout.canvas.borderWidth}px` : undefined,
        borderColor: layout.canvas.borderColor,
        borderStyle: layout.canvas.borderWidth ? "solid" : undefined,
        boxSizing: "border-box",
      }}
    >
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
  return (
    <div
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? "Element du template" : undefined}
      className={cn(
        "absolute",
        interactive && "cursor-move touch-none outline-none",
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
      }}
      onPointerDown={(event) => {
        if (!interactive) return;
        event.stopPropagation();
        onSelectElement?.(element.id);
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
          style={{ objectFit: element.objectFit }}
        />
      ) : element.type === "qrcode" ? (
        <div
          className="flex size-full items-center justify-center overflow-hidden"
          style={{
            backgroundColor: element.bgColor,
            padding: "6%",
          }}
        >
          <QRCodeSVG
            value={guestData.qrCodeData || "YAMBIPASS_PREVIEW_QR_CODE"}
            bgColor={element.bgColor}
            fgColor={element.fgColor}
            level="H"
            style={{ width: "100%", height: "100%" }}
          />
        </div>
      ) : (
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
            color: element.style.color,
            fontWeight: element.style.fontWeight,
            lineHeight: element.style.lineHeight,
            letterSpacing: `${element.style.letterSpacing}em`,
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
          }}
        >
          {resolveInvitationText(element.content, guestData, eventData)}
        </div>
      )}

      {isSelected ? renderResizeHandle?.(element) : null}
    </div>
  );
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

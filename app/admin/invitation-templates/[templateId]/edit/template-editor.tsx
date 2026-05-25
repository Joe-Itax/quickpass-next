"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyStart,
  Bold,
  Braces,
  Copy,
  ImagePlus,
  Italic,
  Layers,
  Loader2,
  Lock,
  Move,
  MoveLeftIcon,
  Palette,
  QrCode,
  Save,
  Square,
  SquareDashedMousePointer,
  Trash2,
  Type,
  Underline,
  Unlock,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InvitationRenderer } from "@/components/invitations/invitation-renderer";

import { compressImageToWebP } from "@/lib/client-image-compression";
import {
  createImageElement,
  createShapeElement,
  createTextElement,
  createQRCodeElement,
  INVITATION_TEMPLATE_CATEGORY_LABELS,
  INVITATION_TEMPLATE_FONT_LABELS,
  INVITATION_TEMPLATE_FONTS,
  normalizeInvitationLayout,
} from "@/lib/invitation-template-layout";
import { saveInvitationTemplateAction } from "@/app/admin/invitation-templates/actions";
import type {
  InvitationTemplateElement,
  InvitationTemplateImageElement,
  InvitationTemplateLayout,
  InvitationTemplateQRCodeElement,
  InvitationTemplateShapeElement,
  InvitationTemplateSummary,
  InvitationTemplateTextElement,
  InvitationTextAlign,
} from "@/types/invitation-template";

type EditorCategory = InvitationTemplateSummary["category"];
type ToolKind =
  | "text"
  | "guest_name"
  | "guest_table"
  | "guest_people_count"
  | "event_name"
  | "event_description"
  | "event_date"
  | "event_duration"
  | "event_location"
  | "event_full_location"
  | "event_message"
  | "guest_email"
  | "guest_whatsapp"
  | "guest_seats"
  | "qrcode"
  | "shape";
type DragMode = "move" | "resize";

type ActiveDrag = {
  mode: DragMode;
  elementId: string;
  startX: number;
  startY: number;
  rect: DOMRect;
  initial: InvitationTemplateElement;
};

const CATEGORIES: EditorCategory[] = ["WEDDING", "DEFENSE", "GALA", "STANDARD"];
const CANVAS_FORMATS = [
  { value: "4:5", label: "Portrait (4:5)", width: 4, height: 5 },
  { value: "9:16", label: "Story (9:16)", width: 9, height: 16 },
  { value: "1:1", label: "Carre (1:1)", width: 1, height: 1 },
  { value: "16:9", label: "Paysage (16:9)", width: 16, height: 9 },
  { value: "21:29.7", label: "A4 Portrait", width: 21, height: 29.7 },
  { value: "29.7:21", label: "A4 Paysage", width: 29.7, height: 21 },
] as const;
const PREVIEW_GUEST = {
  name: "BODRICK & MAMAN FEZA",
  table: "ACCES BANK",
  peopleCount: 2,
  seatsAssigned: 1,
  email: "invite@yambipass.com",
  whatsapp: "243900000000",
  qrCodeData: "YAMBIPASS-PREVIEW-QR",
};

export function TemplateEditor({
  template,
}: {
  template: InvitationTemplateSummary;
}) {
  const router = useRouter();
  const canvasRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const activeDragRef = useRef<ActiveDrag | null>(null);
  const historyPastRef = useRef<InvitationTemplateLayout[]>([]);
  const historyFutureRef = useRef<InvitationTemplateLayout[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [name, setName] = useState(template.name);
  const [category, setCategory] = useState<EditorCategory>(template.category);
  const [isPublic, setIsPublic] = useState<boolean>(template.isPublic);
  const [layout, setLayout] = useState<InvitationTemplateLayout>(
    template.layoutData,
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    template.layoutData.elements[0]?.id ?? null,
  );

  const selectedElement = useMemo(
    () => layout.elements.find((element) => element.id === selectedId) ?? null,
    [layout.elements, selectedId],
  );
  const canvasFormatValue = getCanvasFormatValue(
    layout.canvas.width,
    layout.canvas.height,
  );

  const commitLayout = (
    updater:
      | InvitationTemplateLayout
      | ((current: InvitationTemplateLayout) => InvitationTemplateLayout),
  ) => {
    setLayout((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      if (next === current) return current;

      historyPastRef.current = [...historyPastRef.current.slice(-49), current];
      historyFutureRef.current = [];

      return next;
    });
  };

  const undoLayout = () => {
    setLayout((current) => {
      const previous = historyPastRef.current.pop();
      if (!previous) return current;

      historyFutureRef.current = [current, ...historyFutureRef.current].slice(
        0,
        50,
      );

      return previous;
    });
  };

  const redoLayout = () => {
    setLayout((current) => {
      const next = historyFutureRef.current.shift();
      if (!next) return current;

      historyPastRef.current = [...historyPastRef.current.slice(-49), current];

      return next;
    });
  };

  const updateCanvasDimension = (key: "width" | "height", value: number) => {
    commitLayout((current) => ({
      ...current,
      canvas: {
        ...current.canvas,
        [key]: clamp(value, 1, 100),
      },
    }));
  };

  const addTool = (tool: ToolKind, position?: { x: number; y: number }) => {
    const base = position ?? { x: 16, y: 18 };
    const element =
      tool === "text"
        ? createTextElement({
            content: "Votre texte",
            x: base.x,
            y: base.y,
            width: 60,
            height: 10,
            fontSize: 4,
            color: "#FFFFFF",
          })
        : tool === "qrcode"
          ? createQRCodeElement({
              x: base.x,
              y: base.y,
              width: 30,
              height: 30,
            })
          : tool === "shape"
            ? createShapeElement({
                x: base.x,
                y: base.y,
                width: 34,
                height: 34,
                fillColor: "#FBBF24",
                borderRadius: 0,
              })
            : createTextElement({
                type: "variable",
                content:
                  tool === "guest_name"
                    ? "{{guest_name}}"
                    : tool === "guest_table"
                      ? "Table {{guest_table}}"
                      : tool === "guest_people_count"
                        ? "{{guest_people_count}} pers."
                        : tool === "event_name"
                          ? "{{event_name}}"
                          : tool === "event_description"
                            ? "{{event_description}}"
                            : tool === "event_date"
                              ? "{{event_date}}"
                              : tool === "event_duration"
                                ? "{{event_duration}} h"
                                : tool === "event_location"
                                  ? "{{event_location}}"
                                  : tool === "event_full_location"
                                    ? "{{event_full_location}}"
                                    : tool === "event_message"
                                      ? "{{event_message}}"
                                      : tool === "guest_email"
                                        ? "{{guest_email}}"
                                        : tool === "guest_whatsapp"
                                          ? "{{guest_whatsapp}}"
                                          : tool === "guest_seats"
                                            ? "{{guest_seats}} places"
                                            : `{{${tool}}}`,
                x: base.x,
                y: base.y,
                width: tool === "guest_name" ? 66 : 52,
                height: 8,
                fontSize: tool === "guest_name" ? 4.3 : 3.2,
                color: tool === "guest_name" ? "#FBBF24" : "#E5E7EB",
                fontWeight: 800,
              });

    pushElement(element);
  };

  const pushElement = (element: InvitationTemplateElement) => {
    commitLayout((current) => ({
      ...current,
      elements: [...current.elements, element],
    }));
    setSelectedId(element.id);
  };

  const updateSelectedElement = (
    updater: (element: InvitationTemplateElement) => InvitationTemplateElement,
  ) => {
    if (!selectedId) return;

    commitLayout((current) => ({
      ...current,
      elements: current.elements.map((element) =>
        element.id === selectedId ? updater(element) : element,
      ),
    }));
  };

  const updateElementById = (
    elementId: string,
    updater: (
      element: InvitationTemplateElement,
      layout: InvitationTemplateLayout,
    ) => InvitationTemplateElement,
  ) => {
    setLayout((current) => ({
      ...current,
      elements: current.elements.map((element) =>
        element.id === elementId ? updater(element, current) : element,
      ),
    }));
  };

  const deleteImage = async (url: string) => {
    try {
      if (!url.includes("vercel-storage.com")) return; // Only delete Vercel Blob URLs
      await fetch("/api/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
    } catch (error) {
      console.error("Failed to delete image", error);
    }
  };

  const deleteSelectedElement = () => {
    if (!selectedId) return;

    const elementToDelete = layout.elements.find((e) => e.id === selectedId);
    if (elementToDelete?.type === "image") {
      deleteImage(elementToDelete.src);
    }

    commitLayout((current) => ({
      ...current,
      elements: current.elements.filter((element) => element.id !== selectedId),
    }));
    setSelectedId(null);
  };

  const duplicateSelectedElement = () => {
    if (!selectedElement) return;

    const copy = structuredClone(selectedElement) as InvitationTemplateElement;
    copy.id = createEditorElementId();
    copy.x = clampElementX(copy.x + 3, copy);
    copy.y = clampElementY(copy.y + 3, copy);
    copy.locked = false;
    copy.zIndex = clamp(copy.zIndex + 1, 0, 999);

    commitLayout((current) => ({
      ...current,
      elements: [...current.elements, copy],
    }));
    setSelectedId(copy.id);
  };

  const uploadImage = async (file: File) => {
    setIsUploading(true);

    try {
      const isSvg = file.type === "image/svg+xml";
      const fileToUpload = isSvg ? file : await compressImageToWebP(file);

      const formData = new FormData();
      formData.append("file", fileToUpload);
      formData.append("prefix", `templates/${template.id}`);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Upload failed");
      }

      const data = await response.json();
      return data.url;
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageUpload = async (file?: File) => {
    if (!file) return;

    try {
      const publicUrl = await uploadImage(file);
      pushElement(
        createImageElement(publicUrl, {
          x: 18,
          y: 24,
          width: 64,
          height: 28,
          objectFit: "cover",
        }),
      );
      toast.success("Image compressee et ajoutee.");
    } catch (error) {
      console.error(error);
      toast.error(
        "Upload impossible. Verifiez votre configuration Vercel Blob.",
      );
    }
  };

  const handleBackgroundUpload = async (file?: File) => {
    if (!file) return;

    try {
      const publicUrl = await uploadImage(file);
      commitLayout((current) => ({
        ...current,
        canvas: { ...current.canvas, backgroundImageUrl: publicUrl },
      }));
      toast.success("Fond compresse et applique.");
    } catch (error) {
      console.error(error);
      toast.error("Upload du fond impossible.");
    }
  };

  const startDrag = (
    event: React.PointerEvent<HTMLElement>,
    element: InvitationTemplateElement,
    mode: DragMode,
  ) => {
    if (element.locked) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    historyPastRef.current = [...historyPastRef.current.slice(-49), layout];
    historyFutureRef.current = [];

    activeDragRef.current = {
      mode,
      elementId: element.id,
      startX: event.clientX,
      startY: event.clientY,
      rect,
      initial: element,
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopDrag, { once: true });
  };

  const handlePointerMove = (event: PointerEvent) => {
    const drag = activeDragRef.current;
    if (!drag) return;

    const deltaX = ((event.clientX - drag.startX) / drag.rect.width) * 100;
    const deltaY = ((event.clientY - drag.startY) / drag.rect.height) * 100;

    updateElementById(drag.elementId, (element, currentLayout) => {
      if (drag.mode === "move") {
        const rawPosition = {
          x: clampElementX(drag.initial.x + deltaX, drag.initial),
          y: clampElementY(drag.initial.y + deltaY, drag.initial),
        };
        const snappedPosition = snapElementPosition(
          rawPosition,
          drag.initial,
          currentLayout.elements.filter((item) => item.id !== drag.elementId),
        );

        return {
          ...element,
          x: snappedPosition.x,
          y: snappedPosition.y,
        };
      }

      return {
        ...element,
        width: clamp(drag.initial.width + deltaX, 4, 200),
        height: clamp(drag.initial.height + deltaY, 3, 200),
      };
    });
  };

  const stopDrag = () => {
    activeDragRef.current = null;
    window.removeEventListener("pointermove", handlePointerMove);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const tool = event.dataTransfer.getData(
      "application/x-yambipass-tool",
    ) as ToolKind;
    if (!tool) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    addTool(tool, {
      x: clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 88),
      y: clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 88),
    });
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;

      const key = event.key.toLowerCase();
      const hasModifier = event.ctrlKey || event.metaKey;

      if (hasModifier && key === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          redoLayout();
        } else {
          undoLayout();
        }
        return;
      }

      if (hasModifier && key === "y") {
        event.preventDefault();
        redoLayout();
        return;
      }

      if (hasModifier && key === "d") {
        event.preventDefault();
        duplicateSelectedElement();
        return;
      }

      if (!selectedElement) return;

      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        deleteSelectedElement();
        return;
      }

      if (
        selectedElement.locked ||
        !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)
      ) {
        return;
      }

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      event.preventDefault();
      const step = event.shiftKey ? 10 : 1;
      const dx =
        event.key === "ArrowLeft"
          ? (-step / rect.width) * 100
          : event.key === "ArrowRight"
            ? (step / rect.width) * 100
            : 0;
      const dy =
        event.key === "ArrowUp"
          ? (-step / rect.height) * 100
          : event.key === "ArrowDown"
            ? (step / rect.height) * 100
            : 0;

      updateSelectedElement((current) => ({
        ...current,
        x: clampElementX(current.x + dx, current),
        y: clampElementY(current.y + dy, current),
      }));
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const saveTemplate = () => {
    startTransition(async () => {
      const result = await saveInvitationTemplateAction(template.id, {
        name,
        category,
        layoutData: normalizeInvitationLayout(layout),
        isPublic,
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Modele sauvegarde.");
      router.refresh();
    });
  };

  return (
    <section className="min-h-screen space-y-5 text-white">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/admin/invitation-templates")}
            className="text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:bg-white/5 hover:text-white"
          >
            <MoveLeftIcon className="mr-2 h-4 w-4" />
            Retour
          </Button>

          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-primary">
              Bibliotheque visuelle
            </p>
            <h1 className="text-3xl font-black uppercase italic tracking-tight">
              Editeur d&apos;invitation
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="h-11 w-72 rounded-xl border-white/10 bg-white/5 text-white"
            placeholder="Nom du modele"
          />
          <Select
            value={category}
            onValueChange={(value) => setCategory(value as EditorCategory)}
          >
            <SelectTrigger className="h-11 w-48 rounded-xl border-white/10 bg-white/5 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-[#0f0f0f] text-white">
              {CATEGORIES.map((item) => (
                <SelectItem key={item} value={item}>
                  {INVITATION_TEMPLATE_CATEGORY_LABELS[item]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 h-11">
            <span className="text-xs font-bold uppercase text-gray-400">
              Public
            </span>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>
          <Select
            value={canvasFormatValue}
            onValueChange={(value) => {
              if (value === "CUSTOM") return;
              const [w, h] = value.split(":").map(Number);
              commitLayout((c) => ({
                ...c,
                canvas: {
                  ...c.canvas,
                  width: w || 4,
                  height: h || 5,
                },
              }));
            }}
          >
            <SelectTrigger className="h-11 w-44 rounded-xl border-white/10 bg-white/5 text-white">
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-[#0f0f0f] text-white">
              <SelectItem value="CUSTOM" disabled>
                Personnalise
              </SelectItem>
              {CANVAS_FORMATS.map((format) => (
                <SelectItem key={format.value} value={format.value}>
                  {format.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                L
              </span>
              <Input
                type="number"
                min={1}
                max={100}
                step={0.1}
                value={formatCanvasNumber(layout.canvas.width)}
                onChange={(event) =>
                  updateCanvasDimension("width", Number(event.target.value))
                }
                className="h-11 w-24 rounded-xl border-white/10 bg-white/5 text-white"
              />
            </label>
            <label className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                H
              </span>
              <Input
                type="number"
                min={1}
                max={100}
                step={0.1}
                value={formatCanvasNumber(layout.canvas.height)}
                onChange={(event) =>
                  updateCanvasDimension("height", Number(event.target.value))
                }
                className="h-11 w-24 rounded-xl border-white/10 bg-white/5 text-white"
              />
            </label>
          </div>
          <Button
            onClick={saveTemplate}
            disabled={isPending || isUploading}
            className="h-11 rounded-xl bg-primary px-5 font-black uppercase italic text-black hover:bg-white"
          >
            {isPending ? <Loader2 className="animate-spin" /> : <Save />}
            Enregistrer
          </Button>
        </div>
      </div>

      <div className="grid min-h-[calc(100vh-140px)] xl:h-[calc(100vh-140px)] h-[calc(100vh-140px)] grid-cols-1 gap-5 xl:grid-cols-[260px_minmax(0,1fr)_300px] xl:overflow-hidden">
        <aside className="space-y-4 rounded-2xl border border-white/10 bg-black/40 p-4 xl:overflow-y-auto custom-scrollbar">
          <PanelTitle icon={Layers} label="Outils" />

          <div className="flex flex-col gap-2">
            <ToolButton
              icon={Type}
              label="Texte"
              onClick={() => addTool("text")}
              dragType="text"
            />
            <ToolButton
              icon={QrCode}
              label="QR Code"
              onClick={() => addTool("qrcode")}
              dragType="qrcode"
            />
            <ToolButton
              icon={Square}
              label="Cadre"
              onClick={() => addTool("shape")}
              dragType="shape"
            />
          </div>

          <p className="pt-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
            Invité
          </p>
          <div className="flex flex-col gap-2">
            <ToolButton
              icon={Braces}
              label="{{guest_name}}"
              onClick={() => addTool("guest_name")}
              dragType="guest_name"
            />
            <ToolButton
              icon={Braces}
              label="{{guest_table}}"
              onClick={() => addTool("guest_table")}
              dragType="guest_table"
            />
            <ToolButton
              icon={Braces}
              label="{{guest_seats}}"
              onClick={() => addTool("guest_seats")}
              dragType="guest_seats"
            />
            <ToolButton
              icon={Braces}
              label="{{guest_people_count}}"
              onClick={() => addTool("guest_people_count")}
              dragType="guest_people_count"
            />
            <ToolButton
              icon={Braces}
              label="{{guest_email}}"
              onClick={() => addTool("guest_email")}
              dragType="guest_email"
            />
            <ToolButton
              icon={Braces}
              label="{{guest_whatsapp}}"
              onClick={() => addTool("guest_whatsapp")}
              dragType="guest_whatsapp"
            />
          </div>

          <p className="pt-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
            Événement
          </p>
          <div className="flex flex-col gap-2">
            <ToolButton
              icon={Braces}
              label="{{event_name}}"
              onClick={() => addTool("event_name")}
              dragType="event_name"
            />
            <ToolButton
              icon={Braces}
              label="{{event_date}}"
              onClick={() => addTool("event_date")}
              dragType="event_date"
            />
            <ToolButton
              icon={Braces}
              label="{{event_duration}}"
              onClick={() => addTool("event_duration")}
              dragType="event_duration"
            />
            <ToolButton
              icon={Braces}
              label="{{event_location}}"
              onClick={() => addTool("event_location")}
              dragType="event_location"
            />
            <ToolButton
              icon={Braces}
              label="{{event_full_location}}"
              onClick={() => addTool("event_full_location")}
              dragType="event_full_location"
            />
            <ToolButton
              icon={Braces}
              label="{{event_description}}"
              onClick={() => addTool("event_description")}
              dragType="event_description"
            />
            <ToolButton
              icon={Braces}
              label="{{event_message}}"
              onClick={() => addTool("event_message")}
              dragType="event_message"
            />
          </div>

          <div className="h-px bg-white/10" />

          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => handleImageUpload(event.target.files?.[0])}
          />
          <input
            ref={backgroundInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) =>
              handleBackgroundUpload(event.target.files?.[0])
            }
          />
          <Button
            type="button"
            variant="outline"
            disabled={isUploading}
            onClick={() => imageInputRef.current?.click()}
            className="h-12 w-full rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
          >
            {isUploading ? <Loader2 className="animate-spin" /> : <ImagePlus />}
            Image (WebP / SVG)
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isUploading}
              onClick={() => backgroundInputRef.current?.click()}
              className="h-12 flex-1 rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            >
              <Palette />
              Fond
            </Button>
            {layout.canvas.backgroundImageUrl && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  if (layout.canvas.backgroundImageUrl) {
                    deleteImage(layout.canvas.backgroundImageUrl);
                  }
                  commitLayout((current) => ({
                    ...current,
                    canvas: {
                      ...current.canvas,
                      backgroundImageUrl: undefined,
                    },
                  }));
                }}
                className="h-12 w-12 flex-none rounded-xl p-0"
                title="Supprimer l'image de fond"
              >
                <Trash2 className="size-5" />
              </Button>
            )}
          </div>

          <div className="space-y-4 pt-4">
            {layout.canvas.backgroundImageUrl ? (
              <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                    Cadrage du fond
                  </p>
                  <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    {layout.canvas.backgroundImageLocked ? (
                      <Lock className="size-3" />
                    ) : (
                      <Unlock className="size-3" />
                    )}
                    <Switch
                      checked={Boolean(layout.canvas.backgroundImageLocked)}
                      onCheckedChange={(checked) =>
                        commitLayout((current) => ({
                          ...current,
                          canvas: {
                            ...current.canvas,
                            backgroundImageLocked: checked,
                          },
                        }))
                      }
                    />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <NumberInput
                    label="X"
                    disabled={layout.canvas.backgroundImageLocked}
                    value={layout.canvas.backgroundImageX ?? 50}
                    onChange={(value) =>
                      commitLayout((current) => ({
                        ...current,
                        canvas: {
                          ...current.canvas,
                          backgroundImageX: clamp(value, 0, 100),
                        },
                      }))
                    }
                  />
                  <NumberInput
                    label="Y"
                    disabled={layout.canvas.backgroundImageLocked}
                    value={layout.canvas.backgroundImageY ?? 50}
                    onChange={(value) =>
                      commitLayout((current) => ({
                        ...current,
                        canvas: {
                          ...current.canvas,
                          backgroundImageY: clamp(value, 0, 100),
                        },
                      }))
                    }
                  />
                  <NumberInput
                    label="Zoom"
                    disabled={layout.canvas.backgroundImageLocked}
                    value={layout.canvas.backgroundImageScale ?? 100}
                    onChange={(value) =>
                      commitLayout((current) => ({
                        ...current,
                        canvas: {
                          ...current.canvas,
                          backgroundImageScale: clamp(value, 20, 300),
                        },
                      }))
                    }
                  />
                  <NumberInput
                    label="N&B"
                    disabled={layout.canvas.backgroundImageLocked}
                    value={layout.canvas.backgroundImageGrayscale ?? 0}
                    onChange={(value) =>
                      commitLayout((current) => ({
                        ...current,
                        canvas: {
                          ...current.canvas,
                          backgroundImageGrayscale: clamp(value, 0, 100),
                        },
                      }))
                    }
                  />
                  <NumberInput
                    label="Lum."
                    disabled={layout.canvas.backgroundImageLocked}
                    value={layout.canvas.backgroundImageBrightness ?? 100}
                    onChange={(value) =>
                      commitLayout((current) => ({
                        ...current,
                        canvas: {
                          ...current.canvas,
                          backgroundImageBrightness: clamp(value, 0, 200),
                        },
                      }))
                    }
                  />
                  <NumberInput
                    label="Contr."
                    disabled={layout.canvas.backgroundImageLocked}
                    value={layout.canvas.backgroundImageContrast ?? 100}
                    onChange={(value) =>
                      commitLayout((current) => ({
                        ...current,
                        canvas: {
                          ...current.canvas,
                          backgroundImageContrast: clamp(value, 0, 200),
                        },
                      }))
                    }
                  />
                </div>
              </div>
            ) : null}

            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                  Zone de securite
                </p>
                <Switch
                  checked={Boolean(layout.canvas.showSafeZone)}
                  onCheckedChange={(checked) =>
                    commitLayout((current) => ({
                      ...current,
                      canvas: {
                        ...current.canvas,
                        showSafeZone: checked,
                      },
                    }))
                  }
                />
              </div>
              {layout.canvas.showSafeZone ? (
                <NumberInput
                  label="Marge"
                  value={layout.canvas.safeZoneInset ?? 6}
                  onChange={(value) =>
                    commitLayout((current) => ({
                      ...current,
                      canvas: {
                        ...current.canvas,
                        safeZoneInset: clamp(value, 0, 30),
                      },
                    }))
                  }
                />
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                Couleur de fond
              </label>
              <Input
                type="color"
                value={layout.canvas.backgroundColor}
                onChange={(event) =>
                  commitLayout((current) => ({
                    ...current,
                    canvas: {
                      ...current.canvas,
                      backgroundColor: event.target.value,
                    },
                  }))
                }
                className="h-11 rounded-xl border-white/10 bg-white/5 p-1"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-500">
                <span>Arrondi (Rayon)</span>
                <span>{layout.canvas.borderRadius}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="64"
                value={layout.canvas.borderRadius}
                onChange={(e) =>
                  commitLayout((current) => ({
                    ...current,
                    canvas: {
                      ...current.canvas,
                      borderRadius: Number(e.target.value),
                    },
                  }))
                }
                className="w-full accent-primary"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-500">
                <span>Epaisseur bordure</span>
                <span>{layout.canvas.borderWidth || 0}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                value={layout.canvas.borderWidth || 0}
                onChange={(e) =>
                  commitLayout((current) => ({
                    ...current,
                    canvas: {
                      ...current.canvas,
                      borderWidth: Number(e.target.value),
                    },
                  }))
                }
                className="w-full accent-primary"
              />
            </div>

            {(layout.canvas.borderWidth || 0) > 0 && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                  Couleur de la bordure
                </label>
                <Input
                  type="color"
                  value={layout.canvas.borderColor || "#ffffff"}
                  onChange={(event) =>
                    commitLayout((current) => ({
                      ...current,
                      canvas: {
                        ...current.canvas,
                        borderColor: event.target.value,
                      },
                    }))
                  }
                  className="h-11 rounded-xl border-white/10 bg-white/5 p-1"
                />
              </div>
            )}
          </div>
        </aside>

        <main className="flex min-h-180 items-start justify-center rounded-2xl border border-white/10 bg-[#0b0b0b] p-4 xl:min-h-0 xl:overflow-y-auto custom-scrollbar">
          <div
            ref={canvasRef}
            className="w-full max-w-107.5 flex-none"
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
            onPointerDown={() => setSelectedId(null)}
          >
            <InvitationRenderer
              templateData={layout}
              guestData={PREVIEW_GUEST}
              interactive
              selectedElementId={selectedId}
              onSelectElement={setSelectedId}
              onPointerDownElement={(event, element) =>
                startDrag(event, element, "move")
              }
              renderResizeHandle={(element) =>
                element.locked ? null : (
                  <button
                    type="button"
                    aria-label="Redimensionner"
                    className="absolute -bottom-2 -right-2 size-5 rounded-full border border-black bg-primary shadow-lg"
                    onPointerDown={(event) => {
                      event.stopPropagation();
                      startDrag(event, element, "resize");
                    }}
                  />
                )
              }
            />
          </div>
        </main>

        <aside className="space-y-4 rounded-2xl border border-white/10 bg-black/40 p-4 xl:overflow-y-auto custom-scrollbar">
          <PanelTitle icon={SquareDashedMousePointer} label="Inspecteur" />

          {selectedElement ? (
            <Inspector
              element={selectedElement}
              onChange={updateSelectedElement}
              onDuplicate={duplicateSelectedElement}
              onDelete={deleteSelectedElement}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 p-5 text-center text-sm text-gray-500">
              Selectionnez un element du canvas pour modifier son style.
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

function Inspector({
  element,
  onChange,
  onDuplicate,
  onDelete,
}: {
  element: InvitationTemplateElement;
  onChange: (
    updater: (element: InvitationTemplateElement) => InvitationTemplateElement,
  ) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const updateText = (
    updater: (
      element: InvitationTemplateTextElement,
    ) => InvitationTemplateTextElement,
  ) => {
    if (element.type !== "text" && element.type !== "variable") return;
    onChange((current) =>
      current.type === "text" || current.type === "variable"
        ? updater(current)
        : current,
    );
  };

  const updateImage = (
    updater: (
      element: InvitationTemplateImageElement,
    ) => InvitationTemplateImageElement,
  ) => {
    if (element.type !== "image") return;
    onChange((current) =>
      current.type === "image" ? updater(current) : current,
    );
  };

  const updateQRCode = (
    updater: (
      element: InvitationTemplateQRCodeElement,
    ) => InvitationTemplateQRCodeElement,
  ) => {
    if (element.type !== "qrcode") return;
    onChange((current) =>
      current.type === "qrcode" ? updater(current) : current,
    );
  };

  const updateShape = (
    updater: (
      element: InvitationTemplateShapeElement,
    ) => InvitationTemplateShapeElement,
  ) => {
    if (element.type !== "shape") return;
    onChange((current) =>
      current.type === "shape" ? updater(current) : current,
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <NumberInput
          label="X"
          value={element.x}
          onChange={(value) =>
            onChange((current) => ({
              ...current,
              x: clampElementX(value, current),
            }))
          }
        />
        <NumberInput
          label="Y"
          value={element.y}
          onChange={(value) =>
            onChange((current) => ({
              ...current,
              y: clampElementY(value, current),
            }))
          }
        />
        <NumberInput
          label="Largeur"
          value={element.width}
          onChange={(value) =>
            onChange((current) => ({ ...current, width: clamp(value, 2, 200) }))
          }
        />
        <NumberInput
          label="Hauteur"
          value={element.height}
          onChange={(value) =>
            onChange((current) => ({
              ...current,
              height: clamp(value, 2, 200),
            }))
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <NumberInput
          label="Z-Index"
          value={element.zIndex}
          onChange={(value) =>
            onChange((current) => ({
              ...current,
              zIndex: clamp(value, 0, 999),
            }))
          }
        />
        <NumberInput
          label="Opacite %"
          value={Math.round(element.opacity * 100)}
          onChange={(value) =>
            onChange((current) => ({
              ...current,
              opacity: clamp(value, 0, 100) / 100,
            }))
          }
        />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
          Calques
        </label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              onChange((current) => ({
                ...current,
                zIndex: clamp(current.zIndex + 1, 0, 999),
              }))
            }
            className="h-10 rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
          >
            <Layers className="size-4" />
            Plus haut
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              onChange((current) => ({
                ...current,
                zIndex: clamp(current.zIndex - 1, 0, 999),
              }))
            }
            className="h-10 rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
          >
            <Layers className="size-4" />
            Plus bas
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              onChange((current) => ({
                ...current,
                zIndex: 0,
              }))
            }
            className="h-10 rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
          >
            Arriere
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              onChange((current) => ({
                ...current,
                zIndex: 999,
              }))
            }
            className="h-10 rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
          >
            Avant
          </Button>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={() =>
          onChange((current) => ({
            ...current,
            locked: !current.locked,
          }))
        }
        className={`h-11 w-full rounded-xl border-white/10 ${
          element.locked
            ? "bg-primary text-black hover:bg-white"
            : "bg-white/5 text-white hover:bg-white/10 hover:text-white"
        }`}
      >
        {element.locked ? <Lock /> : <Unlock />}
        {element.locked ? "Verrouille" : "Verrouiller"}
      </Button>

      <Button
        type="button"
        variant="outline"
        onClick={onDuplicate}
        className="h-11 w-full rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
      >
        <Copy />
        Dupliquer
      </Button>

      <div className="space-y-3 rounded-2xl border border-white/10 bg-white/3 p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
            Ombre
          </p>
          <Switch
            checked={Boolean(element.shadow?.enabled)}
            onCheckedChange={(checked) =>
              onChange((current) => ({
                ...current,
                shadow: {
                  ...(current.shadow ?? {
                    x: 0,
                    y: 4,
                    blur: 12,
                    color: "#000000",
                    opacity: 0.35,
                  }),
                  enabled: checked,
                },
              }))
            }
          />
        </div>
        {element.shadow?.enabled ? (
          <div className="grid grid-cols-2 gap-3">
            <NumberInput
              label="X"
              value={element.shadow.x}
              onChange={(value) =>
                onChange((current) => ({
                  ...current,
                  shadow: {
                    ...current.shadow!,
                    x: clamp(value, -40, 40),
                  },
                }))
              }
            />
            <NumberInput
              label="Y"
              value={element.shadow.y}
              onChange={(value) =>
                onChange((current) => ({
                  ...current,
                  shadow: {
                    ...current.shadow!,
                    y: clamp(value, -40, 40),
                  },
                }))
              }
            />
            <NumberInput
              label="Flou"
              value={element.shadow.blur}
              onChange={(value) =>
                onChange((current) => ({
                  ...current,
                  shadow: {
                    ...current.shadow!,
                    blur: clamp(value, 0, 80),
                  },
                }))
              }
            />
            <NumberInput
              label="Opacite"
              value={Math.round(element.shadow.opacity * 100)}
              onChange={(value) =>
                onChange((current) => ({
                  ...current,
                  shadow: {
                    ...current.shadow!,
                    opacity: clamp(value, 0, 100) / 100,
                  },
                }))
              }
            />
            <label className="col-span-2 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                Couleur
              </span>
              <Input
                type="color"
                value={element.shadow.color}
                onChange={(event) =>
                  onChange((current) => ({
                    ...current,
                    shadow: {
                      ...current.shadow!,
                      color: event.target.value,
                    },
                  }))
                }
                className="h-10 rounded-xl border-white/10 bg-white/5 p-1"
              />
            </label>
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
          Alignement Horizontal (Canva)
        </label>
        <div className="grid grid-cols-3 gap-2">
          <Button
            type="button"
            variant="outline"
            title="Aligner a gauche"
            onClick={() => onChange((current) => ({ ...current, x: 0 }))}
            className="h-10 rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
          >
            <AlignLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            title="Centrer horizontalement"
            onClick={() =>
              onChange((current) => ({
                ...current,
                x: (100 - current.width) / 2,
              }))
            }
            className="h-10 rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
          >
            <AlignCenter className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            title="Aligner a droite"
            onClick={() =>
              onChange((current) => ({ ...current, x: 100 - current.width }))
            }
            className="h-10 rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
          >
            <AlignRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
          Alignement Vertical (Canva)
        </label>
        <div className="grid grid-cols-3 gap-2">
          <Button
            type="button"
            variant="outline"
            title="Aligner en haut"
            onClick={() => onChange((current) => ({ ...current, y: 0 }))}
            className="h-10 rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
          >
            <AlignVerticalJustifyStart className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            title="Centrer verticalement"
            onClick={() =>
              onChange((current) => {
                const maxY = Math.max(0, 100 - current.height);

                return {
                  ...current,
                  y: maxY / 2,
                };
              })
            }
            className="h-10 rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
          >
            <AlignVerticalJustifyCenter className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            title="Aligner en bas"
            onClick={() =>
              onChange((current) => ({
                ...current,
                y: Math.max(0, 100 - current.height),
              }))
            }
            className="h-10 rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
          >
            <AlignVerticalJustifyEnd className="size-4" />
          </Button>
        </div>
      </div>

      {element.type === "image" ? (
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
            Ajustement image
          </label>
          <Select
            value={element.objectFit}
            onValueChange={(value) =>
              updateImage((current) => ({
                ...current,
                objectFit: value as InvitationTemplateImageElement["objectFit"],
              }))
            }
          >
            <SelectTrigger className="h-10 w-full rounded-xl border-white/10 bg-white/5 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-[#0f0f0f] text-white">
              <SelectItem value="cover">Couvrir</SelectItem>
              <SelectItem value="contain">Contenir</SelectItem>
              <SelectItem value="fill">Etirer</SelectItem>
            </SelectContent>
          </Select>
          <div className="grid grid-cols-3 gap-3">
            <NumberInput
              label="Lum."
              value={element.filters?.brightness ?? 100}
              onChange={(value) =>
                updateImage((current) => ({
                  ...current,
                  filters: {
                    ...(current.filters ?? {
                      brightness: 100,
                      contrast: 100,
                      grayscale: 0,
                    }),
                    brightness: clamp(value, 0, 200),
                  },
                }))
              }
            />
            <NumberInput
              label="Contr."
              value={element.filters?.contrast ?? 100}
              onChange={(value) =>
                updateImage((current) => ({
                  ...current,
                  filters: {
                    ...(current.filters ?? {
                      brightness: 100,
                      contrast: 100,
                      grayscale: 0,
                    }),
                    contrast: clamp(value, 0, 200),
                  },
                }))
              }
            />
            <NumberInput
              label="N&B"
              value={element.filters?.grayscale ?? 0}
              onChange={(value) =>
                updateImage((current) => ({
                  ...current,
                  filters: {
                    ...(current.filters ?? {
                      brightness: 100,
                      contrast: 100,
                      grayscale: 0,
                    }),
                    grayscale: clamp(value, 0, 100),
                  },
                }))
              }
            />
          </div>
        </div>
      ) : element.type === "qrcode" ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                QR
              </span>
              <Input
                type="color"
                value={element.fgColor}
                onChange={(event) =>
                  updateQRCode((current) => ({
                    ...current,
                    fgColor: event.target.value,
                  }))
                }
                className="h-10 rounded-xl border-white/10 bg-white/5 p-1"
              />
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                Fond
              </span>
              <Input
                type="color"
                value={element.bgColor}
                onChange={(event) =>
                  updateQRCode((current) => ({
                    ...current,
                    bgColor: event.target.value,
                  }))
                }
                className="h-10 rounded-xl border-white/10 bg-white/5 p-1"
              />
            </label>
          </div>
          <div className="grid grid-cols-[1fr_auto] items-end gap-3">
            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                ECC
              </span>
              <Select
                value={element.eccLevel}
                onValueChange={(value) =>
                  updateQRCode((current) => ({
                    ...current,
                    eccLevel:
                      value as InvitationTemplateQRCodeElement["eccLevel"],
                  }))
                }
              >
                <SelectTrigger className="h-10 w-full rounded-xl border-white/10 bg-white/5 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-[#0f0f0f] text-white">
                  <SelectItem value="L">L</SelectItem>
                  <SelectItem value="M">M</SelectItem>
                  <SelectItem value="Q">Q</SelectItem>
                  <SelectItem value="H">H</SelectItem>
                </SelectContent>
              </Select>
            </label>
            <label className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-bold uppercase text-gray-400">
              Logo
              <Switch
                checked={element.showLogo}
                onCheckedChange={(checked) =>
                  updateQRCode((current) => ({
                    ...current,
                    showLogo: checked,
                  }))
                }
              />
            </label>
          </div>
        </div>
      ) : element.type === "shape" ? (
        <div className="space-y-3">
          <label className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
              Remplissage
            </span>
            <Select
              value={element.fillType}
              onValueChange={(value) =>
                updateShape((current) => ({
                  ...current,
                  fillType: value as InvitationTemplateShapeElement["fillType"],
                }))
              }
            >
              <SelectTrigger className="h-10 w-full rounded-xl border-white/10 bg-white/5 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-[#0f0f0f] text-white">
                <SelectItem value="solid">Couleur</SelectItem>
                <SelectItem value="gradient">Gradient</SelectItem>
              </SelectContent>
            </Select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                Couleur
              </span>
              <Input
                type="color"
                value={element.fillColor}
                onChange={(event) =>
                  updateShape((current) => ({
                    ...current,
                    fillColor: event.target.value,
                  }))
                }
                className="h-10 rounded-xl border-white/10 bg-white/5 p-1"
              />
            </label>
            <NumberInput
              label="Rayon %"
              value={element.borderRadius}
              onChange={(value) =>
                updateShape((current) => ({
                  ...current,
                  borderRadius: clamp(value, 0, 100),
                }))
              }
            />
          </div>

          {element.fillType === "gradient" ? (
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                  De
                </span>
                <Input
                  type="color"
                  value={element.gradientFrom}
                  onChange={(event) =>
                    updateShape((current) => ({
                      ...current,
                      gradientFrom: event.target.value,
                    }))
                  }
                  className="h-10 rounded-xl border-white/10 bg-white/5 p-1"
                />
              </label>
              <label className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                  A
                </span>
                <Input
                  type="color"
                  value={element.gradientTo}
                  onChange={(event) =>
                    updateShape((current) => ({
                      ...current,
                      gradientTo: event.target.value,
                    }))
                  }
                  className="h-10 rounded-xl border-white/10 bg-white/5 p-1"
                />
              </label>
              <NumberInput
                label="Angle"
                value={element.gradientAngle}
                onChange={(value) =>
                  updateShape((current) => ({
                    ...current,
                    gradientAngle: clamp(value, 0, 360),
                  }))
                }
              />
            </div>
          ) : null}
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
              Contenu
            </label>
            <RichTextEditor element={element} onChange={updateText} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <NumberInput
              label="Taille"
              value={element.style.fontSize}
              step={0.2}
              onChange={(value) =>
                updateText((current) => ({
                  ...current,
                  style: { ...current.style, fontSize: clamp(value, 1, 18) },
                }))
              }
            />
            <NumberInput
              label="Graisse"
              value={element.style.fontWeight}
              step={100}
              onChange={(value) =>
                updateText((current) => ({
                  ...current,
                  style: {
                    ...current.style,
                    fontWeight: clamp(value, 100, 900),
                  },
                }))
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                updateText((current) => ({
                  ...current,
                  style: {
                    ...current.style,
                    fontStyle:
                      current.style.fontStyle === "italic"
                        ? "normal"
                        : "italic",
                  },
                }))
              }
              className={`h-10 rounded-xl border-white/10 ${
                element.style.fontStyle === "italic"
                  ? "bg-primary text-black"
                  : "bg-white/5 text-white hover:bg-white/10 hover:text-white"
              }`}
            >
              <Italic className="size-4" />
              Italic
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                updateText((current) => ({
                  ...current,
                  style: {
                    ...current.style,
                    textDecoration:
                      current.style.textDecoration === "underline"
                        ? "none"
                        : "underline",
                  },
                }))
              }
              className={`h-10 rounded-xl border-white/10 ${
                element.style.textDecoration === "underline"
                  ? "bg-primary text-black"
                  : "bg-white/5 text-white hover:bg-white/10 hover:text-white"
              }`}
            >
              <Underline className="size-4" />
              Souligne
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
              Casse
            </label>
            <Select
              value={element.style.textTransform ?? "none"}
              onValueChange={(value) =>
                updateText((current) => ({
                  ...current,
                  style: {
                    ...current.style,
                    textTransform:
                      value as InvitationTemplateTextElement["style"]["textTransform"],
                  },
                }))
              }
            >
              <SelectTrigger className="h-10 w-full rounded-xl border-white/10 bg-white/5 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-[#0f0f0f] text-white">
                <SelectItem value="none">Normal</SelectItem>
                <SelectItem value="uppercase">UPPERCASE</SelectItem>
                <SelectItem value="lowercase">lowercase</SelectItem>
                <SelectItem value="sentence">Phrase</SelectItem>
                <SelectItem value="capitalize">Chaque Mot</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
              Police
            </label>
            <Select
              value={element.style.fontFamily}
              onValueChange={(value) =>
                updateText((current) => ({
                  ...current,
                  style: {
                    ...current.style,
                    fontFamily:
                      value as InvitationTemplateTextElement["style"]["fontFamily"],
                  },
                }))
              }
            >
              <SelectTrigger className="h-10 w-full rounded-xl border-white/10 bg-white/5 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-[#0f0f0f] text-white">
                {INVITATION_TEMPLATE_FONTS.map((font) => (
                  <SelectItem
                    key={font}
                    value={font}
                    style={{ fontFamily: editorFontStack(font) }}
                  >
                    {INVITATION_TEMPLATE_FONT_LABELS[font]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
              Couleur
            </label>
            <Input
              type="color"
              value={element.style.color}
              onChange={(event) =>
                updateText((current) => ({
                  ...current,
                  style: { ...current.style, color: event.target.value },
                }))
              }
              className="h-10 rounded-xl border-white/10 bg-white/5 p-1"
            />
          </div>

          <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                Gradient texte
              </p>
              <Switch
                checked={Boolean(element.style.gradientEnabled)}
                onCheckedChange={(checked) =>
                  updateText((current) => ({
                    ...current,
                    style: {
                      ...current.style,
                      gradientEnabled: checked,
                    },
                  }))
                }
              />
            </div>
            {element.style.gradientEnabled ? (
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                    De
                  </span>
                  <Input
                    type="color"
                    value={element.style.gradientFrom ?? "#F59E0B"}
                    onChange={(event) =>
                      updateText((current) => ({
                        ...current,
                        style: {
                          ...current.style,
                          gradientFrom: event.target.value,
                        },
                      }))
                    }
                    className="h-10 rounded-xl border-white/10 bg-white/5 p-1"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                    A
                  </span>
                  <Input
                    type="color"
                    value={element.style.gradientTo ?? "#FFFFFF"}
                    onChange={(event) =>
                      updateText((current) => ({
                        ...current,
                        style: {
                          ...current.style,
                          gradientTo: event.target.value,
                        },
                      }))
                    }
                    className="h-10 rounded-xl border-white/10 bg-white/5 p-1"
                  />
                </label>
                <NumberInput
                  label="Angle"
                  value={element.style.gradientAngle ?? 90}
                  onChange={(value) =>
                    updateText((current) => ({
                      ...current,
                      style: {
                        ...current.style,
                        gradientAngle: clamp(value, 0, 360),
                      },
                    }))
                  }
                />
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { value: "left", icon: AlignLeft },
              { value: "center", icon: AlignCenter },
              { value: "right", icon: AlignRight },
            ].map(({ value, icon: Icon }) => (
              <Button
                key={value}
                type="button"
                variant="outline"
                onClick={() =>
                  updateText((current) => ({
                    ...current,
                    style: {
                      ...current.style,
                      textAlign: value as InvitationTextAlign,
                    },
                  }))
                }
                className={`h-10 rounded-xl border-white/10 ${
                  element.style.textAlign === value
                    ? "bg-primary text-black"
                    : "bg-white/5 text-white hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon />
              </Button>
            ))}
          </div>
        </>
      )}

      <Button
        type="button"
        variant="destructive"
        onClick={onDelete}
        className="h-11 w-full rounded-xl font-black uppercase italic"
      >
        <Trash2 />
        Supprimer
      </Button>
    </div>
  );
}

function RichTextEditor({
  element,
  onChange,
}: {
  element: InvitationTemplateTextElement;
  onChange: (
    updater: (
      element: InvitationTemplateTextElement,
    ) => InvitationTemplateTextElement,
  ) => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const initialHtml =
    element.richContent || escapeHtml(element.content).replaceAll("\n", "<br>");

  useEffect(() => {
    if (!editorRef.current || document.activeElement === editorRef.current) {
      return;
    }

    editorRef.current.innerHTML = initialHtml;
  }, [element.id, initialHtml]);

  const syncContent = () => {
    const html = editorRef.current?.innerHTML || "";
    const text = editorRef.current?.innerText || "";

    onChange((current) => ({
      ...current,
      content: text,
      richContent: html,
    }));
  };

  const applyCommand = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    syncContent();
  };

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
      <div className="flex flex-wrap items-center gap-1 border-b border-white/10 bg-black/30 p-2">
        <Button
          type="button"
          variant="ghost"
          title="Gras"
          onMouseDown={(event) => {
            event.preventDefault();
            applyCommand("bold");
          }}
          className="size-9 rounded-lg p-0 text-white hover:bg-white/10 hover:text-white"
        >
          <Bold className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          title="Italique"
          onMouseDown={(event) => {
            event.preventDefault();
            applyCommand("italic");
          }}
          className="size-9 rounded-lg p-0 text-white hover:bg-white/10 hover:text-white"
        >
          <Italic className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          title="Souligner"
          onMouseDown={(event) => {
            event.preventDefault();
            applyCommand("underline");
          }}
          className="size-9 rounded-lg p-0 text-white hover:bg-white/10 hover:text-white"
        >
          <Underline className="size-4" />
        </Button>
        <Input
          type="color"
          title="Couleur du texte selectionne"
          onMouseDown={(event) => event.preventDefault()}
          onChange={(event) => applyCommand("foreColor", event.target.value)}
          className="h-9 w-12 rounded-lg border-white/10 bg-white/5 p-1"
        />
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={syncContent}
        onBlur={syncContent}
        className="min-h-28 px-3 py-2 text-sm text-white outline-none"
        style={{
          fontFamily: editorFontStack(element.style.fontFamily),
        }}
      />
    </div>
  );
}

function NumberInput({
  label,
  value,
  disabled = false,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  disabled?: boolean;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="space-y-1">
      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
        {label}
      </span>
      <Input
        type="number"
        step={step}
        disabled={disabled}
        value={Number(value.toFixed(2))}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-10 rounded-xl border-white/10 bg-white/5 text-white"
      />
    </label>
  );
}

function ToolButton({
  icon: Icon,
  label,
  onClick,
  dragType,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  dragType: ToolKind;
}) {
  return (
    <button
      type="button"
      draggable
      onClick={onClick}
      onDragStart={(event) =>
        event.dataTransfer.setData("application/x-yambipass-tool", dragType)
      }
      className="flex h-12 w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 text-left text-sm font-bold text-white transition hover:bg-white/10 hover:text-white"
    >
      <Icon className="size-4 text-primary" />
      {label}
      <Move className="ml-auto size-4 text-gray-600" />
    </button>
  );
}

function PanelTitle({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-primary">
      <Icon className="size-4" />
      {label}
    </div>
  );
}

function getCanvasFormatValue(width: number, height: number) {
  const match = CANVAS_FORMATS.find(
    (format) =>
      Math.abs(format.width - width) < 0.01 &&
      Math.abs(format.height - height) < 0.01,
  );

  return match?.value || "CUSTOM";
}

function formatCanvasNumber(value: number) {
  return Number(value.toFixed(1));
}

function createEditorElementId() {
  return `el_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function editorFontStack(fontFamily: string) {
  if (fontFamily === "Great Vibes")
    return "var(--font-great-vibes), Georgia, serif";
  if (fontFamily === "Courgette")
    return "var(--font-courgette), Georgia, serif";
  if (fontFamily === "Georgia") return "Georgia, serif";
  if (fontFamily === "Arial") return "Arial, sans-serif";

  return `"${fontFamily}", var(--font-invitation-inter), Arial, sans-serif`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function snapElementPosition(
  position: { x: number; y: number },
  element: InvitationTemplateElement,
  siblings: InvitationTemplateElement[],
) {
  const threshold = 1.2;
  const horizontalTargets = [0, 50, 100];
  const verticalTargets = [0, 50, 100];

  for (const sibling of siblings) {
    horizontalTargets.push(
      sibling.x,
      sibling.x + sibling.width / 2,
      sibling.x + sibling.width,
    );
    verticalTargets.push(
      sibling.y,
      sibling.y + sibling.height / 2,
      sibling.y + sibling.height,
    );
  }

  let nextX = position.x;
  let nextY = position.y;
  const elementHorizontalAnchors = [
    { target: position.x, offset: 0 },
    { target: position.x + element.width / 2, offset: element.width / 2 },
    { target: position.x + element.width, offset: element.width },
  ];
  const elementVerticalAnchors = [
    { target: position.y, offset: 0 },
    { target: position.y + element.height / 2, offset: element.height / 2 },
    { target: position.y + element.height, offset: element.height },
  ];

  for (const anchor of elementHorizontalAnchors) {
    const target = horizontalTargets.find(
      (candidate) => Math.abs(candidate - anchor.target) <= threshold,
    );
    if (target !== undefined) {
      nextX = target - anchor.offset;
      break;
    }
  }

  for (const anchor of elementVerticalAnchors) {
    const target = verticalTargets.find(
      (candidate) => Math.abs(candidate - anchor.target) <= threshold,
    );
    if (target !== undefined) {
      nextY = target - anchor.offset;
      break;
    }
  }

  return {
    x: clampElementX(nextX, element),
    y: clampElementY(nextY, element),
  };
}

function clampElementX(value: number, element: InvitationTemplateElement) {
  return clamp(value, -element.width + 2, 98);
}

function clampElementY(value: number, element: InvitationTemplateElement) {
  return clamp(value, -element.height + 2, 98);
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;

  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  );
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

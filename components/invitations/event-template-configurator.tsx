"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Edit3, LayoutTemplate, Loader2, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InvitationRenderer } from "@/components/invitations/invitation-renderer";
import { installEventInvitationTemplateAction } from "@/app/admin/invitation-templates/actions";
import type { InvitationTemplateSummary } from "@/types/invitation-template";

type TemplateResponse = {
  templates: InvitationTemplateSummary[];
  selectedTemplateId: number | null;
};

const PREVIEW_GUEST = {
  name: "Fr BODRICK M.",
  table: "ACCES PPANK",
  peopleCount: 2,
  seatsAssigned: 1,
  email: "invite@yambipass.com",
  whatsapp: "243900000000",
  qrCodeData: "YAMBIPASS-PREVIEW-QR",
};

export function EventTemplateConfigurator({
  eventId,
  initialTemplateId,
}: {
  eventId: number;
  initialTemplateId?: number | null;
}) {
  const [templates, setTemplates] = useState<InvitationTemplateSummary[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(
    initialTemplateId ?? null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let ignore = false;

    async function loadTemplates() {
      setIsLoading(true);

      try {
        const response = await fetch(`/api/invitation-templates?eventId=${eventId}`);
        const payload = (await response.json()) as TemplateResponse | { error: string };

        if (!response.ok) {
          throw new Error("error" in payload ? payload.error : "Erreur");
        }

        if (!ignore && "templates" in payload) {
          setTemplates(payload.templates);
          setSelectedTemplateId(payload.selectedTemplateId ?? initialTemplateId ?? null);
        }
      } catch (error) {
        console.error(error);
        if (!ignore) toast.error("Impossible de charger les modeles.");
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    loadTemplates();

    return () => {
      ignore = true;
    };
  }, [eventId, initialTemplateId]);

  const privateTemplates = useMemo(
    () => templates.filter((template) => template.userId !== null),
    [templates],
  );
  const publicTemplates = useMemo(
    () => templates.filter((template) => template.userId === null),
    [templates],
  );
  const selectedTemplate = useMemo(
    () =>
      templates.find((template) => template.id === selectedTemplateId) ?? null,
    [selectedTemplateId, templates],
  );

  const saveSelection = () => {
    startTransition(async () => {
      const result = await installEventInvitationTemplateAction(
        eventId,
        selectedTemplateId,
      );

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Visuel installe pour cet evenement.");
    });
  };

  return (
    <section className="rounded-4xl border border-white/5 bg-white/5 p-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h3 className="text-xl font-black uppercase italic text-white">
                Configuration du Visuel
              </h3>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                Template dynamique rendu depuis le layout JSON
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              className="h-10 rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              <Link href={`/admin/invitation-templates?eventId=${eventId}`}>
                <LayoutTemplate />
                Bibliotheque
              </Link>
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
            <Select
              value={selectedTemplateId ? String(selectedTemplateId) : "none"}
              onValueChange={(value) =>
                setSelectedTemplateId(value === "none" ? null : Number(value))
              }
              disabled={isLoading}
            >
              <SelectTrigger className="h-12 w-full rounded-2xl border-white/10 bg-black/30 text-white">
                <SelectValue placeholder="Selectionner un modele" />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-[#0f0f0f] text-white">
                <SelectItem value="none">Aucun modele visuel</SelectItem>

                {privateTemplates.length > 0 ? (
                  <>
                    <SelectSeparator />
                    <SelectGroup>
                      <SelectLabel>Mes modeles</SelectLabel>
                      {privateTemplates.map((template) => (
                        <SelectItem key={template.id} value={String(template.id)}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </>
                ) : null}

                {publicTemplates.length > 0 ? (
                  <>
                    <SelectSeparator />
                    <SelectGroup>
                      <SelectLabel>Modeles publics</SelectLabel>
                      {publicTemplates.map((template) => (
                        <SelectItem key={template.id} value={String(template.id)}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </>
                ) : null}
              </SelectContent>
            </Select>

            <Button
              onClick={saveSelection}
              disabled={isLoading || isPending}
              className="h-12 rounded-2xl bg-primary px-5 font-black uppercase italic text-black hover:bg-white"
            >
              {isPending ? <Loader2 className="animate-spin" /> : <Save />}
              Sauvegarder
            </Button>
          </div>

          {selectedTemplate ? (
            <div className="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-primary">
                <Sparkles className="size-3" />
                Preview instantanee
              </span>
              <span>{selectedTemplate.name}</span>
              {selectedTemplate.userId ? (
                <Button
                  asChild
                  variant="ghost"
                  className="h-8 rounded-lg px-2 text-primary hover:bg-white/10 hover:text-white"
                >
                  <Link
                    href={`/admin/invitation-templates/${selectedTemplate.id}/edit`}
                  >
                    <Edit3 />
                    Modifier
                  </Link>
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="mx-auto w-full max-w-58">
          {isLoading ? (
            <div className="flex aspect-4/5 items-center justify-center rounded-3xl border border-white/10 bg-black/30">
              <Loader2 className="animate-spin text-primary" />
            </div>
          ) : selectedTemplate ? (
            <InvitationRenderer
              templateData={selectedTemplate.layoutData}
              guestData={PREVIEW_GUEST}
              className="shadow-xl"
            />
          ) : (
            <div className="flex aspect-4/5 items-center justify-center rounded-3xl border border-dashed border-white/10 bg-black/30 p-6 text-center text-xs font-bold uppercase tracking-widest text-gray-500">
              Aucun visuel selectionne
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

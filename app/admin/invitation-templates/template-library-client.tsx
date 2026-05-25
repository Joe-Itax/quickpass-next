"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CopyPlus,
  Edit3,
  Loader2,
  MoveLeftIcon,
  Plus,
  Sparkles,
  Eye,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InvitationRenderer } from "@/components/invitations/invitation-renderer";
import {
  cloneInvitationTemplateAction,
  createBlankInvitationTemplateAction,
  installEventInvitationTemplateAction,
  deleteInvitationTemplateAction,
} from "@/app/admin/invitation-templates/actions";
import { INVITATION_TEMPLATE_CATEGORY_LABELS } from "@/lib/invitation-template-layout";
import type { InvitationTemplateSummary } from "@/types/invitation-template";

const PREVIEW_GUEST = {
  name: "Fr BODRICK M.",
  table: "ACCES PPANK",
  peopleCount: 2,
  seatsAssigned: 1,
  email: "invite@yambipass.com",
  whatsapp: "243900000000",
  qrCodeData: "YAMBIPASS-PREVIEW-QR",
};

export function TemplateLibraryClient({
  templates,
  currentUserId,
  userRole,
  eventId,
}: {
  templates: InvitationTemplateSummary[];
  currentUserId: string;
  userRole?: string;
  eventId?: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Filtres
  const [activeTab, setActiveTab] = useState<"PUBLIC" | "MINE">("PUBLIC");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [orientationFilter, setOrientationFilter] = useState<string>("ALL");
  
  // Modal Preview
  const [previewTemplate, setPreviewTemplate] = useState<InvitationTemplateSummary | null>(null);

  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      // 1. Tab filter
      const isMine = t.userId === currentUserId;
      const isPublicTemplate = t.userId === null || t.isPublic;
      if (activeTab === "PUBLIC" && !isPublicTemplate) return false;
      if (activeTab === "MINE" && !isMine) return false;

      // 2. Category filter
      if (categoryFilter !== "ALL" && t.category !== categoryFilter) return false;

      // 3. Orientation filter
      const isLandscape = t.layoutData.canvas.width > t.layoutData.canvas.height;
      const orientation = isLandscape ? "LANDSCAPE" : "PORTRAIT";
      if (orientationFilter !== "ALL" && orientation !== orientationFilter) return false;

      return true;
    });
  }, [templates, activeTab, categoryFilter, orientationFilter, currentUserId]);

  const createBlank = () => {
    startTransition(async () => {
      const result = await createBlankInvitationTemplateAction();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      router.push(`/admin/invitation-templates/${result.data.id}/edit`);
    });
  };

  const editTemplate = (template: InvitationTemplateSummary) => {
    startTransition(async () => {
      if (template.userId === currentUserId) {
        router.push(`/admin/invitation-templates/${template.id}/edit`);
        return;
      }
      const result = await cloneInvitationTemplateAction(template.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Copie personnelle creee.");
      router.push(`/admin/invitation-templates/${result.data.id}/edit`);
    });
  };

  const useTemplate = (template: InvitationTemplateSummary) => {
    if (!eventId) {
      editTemplate(template);
      return;
    }
    startTransition(async () => {
      const result = await installEventInvitationTemplateAction(eventId, template.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Modele installe sur l'evenement.");
      router.push(`/admin/events/${eventId}`);
    });
  };

  const deleteTemplate = (template: InvitationTemplateSummary) => {
    if (!confirm("Voulez-vous vraiment supprimer ce modele ? Cette action est irreversible.")) return;
    startTransition(async () => {
      const result = await deleteInvitationTemplateAction(template.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Modele supprime.");
    });
  };

  return (
    <section className="space-y-6 text-white">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => router.push(eventId ? `/admin/events/${eventId}` : "/admin")}
            className="group flex size-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 transition-all hover:border-primary/50"
            aria-label="Retour"
          >
            <MoveLeftIcon className="text-gray-500 transition-colors group-hover:text-primary" />
          </button>
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
              Templates dynamiques
            </p>
            <h1 className="text-3xl font-black uppercase italic tracking-tight">
              Bibliotheque d&apos;invitations
            </h1>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={createBlank}
            disabled={isPending}
            className="h-11 rounded-xl bg-primary px-5 font-black uppercase italic text-black hover:bg-white"
          >
            {isPending ? <Loader2 className="animate-spin" /> : <Plus />}
            Partir d&apos;un modele vide
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Toggle Public / Mine */}
        <div className="flex rounded-xl bg-white/5 p-1 border border-white/10">
          <button
            className={`px-6 py-2 rounded-lg text-sm font-black uppercase transition-colors ${
              activeTab === "PUBLIC" ? "bg-primary text-black" : "text-gray-400 hover:text-white"
            }`}
            onClick={() => setActiveTab("PUBLIC")}
          >
            Modeles Publics
          </button>
          <button
            className={`px-6 py-2 rounded-lg text-sm font-black uppercase transition-colors ${
              activeTab === "MINE" ? "bg-primary text-black" : "text-gray-400 hover:text-white"
            }`}
            onClick={() => setActiveTab("MINE")}
          >
            Mes Modeles
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 w-full md:w-auto">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px] h-11 bg-black/30 border-white/10 rounded-xl text-white">
              <SelectValue placeholder="Categorie" />
            </SelectTrigger>
            <SelectContent className="bg-[#0f0f0f] border-white/10 text-white">
              <SelectItem value="ALL">Toutes les categories</SelectItem>
              <SelectItem value="WEDDING">Mariage</SelectItem>
              <SelectItem value="DEFENSE">Soutenance</SelectItem>
              <SelectItem value="GALA">Gala</SelectItem>
              <SelectItem value="STANDARD">Standard</SelectItem>
            </SelectContent>
          </Select>

          <Select value={orientationFilter} onValueChange={setOrientationFilter}>
            <SelectTrigger className="w-[180px] h-11 bg-black/30 border-white/10 rounded-xl text-white">
              <SelectValue placeholder="Orientation" />
            </SelectTrigger>
            <SelectContent className="bg-[#0f0f0f] border-white/10 text-white">
              <SelectItem value="ALL">Toutes orientations</SelectItem>
              <SelectItem value="PORTRAIT">Portrait</SelectItem>
              <SelectItem value="LANDSCAPE">Paysage</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <TemplateGrid
        templates={filteredTemplates}
        currentUserId={currentUserId}
        userRole={userRole}
        eventId={eventId}
        isPending={isPending}
        onEdit={editTemplate}
        onUse={useTemplate}
        onPreview={setPreviewTemplate}
        onDelete={deleteTemplate}
      />

      {/* Dialog Preview */}
      <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
        <DialogContent className="max-w-2xl bg-[#0b0b0b] border-white/10 p-0 text-white overflow-hidden rounded-3xl">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-xl font-black uppercase italic">Apercu du modele</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center bg-white/[0.02] p-8 max-h-[70vh] overflow-auto">
            <div className="w-full max-w-sm">
              {previewTemplate && (
                <InvitationRenderer
                  templateData={previewTemplate.layoutData}
                  guestData={PREVIEW_GUEST}
                  className="shadow-2xl"
                />
              )}
            </div>
          </div>
          <div className="p-6 flex justify-end gap-3 bg-black/40 border-t border-white/10">
            <Button variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => setPreviewTemplate(null)}>
              Fermer
            </Button>
            <Button 
              className="bg-primary text-black font-black uppercase italic"
              onClick={() => {
                if (previewTemplate) editTemplate(previewTemplate);
                setPreviewTemplate(null);
              }}
            >
              <CopyPlus className="mr-2" />
              Personnaliser
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function TemplateGrid({
  templates,
  currentUserId,
  userRole,
  eventId,
  isPending,
  onEdit,
  onUse,
  onPreview,
  onDelete,
}: {
  templates: InvitationTemplateSummary[];
  currentUserId: string;
  userRole?: string;
  eventId?: number;
  isPending: boolean;
  onEdit: (template: InvitationTemplateSummary) => void;
  onUse: (template: InvitationTemplateSummary) => void;
  onPreview: (template: InvitationTemplateSummary) => void;
  onDelete: (template: InvitationTemplateSummary) => void;
}) {
  if (templates.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-white/10 p-16 text-center text-gray-500">
        Aucun modele ne correspond a vos criteres.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {templates.map((template) => {
        const isMine = template.userId === currentUserId;
        const isAdmin = userRole === "ADMIN";
        const isPublic = template.userId === null || template.isPublic;
        const canDelete = isMine || (isAdmin && isPublic);

        return (
          <article
            key={template.id}
            className="overflow-hidden rounded-2xl border border-white/10 bg-black/35 hover:border-primary/50 transition-colors group"
          >
            <div className="flex justify-center bg-white/[0.03] p-5 relative">
              <div className="w-full max-w-56 pointer-events-none">
                <InvitationRenderer
                  templateData={template.layoutData}
                  guestData={PREVIEW_GUEST}
                  className="shadow-xl"
                />
              </div>
            </div>

            <div className="space-y-4 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-black uppercase italic text-white line-clamp-1">
                    {template.name}
                  </h2>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    {INVITATION_TEMPLATE_CATEGORY_LABELS[template.category]}
                  </p>
                </div>
                <Badge
                  className={
                    isPublic
                      ? "bg-white/10 text-gray-300 whitespace-nowrap"
                      : "bg-primary/15 text-primary whitespace-nowrap"
                  }
                >
                  {isPublic ? "Public" : "Prive"}
                </Badge>
              </div>

              <div className="flex gap-2">
                {!isMine ? (
                  <>
                    <Button
                      disabled={isPending}
                      onClick={() => onPreview(template)}
                      className="h-10 flex-1 rounded-xl bg-white/10 font-bold text-white hover:bg-white/20"
                    >
                      <Eye className="size-4 mr-2" />
                      Apercu
                    </Button>
                    <Button
                      disabled={isPending}
                      onClick={() => onEdit(template)}
                      className="h-10 flex-1 rounded-xl bg-primary font-black uppercase italic text-black hover:bg-white"
                    >
                      <CopyPlus className="size-4 mr-2" />
                      Personnaliser
                    </Button>
                    {canDelete && (
                      <Button
                        disabled={isPending}
                        onClick={() => onDelete(template)}
                        variant="destructive"
                        className="h-10 w-10 rounded-xl p-0 flex-none"
                        title="Supprimer (Admin)"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    {eventId ? (
                      <Button
                        disabled={isPending}
                        onClick={() => onUse(template)}
                        className="h-10 flex-1 rounded-xl bg-primary font-black uppercase italic text-black hover:bg-white"
                      >
                        <Sparkles className="size-4 mr-2" />
                        Utiliser
                      </Button>
                    ) : null}
                    <Button
                      disabled={isPending}
                      onClick={() => onEdit(template)}
                      variant={eventId ? "outline" : "default"}
                      className={`h-10 flex-1 rounded-xl ${eventId ? "border-white/10 bg-white/5 text-white" : "bg-primary font-black uppercase italic text-black hover:bg-white"}`}
                    >
                      <Edit3 className="size-4 mr-2" />
                      Editer
                    </Button>
                    <Button
                      disabled={isPending}
                      onClick={() => onDelete(template)}
                      variant="destructive"
                      className="h-10 w-10 rounded-xl p-0 flex-none"
                      title="Supprimer"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

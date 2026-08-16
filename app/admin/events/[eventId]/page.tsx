"use client";

import { authClient } from "@/lib/auth-client";
import { useEvent } from "@/hooks/use-event";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DataStatusDisplay from "@/components/data-status-display";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Archive,
  MoveLeftIcon,
  Users,
  Table2Icon,
  QrCode,
  Trash2Icon,
  MapPin,
  Calendar,
  Activity,
  Layers,
  Hash,
  Cpu,
  MonitorSmartphone,
  Clock,
  AlertCircle,
  Mail,
  MessageCircle,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  Table2,
  ListChecks,
  Download,
  LayoutGrid,
  MoreHorizontal,
  Settings2,
  Upload,
  UserPlus,
  PowerOff,
} from "lucide-react";
import { Event2 } from "@/types/types";
import AddGuest from "./add-guest";
import AddTable from "./add-table";
import ModifyEvent from "./modify-event";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import DeleteEvent from "./delete-event";
import QuickAddTerminal from "./quick-add-terminal";
import ModifyTerminal from "@/app/admin/terminals/modify-terminal";
import DeleteTerminal from "@/app/admin/terminals/delete-terminal";
import { useState, useMemo, useRef } from "react";
import { useRealtimeSync } from "@/hooks/use-realtime-sync";
import Link from "next/link";
import ImportGuests from "./import-guests";
import { toast } from "sonner";
import { EventTemplateConfigurator } from "@/components/invitations/event-template-configurator";
import { InvitationTicket } from "@/components/invitations/invitation-ticket";
import {
  buildInvitationExportBlob,
  createZipBlob,
  downloadBlob,
  safeFileName,
  type InvitationExportFormat,
} from "@/lib/client-invitation-export";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return "Date inconnue";
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Africa/Kinshasa",
  }).format(date);
};

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  glow?: boolean;
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  glow = false,
}: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className={cn(
        "relative z-10 p-5 rounded-4xl border border-white/5 flex flex-col items-center text-center gap-2 overflow-hidden transition-colors backface-hidden contain-[paint]",
        glow
          ? "bg-emerald-500/10 hover:bg-emerald-500/20"
          : "bg-white/5 hover:bg-white/10",
      )}
    >
      <Icon className={cn("w-5 h-5", color)} />
      <span className="text-2xl font-black italic tracking-tighter text-white">
        {value}
      </span>
      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">
        {label}
      </span>
    </motion.div>
  );
}

type EventActionsMenuProps = {
  isExportingGuestStructure: boolean;
  onEditEvent: () => void;
  onAddGuest: () => void;
  onImportGuests: () => void;
  onOpenSpreadsheet: () => void;
  onExportGuests: () => void;
  onAddTable: () => void;
  onDeleteEvent: () => void;
};

function EventActionsMenu({
  isExportingGuestStructure,
  onEditEvent,
  onAddGuest,
  onImportGuests,
  onOpenSpreadsheet,
  onExportGuests,
  onAddTable,
  onDeleteEvent,
}: EventActionsMenuProps) {
  const itemClassName =
    "h-10 rounded-lg px-3 text-xs font-bold text-white focus:bg-white/10 focus:text-white";

  const { data: session, isPending, error, refetch } = authClient.useSession();
  const user = session?.user;

  if (isPending || error) {
    return (
      <DataStatusDisplay
        isPending={isPending}
        errorObject={error}
        refetch={refetch}
      />
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-11 rounded-xl border-white/10 bg-white/5 px-4 text-[10px] font-black uppercase italic tracking-widest text-white hover:bg-white/10 hover:text-primary"
        >
          <MoreHorizontal className="size-4 text-primary" />
          Actions
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-72 rounded-xl border-white/10 bg-[#0c0c0c] p-2 text-white shadow-2xl"
      >
        <DropdownMenuLabel className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
          Événement
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={onEditEvent} className={itemClassName}>
            <Settings2 className="text-primary" />
            Éditer les paramètres
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="my-2 bg-white/10" />
        <DropdownMenuLabel className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
          Invités
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={onAddGuest} className={itemClassName}>
            <UserPlus className="text-primary" />
            Ajouter un invité
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onImportGuests} className={itemClassName}>
            <Upload className="text-primary" />
            Importer un fichier Excel
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={onOpenSpreadsheet}
            className={itemClassName}
          >
            <FileSpreadsheet className="text-primary" />
            Ouvrir le tableur
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={isExportingGuestStructure}
            onSelect={onExportGuests}
            className={itemClassName}
          >
            {isExportingGuestStructure ? (
              <Loader2 className="animate-spin text-primary" />
            ) : (
              <Download className="text-primary" />
            )}
            Exporter les invités
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="my-2 bg-white/10" />
        <DropdownMenuLabel className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
          Plan de table
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={onAddTable} className={itemClassName}>
            <LayoutGrid className="text-primary" />
            Créer une table
          </DropdownMenuItem>
        </DropdownMenuGroup>

        {user?.role === "ADMIN" && (
          <>
            <DropdownMenuSeparator className="my-2 bg-white/10" />
            <DropdownMenuItem
              variant="destructive"
              onSelect={onDeleteEvent}
              className="h-10 rounded-lg px-3 text-xs font-bold"
            >
              <Trash2Icon />
              Supprimer l&apos;événement
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function EventPage() {
  const { eventId } = useParams();
  const router = useRouter();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isModifyEventOpen, setIsModifyEventOpen] = useState(false);
  const [isAddGuestOpen, setIsAddGuestOpen] = useState(false);
  const [isImportGuestsOpen, setIsImportGuestsOpen] = useState(false);
  const [isAddTableOpen, setIsAddTableOpen] = useState(false);
  const [isBroadcastingEmail, setIsBroadcastingEmail] = useState(false);
  const [isBroadcastingWhatsapp, setIsBroadcastingWhatsapp] = useState(false);
  const [isExportingStats, setIsExportingStats] = useState(false);
  const [isExportingGuestStructure, setIsExportingGuestStructure] =
    useState(false);
  const [isExportingInvitations, setIsExportingInvitations] = useState(false);
  const [bulkExportFormat, setBulkExportFormat] =
    useState<InvitationExportFormat>("pdf");
  const [broadcastMode, setBroadcastMode] = useState<"all" | "unsent">(
    "unsent",
  );
  const bulkExportRef = useRef<HTMLDivElement>(null);

  const [selectedTerminal, setSelectedTerminal] = useState<{
    id: number;
    name: string;
    code?: string;
    isActive: boolean;
  } | null>(null);
  const [isModifyTerminalOpen, setIsModifyTerminalOpen] = useState(false);

  const [terminalToDelete, setTerminalToDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [isDeleteTerminalOpen, setIsDeleteTerminalOpen] = useState(false);

  const {
    data: dataEvent,
    isPending,
    isError,
    error,
    refetch,
  } = useEvent(Number(eventId));

  const event = dataEvent as Event2;

  useRealtimeSync({
    eventId: Number(eventId),
    onUpdate: () => refetch(),
  });

  const timeInfo = useMemo(() => {
    if (!event) return null;
    const start = new Date(event.date);
    const end = new Date(
      start.getTime() + (event.durationHours || 24) * 60 * 60 * 1000,
    );
    return {
      startStr: `${start.getHours()}h${start.getMinutes().toString().padStart(2, "0")}`,
      endStr: `${end.getHours()}h${end.getMinutes().toString().padStart(2, "0")}`,
      duration: event.durationHours,
    };
  }, [event]);

  const eligibility = useMemo(() => {
    if (!event?.invitations) return { email: 0, whatsapp: 0 };
    return {
      email: event.invitations.filter(
        (inv) => inv.email && inv.email.includes("@"),
      ).length,
      whatsapp: event.invitations.filter(
        (inv) => inv.whatsapp && inv.whatsapp.length >= 9,
      ).length,
    };
  }, [event]);

  const unassignedGuests = useMemo(() => {
    if (!event) return [];
    return event.invitations.filter(
      (inv) => !inv.allocations || inv.allocations.length === 0,
    );
  }, [event]);

  const totalUnassignedPeople = unassignedGuests.reduce(
    (sum, g) => sum + g.peopleCount,
    0,
  );

  const handleBroadcastEmail = async () => {
    setIsBroadcastingEmail(true);
    try {
      const res = await fetch(`/api/events/${eventId}/broadcast/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sendMode: broadcastMode }),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success(`${result.count} emails envoyés`);
        refetch();
      } else toast.error(result.error);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      toast.error("Erreur réseau");
    } finally {
      setIsBroadcastingEmail(false);
    }
  };

  const handleBroadcastWhatsapp = async () => {
    setIsBroadcastingWhatsapp(true);
    try {
      const res = await fetch(`/api/events/${eventId}/broadcast/whatsapp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sendMode: broadcastMode }),
      });
      const result = await res.json();

      if (res.ok) {
        toast.success(
          result.queuedBehindExisting
            ? `${result.queued} message(s) ajoute(s) a la suite de la file active`
            : `${result.queued} message(s) WhatsApp planifie(s)`,
        );
        if (result.workerError) {
          toast.warning("File creee. Le worker reprendra via sa boucle.");
        }
        refetch();
      } else {
        toast.error(result.error || "Erreur lors de la planification.");
      }
    } catch {
      toast.error("Erreur reseau");
    } finally {
      setIsBroadcastingWhatsapp(false);
    }
  };

  const handleExportEventStats = async () => {
    if (!event) return;

    if (event.status !== "FINISHED") {
      toast.error("Le bilan est disponible uniquement apres l'evenement.");
      return;
    }

    setIsExportingStats(true);

    try {
      const response = await fetch(`/api/events/${eventId}/stats/export`);

      if (!response.ok) {
        let message = "Erreur lors de l'export des statistiques";

        try {
          const payload = await response.json();
          message = payload.error || message;
        } catch {
          // The server may return a non-JSON error page in development.
        }

        toast.error(message);
        return;
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition");
      const fileName =
        contentDisposition?.match(/filename="?([^"]+)"?/i)?.[1] ||
        `YambiPass_Stats_Event_${event.id}.xlsx`;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Fichier de statistiques genere avec succes !");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'export des statistiques");
    } finally {
      setIsExportingStats(false);
    }
  };

  const handleExportGuestStructure = async () => {
    if (!event) return;
    setIsExportingGuestStructure(true);

    try {
      const response = await fetch(`/api/events/${eventId}/guests/export`);

      if (!response.ok) {
        let message = "Erreur lors de l'export des invites";

        try {
          const payload = await response.json();
          message = payload.error || message;
        } catch {
          // The server may return a non-JSON error page in development.
        }

        toast.error(message);
        return;
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition");
      const fileName =
        contentDisposition?.match(/filename="?([^"]+)"?/i)?.[1] ||
        `YambiPass_Invites_Event_${event.id}.xlsx`;

      downloadBlob(blob, fileName);
      toast.success("Structure des invites exportee.");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'export des invites");
    } finally {
      setIsExportingGuestStructure(false);
    }
  };

  const handleExportInvitationsZip = async () => {
    if (!event?.invitations?.length) {
      toast.error("Aucune invitation a exporter.");
      return;
    }

    setIsExportingInvitations(true);

    try {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
      await new Promise((resolve) => setTimeout(resolve, 150));

      const nodes = Array.from(
        bulkExportRef.current?.querySelectorAll<HTMLElement>(
          "[data-invitation-export-id]",
        ) ?? [],
      );

      if (nodes.length === 0) {
        toast.error("Impossible de preparer les invitations.");
        return;
      }

      const invitationById = new Map(
        event.invitations.map((invitation) => [
          String(invitation.id),
          invitation,
        ]),
      );
      const extension = bulkExportFormat === "pdf" ? "pdf" : "png";
      const entries = [];

      for (const [index, node] of nodes.entries()) {
        const invitation = invitationById.get(
          node.dataset.invitationExportId || "",
        );
        if (!invitation) continue;

        const blob = await buildInvitationExportBlob(node, bulkExportFormat);
        const order = String(index + 1).padStart(3, "0");
        const name = `${order}_${safeFileName(invitation.label) || invitation.id}.${extension}`;
        entries.push({ name, blob });
      }

      const zip = await createZipBlob(entries);
      const formatLabel = bulkExportFormat === "pdf" ? "PDF" : "PNG";
      downloadBlob(
        zip,
        `Invitations_${safeFileName(event.name) || event.id}_${formatLabel}.zip`,
      );
      toast.success(`${entries.length} invitation(s) exportee(s).`);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'export des invitations.");
    } finally {
      setIsExportingInvitations(false);
    }
  };

  if (isPending || isError || error) {
    return (
      <DataStatusDisplay
        isPending={isPending}
        hasError={isError}
        errorObject={error}
        refetch={refetch}
      />
    );
  }

  const totalCapacity = event.stats.totalCapacity || 0;
  const totalAssigned = event.stats.totalAssignedSeats || 0;
  const occupancyRate =
    totalCapacity > 0 ? Math.round((totalAssigned / totalCapacity) * 100) : 0;
  const availableSeats = Math.max(0, totalCapacity - totalAssigned);

  return (
    <section className="py-6 px-2 max-w-7xl mx-auto space-y-8 bg-background min-h-screen">
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5 backface-hidden">
        <div className="space-y-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/admin/events")}
            className="hover:bg-white/5 hover:text-white text-gray-500 font-bold uppercase text-[10px] tracking-widest"
          >
            <MoveLeftIcon className="mr-2 h-4 w-4" /> Retour au Dashboard
          </Button>

          <div className="flex flex-wrap items-center gap-4">
            <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">
              {event.name}
            </h2>
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-white/5 border border-white/10">
              <Hash size={14} className="text-primary" />
              <span className="text-sm font-mono font-bold text-primary tracking-tighter">
                {event.eventCode}
              </span>
            </div>
            <Badge
              className={cn(
                "font-black italic uppercase text-[10px] px-4 py-1.5 rounded-full border-none",
                event.status === "CANCELLED"
                  ? "bg-red-500"
                  : event.status === "UPCOMING"
                    ? "bg-blue-600"
                    : "bg-emerald-500",
              )}
            >
              {`${event.status === "UPCOMING" ? "À venir" : event.status === "ONGOING" ? "En cours" : event.status === "FINISHED" ? "Terminé" : event.status === "CANCELLED" ? "Annulé" : event.status}`}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-gray-400 text-[10px] font-black uppercase tracking-[0.15em]">
            <span className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
              <Calendar size={14} className="text-primary" />{" "}
              {formatDateTime(event.date)}
            </span>
            <span className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
              <Clock size={14} className="text-primary" /> {timeInfo?.startStr}{" "}
              — {timeInfo?.endStr}
            </span>
            <span className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
              <MapPin size={14} className="text-primary" /> {event.location}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <EventActionsMenu
            isExportingGuestStructure={isExportingGuestStructure}
            onEditEvent={() => setIsModifyEventOpen(true)}
            onAddGuest={() => setIsAddGuestOpen(true)}
            onImportGuests={() => setIsImportGuestsOpen(true)}
            onOpenSpreadsheet={() =>
              router.push(`/admin/events/${event.id}/excel`)
            }
            onExportGuests={handleExportGuestStructure}
            onAddTable={() => setIsAddTableOpen(true)}
            onDeleteEvent={() => setIsDeleteDialogOpen(true)}
          />
          <ModifyEvent
            event={event}
            open={isModifyEventOpen}
            onOpenChange={setIsModifyEventOpen}
            onEventUpdated={refetch}
            hideTrigger
          />
          <AddGuest
            eventId={event.id}
            open={isAddGuestOpen}
            onOpenChange={setIsAddGuestOpen}
            hideTrigger
          />
          <ImportGuests
            eventId={event.id}
            open={isImportGuestsOpen}
            onOpenChange={setIsImportGuestsOpen}
            hideTrigger
          />
          <AddTable
            eventId={event.id}
            open={isAddTableOpen}
            onOpenChange={setIsAddTableOpen}
            onTableAdded={refetch}
            hideTrigger
          />
        </div>
      </div>

      <AnimatePresence>
        {unassignedGuests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="relative z-10 p-8 rounded-[3rem] border border-red-500/30 bg-red-950/40 space-y-6 overflow-hidden backface-hidden contain-[paint]"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-red-500/20 pb-6">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-red-500 flex items-center justify-center">
                  <AlertCircle className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black italic uppercase text-white">
                    Flux Critique
                  </h3>
                  <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em]">
                    {totalUnassignedPeople} Pax sans siège assigné
                  </p>
                </div>
              </div>
              <Button
                onClick={() => router.push(`/admin/events/${eventId}/tables`)}
                variant="outline"
                className="border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl font-black uppercase italic text-[10px]"
              >
                Résoudre dans le Plan de Table
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/5 space-y-6 relative overflow-hidden backface-hidden contain-[paint]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black italic uppercase text-white">
              Centre de Diffusion
            </h3>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
              {unassignedGuests.length > 0
                ? "⚠️ Placement incomplet : Diffusion restreinte"
                : "Canaux de transmission prêts"}
            </p>
          </div>
          {unassignedGuests.length === 0 && (
            <div className="flex items-center gap-2 text-emerald-500 px-4 py-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <CheckCircle2 size={16} />
              <span className="text-[10px] font-black uppercase italic">
                Audit Placement OK
              </span>
            </div>
          )}
          <Select
            value={broadcastMode}
            onValueChange={(value) =>
              setBroadcastMode(value as "all" | "unsent")
            }
          >
            <SelectTrigger className="h-11 w-full rounded-2xl border-white/10 bg-black/30 text-white md:w-68">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-[#0f0f0f] text-white">
              <SelectItem value="unsent">Seulement ceux non envoyes</SelectItem>
              <SelectItem value="all">Tout le monde</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="space-y-4">
            <Button
              onClick={handleBroadcastWhatsapp}
              disabled={isBroadcastingWhatsapp || eligibility.whatsapp === 0}
              className={cn(
                "w-full h-20 rounded-3xl flex flex-col gap-1 transition-all group",
                eligibility.whatsapp === 0
                  ? "bg-white/5 text-gray-600 opacity-50 cursor-not-allowed"
                  : "bg-[#25D366]/15 border border-[#25D366]/30 hover:bg-[#25D366] hover:text-white text-[#25D366]",
              )}
            >
              {isBroadcastingWhatsapp ? (
                <Loader2 className="animate-spin" />
              ) : (
                <MessageCircle />
              )}
              <span className="font-black uppercase italic text-[11px]">
                Envoyer WhatsApp
              </span>
            </Button>
            <div className="px-4 flex justify-between items-center gap-3">
              <span className="text-[9px] font-black text-gray-500 uppercase">
                Contacts detectes
              </span>
              <Link
                href={`/admin/events/${eventId}/whatsapp`}
                className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-primary hover:text-white"
              >
                <ListChecks size={12} /> Suivi
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <Button
              onClick={handleBroadcastEmail}
              disabled={
                isBroadcastingEmail ||
                unassignedGuests.length > 0 ||
                eligibility.email === 0
              }
              className={cn(
                "w-full h-20 rounded-3xl flex flex-col gap-1 transition-all group",
                unassignedGuests.length > 0 || eligibility.email === 0
                  ? "bg-white/5 text-gray-600 opacity-50 cursor-not-allowed"
                  : "bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500 hover:text-white text-blue-400",
              )}
            >
              {isBroadcastingEmail ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Mail />
              )}
              <span className="font-black uppercase italic text-[11px]">
                Diffuser par Email
              </span>
            </Button>
            <div className="px-4 flex justify-between items-center">
              <span className="text-[9px] font-black text-gray-500 uppercase">
                Emails valides
              </span>
              <span className="text-xs font-mono text-blue-400 font-bold">
                {eligibility.email}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <Button
              onClick={handleExportEventStats}
              disabled={isExportingStats || event.status !== "FINISHED"}
              className={cn(
                "w-full h-20 rounded-3xl flex flex-col gap-1 transition-all group",
                event.status !== "FINISHED"
                  ? "bg-white/5 text-gray-600 opacity-50 cursor-not-allowed"
                  : "bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500 hover:text-white text-orange-400",
              )}
            >
              {isExportingStats ? (
                <Loader2 className="animate-spin" />
              ) : (
                <FileSpreadsheet />
              )}
              <span className="font-black uppercase italic text-[11px]">
                Télécharger Stats
              </span>
            </Button>
            <div className="px-4 flex justify-between items-center">
              <span className="text-[9px] font-black text-gray-500 uppercase">
                Après l&apos;événement
              </span>
              <span className="text-xs font-mono text-orange-400 font-bold">
                {event.status === "FINISHED" ? "✓" : "—"}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <Button
                onClick={handleExportInvitationsZip}
                disabled={
                  isExportingInvitations || event.invitations.length === 0
                }
                className={cn(
                  "h-20 rounded-3xl flex flex-col gap-1 transition-all group",
                  event.invitations.length === 0
                    ? "bg-white/5 text-gray-600 opacity-50 cursor-not-allowed"
                    : "bg-primary/10 border border-primary/25 hover:bg-primary hover:text-black text-primary",
                )}
              >
                {isExportingInvitations ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Archive />
                )}
                <span className="font-black uppercase italic text-[11px]">
                  Invitations ZIP
                </span>
              </Button>
              <Select
                value={bulkExportFormat}
                onValueChange={(value) =>
                  setBulkExportFormat(value as InvitationExportFormat)
                }
              >
                <SelectTrigger className="h-20 w-24 rounded-3xl border-white/10 bg-white/5 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-[#0f0f0f] text-white">
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="image">PNG</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="px-4 flex justify-between items-center">
              <span className="text-[9px] font-black text-gray-500 uppercase">
                Export massif
              </span>
              <span className="text-xs font-mono text-primary font-bold">
                {event.invitations.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      <EventTemplateConfigurator
        eventId={event.id}
        initialTemplateId={event.invitationTemplateId}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard
              label="Invitations"
              value={event.stats.totalInvitations}
              icon={Users}
              color="text-primary"
            />
            <StatCard
              label="Présences"
              value={event.stats.totalScanned}
              icon={QrCode}
              color="text-emerald-400"
              glow
            />
            <StatCard
              label="Occupation"
              value={`${occupancyRate}%`}
              icon={Layers}
              color="text-purple-400"
            />
            <StatCard
              label="Sièges Assignés"
              value={`${totalAssigned}/${totalCapacity}`}
              icon={Table2Icon}
              color="text-blue-400"
            />
            <StatCard
              label="Total Personnes"
              value={event.stats.totalPeople}
              icon={Users}
              color="text-white"
            />
            <StatCard
              label="Sièges Libres"
              value={availableSeats}
              icon={Activity}
              color="text-orange-400"
            />
          </div>

          <Card className="bg-white/2 border-white/5 rounded-4xl overflow-hidden">
            <CardHeader className="border-b border-white/5 p-6">
              <CardTitle className="flex items-center justify-between text-sm font-black uppercase italic text-primary">
                <div className="flex items-center gap-2">
                  <Table2Icon size={18} /> Monitoring des Tables (
                  {event.tables.length})
                </div>
                <Button
                  onClick={() => router.push(`/admin/events/${eventId}/tables`)}
                  variant="outline"
                  className="rounded-xl border-primary/20 text-primary text-[10px] uppercase italic"
                >
                  <Table2 className="size-4 mr-2" /> Voir Plan
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {event.tables.map((table) => {
                const tableAssigned = event.invitations.reduce((total, inv) => {
                  const alloc = inv.allocations?.find(
                    (a) => a.tableId === table.id,
                  );
                  return total + (alloc?.seatsAssigned || 0);
                }, 0);
                const isFull = tableAssigned >= table.capacity;
                return (
                  <Link
                    key={table.id}
                    href={`/admin/events/${eventId}/tables/${table.id}`}
                    className="p-4 rounded-2xl border border-white/5 bg-white/2 flex justify-between items-center group hover:scale-[1.02] transition-transform"
                  >
                    <div>
                      <p className="font-black uppercase italic text-sm text-white group-hover:text-primary">
                        {table.name}
                      </p>
                      <p className="text-[10px] font-bold text-gray-500 uppercase">
                        {tableAssigned} / {table.capacity} PLACES
                      </p>
                    </div>
                    <Badge
                      className={cn(
                        "text-[9px] font-black",
                        isFull
                          ? "bg-red-500/10 text-red-500"
                          : "bg-emerald-500/10 text-emerald-500",
                      )}
                    >
                      {isFull
                        ? "COMPLET"
                        : `${table.capacity - tableAssigned} LIBRES`}
                    </Badge>
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="bg-[#0a0a0a]/50 border-white/10 rounded-4xl border overflow-hidden">
            <CardHeader className="bg-white/5 border-b border-white/5 p-6">
              <CardTitle className="text-sm font-black uppercase italic text-primary flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu size={18} /> Terminaux ({event.terminals?.length || 0})
                </div>
                <QuickAddTerminal eventId={event.id} />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              {event.terminals?.map((terminal) => {
                const isSessionActive = (terminal as unknown as { isSessionActive?: boolean }).isSessionActive;
                return (
                  <div
                    key={terminal.id}
                    className="p-3 rounded-2xl bg-white/3 border border-white/5 flex items-center justify-between group hover:border-white/10 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "size-10 rounded-xl flex items-center justify-center border",
                          terminal.isActive
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            : "bg-red-500/10 text-red-500 border-red-500/20",
                        )}
                      >
                        <MonitorSmartphone size={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black uppercase italic text-white group-hover:text-primary">
                          {terminal.name}
                        </span>
                        <span className="text-[9px] text-gray-500 font-mono tracking-wider">
                          {terminal.code}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Badge Session Active */}
                      <span
                        className={cn(
                          "text-[9px] font-black uppercase px-2 py-0.5 rounded-full border flex items-center gap-1",
                          isSessionActive
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                            : "bg-white/5 border-white/10 text-gray-500",
                        )}
                      >
                        <span
                          className={cn(
                            "size-1.5 rounded-full",
                            isSessionActive ? "bg-emerald-400 animate-pulse" : "bg-gray-500",
                          )}
                        />
                        {isSessionActive ? "Session Active" : "Inactif"}
                      </span>

                      {/* Dropdown Menu d'actions du terminal */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
                          >
                            <MoreHorizontal size={14} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-[#0f0f0f] border-white/10 rounded-2xl p-2 w-48 text-white"
                        >
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedTerminal({
                                id: terminal.id,
                                name: terminal.name,
                                code: terminal.code,
                                isActive: terminal.isActive,
                              });
                              setIsModifyTerminalOpen(true);
                            }}
                            className="rounded-xl text-[10px] font-black uppercase italic cursor-pointer focus:bg-white/10 focus:text-white"
                          >
                            <Settings2 className="size-3.5 mr-2 text-primary" />
                            Configurer
                          </DropdownMenuItem>

                          {isSessionActive && (
                            <DropdownMenuItem
                              onClick={async () => {
                                try {
                                  const res = await fetch(
                                    `/api/events/terminals/${terminal.id}/stop-session`,
                                    { method: "POST" },
                                  );
                                  if (!res.ok) throw new Error();
                                  toast.success("Session du terminal arrêtée.");
                                  refetch();
                                } catch {
                                  toast.error("Erreur lors de l'arrêt de la session.");
                                }
                              }}
                              className="rounded-xl text-[10px] font-black uppercase italic cursor-pointer text-orange-400 focus:bg-orange-500/10 focus:text-orange-300"
                            >
                              <PowerOff className="size-3.5 mr-2" />
                              Arrêter la session
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator className="bg-white/10" />

                          <DropdownMenuItem
                            onClick={() => {
                              setTerminalToDelete({
                                id: terminal.id,
                                name: terminal.name,
                              });
                              setIsDeleteTerminalOpen(true);
                            }}
                            className="rounded-xl text-[10px] font-black uppercase italic cursor-pointer text-red-500 focus:bg-red-500/10 focus:text-red-400"
                          >
                            <Trash2Icon className="size-3.5 mr-2" />
                            Révoquer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="bg-white/2 border-white/5 rounded-4xl overflow-hidden">
            <CardHeader className="border-b border-white/5 p-6">
              <CardTitle className="flex items-center justify-between text-sm font-black uppercase italic text-primary">
                Dernières Invitations
                <Button
                  onClick={() => router.push(`/admin/events/${eventId}/guests`)}
                  variant="outline"
                  className="rounded-xl border-primary/20 text-primary text-[10px] uppercase italic"
                >
                  <Users className="size-4 mr-2" /> Voir tout
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3 max-h-125 overflow-y-auto custom-scrollbar">
              {event.invitations.map((inv) => (
                <div
                  key={inv.id}
                  onClick={() =>
                    router.push(`/admin/events/${eventId}/guests/${inv.id}`)
                  }
                  className="p-4 rounded-2xl border border-white/5 bg-white/1 hover:bg-white/5 transition-all cursor-pointer group flex justify-between items-center"
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-xs uppercase text-white group-hover:text-primary">
                      {inv.label}
                    </span>
                    <div className="flex items-center gap-3 text-[9px] font-black text-gray-500 uppercase">
                      <span className="flex items-center gap-1">
                        <QrCode size={10} className="text-emerald-500" />{" "}
                        {inv.scannedCount} SCANS
                      </span>
                      <span className="flex items-center gap-1 text-blue-400">
                        <Table2Icon size={10} />{" "}
                        {inv.allocations?.[0]?.table.name || "—"}
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-black border-white/10 text-white group-hover:border-primary"
                  >
                    {inv.peopleCount} PERS.
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <DeleteEvent
        eventId={event.id}
        eventName={event.name}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      />

      {selectedTerminal && (
        <ModifyTerminal
          terminal={selectedTerminal}
          open={isModifyTerminalOpen}
          onOpenChange={setIsModifyTerminalOpen}
        />
      )}

      {terminalToDelete && (
        <DeleteTerminal
          terminalId={terminalToDelete.id}
          terminalName={terminalToDelete.name}
          open={isDeleteTerminalOpen}
          onOpenChange={setIsDeleteTerminalOpen}
        />
      )}

      {isExportingInvitations ? (
        <BulkInvitationExportHost event={event} containerRef={bulkExportRef} />
      ) : null}
    </section>
  );
}

function BulkInvitationExportHost({
  event,
  containerRef,
}: {
  event: Event2;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none fixed -left-2500 top-0 z-[-1] flex flex-col gap-8"
    >
      {event.invitations.map((invitation) => (
        <div
          key={invitation.id}
          data-invitation-export-id={invitation.id}
          className="w-95 max-w-full"
        >
          <InvitationTicket invitation={invitation} event={event} />
        </div>
      ))}
    </div>
  );
}

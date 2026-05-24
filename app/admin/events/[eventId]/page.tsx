"use client";

import { useEvent } from "@/hooks/use-event";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DataStatusDisplay from "@/components/data-status-display";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
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
} from "lucide-react";
import { Event2 } from "@/types/types";
import AddGuest from "./add-guest";
import AddTable from "./add-table";
import ModifyEvent from "./modify-event";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import DeleteEvent from "./delete-event";
import QuickAddTerminal from "./quick-add-terminal";
import { useState, useMemo } from "react";
import { useRealtimeSync } from "@/hooks/use-realtime-sync";
import Link from "next/link";
import ImportGuests from "./import-guests";
import { toast } from "sonner";

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
        "relative z-10 transform-gpu will-change-transform p-5 rounded-4xl border border-white/5 flex flex-col items-center text-center gap-2 overflow-hidden transition-colors",
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

export default function EventPage() {
  const { eventId } = useParams();
  const router = useRouter();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBroadcastingEmail, setIsBroadcastingEmail] = useState(false);
  const [isBroadcastingWhatsapp, setIsBroadcastingWhatsapp] = useState(false);
  const [isExportingStats, setIsExportingStats] = useState(false);

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
      });
      const result = await res.json();

      if (res.ok) {
        toast.success(`${result.queued} message(s) WhatsApp planifie(s)`);
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
      <div className="relative z-10 transform-gpu backface-hidden flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
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

          <div className="transform-gpu flex flex-wrap items-center gap-6 text-gray-400 text-[10px] font-black uppercase tracking-[0.15em]">
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
          <ModifyEvent event={event} />
          <AddGuest eventId={event.id} />
          <ImportGuests eventId={event.id} />
          <AddTable eventId={event.id} />
          <Button
            variant="destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
            className="rounded-xl font-black uppercase italic text-[10px] px-5"
          >
            <Trash2Icon className="w-4 h-4 mr-2" /> Supprimer
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {unassignedGuests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="relative z-10 transform-gpu will-change-[height,opacity] p-8 rounded-[3rem] border border-red-500/30 bg-red-950/40 space-y-6 overflow-hidden"
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

      <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/5 space-y-6 relative overflow-hidden">
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
        </div>
      </div>

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
                  <Cpu size={18} /> Terminaux
                </div>
                <QuickAddTerminal eventId={event.id} />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              {event.terminals?.map((terminal) => (
                <div
                  key={terminal.id}
                  className="p-3 rounded-2xl bg-white/3 border border-white/5 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "size-10 rounded-xl flex items-center justify-center",
                        terminal.isActive
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-red-500/10 text-red-500",
                      )}
                    >
                      <MonitorSmartphone size={20} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black uppercase italic text-white group-hover:text-primary">
                        {terminal.name}
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {terminal.code}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-white/2 border-white/5 rounded-4xl overflow-hidden">
            <CardHeader className="border-b border-white/5 p-6">
              <CardTitle className="text-sm font-black uppercase italic text-primary">
                Dernières Invitations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3 max-h-125 overflow-y-auto custom-scrollbar">
              {event.invitations.map((inv) => (
                <div
                  key={inv.id}
                  onClick={() =>
                    router.push(`/admin/events/${eventId}/${inv.id}`)
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
    </section>
  );
}

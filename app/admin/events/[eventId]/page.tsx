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
  MoreVertical,
  Settings2,
  Trash2,
  Clock,
  Timer,
  Table2,
} from "lucide-react";
import { Event2, Terminal } from "@/types/types";
import formatDateToCustom from "@/utils/format-date-to-custom";
import AddGuest from "./add-guest";
import AddTable from "./add-table";
import ModifyEvent from "./modify-event";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import DeleteEvent from "./delete-event";
import QuickAddTerminal from "./quick-add-terminal";
import { useState, useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DeleteTerminal from "../../terminals/delete-terminal";
import ModifyTerminal from "../../terminals/modify-terminal";
import { useRealtimeSync } from "@/hooks/use-realtime-sync";
import Link from "next/link";

export default function EventPage() {
  const { eventId } = useParams();
  const router = useRouter();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTerminal, setSelectedTerminal] = useState<Terminal | null>(
    null,
  );
  const [isModifyOpen, setIsModifyOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [terminalToDelete, setTerminalToDelete] = useState<Terminal | null>(
    null,
  );

  const {
    data: dataEvent,
    isPending,
    isError,
    error,
    refetch,
  } = useEvent(Number(eventId));

  const data = dataEvent as Event2;

  useRealtimeSync({
    eventId: Number(eventId),
    onUpdate: () => refetch(),
  });

  // --- LOGIQUE DE CALCUL DU TEMPS ---
  const timeInfo = useMemo(() => {
    if (!data) return null;
    const start = new Date(data.date);
    const end = new Date(
      start.getTime() + (data.durationHours || 24) * 60 * 60 * 1000,
    );
    return {
      startStr: `${start.getHours()}h${start.getMinutes().toString().padStart(2, "0")}`,
      endStr: `${end.getHours()}h${end.getMinutes().toString().padStart(2, "0")}`,
      duration: data.durationHours,
    };
  }, [data]);

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

  const event = data as Event2;

  const totalCapacity = event.stats.totalCapacity || 0;
  const totalAssigned = event.stats.totalAssignedSeats || 0;
  const occupancyRate =
    totalCapacity > 0 ? Math.round((totalAssigned / totalCapacity) * 100) : 0;
  const availableSeats = Math.max(0, totalCapacity - totalAssigned);

  return (
    <section className="py-6 px-0! max-w-7xl mx-auto space-y-8">
      {/* --- CYBER HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
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
                "font-black italic uppercase text-[10px] px-4 py-1.5 rounded-full border-none shadow-[0_0_15px_rgba(0,0,0,0.2)]",
                event.status === "CANCELLED"
                  ? "bg-red-500 text-white"
                  : event.status === "UPCOMING"
                    ? "bg-blue-600 text-white"
                    : event.status === "ONGOING"
                      ? "bg-emerald-500 text-white animate-pulse"
                      : "bg-gray-600 text-white",
              )}
            >
              {event.status === "ONGOING" && (
                <span className="size-1.5 rounded-full bg-white mr-2 animate-ping inline-block" />
              )}
              {event.status}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-gray-400 text-[10px] font-black uppercase tracking-[0.15em]">
            <span className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
              <Calendar size={14} className="text-primary" />{" "}
              {formatDateToCustom(event.date, false)}
            </span>
            <span className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
              <Clock size={14} className="text-primary" /> {timeInfo?.startStr}{" "}
              — {timeInfo?.endStr}
            </span>
            <span className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
              <Timer size={14} className="text-primary" /> Durée:{" "}
              {timeInfo?.duration}H
            </span>
            <span className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
              <MapPin size={14} className="text-primary" /> {event.location}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <ModifyEvent event={event} />
          <AddGuest eventId={event.id} />
          <AddTable eventId={event.id} />
          <Button
            variant="destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
            className="rounded-xl font-black uppercase italic text-[10px] px-5 hover:scale-105 transition-transform"
          >
            <Trash2Icon className="w-4 h-4 mr-2" /> Supprimer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* COLONNE GAUCHE: Stats & Tables */}
        <div className="lg:col-span-2 space-y-8">
          {/* STATS REAL-TIME */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard
              label="Invitations"
              value={event.stats.totalInvitations}
              icon={Users}
              color="text-primary"
            />
            <StatCard
              label="Présences (Scans)"
              value={event.stats.totalScanned}
              icon={QrCode}
              color="text-emerald-400"
              glow
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
            <StatCard
              label="Occupation"
              value={`${occupancyRate}%`}
              icon={Layers}
              color="text-purple-400"
            />
          </div>

          {/* TABLES MONITORING */}
          <Card className="bg-white/2 border-white/5 rounded-4xl overflow-hidden backdrop-blur-md">
            <CardHeader className="border-b border-white/5 bg-white/2 p-6">
              <CardTitle className="flex items-center justify-between">
                <div className="text-sm font-black uppercase italic text-primary flex items-center gap-2">
                  <Table2Icon size={18} /> Monitoring des Tables (
                  {event.tables.length})
                </div>
                <div className="text-sm font-black uppercase italic text-primary flex items-center gap-2">
                  <Button
                    onClick={() =>
                      router.push(`/admin/events/${eventId}/tables`)
                    }
                    variant="outline"
                    className="rounded-xl border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary hover:text-primary font-black uppercase italic text-[10px] tracking-widest transition-all"
                  >
                    <Table2 className="size-4" /> Plan de Table
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 max-sm:p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {event.tables.map((table) => {
                const tableAssigned = event.invitations.reduce((total, inv) => {
                  const alloc = inv.allocations?.find(
                    (a) => a.tableId === table.id,
                  );
                  return total + (alloc?.seatsAssigned || 0);
                }, 0);
                const isFull = tableAssigned >= table.capacity;

                return (
                  <motion.div
                    key={table.id}
                    whileHover={{ scale: 1.02 }}
                    className=""
                  >
                    <Link
                      href={`/admin/events/${eventId}/tables/${table.id}`}
                      className="size-full p-4 rounded-2xl border border-white/5 bg-white/2 flex justify-between items-center group transition-all"
                    >
                      <div>
                        <p className="font-black uppercase italic text-sm text-white group-hover:text-primary transition-colors">
                          {table.name}
                        </p>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                          {tableAssigned} / {table.capacity} PLACES
                        </p>
                      </div>
                      <Badge
                        className={cn(
                          "rounded-lg font-black italic text-[9px]",
                          isFull
                            ? "bg-red-500/10 text-red-500 border-red-500/20"
                            : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                        )}
                      >
                        {isFull
                          ? "COMPLET"
                          : `${table.capacity - tableAssigned} LIBRES`}
                      </Badge>
                    </Link>
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* COLONNE DROITE: Terminals & Invitations */}
        <div className="space-y-8">
          {/* TERMINALS */}
          <Card className="bg-[#0a0a0a]/50 border-white/10 rounded-4xl border overflow-hidden">
            <CardHeader className="bg-white/5 border-b border-white/5 p-6">
              <CardTitle className="text-sm font-black uppercase italic text-primary flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Cpu size={18} /> Terminaux
                </div>
                <QuickAddTerminal eventId={event.id} />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 max-sm:p-4 space-y-3">
              {event.terminals?.map((terminal) => (
                <div
                  key={terminal.id}
                  className="p-3 rounded-2xl bg-white/3 border border-white/5 flex items-center justify-between group transition-colors hover:bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "size-10 rounded-xl flex items-center justify-center transition-colors",
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="size-8 p-0 hover:bg-white/10 rounded-xl"
                      >
                        <MoreVertical size={18} className="text-gray-500" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="bg-[#0f0f0f] border-white/10 rounded-2xl"
                    >
                      <DropdownMenuItem
                        className="gap-3 py-3 px-4 font-bold uppercase italic text-[10px] cursor-pointer"
                        onClick={() => {
                          setSelectedTerminal(terminal);
                          setIsModifyOpen(true);
                        }}
                      >
                        <Settings2 size={14} /> Configurer
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="gap-3 py-3 px-4 text-red-500 font-bold uppercase italic text-[10px] cursor-pointer"
                        onClick={() => {
                          setTerminalToDelete(terminal);
                          setIsDeleteOpen(true);
                        }}
                      >
                        <Trash2 size={14} /> Révoquer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* INVITATIONS */}
          <Card className="bg-white/2 border-white/5 rounded-4xl overflow-hidden">
            <CardHeader className="border-b border-white/5 p-6">
              <CardTitle className="text-sm font-black uppercase italic text-primary">
                Invitations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 max-sm:p-4 space-y-3 max-h-100 overflow-y-auto custom-scrollbar">
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
                    className="text-[10px] font-black border-white/10 text-white group-hover:border-primary transition-colors"
                  >
                    {inv.peopleCount} PERS.
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* MODALS */}
      <DeleteEvent
        eventId={event.id}
        eventName={event.name}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      />
      {selectedTerminal && (
        <ModifyTerminal
          key={`mod-${selectedTerminal.id}`}
          terminal={selectedTerminal}
          open={isModifyOpen}
          onOpenChange={(o) => {
            setIsModifyOpen(o);
            if (!o) setSelectedTerminal(null);
          }}
        />
      )}
      {terminalToDelete && (
        <DeleteTerminal
          key={`del-${terminalToDelete.id}`}
          terminalId={terminalToDelete.id}
          terminalName={terminalToDelete.name}
          open={isDeleteOpen}
          onOpenChange={(o) => {
            setIsDeleteOpen(o);
            if (!o) setTerminalToDelete(null);
          }}
        />
      )}
    </section>
  );
}

// Composant StatCard
function StatCard({
  label,
  value,
  icon: Icon,
  color,
  glow = false,
}: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="p-5 rounded-4xl bg-white/2 border border-white/5 flex flex-col items-center text-center gap-2 relative overflow-hidden group"
    >
      {glow && (
        <div className="absolute inset-0 bg-emerald-500/5 blur-xl group-hover:bg-emerald-500/10 transition-colors" />
      )}
      <Icon className={cn("w-5 h-5", color)} />
      <span
        className={cn("text-2xl font-black italic tracking-tighter text-white")}
      >
        {value}
      </span>
      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">
        {label}
      </span>
    </motion.div>
  );
}

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  glow?: boolean;
}

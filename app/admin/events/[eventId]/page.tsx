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
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DeleteTerminal from "../../terminals/delete-terminal";
import ModifyTerminal from "../../terminals/modify-terminal";

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

  const { data, isPending, isError, error, refetch } = useEvent(
    Number(eventId),
  );

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

  // --- LOGIQUE DE CALCUL SÉCURISÉE ---
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
          >
            <MoveLeftIcon className="mr-2 h-4 w-4" /> Retour
          </Button>

          <div className="flex flex-wrap items-center gap-4">
            <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">
              {event.name}
            </h2>
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-white/5 border border-white/10 shadow-[0_0_10px_rgba(253,182,35,0.05)]">
              <Hash size={14} className="text-primary" />
              <span className="text-sm font-mono font-bold text-primary tracking-tighter">
                {event.eventCode}
              </span>
            </div>
            <Badge
              className={cn(
                "font-black italic uppercase text-[10px] px-3 py-1",
                event.status === "UPCOMING"
                  ? "bg-primary text-white"
                  : event.status === "ONGOING"
                    ? "bg-emerald-500 text-white animate-pulse"
                    : "bg-red-500",
              )}
            >
              {event.status}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-gray-500 text-xs font-bold uppercase tracking-widest">
            <span className="flex items-center gap-2">
              <Calendar size={14} className="text-primary" />{" "}
              {formatDateToCustom(event.date, false)}
            </span>
            <span className="flex items-center gap-2">
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
            className="rounded-xl font-black uppercase italic text-[10px] px-5"
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
              label="Groupes / Invitations"
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
            <CardHeader className="border-b border-white/5 bg-white/2">
              <CardTitle className="text-sm font-black uppercase italic text-primary flex items-center gap-2">
                <Table2Icon size={18} /> Monitoring des Tables (
                {event.tables.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 max-sm:p-2 grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    className="p-4 rounded-2xl border border-white/5 bg-white/2 flex justify-between items-center group transition-all"
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
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* COLONNE DROITE: Invitations & Terminals */}
        <div className="space-y-8">
          {/* TERMINALS MONITORING */}
          <Card className="bg-[#0a0a0a]/50 border-white/10 rounded-4xl border overflow-hidden">
            <CardHeader className="bg-white/5 border-b border-white/5">
              <CardTitle className="text-sm font-black uppercase italic text-primary flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Cpu size={18} /> Liste des Terminaux
                </div>
                <QuickAddTerminal eventId={event.id} />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 max-sm:p-2 space-y-3">
              {event.terminals && event.terminals.length > 0 ? (
                event.terminals.map((terminal) => (
                  <div
                    key={terminal.id}
                    className="p-3 rounded-2xl bg-white/3 border border-white/5 flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "size-10 rounded-xl flex items-center justify-center transition-colors",
                          terminal.isActive
                            ? "bg-emerald-500/10 text-emerald-500"
                            : !terminal.deletedAt
                              ? "bg-yellow-500/20 text-yellow-500"
                              : "bg-red-500/10 text-red-500",
                        )}
                      >
                        <MonitorSmartphone size={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black uppercase italic text-white group-hover:text-primary">
                          {terminal.name}
                        </span>
                        <span className="text-[11px] text-gray-500 font-bold tracking-widest">
                          {terminal.code}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        variant={
                          terminal.deletedAt
                            ? "destructive"
                            : terminal.isActive
                              ? "default"
                              : "secondary"
                        }
                        className={cn(
                          "text-[8px] font-black px-1.5 h-4",
                          terminal.deletedAt
                            ? "Archivé"
                            : terminal.isActive
                              ? "bg-green-500/20 text-green-500 border-green-500/20"
                              : "bg-yellow-500/20 text-yellow-500 border-yellow-500/20",
                        )}
                      >
                        {terminal.deletedAt
                          ? "Archivé"
                          : terminal.isActive
                            ? "Opérationnel"
                            : "Hors-Ligne"}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          asChild
                          disabled={!!terminal.deletedAt}
                        >
                          <Button
                            variant="ghost"
                            className="size-8 p-0 hover:bg-white/10 rounded-xl"
                          >
                            <MoreVertical size={18} className="text-gray-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-[#0f0f0f] border-white/10 rounded-2xl min-w-40"
                        >
                          <DropdownMenuItem
                            className="gap-3 py-3 px-4 focus:bg-primary focus:text-white cursor-pointer font-bold uppercase italic text-[10px] transition-colors"
                            onClick={() => {
                              setSelectedTerminal(terminal);
                              setIsModifyOpen(true);
                            }}
                          >
                            <Settings2 size={14} className="text-white" />{" "}
                            Configurer
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-3 py-3 px-4 text-red-500 focus:bg-red-500 focus:text-white cursor-pointer font-bold uppercase italic text-[10px] transition-colors"
                            onClick={() => {
                              setTerminalToDelete(terminal);
                              setIsDeleteOpen(true);
                            }}
                          >
                            <Trash2 size={14} className="text-white" /> Révoquer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <p className="text-[10px] font-black text-gray-600 uppercase italic">
                    Aucun terminal lié
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* INVITATIONS LIST */}
          <Card className="bg-white/2 border-white/5 rounded-4xl">
            <CardHeader className="border-b border-white/5">
              <CardTitle className="text-sm font-black uppercase italic text-primary">
                Liste des Invitations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 max-sm:p-2 space-y-3 max-h-100 overflow-y-auto custom-scrollbar">
              {event.invitations.length === 0 && (
                <p className="text-center py-8 text-[10px] font-bold text-gray-600 uppercase italic">
                  Aucune donnée entrante
                </p>
              )}
              {event.invitations.map((inv) => (
                <div
                  key={inv.id}
                  onClick={() =>
                    router.push(`/admin/events/${eventId}/${inv.id}`)
                  }
                  className="p-3 rounded-xl border border-white/5 bg-white/1 hover:bg-white/5 transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-xs uppercase text-white group-hover:text-primary transition-colors">
                      {inv.label}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[9px] font-black border-primary/20 text-primary"
                    >
                      {inv.peopleCount} PERS.
                    </Badge>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-[9px] font-black text-gray-500 uppercase tracking-tighter">
                    <div className="flex items-center gap-1">
                      <QrCode size={10} className="text-emerald-500" />
                      <span>Scans: {inv.scannedCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Table2Icon size={10} className="text-blue-500" />
                      <span className="truncate">
                        {inv.allocations?.map((a) => a.table.name).join(", ") ||
                          "N/A"}
                      </span>
                    </div>
                  </div>
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

      {/* MODALS */}
      {selectedTerminal && (
        <ModifyTerminal
          key={`modify-${selectedTerminal.id}`}
          terminal={selectedTerminal}
          open={isModifyOpen}
          onOpenChange={(open) => {
            setIsModifyOpen(open);
            if (!open) setSelectedTerminal(null);
          }}
        />
      )}

      {terminalToDelete && (
        <DeleteTerminal
          key={`delete-${terminalToDelete.id}`}
          terminalId={terminalToDelete.id}
          terminalName={terminalToDelete.name}
          open={isDeleteOpen}
          onOpenChange={(open) => {
            setIsDeleteOpen(open);
            if (!open) setTerminalToDelete(null);
          }}
        />
      )}
    </section>
  );
}

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
      whileHover={{ y: -5 }}
      className="p-4 rounded-4xl bg-white/2 border border-white/5 flex flex-col items-center text-center gap-2 relative overflow-hidden group shadow-lg"
    >
      {glow && (
        <div className="absolute inset-0 bg-emerald-500/5 blur-xl group-hover:bg-emerald-500/10 transition-colors" />
      )}
      <Icon className={cn("w-5 h-5", color)} />
      <span
        className={cn(
          "text-2xl font-black italic tracking-tighter",
          glow ? "text-emerald-400" : "text-white",
        )}
      >
        {value}
      </span>
      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">
        {label}
      </span>
    </motion.div>
  );
}

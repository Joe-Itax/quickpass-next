"use client";

import { useMemo, useState } from "react";
import AddTerminal from "./add-terminal";
import {
  MoreVertical,
  Settings2,
  Trash2,
  MonitorSmartphone,
  Search,
  FilterX,
  Hash,
  Activity,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useEventsWithTerminals } from "@/hooks/use-event";
import ModifyTerminal from "./modify-terminal";
import DeleteTerminal from "./delete-terminal";
import DataStatusDisplay from "@/components/data-status-display";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useRealtimeList } from "@/hooks/use-realtime-list";

interface Terminal {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
  deletedAt: Date | null;
}

interface Event {
  id: string;
  name: string;
  eventCode: string;
  terminals: Terminal[];
}

export default function TerminalsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTerminal, setSelectedTerminal] = useState<Terminal | null>(
    null,
  );
  const [isModifyOpen, setIsModifyOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [terminalToDelete, setTerminalToDelete] = useState<Terminal | null>(
    null,
  );

  const {
    data: events,
    isPending,
    isError,
    error,
    refetch,
  } = useEventsWithTerminals();

  useRealtimeList(refetch);

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    return events
      .map((event: Event) => ({
        ...event,
        terminals: event.terminals.filter(
          (t) =>
            t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.code.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
      }))
      .filter((event: Event) => event.terminals.length > 0);
  }, [events, searchQuery]);

  if (isPending || isError) {
    return (
      <DataStatusDisplay
        isPending={isPending}
        hasError={isError}
        errorObject={error}
        refetch={refetch}
      />
    );
  }

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-12">
      {/* --- HEADER --- */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Activity className="text-primary" size={20} />
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tighter italic text-white">
              Terminaux
            </h1>
          </div>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.3em] ml-1">
            Points de contrôle & Monitoring
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <div className="relative w-full sm:w-80 group">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors"
              size={18}
            />
            <Input
              placeholder="RECHERCHER UN POINT..."
              className="h-12 pl-12 bg-white/5 border-white/10 rounded-2xl text-white font-bold italic focus:border-primary transition-all placeholder:text-gray-600 text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <AddTerminal />
        </div>
      </header>

      {/* --- CONTENT --- */}
      <div className="space-y-16">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event: Event) => (
            <section key={event.id} className="space-y-6">
              {/* Event Separator with Code */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-black uppercase italic tracking-tight text-white">
                    {event.name}
                  </h2>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/20 rounded-lg">
                    <Hash size={12} className="text-primary" />
                    <span className="text-[15px] font-black text-primary">
                      {event.eventCode}
                    </span>
                  </div>
                </div>
                <Badge className="w-fit bg-white/5 text-gray-500 border-none font-black text-[10px]">
                  {event.terminals.length} UNITÉS
                </Badge>
              </div>

              {/* Terminals Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {event.terminals.map((terminal: Terminal) => (
                  <div
                    key={terminal.id}
                    className={cn(
                      "relative p-6 rounded-4xl border group transition-all duration-300",
                      terminal.isActive && !terminal.deletedAt
                        ? "bg-white/3 border-white/10 hover:border-primary/40 shadow-xl shadow-black/20"
                        : "bg-black/40 border-white/5 opacity-60 grayscale-[0.8]",
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            "size-12 rounded-2xl flex items-center justify-center transition-all",
                            terminal.isActive
                              ? "bg-primary text-white"
                              : "bg-white/5 text-gray-600",
                          )}
                        >
                          <MonitorSmartphone size={24} />
                        </div>
                        <div>
                          <p className="font-black uppercase italic text-white tracking-tight">
                            {terminal.name}
                          </p>
                          <p className="text-[12px] font-mono text-gray-500 tracking-widest mt-1">
                            CODE: {terminal.code}
                          </p>
                        </div>
                      </div>

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

                    <div className="mt-6 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "size-1.5 rounded-full animate-pulse",
                            terminal.deletedAt
                              ? "bg-red-500"
                              : terminal.isActive
                                ? "bg-emerald-500"
                                : "bg-yellow-500",
                          )}
                        />
                        <span
                          className={cn(
                            "text-[9px] font-black uppercase tracking-widest",
                            terminal.deletedAt
                              ? "text-red-500"
                              : terminal.isActive
                                ? "text-emerald-500"
                                : "text-yellow-500",
                          )}
                        >
                          {terminal.deletedAt
                            ? "Archivé"
                            : terminal.isActive
                              ? "Opérationnel"
                              : "Hors-Ligne"}
                        </span>
                      </div>

                      {terminal.isActive && !terminal.deletedAt && (
                        <div className="text-[8px] font-bold text-gray-600 uppercase border border-white/5 px-2 py-1 rounded-md">
                          Ready to scan
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-40 border border-dashed border-white/10 rounded-[3rem] bg-white/2">
            <div className="size-20 rounded-3xl bg-white/5 flex items-center justify-center mb-6 border border-white/10">
              <FilterX size={40} className="text-gray-700" />
            </div>
            <p className="text-xl font-black uppercase italic text-gray-600 tracking-tighter">
              Aucun terminal trouvé
            </p>
            {searchQuery && (
              <Button
                variant="link"
                onClick={() => setSearchQuery("")}
                className="text-primary mt-4 font-bold uppercase text-[10px] tracking-widest"
              >
                Réinitialiser les filtres
              </Button>
            )}
          </div>
        )}
      </div>

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
    </div>
  );
}

"use client";

import AddTerminal from "./add-terminal";
import {
  MoreVertical,
  Settings2,
  Trash2,
  MonitorSmartphone,
  Search,
  FilterX,
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
import { useMemo, useState } from "react";
import ModifyTerminal from "./modify-terminal";
import DeleteTerminal from "./delete-terminal";
import DataStatusDisplay from "@/components/data-status-display";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
  terminals: Terminal[];
}

export default function TerminalsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTerminal, setSelectedTerminal] = useState<Terminal | null>(
    null
  );
  const [isModifyOpen, setIsModifyOpen] = useState(false);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [terminalToDelete, setTerminalToDelete] = useState<Terminal | null>(
    null
  );

  const {
    data: events,
    isPending,
    isError,
    error,
    refetch,
  } = useEventsWithTerminals();

  // Logique de filtrage performante
  const filteredEvents = useMemo(() => {
    if (!events) return [];

    return (
      events
        .map((event: Event) => ({
          ...event,
          // On filtre les terminaux de chaque event selon la recherche
          terminals: event.terminals.filter(
            (t) =>
              t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              t.code.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        }))
        // On ne garde que les events qui ont des terminaux correspondant à la recherche
        .filter((event: Event) => event.terminals.length > 0)
    );
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
    <div className="p-8 max-w-6xl mx-auto">
      {/* <header className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter italic">
            Gestion des Terminaux
          </h1>
          <p className="text-muted-foreground text-sm">
            Configurez vos points de contrôle par événement.
          </p>
        </div>
        <AddTerminal />
      </header> */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter italic">
            Gestion des Terminaux
          </h1>
          <p className="text-muted-foreground text-sm">
            Configurez vos points de contrôle par événement.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* BARRE DE RECHERCHE */}
          <div className="relative w-full md:w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={16}
            />
            <Input
              placeholder="Rechercher un terminal..."
              className="pl-9 bg-black/20 border-white/10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <AddTerminal />
        </div>
      </header>

      <div className="space-y-10">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event: Event) => (
            <section key={event.id} className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold uppercase tracking-widest text-primary">
                    {event.name}
                  </h2>
                  <Badge
                    variant="outline"
                    className="text-[10px] border-white/10 text-muted-foreground"
                  >
                    {event.terminals.length}
                  </Badge>
                </div>
                <div className="h-px flex-1 bg-border/50" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {event.terminals.map((terminal: Terminal) => (
                  <div
                    key={terminal.id}
                    className={cn(
                      "p-4 rounded-xl border flex justify-between items-center group transition-all duration-200 bg-black/30 text-white/90 border-none shadow-md shadow-black",
                      (!terminal.isActive || terminal.deletedAt) &&
                        "opacity-60 grayscale-[0.5]"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-lg bg-white/85 flex items-center justify-center relative">
                        <MonitorSmartphone
                          size={20}
                          className="text-muted-foreground"
                        />
                        {!terminal.isActive && !terminal.deletedAt && (
                          <div
                            className="absolute -top-1 -right-1 size-3 bg-yellow-500 rounded-full border-2 border-black"
                            title="Désactivé"
                          />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold leading-none">
                            {terminal.name}
                          </p>
                          {terminal.deletedAt ? (
                            <Badge
                              variant="destructive"
                              className="text-[8px] px-1.5 py-0"
                            >
                              Archivé
                            </Badge>
                          ) : !terminal.isActive ? (
                            <Badge
                              variant="secondary"
                              className="text-[8px] px-1.5 py-0 bg-yellow-500/20 text-yellow-500 border-yellow-500/20"
                            >
                              Inactif
                            </Badge>
                          ) : (
                            <Badge className="text-[8px] px-1.5 py-0 bg-green-500/20 text-green-500 border-green-500/20">
                              En ligne
                            </Badge>
                          )}
                        </div>
                        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                          {terminal.code}
                        </p>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger
                        asChild
                        disabled={!!terminal.deletedAt}
                      >
                        <button
                          className={cn(
                            "p-2 hover:bg-black/50 rounded-full cursor-pointer transition-colors",
                            !!terminal.deletedAt &&
                              "cursor-not-allowed opacity-20"
                          )}
                        >
                          <MoreVertical size={16} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="bg-[#151515] border-white/10 text-white"
                      >
                        <DropdownMenuItem
                          className="gap-2 focus:bg-white/5 focus:text-white cursor-pointer"
                          onClick={() => {
                            setSelectedTerminal(terminal);
                            setIsModifyOpen(true);
                          }}
                        >
                          <Settings2 size={14} /> Modifier
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          className="gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                          onClick={() => {
                            setTerminalToDelete(terminal);
                            setIsDeleteOpen(true);
                          }}
                        >
                          <Trash2 size={14} /> Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-white/5 rounded-3xl bg-black/10">
            <div className="size-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <FilterX size={32} className="text-muted-foreground" />
            </div>
            <p className="text-lg font-medium text-white/50 italic">
              Aucun terminal trouvé
            </p>
            {searchQuery && (
              <Button
                variant="link"
                onClick={() => setSearchQuery("")}
                className="text-primary mt-2"
              >
                Effacer la recherche
              </Button>
            )}
          </div>
        )}
        {/* MODAL DE MODIFICATION */}
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

        {/* MODAL DE SUPPRESSION (SOFT DELETE) */}
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
    </div>
  );
}

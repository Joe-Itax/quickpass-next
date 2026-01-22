"use client";

import { useParams, useRouter } from "next/navigation";
import { useEventHistory } from "@/hooks/use-event";
import {
  ChevronLeft,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Search,
  MonitorSmartphone,
  XCircle,
  Loader2Icon,
} from "lucide-react";
import DataStatusDisplay from "@/components/data-status-display";
import { Log } from "@/types/types";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRealtimeSync } from "@/hooks/use-realtime-sync";

export default function HistoryPage() {
  const { eventCode } = useParams() as { eventCode: string };
  const eventName = localStorage.getItem("eventName") || "";
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTerminal, setSelectedTerminal] = useState<string | null>(null);

  const {
    data: logs,
    isPending,
    isError,
    error,
    refetch,
  } = useEventHistory(eventCode);

  useRealtimeSync({
    eventCode,
    onUpdate: () => refetch(),
  });

  // Extraction de la liste unique des terminaux pour le filtre
  const terminals = useMemo((): string[] => {
    if (!logs) return [];
    const names = logs
      .map(
        (l: { terminal: { name: string }; terminalCode: string }) =>
          l.terminal?.name || l.terminalCode,
      )
      .filter(Boolean);
    return Array.from(new Set(names)) as string[];
  }, [logs]);

  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    return logs.filter((log: Log) => {
      const matchesSearch =
        log.guestName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.errorMessage?.toLowerCase().includes(searchQuery.toLowerCase());

      const terminalName = log.terminal?.name || log.terminalCode;
      const matchesTerminal =
        !selectedTerminal || terminalName === selectedTerminal;

      return matchesSearch && matchesTerminal;
    });
  }, [logs, searchQuery, selectedTerminal]);

  if (isError) {
    return (
      <DataStatusDisplay
        isPending={false}
        hasError={isError}
        errorObject={error}
        refetch={refetch}
      />
    );
  }

  return (
    <div className="min-h-screen text-white flex flex-col bg-[#050505] bg-[url(/bg-1.svg)] bg-center bg-no-repeat bg-cover pb-12">
      {/* STICKY HEADER */}
      <header className="sticky top-0 z-30 p-6 bg-white/5 backdrop-blur-xl border-b border-white/10 ">
        <div className="flex justify-between items-center mb-6">
          <Button
            onClick={() => router.push(`/scan-portail/${eventCode}`)}
            variant="ghost"
            className="size-10 rounded-full p-0"
          >
            <ChevronLeft size={20} />
          </Button>
          <div className="text-center">
            <h1 className="text-xl font-black italic uppercase tracking-tighter">
              Journal de Bord
            </h1>
            <p className="text-[9px] text-primary font-bold uppercase tracking-widest">
              {isPending ? "Event" : eventName}
            </p>
          </div>
          <div className="size-10" />
        </div>

        {/* RECHERCHE */}
        <div className="relative max-w-lg m-auto">
          <Search
            className="absolute left-3 top-1/4 -translate-y-1/2 text-gray-500"
            size={16}
          />
          <Input
            placeholder="Rechercher un nom, une erreur..."
            className="bg-white/5 border-white/10 pl-10 h-12 rounded-xl focus:border-primary transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
            >
              <XCircle size={16} />
            </button>
          )}

          {/* FILTRE PAR TERMINAL */}
          {terminals.length > 0 && (
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2 no-scrollbar">
              <button
                onClick={() => setSelectedTerminal(null)}
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all whitespace-nowrap ${
                  !selectedTerminal
                    ? "bg-primary text-white"
                    : "bg-white/5 text-gray-500"
                }`}
              >
                Tous
              </button>
              {!isPending &&
                terminals.map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTerminal(t)}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all whitespace-nowrap ${
                      selectedTerminal === t
                        ? "bg-primary text-white"
                        : "bg-white/5 text-gray-500"
                    }`}
                  >
                    {t}
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* STATS RAPIDES */}
        <div className="sticky bottom-0 p-4 pb-0 mt-2 border-t border-white/10 flex justify-center">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em]">
            Total: {isPending ? "..." : filteredLogs.length} scans affichés
          </p>
        </div>
      </header>

      <div className="p-6 pb-40 space-y-4 flex-1 w-full max-w-3xl m-auto">
        {isPending ? (
          <div className="w-full m-auto flex justify-center pt-12">
            <Loader2Icon className="ani animate-spin text-primary mr-2" />
            <span>Chargement de l&apos;historique</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-30 italic">
            <Clock size={40} className="mb-4" />
            <p>
              {searchQuery
                ? "Aucun résultat pour cette recherche"
                : "Aucun scan enregistré..."}
            </p>
          </div>
        ) : (
          filteredLogs.map((log: Log) => {
            const dateObj = new Date(log.scannedAt);

            return (
              <div
                key={log.id}
                className={`p-4 rounded-2xl border backdrop-blur-sm transition-all shadow-lg ${
                  log.status === "SUCCESS"
                    ? "bg-white/2 border-white/5"
                    : "bg-red-500/5 border-red-500/20"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* ICON STATUS */}
                  <div
                    className={`size-10 shrink-0 rounded-xl flex items-center justify-center ${
                      log.status === "SUCCESS"
                        ? "text-green-400 bg-green-400/10"
                        : "text-red-400 bg-red-400/10"
                    }`}
                  >
                    {log.status === "SUCCESS" ? (
                      <ShieldCheck size={22} />
                    ) : (
                      <ShieldAlert size={22} />
                    )}
                  </div>

                  {/* CONTENT */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <p
                        className={`font-black uppercase text-sm truncate tracking-tight ${log.status === "ERROR" ? "text-red-200" : "text-white"}`}
                      >
                        {log.guestName || "QR Invalide"}
                      </p>

                      {/* AFFICHAGE DATE ET HEURE */}
                      <div className="text-right shrink-0 ml-2">
                        <p className="text-[11px] font-mono font-bold text-gray-300 leading-none">
                          {dateObj.toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        <p className="text-[10px] font-medium text-gray-600 uppercase mt-0.5">
                          {dateObj.toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    {/* ERROR MESSAGE */}
                    {log.status === "ERROR" ? (
                      <p className="text-[11px] font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded w-fit">
                        {log.errorMessage || "Erreur inconnue"}
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        <Badge
                          variant="secondary"
                          className="bg-white/5 text-[9px] text-gray-400 border-none px-1.5 py-0 h-4"
                        >
                          <MonitorSmartphone size={10} className="mr-1" />
                          {log.terminal?.name ||
                            log.terminalCode ||
                            "Terminal Inconnu"}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

"use client";

import { motion, AnimatePresence } from "motion/react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, CalendarPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { EventCard } from "./event-card";
import { useEvents } from "@/hooks/use-event";
import { Event2 } from "@/types/types";
import DataStatusDisplay from "@/components/data-status-display";
import AddEvent from "../events/add-event";
import { useRealtimeList } from "@/hooks/use-realtime-list";

export default function Events() {
  const { data: events = [], isPending, isError, error, refetch } = useEvents();
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  useRealtimeList(refetch);

  const filteredEvents = useMemo(() => {
    return (events as Event2[]).filter((e: Event2) => {
      const matchesStatus = statusFilter === "all" || e.status === statusFilter;
      const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [events, search, statusFilter]);

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
    <div className="space-y-8">
      {/* TOOLBAR FILTRES */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-center bg-white/2 border border-white/5 p-4 rounded-4xl backdrop-blur-md">
        <div className="relative w-full lg:max-w-md">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
            size={18}
          />
          <Input
            placeholder="Rechercher par nom d'événement..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 pl-12 bg-white/5 border-white/10 rounded-xl focus:border-primary transition-all text-white placeholder:text-gray-600"
          />
        </div>

        <div className="flex max-sm:flex-wrap gap-3 w-full lg:w-auto items-center">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-xl text-gray-300 min-w-40">
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-primary" />
                <SelectValue placeholder="Statut" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-[#0f0f0f] border-white/10 text-white">
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="UPCOMING">À venir</SelectItem>
              <SelectItem value="ONGOING">En cours</SelectItem>
              <SelectItem value="FINISHED">Terminés</SelectItem>
            </SelectContent>
          </Select>

          <AddEvent />
        </div>
      </div>

      {/* GRILLE D'ÉVÉNEMENTS */}
      <AnimatePresence mode="popLayout">
        {filteredEvents.length <= 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-white/5 rounded-[3rem]"
          >
            <CalendarPlus size={48} className="text-gray-700 mb-4" />
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">
              Aucun événement détecté
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event, i) => (
              <motion.div
                key={event.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
              >
                <EventCard event={event} />
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

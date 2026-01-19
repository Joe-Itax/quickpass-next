"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMemo, useState } from "react";
import { EventCard } from "./event-card";
import { useEvents } from "@/hooks/use-event";
import { Event2 } from "@/types/types";
import DataStatusDisplay from "@/components/data-status-display";
import AddEvent from "../events/add-event";

export default function Events() {
  const { data: events = [], isPending, isError, error, refetch } = useEvents();

  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filteredEvents = useMemo(() => {
    return (events as Event2[]).filter((e: Event2) => {
      const matchesStatus = statusFilter === "all" || e.status === statusFilter;
      const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [events, search, statusFilter]);

  if (isPending || error || isError) {
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
    <>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <Input
          placeholder="🔍 Rechercher un événement..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-1/2"
        />

        <div className="flex gap-2 flex-wrap justify-center items-center">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-45">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="UPCOMING">À venir</SelectItem>
              <SelectItem value="ONGOING">En cours</SelectItem>
              <SelectItem value="FINISHED">Passés</SelectItem>
            </SelectContent>
          </Select>

          <AddEvent />
        </div>
      </div>

      {filteredEvents.length <= 0 && (
        <div className="flex justify-center items-center pt-32">
          <p>Aucun événement à afficher. Créer votre premier événement.</p>
        </div>
      )}

      {/* Event List */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredEvents.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </>
  );
}

"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useMemo, useState } from "react";
import { EventCard } from "./event-card";
import { Event } from "@/types/types";

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchEvents = async () => {
      const res = await fetch("/data/events.json");
      const data = await res.json();
      setEvents(data);
    };
    fetchEvents();
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const matchesStatus = statusFilter === "all" || e.status === statusFilter;
      const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [events, search, statusFilter]);

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

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="upcoming">À venir</SelectItem>
            <SelectItem value="ongoing">En cours</SelectItem>
            <SelectItem value="past">Passés</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Event List */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredEvents.map((event, i) => (
          <EventCard key={i} event={event} />
        ))}
      </div>
    </>
  );
}

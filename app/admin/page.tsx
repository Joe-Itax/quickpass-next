"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { CalendarDays, Clock, CheckCircle } from "lucide-react";
import { EventCard } from "./components/event-card";
import { StatCard } from "./components/stat-card";
import { Event } from "@/types/types";

export default function AdminDashboard() {
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

  const total = events.length;
  const ongoing = events.filter((e) => e.status === "ongoing").length;
  const past = events.filter((e) => e.status === "past").length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Tableau de bord</h1>
          <p className="text-gray-200 text-sm">
            Aperçu de vos événements et statistiques
          </p>
        </div>
        <Button className="bg-primary text-white hover:bg-primary/90">
          + Nouvel événement
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total événements"
          value={total}
          icon={<CalendarDays />}
        />
        <StatCard title="En cours" value={ongoing} icon={<Clock />} />
        <StatCard title="Passés" value={past} icon={<CheckCircle />} />
      </div>

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
    </div>
  );
}

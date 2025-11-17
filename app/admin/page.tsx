"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, CheckCircle } from "lucide-react";
import { StatCard } from "./components/stat-card";
import { Event } from "@/types/types";
import Events from "./components/events";

export default function AdminDashboard() {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      const res = await fetch("/data/events.json");
      const data = await res.json();
      setEvents(data);
    };
    fetchEvents();
  }, []);

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

      {/* Filters & Event List*/}
      <Events />
    </div>
  );
}

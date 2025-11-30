"use client";

// import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, CheckCircle } from "lucide-react";
import { StatCard } from "./components/stat-card";
import { Event2 } from "@/types/types";
import Events from "./components/events";
import { useEvents } from "@/hooks/use-event";
import DataStatusDisplay from "@/components/data-status-display";

export default function AdminDashboard() {
  const { data = [], isPending, isError, error, refetch } = useEvents();
  const events = data as Event2[];

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

  const total = events.length;
  const ongoing = events.filter((e) => e.status === "ONGOING").length;
  const past = events.filter((e) => e.status === "FINISHED").length;
  // const upcoming = events.filter((e) => e.status === "UPCOMING").length;

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
        {/* <Button className="bg-primary text-white hover:bg-primary/90">
          + Nouvel événement
        </Button> */}
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
        {/* <StatCard title="À venir" value={upcoming} icon={<CalendarDays />} /> */}
      </div>

      {/* Filters & Event List*/}
      <Events />
    </div>
  );
}

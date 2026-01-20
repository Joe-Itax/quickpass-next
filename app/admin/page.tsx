"use client";

import { motion } from "motion/react";
import {
  CalendarDays,
  Clock,
  CheckCircle,
  LayoutDashboard,
} from "lucide-react";
import { StatCard } from "./components/stat-card";
import { Event2 } from "@/types/types";
import Events from "./components/events";
import { useEvents } from "@/hooks/use-event";
import DataStatusDisplay from "@/components/data-status-display";

export default function AdminDashboard() {
  const { data = [], isPending, isError, error, refetch } = useEvents();
  const events = data as Event2[];

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

  const total = events.length;
  const ongoing = events.filter((e) => e.status === "ONGOING").length;
  const past = events.filter((e) => e.status === "FINISHED").length;

  return (
    <div className="flex flex-col gap-10">
      {/* Header avec bouton d'action rapide */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center gap-2 mb-1">
            <LayoutDashboard size={16} className="text-primary" />
            <p className="text-[10px] font-bold text-primary tracking-[0.3em] uppercase">
              Control Panel
            </p>
          </div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">
            Tableau de bord
          </h1>
          <p className="text-gray-500 text-xs font-medium uppercase tracking-widest mt-1">
            Gestion globale des événements et flux
          </p>
        </motion.div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard
          title="Total événements"
          value={total}
          icon={<CalendarDays size={20} />}
          delay={0.1}
        />
        <StatCard
          title="En cours"
          value={ongoing}
          icon={<Clock size={20} />}
          color="text-emerald-400"
          delay={0.2}
        />
        <StatCard
          title="Passés"
          value={past}
          icon={<CheckCircle size={20} />}
          color="text-gray-500"
          delay={0.3}
        />
      </div>

      {/* Liste des Événements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white/2 border border-white/5 rounded-[2.5rem] p-1"
      >
        <Events />
      </motion.div>
    </div>
  );
}

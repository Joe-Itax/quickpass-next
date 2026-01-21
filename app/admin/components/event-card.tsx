"use client";

import { Event2 } from "@/types/types";
import {
  Calendar,
  MapPin,
  Users,
  ArrowRight,
  Clock,
  Timer,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function EventCard({ event }: { event: Event2 }) {
  const statusColors = {
    UPCOMING: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    ONGOING:
      "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]",
    FINISHED: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    CANCELLED: "bg-red-500 text-white/80 border-white/20",
  };

  // Calcul de l'heure de fin pour l'affichage
  const startTime = new Date(event.date);
  const endTime = new Date(
    startTime.getTime() + (event.durationHours || 24) * 60 * 60 * 1000,
  );

  return (
    <div className="group relative bg-white/3 hover:bg-white/6 border border-white/10 rounded-[2.5rem] overflow-hidden transition-all duration-300 backdrop-blur-md">
      {/* STATUS OVERLAY */}
      <div className="absolute top-5 right-5 z-10 flex flex-col items-end gap-2">
        <Badge
          variant="outline"
          className={`${statusColors[event.status as keyof typeof statusColors]} border font-black uppercase text-[9px] px-3 py-1 rounded-full`}
        >
          {event.status === "ONGOING" && (
            <span className="size-1.5 rounded-full bg-emerald-400 animate-ping mr-2" />
          )}
          {event.status}
        </Badge>

        {event.status === "ONGOING" && (
          <div className="bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg border border-white/5 flex items-center gap-1.5">
            <Timer size={10} className="text-primary" />
            <span className="text-[8px] font-bold text-white/50 uppercase">
              Fin env. {endTime.getHours()}h
              {endTime.getMinutes().toString().padStart(2, "0")}
            </span>
          </div>
        )}
      </div>

      <div className="py-8 px-8 max-sm:px-4">
        {/* HEADER EVENT */}
        <div className="mb-6">
          <p className="text-[10px] font-black text-primary tracking-[0.3em] uppercase mb-1">
            {event.status === "FINISHED"
              ? "Session terminée"
              : "Session active"}
          </p>
          <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white group-hover:text-primary transition-colors truncate">
            {event.name}
          </h3>
          <p className="text-gray-500 text-[11px] mt-2 line-clamp-2 font-medium">
            {event.description}
          </p>
        </div>

        {/* DETAILS */}
        <div className="grid grid-cols-1 gap-3 mb-8">
          {/* Date et Heure combinées */}
          <div className="flex items-center gap-3 text-gray-400">
            <div className="size-8 rounded-lg bg-white/5 flex items-center justify-center text-primary/60 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
              <Calendar size={14} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black uppercase tracking-tight text-white/90">
                {new Date(event.date).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
              <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500 italic">
                <Clock size={10} />
                <span>
                  Début : {startTime.getHours()}h
                  {startTime.getMinutes().toString().padStart(2, "0")}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-gray-400">
            <div className="size-8 rounded-lg bg-white/5 flex items-center justify-center text-primary/60 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
              <MapPin size={14} />
            </div>
            <span className="text-xs font-bold uppercase tracking-tight text-white/70 truncate">
              {event.location}
            </span>
          </div>

          <div className="flex items-center gap-3 text-gray-400">
            <div className="size-8 rounded-lg bg-white/5 flex items-center justify-center text-primary/60 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
              <Users size={14} />
            </div>
            <span className="text-xs font-bold uppercase tracking-tight text-white/70">
              {event.invitations?.length || 0} Invitations enregistrées
            </span>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-2">
          <Link href={`/admin/events/${event.id}`} className="flex-1">
            <Button
              className="w-full bg-white/5 hover:bg-primary text-white font-black uppercase italic text-xs py-5 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/5 hover:border-primary"
              variant={"secondary"}
            >
              Gérer l&apos;événement
              <ArrowRight
                size={16}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Button>
          </Link>
        </div>
      </div>

      {/* PROGRESS DECORATION */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-white/5">
        <div
          className={`h-full transition-all duration-1000 ${
            event.status === "ONGOING"
              ? "bg-primary animate-pulse shadow-[0_0_15px_#FDB623]"
              : event.status === "FINISHED"
                ? "bg-emerald-500"
                : "bg-white/10"
          }`}
          style={{
            width:
              event.status === "FINISHED"
                ? "100%"
                : event.status === "ONGOING"
                  ? "60%"
                  : "15%",
          }}
        />
      </div>
    </div>
  );
}

"use client";

import { Event2 } from "@/types/types";
import { Calendar, MapPin, Users, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function EventCard({ event }: { event: Event2 }) {
  const statusColors = {
    UPCOMING: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    ONGOING: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    FINISHED: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    CANCELLED: "bg-red-500 text-white/80 border-white/20",
  };

  return (
    <div className="group relative bg-white/3 hover:bg-white/6 border border-white/10 rounded-[2.5rem] overflow-hidden transition-all duration-300 backdrop-blur-md">
      {/* STATUS OVERLAY */}
      <div className="absolute top-5 right-5 z-10">
        <Badge
          variant="outline"
          className={`${statusColors[event.status as keyof typeof statusColors]} border font-black uppercase text-[9px] px-3 py-1 rounded-full`}
        >
          {event.status}
        </Badge>
      </div>

      <div className="py-8 px-8 max-sm:px-2">
        {/* HEADER EVENT */}
        <div className="mb-6">
          <p className="text-[10px] font-black text-primary tracking-[0.3em] uppercase mb-1">
            Session
          </p>
          <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white group-hover:text-primary transition-colors truncate">
            {event.name}
          </h3>
          <p className="text-gray-500 text-[11px] mt-2 line-clamp-2 font-medium">
            {event.description}
          </p>
        </div>

        {/* DETAILS */}
        <div className="space-y-3 mb-8">
          <div className="flex items-center gap-3 text-gray-400">
            <div className="size-8 rounded-lg bg-white/5 flex items-center justify-center text-primary/60">
              <Calendar size={14} />
            </div>
            <span className="text-xs font-bold uppercase tracking-tight text-white/70">
              {new Date(event.date).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>

          <div className="flex items-center gap-3 text-gray-400">
            <div className="size-8 rounded-lg bg-white/5 flex items-center justify-center text-primary/60">
              <MapPin size={14} />
            </div>
            <span className="text-xs font-bold uppercase tracking-tight text-white/70 truncate">
              {event.location}
            </span>
          </div>

          <div className="flex items-center gap-3 text-gray-400">
            <div className="size-8 rounded-lg bg-white/5 flex items-center justify-center text-primary/60">
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
              className="w-full bg-white/5 hover:bg-primary text-white font-black uppercase italic text-xs py-4 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              variant={"secondary"}
            >
              Gérer l&apos;événement
              <ArrowRight
                size={16}
                className="group-hover/btn:translate-x-1 transition-transform"
              />
            </Button>
          </Link>
        </div>
      </div>

      {/* PROGRESS DECORATION */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-white/5">
        <div
          className={`h-full ${event.status === "ONGOING" ? "bg-primary animate-pulse shadow-[0_0_10px_#FDB623]" : "bg-white/10"}`}
          style={{ width: event.status === "FINISHED" ? "100%" : "30%" }}
        />
      </div>
    </div>
  );
}

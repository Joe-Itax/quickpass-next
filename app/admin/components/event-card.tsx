"use client";

import Link from "next/link";
import { Calendar, MapPin, Users } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Event2 } from "@/types/types";
import formatDateToCustom from "@/utils/format-date-to-custom";

export function EventCard({ event }: { event: Event2 }) {
  return (
    <Link href={`/admin/events/${event.id ?? ""}`}>
      <Card className="hover:shadow-lg hover:scale-[1.01] transition-all duration-200 bg-black/30 text-white/90 border-none shadow-md shadow-black">
        <CardHeader>
          <CardTitle>{event.name}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <p className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />{" "}
            {formatDateToCustom(event.date) ?? "Date inconnue"}
          </p>
          <p className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />{" "}
            {event.location ?? "Lieu inconnu"}
          </p>
          <p className="flex flex-col gap-2">
            <Users className="size-4! text-primary" />
            {event.stats.totalInvitations} invitations envoyés (Pour{" "}
            {event.stats.totalPeople} personnes) — ({event.stats.totalCapacity}{" "}
            places au total dispo)
          </p>
          <span
            className={`mt-2 px-2 py-1 text-xs rounded-full self-start ${
              event.status === "UPCOMING"
                ? "bg-blue-500/20 text-blue-300"
                : event.status === "ONGOING"
                ? "bg-green-500/20 text-green-300"
                : "bg-red-500/20 text-red-300"
            }`}
          >
            {event.status === "UPCOMING"
              ? "À venir"
              : event.status === "ONGOING"
              ? "En cours"
              : "Passé"}
          </span>
          <p>Event Code: {event.eventCode}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

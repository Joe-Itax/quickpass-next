"use client";

import Link from "next/link";
import { Calendar, MapPin, Users } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Event } from "@/types/types";

export function EventCard({ event }: { event: Event }) {
  return (
    <Link href={`/admin/events/${event.id ?? ""}`}>
      <Card className="hover:shadow-lg hover:scale-[1.01] transition-all duration-200 bg-black/30 text-white/90 border-none shadow-md shadow-black">
        <CardHeader>
          <CardTitle>{event.name}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <p className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />{" "}
            {event.date ?? "Date inconnue"}
          </p>
          <p className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />{" "}
            {event.location ?? "Lieu inconnu"}
          </p>
          <p className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            {/* {event.guestsCount ?? 0}{" "} invités*/}
            {event.totalInvitations} invitations — ({event.totalCapacity}{" "}
            personnes)
          </p>
          <span
            className={`mt-2 px-2 py-1 text-xs rounded-full self-start ${
              event.status === "upcoming"
                ? "bg-blue-500/20 text-blue-300"
                : event.status === "ongoing"
                ? "bg-green-500/20 text-green-300"
                : "bg-red-500/20 text-red-300"
            }`}
          >
            {event.status === "upcoming"
              ? "À venir"
              : event.status === "ongoing"
              ? "En cours"
              : "Passé"}
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}

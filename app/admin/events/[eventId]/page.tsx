"use client";

import { useDeleteEvent, useEvent } from "@/hooks/use-event";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DataStatusDisplay from "@/components/data-status-display";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MoveLeftIcon,
  Users,
  Table2Icon,
  QrCode,
  UserCheck2Icon,
  Trash2Icon,
} from "lucide-react";
import { Event2, EventAssignment } from "@/types/types";
import formatDateToCustom from "@/utils/format-date-to-custom";
import AddGuest from "./add-guest";
import AddTable from "./add-table";
import ModifyEvent from "./modify-event";

export default function EventPage() {
  const { eventId } = useParams();
  const router = useRouter();

  const { data, isPending, isError, error, refetch } = useEvent(
    Number(eventId)
  );
  const { mutateAsync: deleteEvent, isPending: isDeleting } = useDeleteEvent(
    Number(eventId)
  );

  if (isPending || isError || error) {
    return (
      <DataStatusDisplay
        isPending={isPending}
        hasError={isError}
        errorObject={error}
        refetch={refetch}
      />
    );
  }

  const event = data as Event2;

  const handleInvitationClick = (guestId: number) => {
    router.push(`/admin/events/${eventId}/${guestId}`);
  };

  const handleTableClick = (tableId: number) => {
    router.push(`/admin/events/${eventId}/tables/${tableId}`);
  };

  const handleDeleteEvent = async () => {
    if (
      confirm(
        `Êtes-vous sûr de vouloir supprimer l'événement "${event.name}" ? Cette action est irréversible.`
      )
    ) {
      try {
        await deleteEvent(event.id);
        router.push(`/admin/events`);
      } catch (error) {
        console.error("Error deleting event:", error);
      }
    }
  };

  return (
    <section className="p-6 max-w-5xl mx-auto space-y-10">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push("/admin/events")}>
            <MoveLeftIcon />
          </Button>
          <h2 className="text-3xl font-bold ">{event.name}</h2>
          <Badge
            variant={
              event.status === "UPCOMING"
                ? "default"
                : event.status === "ONGOING"
                ? "secondary"
                : "destructive"
            }
          >
            {event.status}
          </Badge>
        </div>
        <div className="flex flex-col gap-2">
          <ModifyEvent event={event} />
          <AddGuest eventId={event.id} />
          <AddTable eventId={event.id} />
          <Button
            variant="outline"
            onClick={handleDeleteEvent}
            disabled={isDeleting}
            className="text-red-400 border-red-400/30 hover:bg-red-400/10 hover:text-red-300"
          >
            <Trash2Icon className="w-4 h-4 mr-2" />
            {isDeleting ? "Suppression..." : "Supprimer"}
          </Button>
        </div>
      </div>

      {/* MAIN INFO */}
      <Card className="text-white/80">
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold">Description</h3>
            <p className="text-muted/70">{event.description}</p>
          </div>
          <div>
            <h3 className="font-semibold">Date</h3>
            <p className="text-muted/70">
              {formatDateToCustom(event.date, false)}
            </p>
          </div>
          <div>
            <h3 className="font-semibold">Lieu</h3>
            <p className="text-muted/70">{event.location}</p>
          </div>
          <div>
            <h3 className="font-semibold">Code de l&apos;événement</h3>
            <p className="text-muted/70">{event.eventCode}</p>
          </div>
        </CardContent>
      </Card>

      {/* STATS */}
      <Card className="text-white/80">
        <CardHeader>
          <CardTitle>Statistiques</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat
            label="Invitations"
            value={event.stats.totalInvitations}
            icon={Users}
          />
          <Stat
            label="Personnes prévues"
            value={event.stats.totalPeople}
            icon={Users}
          />
          <Stat
            label="Places totales"
            value={event.stats.totalCapacity}
            icon={Table2Icon}
          />
          <Stat
            label="Places disponibles"
            value={event.stats.availableSeats}
            icon={Table2Icon}
          />

          <Stat
            label="Déjà scannés"
            value={event.stats.totalScanned}
            icon={QrCode}
          />
          <Stat
            label="Taux d'occupation"
            value={`${Math.round(
              (event.stats.totalAssignedSeats / event.stats.totalCapacity) * 100
            )}%`}
            icon={Users}
          />
        </CardContent>
      </Card>

      {/* TABLES */}
      <Card className="text-white/80">
        <CardHeader>
          <CardTitle>Tables ({event.tables.length})</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {event.tables.map((table) => {
            // Calculer le total des places assignées pour cette table
            // en parcourant toutes les invitations et leurs allocations
            const totalSeatsAssigned = event.invitations.reduce(
              (total, invitation) => {
                const allocationForThisTable = invitation.allocations?.find(
                  (allocation) => allocation.tableId === table.id
                );
                return total + (allocationForThisTable?.seatsAssigned || 0);
              },
              0
            );

            return (
              <div
                key={table.id}
                onClick={() => handleTableClick(table.id)}
                className="p-3 rounded border border-white/10 bg-muted/10 flex justify-between items-center cursor-pointer hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium">{table.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {totalSeatsAssigned}/{table.capacity} places
                  </Badge>
                </div>
                <div className="text-sm text-muted/70">
                  {totalSeatsAssigned === 0 ? (
                    <span className="text-green-400">Libre</span>
                  ) : totalSeatsAssigned === table.capacity ? (
                    <span className="text-red-400">Complet</span>
                  ) : (
                    <span className="text-yellow-400">
                      {table.capacity - totalSeatsAssigned} places libres
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* INVITATIONS */}
      <Card className="text-white/80">
        <CardHeader>
          <CardTitle>Invitations ({event.invitations.length})</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {event.invitations.map((inv) => (
            <div
              key={inv.id}
              onClick={() => handleInvitationClick(inv.id)}
              className="p-3 rounded border border-white/10 bg-muted/10 cursor-pointer hover:bg-muted/20 transition-colors"
            >
              <div className="flex justify-between">
                <span className="font-medium">{inv.label}</span>
                <Badge variant="outline">{inv.peopleCount} pers.</Badge>
              </div>
              <p className="text-xs text-muted/70 mt-1">
                Scanné : {inv.scannedCount}
              </p>
              <p>
                Tables: {inv.allocations?.map((a) => a.table.name).join(", ")}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ASSIGNMENTS */}
      <UsersAssigned assignments={event.assignments} />
    </section>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className: string }>;
}) {
  return (
    <div className="p-4 bg-muted/10 rounded-lg flex flex-col items-center gap-2">
      <Icon className="w-5 h-5 text-primary" />
      <span className="text-lg font-bold">{value}</span>
      <span className="text-xs text-muted/70">{label}</span>
    </div>
  );
}

function UsersAssigned({ assignments }: { assignments: EventAssignment[] }) {
  return (
    <Card className="text-white/80">
      <CardHeader>
        <CardTitle>Équipe assignée ({assignments.length})</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {assignments.map((a: EventAssignment) => {
          return (
            <div
              key={a.id}
              className="p-3 rounded border border-white/10 bg-muted/10 flex justify-between"
            >
              <span className="font-medium flex items-center gap-2">
                <UserCheck2Icon className="w-4 h-4" />
                {a.user?.name ?? "—"}
              </span>
              <span className="text-muted/70 text-sm">
                {formatDateToCustom(a.assignedAt, false)}
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

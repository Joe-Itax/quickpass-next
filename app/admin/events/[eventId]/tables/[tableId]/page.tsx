"use client";

import { useEvent, useTable, useDeleteTable } from "@/hooks/use-event";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DataStatusDisplay from "@/components/data-status-display";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoveLeftIcon, Trash2Icon, Users, Table2Icon } from "lucide-react";
import { Event2, Table as TableType } from "@/types/types";
import ModifyTable from "../modify-table";

export default function TablePage() {
  const { eventId, tableId } = useParams();
  const router = useRouter();

  const { data: eventData, isPending: isEventPending } = useEvent(
    Number(eventId)
  );
  const {
    data: tableData,
    isPending: isTablePending,
    error,
    refetch,
  } = useTable(Number(eventId), Number(tableId));
  const { mutateAsync: deleteTable, isPending: isDeleting } = useDeleteTable(
    Number(eventId)
  );

  const isPending = isEventPending || isTablePending;
  const hasError = error !== null;

  if (isPending || hasError) {
    return (
      <DataStatusDisplay
        isPending={isPending}
        hasError={hasError}
        errorObject={error}
        refetch={refetch}
      />
    );
  }

  const event = eventData as Event2;
  const table = tableData as TableType;

  // Calculer les invités assignés à cette table
  const guestsAtTable =
    event?.invitations.filter((invitation) =>
      invitation.allocations?.some(
        (allocation) => allocation.tableId === table.id
      )
    ) || [];

  const totalSeatsAssigned = guestsAtTable.reduce((total, invitation) => {
    const allocation = invitation.allocations?.find(
      (a) => a.tableId === table.id
    );
    return total + (allocation?.seatsAssigned || 0);
  }, 0);

  const handleDeleteTable = async () => {
    if (
      confirm(
        `Êtes-vous sûr de vouloir supprimer la table "${table.name}" ? Cette action est irréversible.`
      )
    ) {
      try {
        await deleteTable(table.id);
        router.push(`/admin/events/${eventId}`);
      } catch (error) {
        console.error("Error deleting table:", error);
      }
    }
  };

  return (
    <section className="p-6 max-w-4xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push(`/admin/events/${eventId}`)}
          >
            <MoveLeftIcon />
          </Button>
          <div>
            <h2 className="text-3xl font-bold">{table.name}</h2>
            <p className="text-white/60">
              Table de l&apos;événement {event?.name}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <ModifyTable
            eventId={Number(eventId)}
            table={table}
            onTableUpdated={refetch}
          />
          <Button
            variant="outline"
            onClick={handleDeleteTable}
            disabled={isDeleting || totalSeatsAssigned > 0}
            className="text-red-400 border-red-400/30 hover:bg-red-400/10 hover:text-red-300"
          >
            <Trash2Icon className="w-4 h-4 mr-2" />
            {isDeleting ? "Suppression..." : "Supprimer"}
          </Button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="text-white/80">
          <CardContent className="p-6 flex flex-col items-center gap-2">
            <Table2Icon className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold">{table.capacity}</span>
            <span className="text-sm text-white/60">Capacité totale</span>
          </CardContent>
        </Card>

        <Card className="text-white/80">
          <CardContent className="p-6 flex flex-col items-center gap-2">
            <Users className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold">{totalSeatsAssigned}</span>
            <span className="text-sm text-white/60">Places assignées</span>
          </CardContent>
        </Card>

        <Card className="text-white/80">
          <CardContent className="p-6 flex flex-col items-center gap-2">
            <Table2Icon className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold">
              {table.capacity - totalSeatsAssigned}
            </span>
            <span className="text-sm text-white/60">Places disponibles</span>
          </CardContent>
        </Card>
      </div>

      {/* STATUS */}
      <Card className="text-white/80">
        <CardHeader>
          <CardTitle>Statut de la table</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {totalSeatsAssigned === 0 ? (
              <Badge className="bg-green-500">Libre</Badge>
            ) : totalSeatsAssigned === table.capacity ? (
              <Badge className="bg-red-500">Complète</Badge>
            ) : (
              <Badge className="bg-yellow-500">Partiellement occupée</Badge>
            )}
            <span className="text-sm text-white/60">
              {totalSeatsAssigned === 0
                ? "Aucune place n'est actuellement assignée à cette table."
                : totalSeatsAssigned === table.capacity
                ? "Toutes les places de cette table sont occupées."
                : `${
                    table.capacity - totalSeatsAssigned
                  } places restantes sur cette table.`}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* GUESTS AT THIS TABLE */}
      <Card className="text-white/80">
        <CardHeader>
          <CardTitle>Invités à cette table ({guestsAtTable.length})</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {guestsAtTable.length === 0 ? (
            <p className="text-white/60 text-center py-4">
              Aucun invité n&apos;est actuellement assigné à cette table.
            </p>
          ) : (
            guestsAtTable.map((invitation) => {
              const allocation = invitation.allocations?.find(
                (a) => a.tableId === table.id
              );
              const seatsAssigned = allocation?.seatsAssigned || 0;

              return (
                <div
                  key={invitation.id}
                  onClick={() =>
                    router.push(`/admin/events/${eventId}/${invitation.id}`)
                  }
                  className="p-3 rounded border border-white/10 bg-muted/10 cursor-pointer hover:bg-muted/20 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{invitation.label}</span>
                    <Badge variant="outline">
                      {seatsAssigned} {seatsAssigned > 1 ? "places" : "place"}
                    </Badge>
                  </div>
                  <p className="text-xs text-white/60 mt-1">
                    {invitation.peopleCount} personne(s) au total • Scanné:{" "}
                    {invitation.scannedCount}
                  </p>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </section>
  );
}

"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Users, UserMinus, ChevronRight, Info } from "lucide-react";
import { useTable, useEventInvitations } from "@/hooks/use-event";
import { Table, Invitation } from "@/types/types";
import DataStatusDisplay from "@/components/data-status-display";
import ModifyTable from "./modify-table";
import DeleteTable from "./delete-table";
import { useRealtimeSync } from "@/hooks/use-realtime-sync";
import { useRealtimeList } from "@/hooks/use-realtime-list";

export default function TableDetailPage() {
  const { eventId, tableId } = useParams();
  const router = useRouter();

  const {
    data: tableData,
    isPending: tPending,
    isError: tError,
    refetch: refetchT,
  } = useTable(Number(eventId), Number(tableId));
  const {
    data: invsData,
    isPending: iPending,
    isError: iError,
    refetch: refetchI,
  } = useEventInvitations(Number(eventId));

  // Synchronisation en temps réel
  useRealtimeSync({
    eventId: Number(eventId),
    onUpdate: () => {
      refetchT();
      refetchI();
    },
  });
  useRealtimeList(refetchT);
  useRealtimeList(refetchI);

  const table = tableData as Table;
  const invitations = (invsData as Invitation[]) || [];

  // Filtrer les invités qui ont une allocation sur cette table
  const guestsAtTable = invitations
    .filter((inv) =>
      inv.allocations?.some((alloc) => alloc.tableId === Number(tableId)),
    )
    .map((inv) => {
      const allocation = inv.allocations?.find(
        (a) => a.tableId === Number(tableId),
      );
      return {
        ...inv,
        seatsAtThisTable: allocation?.seatsAssigned || 0,
      };
    });

  const currentOccupied = guestsAtTable.reduce(
    (sum, g) => sum + g.seatsAtThisTable,
    0,
  );

  if (tPending || iPending)
    return (
      <DataStatusDisplay
        isPending
        refetch={() => {
          refetchT();
          refetchI();
        }}
      />
    );
  if (tError || iError)
    return (
      <DataStatusDisplay
        hasError
        refetch={() => {
          refetchT();
          refetchI();
        }}
      />
    );

  return (
    <section className="min-h-screen bg-[#050505] p-4 md:p-10 space-y-8">
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <button
            onClick={() => router.push(`/admin/events/${eventId}/tables`)}
            className="group size-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:border-primary/50 transition-all cursor-pointer"
          >
            <ArrowLeft className="text-gray-500 group-hover:text-primary transition-colors" />
          </button>
          <div>
            <h1 className="text-4xl font-black italic uppercase text-white tracking-tighter">
              {table.name}
            </h1>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em] mt-1">
              Détails et liste des occupants
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ModifyTable
            table={table}
            occupiedSeats={currentOccupied}
            eventId={Number(eventId)}
          />
          <DeleteTable
            tableId={table.id}
            tableName={table.name}
            eventId={Number(eventId)}
            occupiedSeats={currentOccupied}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* --- STATS DE LA TABLE --- */}
        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8">
            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-6">
              État de remplissage
            </p>
            <div className="flex items-end gap-2 mb-4">
              <span className="text-6xl font-black text-white italic">
                {currentOccupied}
              </span>
              <span className="text-2xl font-black text-gray-600 mb-2">
                / {table.capacity} PAX
              </span>
            </div>
            <div className="h-4 bg-white/5 rounded-full overflow-hidden p-1 border border-white/5">
              <div
                className="h-full bg-primary rounded-full transition-all duration-700"
                style={{
                  width: `${(currentOccupied / table.capacity) * 100}%`,
                }}
              />
            </div>
            <p className="text-[9px] font-bold text-gray-500 uppercase mt-4 text-center">
              {table.capacity - currentOccupied} places encore disponibles
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-start gap-4">
            <Info className="text-primary shrink-0" size={20} />
            <p className="text-[10px] text-gray-400 font-medium leading-relaxed uppercase">
              Pour déplacer un invité, rendez-vous sur sa fiche individuelle via
              le bouton <ChevronRight className="inline size-3" />.
            </p>
          </div>
        </div>

        {/* --- LISTE DES INVITÉS --- */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-black uppercase italic text-white flex items-center gap-2 mb-2">
            <Users size={16} className="text-primary" /> Invités assignés (
            {guestsAtTable.length})
          </h3>

          <div className="grid gap-3">
            {guestsAtTable.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center bg-white/2 border border-dashed border-white/10 rounded-4xl">
                <UserMinus className="text-gray-700 mb-2" size={32} />
                <p className="text-xs font-bold text-gray-500 uppercase">
                  Aucun invité sur cette table
                </p>
              </div>
            ) : (
              guestsAtTable.map((guest) => (
                <div
                  key={guest.id}
                  onClick={() =>
                    router.push(`/admin/events/${eventId}/${guest.id}`)
                  }
                  className="group flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/30 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-primary text-xs italic">
                      {guest.seatsAtThisTable}
                    </div>
                    <div>
                      <p className="font-bold text-white uppercase italic group-hover:text-primary transition-colors">
                        {guest.label}
                      </p>
                      <p className="text-[9px] font-black text-gray-500 uppercase tracking-tighter">
                        {guest.whatsapp || guest.email || "Pas de contact"}
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    className="text-gray-700 group-hover:text-primary transition-colors"
                    size={20}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

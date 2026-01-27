"use client";

import { useParams, useRouter } from "next/navigation";
import { useTables, useEventInvitations, useEvent } from "@/hooks/use-event";
import { Table, Invitation, Event2 } from "@/types/types";
import { Table2, ChevronRight, MoveLeftIcon } from "lucide-react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useRealtimeSync } from "@/hooks/use-realtime-sync";
import { useRealtimeList } from "@/hooks/use-realtime-list";
import AddTable from "../add-table";

export default function TablesPage() {
  const { eventId } = useParams();
  const router = useRouter();
  const { data: tablesData, refetch: refetchT } = useTables(Number(eventId));
  const { data: invsData, refetch: refetchI } = useEventInvitations(
    Number(eventId),
  );
  const { data: eventDatas, refetch: refetchE } = useEvent(Number(eventId));

  const eventData = eventDatas as Event2;

  // Synchronisation en temps réel
  useRealtimeSync({
    eventId: Number(eventId),
    onUpdate: () => {
      refetchT();
      refetchI();
      refetchE();
    },
  });
  useRealtimeList(refetchT);
  useRealtimeList(refetchI);
  useRealtimeList(refetchE);

  const tables = (tablesData as Table[]) || [];
  const invitations = (invsData as Invitation[]) || [];

  // Calcul de l'occupation par table
  const tableOccupancy = tables.map((table) => {
    const occupied = invitations.reduce((acc, inv) => {
      const allocation = inv.allocations?.find((a) => a.tableId === table.id);
      return acc + (allocation?.seatsAssigned || 0);
    }, 0);

    return { ...table, occupied };
  });

  return (
    <div className="p-6 md:p-10 space-y-10 bg-[#050505] min-h-screen">
      <div className="flex items-center gap-6">
        <button
          onClick={() => router.push(`/admin/events/${eventId}`)}
          className="group size-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:border-primary/50 transition-all cursor-pointer"
        >
          <MoveLeftIcon className="text-gray-500 group-hover:text-primary transition-colors" />
        </button>
        <div className="flex w-full max-[500px]:flex-col flex-row justify-between gap-2">
          <div>
            <h1 className="text-3xl font-black italic uppercase text-white tracking-tighter">
              {eventData?.name} <br />
              <span className="text-white/60"> Logistique Tables</span>
            </h1>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              Vue d&apos;ensemble de l&apos;occupation en temps réel
            </p>
          </div>
          <div>
            <AddTable eventId={Number(eventId)} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tableOccupancy.map((table) => {
          const percent = (table.occupied / table.capacity) * 100;
          const isFull = table.occupied >= table.capacity;

          return (
            <Link
              key={table.id}
              href={`/admin/events/${eventId}/tables/${table.id}`}
              className="group bg-white/5 border border-white/10 rounded-4xl p-6 hover:border-primary/50 transition-all"
            >
              <div className="flex justify-between items-start mb-6">
                <div
                  className={cn(
                    "size-12 rounded-2xl flex items-center justify-center border",
                    isFull
                      ? "bg-red-500/10 border-red-500/20 text-red-500"
                      : "bg-primary/10 border-primary/20 text-primary",
                  )}
                >
                  <Table2 size={24} />
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-gray-500 uppercase">
                    Capacité
                  </p>
                  <p className="text-xl font-black text-white italic">
                    {table.capacity}
                  </p>
                </div>
              </div>

              <h3 className="text-xl font-black uppercase italic text-white mb-1">
                {table.name}
              </h3>
              <p className="text-[10px] font-bold text-gray-500 uppercase mb-4">
                {table.occupied} sièges occupés
              </p>

              <div className="space-y-2">
                <div className="flex justify-between text-[9px] font-black uppercase">
                  <span className={isFull ? "text-red-500" : "text-primary"}>
                    {Math.round(percent)}% Rempli
                  </span>
                  <span className="text-gray-500">
                    {table.capacity - table.occupied} Libres
                  </span>
                </div>
                <Progress value={percent} className="h-1.5 bg-white/5" />
              </div>

              <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between text-gray-500 group-hover:text-primary transition-colors">
                <span className="text-[10px] font-black uppercase">
                  Voir les invités
                </span>
                <ChevronRight size={16} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

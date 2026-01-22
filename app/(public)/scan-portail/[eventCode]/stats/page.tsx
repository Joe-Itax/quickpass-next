"use client";

import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, BarChart3, Users2, PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useEventByEventCode,
  useEventInvitationsByEventCode,
  useTablesByEventCode,
} from "@/hooks/use-event";
import StatCard from "./stat-card";
import Guests from "./guest";
import TableOccupancy from "./table-occupancy";
import DataStatusDisplay from "@/components/data-status-display";
import { Event2, Invitation, Table } from "@/types/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRealtimeSync } from "@/hooks/use-realtime-sync";

export default function StatsPage() {
  const { eventCode } = useParams() as { eventCode: string };
  const router = useRouter();

  const {
    data: event,
    isPending: p1,
    isError: e1,
    refetch: refetchEvent,
  } = useEventByEventCode(eventCode);
  const {
    data: invs,
    isPending: p2,
    isError: e2,
    refetch: refetchInvitations,
  } = useEventInvitationsByEventCode(eventCode);
  const {
    data: tables,
    isPending: p3,
    isError: e3,
    refetch: refetchTables,
  } = useTablesByEventCode(eventCode);

  useRealtimeSync({
    eventCode,
    onUpdate: () => refetchEvent(),
  });
  useRealtimeSync({
    eventCode,
    onUpdate: () => refetchInvitations(),
  });
  useRealtimeSync({
    eventCode,
    onUpdate: () => refetchTables(),
  });

  const invitations = (invs as Invitation[]) || [];
  const tablesData = (tables as Table[]) || [];
  const eventData = event as Event2;

  const loading = p1 || p2 || p3;

  if (e1 || e2 || e3) return <DataStatusDisplay hasError={true} />;

  const personsTotalCapacity = invitations.reduce(
    (sum, inv) => sum + inv.peopleCount,
    0,
  );
  const personsTotalScanned = invitations.reduce(
    (sum, inv) => sum + inv.scannedCount,
    0,
  );

  return (
    <div className="min-h-screen text-white flex flex-col bg-[#050505] bg-[url(/bg-1.svg)] bg-center bg-no-repeat bg-cover">
      {/* HEADER STYLE SCANNER */}
      <div className="p-6 flex justify-between items-center bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <Button
          onClick={() => router.push(`/scan-portail/${eventCode}`)}
          variant="ghost"
          className="size-10 rounded-full p-0"
        >
          <ChevronLeft size={24} />
        </Button>
        <div className="text-center">
          <p className="text-[10px] font-bold text-primary tracking-[0.2em] uppercase">
            Rapports Live
          </p>
          <h1 className="font-black italic uppercase tracking-tighter">
            {loading ? "Chargement..." : eventData?.name}
          </h1>
        </div>
        <div className="size-10 flex items-center justify-center">
          <div className="size-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_#FDB623]" />
        </div>
      </div>

      <main className="p-6 max-w-7xl mx-auto w-full space-y-8">
        {/* TOP OVERVIEW */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <StatCard
              invitationsTotal={invitations.length}
              invitationsUnscanned={
                invitations.filter((i) => i.scannedCount === 0).length
              }
              invitationsPartial={
                invitations.filter(
                  (i) => i.scannedCount > 0 && i.scannedCount < i.peopleCount,
                ).length
              }
              invitationsComplete={
                invitations.filter((i) => i.scannedCount === i.peopleCount)
                  .length
              }
              personsTotalCapacity={personsTotalCapacity}
              personsTotalScanned={personsTotalScanned}
              personsRemaining={personsTotalCapacity - personsTotalScanned}
              loading={loading}
            />
          </div>

          {/* QUICK INFO CARD */}
          <div className="bg-primary/10 border border-primary/20 rounded-4xl p-6 flex flex-col justify-center">
            <PieChart className="text-primary mb-4" size={32} />
            <h3 className="text-2xl font-black italic uppercase leading-none mb-2">
              Taux d&apos;entrée
            </h3>
            <span className="text-5xl font-black text-white">
              {loading
                ? "..."
                : personsTotalCapacity > 0
                  ? Math.round(
                      (personsTotalScanned / personsTotalCapacity) * 100,
                    )
                  : 0}
              %
            </span>
            <p className="text-xs font-bold uppercase text-primary/60 mt-2 tracking-widest">
              {personsTotalScanned} sur {personsTotalCapacity} personnes
            </p>
          </div>
        </div>

        {/* TABS POUR GUESTS VS TABLES */}
        <Tabs defaultValue="tables" className="w-full pb-40">
          <TabsList className="bg-white/5 border border-white/10 p-1 rounded-xl mb-8">
            <TabsTrigger
              value="tables"
              className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white font-bold uppercase text-[10px]"
            >
              <BarChart3 size={14} className="mr-2" /> Occupation Tables
            </TabsTrigger>
            <TabsTrigger
              value="guests"
              className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white font-bold uppercase text-[10px]"
            >
              <Users2 size={14} className="mr-2" /> Liste des Invités
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tables" className="mt-0">
            <div className="mb-4">
              <h2 className="text-xl font-black italic uppercase tracking-tight">
                Remplissage des zones
              </h2>
              <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">
                Suivi en direct par table
              </p>
            </div>
            <TableOccupancy tables={tablesData} invitations={invitations} />
          </TabsContent>

          <TabsContent value="guests" className="mt-0">
            <Guests />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

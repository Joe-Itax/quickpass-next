"use client";

import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "motion/react";
import { Loader2, User, UserCheck, Users, UserX } from "lucide-react";
import { Event, Guest } from "@/types/types";
import GuestCard from "@/components/public/guest-card";
// import { usePathname } from "next/navigation";

export default function StatsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [guestsData, setGuestsData] = useState<Guest[]>([]);
  const [search, setSearch] = useState("");
  const [tableFilter, setTableFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  // const eventId = usePathname().split("/")[1];
  const eventId = "soiree_black_&_gold_1";
  const perPage = 9;

  useEffect(() => {
    const fetchGuests = async () => {
      try {
        const res = await fetch("/data/guests.json");
        const data = await res.json();
        setGuestsData(data);
      } catch (error) {
        console.error("Erreur lors du chargement des invités :", error);
      } finally {
        setLoading(false);
      }
    };
    fetchGuests();
    const fetchEvents = async () => {
      const res = await fetch("/data/events.json");
      const data = await res.json();
      setEvents(data);
    };
    fetchEvents();
  }, []);

  // Tables uniques (calculées après chargement)
  const tables = useMemo(() => {
    if (!guestsData.length) return ["all"];
    const unique = Array.from(new Set(guestsData.map((g) => g.table)));
    return ["all", ...unique];
  }, [guestsData]);

  // États possibles (toujours statiques pour éviter les bug)
  const states = [
    { value: "all", label: "Tous" },
    { value: "unscanned", label: "Non scannés" },
    { value: "partial", label: "Partiels" },
    { value: "complete", label: "Complétés" },
  ];

  // Filtrage
  const filteredGuests = useMemo(() => {
    return guestsData.filter((guest) => {
      const searchLower = search.toLowerCase();
      const guestName = (guest.name ?? "").toLowerCase();
      const guestEmail = (guest.email ?? "").toLowerCase();
      const guestTable = (guest.table ?? "").toLowerCase();
      const matchesSearch =
        guestName.includes(searchLower) ||
        guestEmail.includes(searchLower) ||
        guestTable.includes(searchLower);

      const matchesTable =
        tableFilter === "all" || (guest.table ?? "") === tableFilter;

      const matchesState =
        stateFilter === "all" ||
        (stateFilter === "unscanned" && guest.scannedCount === 0) ||
        (stateFilter === "partial" &&
          guest.scannedCount > 0 &&
          guest.scannedCount < guest.capacity) ||
        (stateFilter === "complete" && guest.scannedCount === guest.capacity);

      return matchesSearch && matchesTable && matchesState;
    });
  }, [search, tableFilter, stateFilter, guestsData]);

  const totalPages = Math.ceil(filteredGuests.length / perPage);
  const currentGuests = filteredGuests.slice(
    (page - 1) * perPage,
    page * perPage
  );

  // Invitations
  const invitationsTotal = guestsData.length;

  const invitationsUnscanned = guestsData.filter(
    (g) => (g.scannedCount ?? 0) === 0
  ).length;

  const invitationsPartial = guestsData.filter(
    (g) =>
      (g.scannedCount ?? 0) > 0 && (g.scannedCount ?? 0) < (g.capacity ?? 1)
  ).length;

  const invitationsComplete = guestsData.filter(
    (g) => (g.scannedCount ?? 0) >= (g.capacity ?? 1)
  ).length;

  // Personnes
  const personsTotalCapacity = guestsData.reduce(
    (sum, g) => sum + (g.capacity ?? 1),
    0
  );

  const personsTotalScanned = guestsData.reduce(
    (sum, g) => sum + (g.scannedCount ?? 0),
    0
  );

  const personsRemaining = Math.max(
    0,
    personsTotalCapacity - personsTotalScanned
  );

  return (
    <div className="p-6 pb-40 flex flex-col gap-6 min-h-screen bg-[url(/bg-1.svg)] bg-center bg-no-repeat bg-cover bg-background">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Statistiques des invités</h1>
          <p className="text-sm text-gray-300">
            Gérez vos invités, filtres et états de scannage.
          </p>
          <div className="pt-8">
            <h2 className="text-2xl font-bold">
              Description de l&apos;événement
            </h2>
            <p className="text-sm text-gray-300">
              {events.find((e) => e.eventId === eventId)?.description} Lorem
              ipsum dolor, sit amet consectetur adipisicing elit. Nobis,
              laudantium est. Magnam, sed iste maxime numquam distinctio fugiat
              unde, necessitatibus, assumenda voluptatum nesciunt amet
              recusandae dolore minima omnis sit sunt! Lorem ipsum dolor sit
              amet consectetur adipisicing elit. Vitae quam adipisci at repellat
              error. Tenetur quasi ullam eos, tempora ipsam maxime iure nam
              laborum aliquam. Dignissimos excepturi ducimus minima quod.
            </p>
          </div>
        </div>
      </div>

      {/* --- Stat Cards --- */}
      {/* --- INVITATIONS --- */}
      <h2 className="text-lg font-semibold mt-6 mb-2 text-white">
        Invitations
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Invitations Totales */}
        <Card className="bg-black/30 text-white/80 border-none shadow-md shadow-black">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Invitations
            </CardTitle>
            <Users className="h-5 w-5 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "…" : invitationsTotal}
            </div>
          </CardContent>
        </Card>

        {/* Non scannées */}
        <Card className="bg-black/30 text-white/80 border-none shadow-md shadow-black">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Non Scannées</CardTitle>
            <UserX className="h-5 w-5 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "…" : invitationsUnscanned}
            </div>
          </CardContent>
        </Card>

        {/* Partiellement scannées */}
        <Card className="bg-black/30 text-white/80 border-none shadow-md shadow-black">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Partiels</CardTitle>
            <User className="h-5 w-5 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "…" : invitationsPartial}
            </div>
          </CardContent>
        </Card>

        {/* Complètes */}
        <Card className="bg-black/30 text-white/80 border-none shadow-md shadow-black">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Complétées</CardTitle>
            <UserCheck className="h-5 w-5 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "…" : invitationsComplete}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- PERSONNES --- */}
      <h2 className="text-lg font-semibold mt-6 mb-2 text-white">Personnes</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total attendues */}
        <Card className="bg-black/30 text-white/80 border-none shadow-md shadow-black">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Personnes Attendues
            </CardTitle>
            <Users className="h-5 w-5 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "…" : personsTotalCapacity}
            </div>
          </CardContent>
        </Card>

        {/* Scannées */}
        <Card className="bg-black/30 text-white/80 border-none shadow-md shadow-black">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Personnes Entrées
            </CardTitle>
            <UserCheck className="h-5 w-5 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "…" : personsTotalScanned}
            </div>
          </CardContent>
        </Card>

        {/* Restants */}
        <Card className="bg-black/30 text-white/80 border-none shadow-md shadow-black">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Restants</CardTitle>
            <User className="h-5 w-5 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "…" : personsRemaining}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row justify-around items-center gap-4 w-full">
        <Input
          placeholder="🔍 Rechercher un invité, email ou table..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full"
        />

        <Select
          value={tableFilter}
          onValueChange={(val) => {
            setTableFilter(val);
            setPage(1);
          }}
        >
          <SelectTrigger className="bg-black/30 text-white border-none w-full sm:w-[180px]">
            <SelectValue placeholder="Filtrer par table" />
          </SelectTrigger>
          <SelectContent>
            {tables.map((t) => (
              <SelectItem key={t} value={t}>
                {t === "all" ? "Toutes les tables" : t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={stateFilter}
          onValueChange={(val) => {
            setStateFilter(val);
            setPage(1);
          }}
        >
          <SelectTrigger className="bg-black/30 text-white border-none w-full sm:w-[180px]">
            <SelectValue placeholder="Filtrer état" />
          </SelectTrigger>
          <SelectContent>
            {states.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grid des invités */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 items-center justify-center gap-5">
        {loading ? (
          <div className="flex justify-center items-center h-96 col-span-full gap-2 text-white">
            <Loader2 className="animate-spin" />
            <span>Chargement...</span>
          </div>
        ) : currentGuests.length === 0 ? (
          <div className="text-center text-gray-400 italic col-span-full mt-12">
            Aucun invité trouvé 🫤
          </div>
        ) : (
          currentGuests.map((guest, i) => (
            <motion.div
              key={guest.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <GuestCard guest={guest} />
            </motion.div>
          ))
        )}
      </div>

      {/* Pagination responsive */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination>
            <PaginationContent className="flex flex-wrap justify-center gap-2">
              {Array.from({ length: totalPages }).map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink
                    onClick={() => setPage(i + 1)}
                    isActive={page === i + 1}
                    className={`cursor-pointer px-3 ${
                      page === i + 1
                        ? "border border-primary hover:bg-primary hover:text-white text-white bg-primary"
                        : "text-gray-300"
                    }`}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}

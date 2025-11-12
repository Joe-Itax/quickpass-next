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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "motion/react";
import { Loader2, UserCheck, Users, UserX } from "lucide-react";

interface Guest {
  id: number;
  name: string;
  email: string;
  table: string;
  scanned: boolean;
  scannedAt?: string;
}

export default function StatsPage() {
  const [guestsData, setGuestsData] = useState<Guest[]>([]);
  const [search, setSearch] = useState("");
  const [tableFilter, setTableFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
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
  }, []);

  // Tables uniques (calculées après chargement)
  const tables = useMemo(() => {
    if (!guestsData.length) return ["all"];
    const unique = Array.from(new Set(guestsData.map((g) => g.table)));
    return ["all", ...unique];
  }, [guestsData]);

  // États possibles (toujours statiques pour éviter les bug)
  const states = [
    { value: "all", label: "Tous les invités" },
    { value: "true", label: "Scannés" },
    { value: "false", label: "Non scannés" },
  ];

  // Filtrage
  const filteredGuests = useMemo(() => {
    return guestsData.filter((guest) => {
      const searchLower = search.toLowerCase();
      const matchesSearch =
        guest.name.toLowerCase().includes(searchLower) ||
        guest.email.toLowerCase().includes(searchLower) ||
        guest.table.toLowerCase().includes(searchLower);

      const matchesTable = tableFilter === "all" || guest.table === tableFilter;
      const matchesState =
        stateFilter === "all" || guest.scanned === (stateFilter === "true");

      return matchesSearch && matchesTable && matchesState;
    });
  }, [search, tableFilter, stateFilter, guestsData]);

  const totalPages = Math.ceil(filteredGuests.length / perPage);
  const currentGuests = filteredGuests.slice(
    (page - 1) * perPage,
    page * perPage
  );

  const total = guestsData.length;
  const scannedCount = guestsData.filter((i) => i.scanned).length;
  const notScannedCount = total - scannedCount;

  return (
    <div className="p-6 pb-40 flex flex-col gap-6 min-h-screen bg-[url(/bg-1.svg)] bg-center bg-no-repeat bg-cover bg-background">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Statistiques des invités</h1>
          <p className="text-sm text-gray-300">
            Gérez vos invités, filtres et états de scannage.
          </p>
        </div>
      </div>

      {/* --- Stat Cards --- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-black/30 text-white/80 border-none shadow-md shadow-black">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Invités</CardTitle>
            <Users className="h-5 w-5 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "…" : total}</div>
          </CardContent>
        </Card>

        <Card className="bg-black/30 text-white/80 border-none shadow-md shadow-black">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Scannés</CardTitle>
            <UserCheck className="h-5 w-5 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "…" : scannedCount}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/30 text-white/80 border-none shadow-md shadow-black">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Non Scannés</CardTitle>
            <UserX className="h-5 w-5 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "…" : notScannedCount}
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
              <Card className="hover:shadow-lg transition-all duration-200 border border-primary rounded-lg bg-black/30 shadow-md shadow-black text-foreground">
                <CardContent className="p-5 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">{guest.name}</h3>
                    <Badge
                      className={`${
                        guest.scanned
                          ? "bg-green-500 hover:bg-green-500 text-white"
                          : "bg-gray-300 hover:bg-gray-300 text-black"
                      }`}
                    >
                      {guest.scanned ? "Scanné" : "Non scanné"}
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-100">{guest.email}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-gray-100">
                      Table:{" "}
                      <span className="font-medium text-gray-200">
                        {guest.table}
                      </span>
                    </span>
                    <span className="text-xs text-gray-400">
                      #ID: {guest.id}
                    </span>
                  </div>
                </CardContent>
              </Card>
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

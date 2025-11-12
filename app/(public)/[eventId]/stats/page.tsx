"use client";

import { useState } from "react";
import { Users, UserCheck, UserX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import formatDateToCustom from "@/utils/format-date-to-custom";

interface Invite {
  id: number;
  name: string;
  email: string;
  scanned: boolean;
  scannedAt?: string;
}

const invitesMock: Invite[] = [
  {
    id: 1,
    name: "Joseph Itakala",
    email: "itax@example.com",
    scanned: true,
    scannedAt: "2025-11-16T14:30:00Z",
  },
  { id: 2, name: "Charly K.", email: "charly@example.com", scanned: false },
  {
    id: 3,
    name: "Mado M.",
    email: "mado@example.com",
    scanned: true,
    scannedAt: "2025-12-16T15:10:00Z",
  },
  { id: 4, name: "Jean-Paul", email: "jp@example.com", scanned: false },
  {
    id: 5,
    name: "Brigitte N.",
    email: "brigi@example.com",
    scanned: true,
    scannedAt: "2025-01-16T06:05:00Z",
  },
  {
    id: 6,
    name: "Brigitte N.",
    email: "brigi@example.com",
    scanned: true,
    scannedAt: "2025-01-16T06:05:00Z",
  },
  {
    id: 7,
    name: "Brigitte N.",
    email: "brigi@example.com",
    scanned: true,
    scannedAt: "2025-01-16T06:05:00Z",
  },
  {
    id: 8,
    name: "Brigitte N.",
    email: "brigi@example.com",
    scanned: true,
    scannedAt: "2025-01-16T06:05:00Z",
  },
  {
    id: 9,
    name: "Brigitte N.",
    email: "brigi@example.com",
    scanned: true,
    scannedAt: "2025-01-16T06:05:00Z",
  },
  {
    id: 10,
    name: "Brigitte N.",
    email: "brigi@example.com",
    scanned: true,
    scannedAt: "2025-01-16T06:05:00Z",
  },
];

export default function StatsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filteredInvites = invitesMock.filter((inv) => {
    const matchesSearch =
      inv.name.toLowerCase().includes(search.toLowerCase()) ||
      inv.email.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "all"
        ? true
        : filter === "scanned"
        ? inv.scanned
        : !inv.scanned;
    return matchesSearch && matchesFilter;
  });

  const total = invitesMock.length;
  const scannedCount = invitesMock.filter((i) => i.scanned).length;
  const notScannedCount = total - scannedCount;

  return (
    <div className="flex flex-col items-center pt-8 w-full bg-[url(/bg-1.svg)] bg-center bg-no-repeat bg-cover bg-[#333333]/80 text-white pb-32">
      <div className="max-w-4xl w-full xs:p-4 p-2 md:p-6 flex flex-col gap-6">
        {/* --- Header --- */}
        <h1 className="text-3xl font-bold">Statistiques</h1>
        <p className="text-gray-300 mb-2">
          Aperçu global des invités et de leur statut de scan.
        </p>

        {/* --- Stat Cards --- */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-black/30 text-white/80 border-none shadow-md shadow-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Invités
              </CardTitle>
              <Users className="h-5 w-5 text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{total}</div>
            </CardContent>
          </Card>

          <Card className="bg-black/30 text-white/80 border-none shadow-md shadow-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scannés</CardTitle>
              <UserCheck className="h-5 w-5 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{scannedCount}</div>
            </CardContent>
          </Card>

          <Card className="bg-black/30 text-white/80 border-none shadow-md shadow-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Non Scannés</CardTitle>
              <UserX className="h-5 w-5 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{notScannedCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* --- Filter + Search --- */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-4">
          <Input
            placeholder="Rechercher un invité..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-black/30 text-white border-none focus-visible:ring-amber-400"
          />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="bg-black/30 text-white border-none w-full sm:w-[180px]">
              <SelectValue placeholder="Filtrer" />
            </SelectTrigger>
            <SelectContent className="bg-[#222] text-white border-none">
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="scanned">Scannés</SelectItem>
              <SelectItem value="not-scanned">Non Scannés</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* --- Table --- */}
        <div className="overflow-x-auto bg-black/20 rounded-lg mt-4">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-black/40 text-gray-300 uppercase text-xs">
              <tr>
                <th className="px-4 py-3">N°</th>
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Heure de scan</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvites.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center text-gray-400"
                  >
                    Aucun invité trouvé
                  </td>
                </tr>
              ) : (
                filteredInvites.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-t border-gray-700/40 hover:bg-white/10 transition-colors"
                  >
                    <td
                      className={`px-4 py-3 font-medium ${
                        inv.scanned ? "bg-green-400" : "bg-red-400"
                      }`}
                    >
                      {inv.id}
                    </td>
                    <td className="px-4 py-3 font-medium">{inv.name}</td>
                    <td className="px-4 py-3 text-gray-300">{inv.email}</td>
                    <td className="px-4 py-3">
                      {inv.scanned ? (
                        <span className="text-green-400 font-semibold">
                          Scanné
                        </span>
                      ) : (
                        <span className="text-red-400 font-semibold">
                          Non scanné
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {inv.scannedAt ? formatDateToCustom(inv.scannedAt) : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

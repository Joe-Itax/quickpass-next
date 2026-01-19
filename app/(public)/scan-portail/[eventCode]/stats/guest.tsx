"use client";

import { motion, AnimatePresence } from "motion/react";
import InvitationCard from "@/components/public/invitation-card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Search, Filter, Users2 } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { Invitation, Table } from "@/types/types";
import { useMemo, useState } from "react";
import {
  useEventInvitationsByEventCode,
  useTablesByEventCode,
} from "@/hooks/use-event";
import DataStatusDisplay from "@/components/data-status-display";
import { useParams } from "next/navigation";

export default function Guests() {
  const { eventCode } = useParams() as { eventCode: string };
  const [search, setSearch] = useState("");
  const [tableFilter, setTableFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [page, setPage] = useState(1);
  const perPage = 9;

  const {
    data,
    isPending: invPending,
    isError: invError,
    error: invErr,
    refetch,
  } = useEventInvitationsByEventCode(eventCode);
  const { data: dataTables, isPending: tablePending } =
    useTablesByEventCode(eventCode);

  const invitations = useMemo(() => (data as Invitation[]) || [], [data]);
  const tablesData = (dataTables as Table[]) || [];

  const isPending = invPending || tablePending;

  const filteredInvitation = useMemo(() => {
    return invitations.filter((guest) => {
      const matchesSearch = (guest.label ?? "")
        .toLowerCase()
        .includes(search.toLowerCase());
      const guestTableNames =
        guest.allocations?.map((a) => a.table?.name).filter(Boolean) || [];
      const matchesTable =
        tableFilter === "all" || guestTableNames.includes(tableFilter);

      const matchesState =
        stateFilter === "all" ||
        (stateFilter === "unscanned" && guest.scannedCount === 0) ||
        (stateFilter === "partial" &&
          guest.scannedCount > 0 &&
          guest.scannedCount < guest.peopleCount) ||
        (stateFilter === "complete" &&
          guest.scannedCount === guest.peopleCount);

      return matchesSearch && matchesTable && matchesState;
    });
  }, [search, tableFilter, stateFilter, invitations]);

  if (invError)
    return (
      <DataStatusDisplay
        hasError={true}
        errorObject={invErr}
        refetch={refetch}
      />
    );

  const totalPages = Math.ceil(filteredInvitation.length / perPage);
  const currentInvitation = filteredInvitation.slice(
    (page - 1) * perPage,
    page * perPage,
  );

  return (
    <div className="space-y-8">
      {/* BARRE DE RECHERCHE ET FILTRES */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-6 relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
            size={18}
          />
          <Input
            placeholder="Rechercher un invité..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full h-12 pl-12 bg-white/5 border-white/10 rounded-2xl focus:border-primary transition-all text-white"
          />
        </div>

        <div className="md:col-span-3">
          <Select
            value={tableFilter}
            onValueChange={(val) => {
              setTableFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-2xl text-gray-300">
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-primary" />
                <SelectValue placeholder="Toutes les tables" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-[#0f0f0f] border-white/10 text-white">
              <SelectItem value="all">Toutes les tables</SelectItem>
              {tablesData.map((t) => (
                <SelectItem key={t.id} value={t.name}>
                  <div className="flex items-center justify-between w-full gap-4">
                    <span>{t.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-3">
          <Select
            value={stateFilter}
            onValueChange={(val) => {
              setStateFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-2xl text-gray-300">
              <div className="flex items-center gap-2">
                <Users2 size={14} className="text-primary" />
                <SelectValue placeholder="État" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-[#0f0f0f] border-white/10 text-white">
              <SelectItem value="all">Tous les états</SelectItem>
              <SelectItem value="unscanned">Non scannés</SelectItem>
              <SelectItem value="partial">Partiels</SelectItem>
              <SelectItem value="complete">Complétés</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* RÉSULTATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isPending ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4 opacity-50">
            <Loader2 className="animate-spin text-primary" size={40} />
            <p className="text-[10px] font-black uppercase tracking-widest">
              Initialisation des données...
            </p>
          </div>
        ) : currentInvitation.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-full py-20 text-center bg-white/2 border border-dashed border-white/10 rounded-4xl"
          >
            <p className="text-gray-500 italic">
              Aucun résultat pour cette sélection 🫤
            </p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {currentInvitation.map((guest, i) => (
              <motion.div
                key={guest.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
              >
                <InvitationCard invitation={guest} />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* PAGINATION */}
      {!isPending && totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center pt-8"
        >
          <Pagination>
            <PaginationContent className="bg-white/5 p-1 rounded-2xl border border-white/10">
              {Array.from({ length: totalPages }).map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink
                    onClick={() => setPage(i + 1)}
                    isActive={page === i + 1}
                    className={`cursor-pointer size-10 rounded-xl border-none transition-all font-black ${
                      page === i + 1
                        ? "bg-primary text-white shadow-[0_0_15px_#FDB623]"
                        : "text-gray-500 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
            </PaginationContent>
          </Pagination>
        </motion.div>
      )}
    </div>
  );
}

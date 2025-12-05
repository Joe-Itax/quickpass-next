import { motion } from "motion/react";
import InvitationCard from "@/components/public/invitation-card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { Event2, Invitation, Table } from "@/types/types";
import { useMemo, useState } from "react";
import {
  useEventByEventCode,
  useEventInvitationsByEventCode,
  useTablesByEventCode,
} from "@/hooks/use-event";
import DataStatusDisplay from "@/components/data-status-display";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";

export default function Guests() {
  const { eventCode } = useParams();
  const [search, setSearch] = useState("");
  const [tableFilter, setTableFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [page, setPage] = useState(1);
  const perPage = 9;

  const {
    data,
    isPending: invetIsPending,
    error: invetError,
    isError: invetIsError,
    refetch,
  } = useEventInvitationsByEventCode(eventCode as string);
  const invitation = data as Invitation[] | undefined;

  const {
    data: dataTables,
    isPending: tableIsPending,
    isError: tableIsError,
    error: tableError,
  } = useTablesByEventCode(eventCode as string);
  const tablesData = dataTables as Table[] | undefined;

  const {
    data: eventData,
    isPending: isEventPending,
    isError: isEventError,
    error: eventError,
  } = useEventByEventCode(eventCode as string);

  const event = eventData as Event2;

  const isPending = invetIsPending || tableIsPending || isEventPending;
  const error = invetError || tableError || eventError;
  const isError = invetIsError || tableIsError || isEventError;

  // Tables uniques depuis les allocations réelles
  const tables = useMemo(() => {
    if (!invitation || !tablesData?.length) return ["all"];

    // const tableNames = tablesData
    //   .flatMap((tab) => tab.name)
    //   .filter(Boolean) as string[];

    // const unique = Array.from(new Set(tableNames));
    return ["all", ...tablesData];
    // return ["all", ...unique];
  }, [invitation, tablesData]);

  // États possibles
  const states = [
    { value: "all", label: "Tous" },
    { value: "unscanned", label: "Non scannés" },
    { value: "partial", label: "Partiels" },
    { value: "complete", label: "Complétés" },
  ];

  // Filtrage
  const filteredInvitation = useMemo(() => {
    if (!invitation) return [];

    return invitation?.filter((guest) => {
      const searchLower = search.toLowerCase();
      const guestName = (guest.label ?? "").toLowerCase();
      const matchesSearch = guestName.includes(searchLower);

      // Filtre par table
      const guestTableNames =
        guest.allocations?.map((a) => a.table?.name).filter(Boolean) || [];
      const matchesTable =
        tableFilter === "all" || guestTableNames.includes(tableFilter);

      // Filtre par état de scan
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
  }, [search, tableFilter, stateFilter, invitation]);

  if (isPending || error || isError || !tablesData) {
    return (
      <DataStatusDisplay
        isPending={isPending}
        hasError={isError}
        errorObject={error}
        refetch={refetch}
      />
    );
  }

  const totalPages = Math.ceil(filteredInvitation.length / perPage);
  const currentInvitation = filteredInvitation.slice(
    (page - 1) * perPage,
    page * perPage
  );

  return (
    <>
      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row justify-around items-center gap-4 w-full">
        <Input
          placeholder="🔍 Rechercher un invité..."
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
            {tables.map((t) => {
              const isAll = t === "all";

              const key = isAll ? "all" : (t as Table).id;
              const value = isAll ? "all" : (t as Table).name;
              const label = isAll ? "Toutes les tables" : (t as Table).name;
              const capacity = (t as Table).capacity;

              const totalSeatsAssigned = event.invitations.reduce(
                (total, invitation) => {
                  const allocationForThisTable = invitation.allocations?.find(
                    (allocation) => allocation.tableId === key
                  );
                  return total + (allocationForThisTable?.seatsAssigned || 0);
                },
                0
              );

              return (
                <SelectItem key={key} value={value}>
                  {label}
                  {!isAll && (
                    <Badge
                      variant="outline"
                      className="text-xs text-black bg-card"
                    >
                      {totalSeatsAssigned}/{capacity} places
                    </Badge>
                  )}
                </SelectItem>
              );
            })}
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
        {isPending ? (
          <div className="flex justify-center items-center h-96 col-span-full gap-2 text-white">
            <Loader2 className="animate-spin" />
            <span>Chargement...</span>
          </div>
        ) : currentInvitation.length === 0 ? (
          <div className="text-center text-gray-400 italic col-span-full mt-12">
            Aucun invité trouvé 🫤
          </div>
        ) : (
          currentInvitation.map((guest, i) => (
            <motion.div
              key={`${guest.id}-${i}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <InvitationCard invitation={guest} />
            </motion.div>
          ))
        )}
      </div>

      {/* Pagination responsive */}
      {!isPending && totalPages > 1 && (
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
    </>
  );
}

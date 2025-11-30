// import { motion } from "motion/react";
// import GuestCard from "@/components/public/guest-card";
// import { Input } from "@/components/ui/input";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Loader2 } from "lucide-react";
// import {
//   Pagination,
//   PaginationContent,
//   PaginationItem,
//   PaginationLink,
// } from "@/components/ui/pagination";
// import { Invitation } from "@/types/types";
// import { useMemo, useState } from "react";
// import { useEventInvitationsByEventCode } from "@/hooks/use-event";
// import DataStatusDisplay from "@/components/data-status-display";

// export default function Guests() {
//   // {
//   // tables,
//   // states,
//   // search,
//   // setSearch,
//   // tableFilter,
//   // setTableFilter,
//   // stateFilter,
//   // setStateFilter,
//   // page,
//   // setPage,
//   // totalPages,
//   // currentGuests,
//   // }: // loading,
//   // {
//   // tables: string[];
//   // states: { label: string; value: string }[];
//   // search: string;
//   // setSearch: (val: string) => void;
//   // tableFilter: string;
//   // setTableFilter: (val: string) => void;
//   // stateFilter: string;
//   // setStateFilter: (val: string) => void;
//   // page: number;
//   // setPage: (val: number) => void;
//   // totalPages: number;
//   // currentGuests: Guest[];
//   // loading: boolean;
//   // }
//   // const [events, setEvents] = useState<Event[]>([]);
//   // const [guestsData, setGuestsData] = useState<Guest[]>([]);
//   const [search, setSearch] = useState("");
//   const [tableFilter, setTableFilter] = useState("all");
//   const [stateFilter, setStateFilter] = useState("all");
//   const [page, setPage] = useState(1);
//   // const [loading, setLoading] = useState(true);
//   const eventCode = "afterwork-tech-2025-1";
//   const perPage = 9;

//   const { data, isPending, error, isError, refetch } =
//     useEventInvitationsByEventCode(eventCode);
//   const guestsData = data as Invitation[];

//   // return console.log("guestsData: ", guestsData);

//   // useEffect(() => {
//   //   const fetchGuests = async () => {
//   //     try {
//   //       const res = await fetch("/data/guests.json");
//   //       const data = await res.json();
//   //       setGuestsData(data);
//   //     } catch (error) {
//   //       console.error("Erreur lors du chargement des invités :", error);
//   //     } finally {
//   //       setLoading(false);
//   //     }
//   //   };
//   //   fetchGuests();
//   //   const fetchEvents = async () => {
//   //     const res = await fetch("/data/events.json");
//   //     const data = await res.json();
//   //     setEvents(data);
//   //   };
//   //   fetchEvents();
//   // }, []);

//   // Tables uniques (calculées après chargement)
//   const tables = useMemo(() => {
//     if (!guestsData?.length) return ["all"];
//     const unique = Array.from(new Set(guestsData.map((g) => g.table)));
//     return ["all", ...unique];
//   }, [guestsData]);

//   // États possibles (toujours statiques pour éviter les bug)
//   const states = [
//     { value: "all", label: "Tous" },
//     { value: "unscanned", label: "Non scannés" },
//     { value: "partial", label: "Partiels" },
//     { value: "complete", label: "Complétés" },
//   ];

//   // Filtrage
//   const filteredGuests = useMemo(() => {
//     return guestsData?.filter((guest) => {
//       const searchLower = search.toLowerCase();
//       const guestName = (guest.label ?? "").toLowerCase();
//       const guestEmail = (guest.email ?? "").toLowerCase();
//       const guestTable = (guest.table ?? "").toLowerCase();
//       const matchesSearch =
//         guestName.includes(searchLower) ||
//         guestEmail.includes(searchLower) ||
//         guestTable.includes(searchLower);

//       const matchesTable =
//         tableFilter === "all" || (guest.table ?? "") === tableFilter;

//       const matchesState =
//         stateFilter === "all" ||
//         (stateFilter === "unscanned" && guest.scannedCount === 0) ||
//         (stateFilter === "partial" &&
//           guest.scannedCount > 0 &&
//           guest.scannedCount < guest.peopleCount) ||
//         (stateFilter === "complete" &&
//           guest.scannedCount === guest.peopleCount);

//       return matchesSearch && matchesTable && matchesState;
//     });
//   }, [search, tableFilter, stateFilter, guestsData]);

//   if (isPending || error || isError) {
//     return (
//       <DataStatusDisplay
//         isPending={isPending}
//         hasError={isError}
//         errorObject={error}
//         refetch={refetch}
//       />
//     );
//   }

//   const totalPages = Math.ceil(filteredGuests.length / perPage);
//   const currentGuests = filteredGuests.slice(
//     (page - 1) * perPage,
//     page * perPage
//   );
//   return (
//     <>
//       {/* Search + Filter */}
//       <div className="flex flex-col sm:flex-row justify-around items-center gap-4 w-full">
//         <Input
//           placeholder="🔍 Rechercher un invité, email ou table..."
//           value={search}
//           onChange={(e) => {
//             setSearch(e.target.value);
//             setPage(1);
//           }}
//           className="w-full"
//         />

//         <Select
//           value={tableFilter}
//           onValueChange={(val) => {
//             setTableFilter(val);
//             setPage(1);
//           }}
//         >
//           <SelectTrigger className="bg-black/30 text-white border-none w-full sm:w-[180px]">
//             <SelectValue placeholder="Filtrer par table" />
//           </SelectTrigger>
//           <SelectContent>
//             {tables.map((t) => (
//               <SelectItem key={t} value={t}>
//                 {t === "all" ? "Toutes les tables" : t}
//               </SelectItem>
//             ))}
//           </SelectContent>
//         </Select>

//         <Select
//           value={stateFilter}
//           onValueChange={(val) => {
//             setStateFilter(val);
//             setPage(1);
//           }}
//         >
//           <SelectTrigger className="bg-black/30 text-white border-none w-full sm:w-[180px]">
//             <SelectValue placeholder="Filtrer état" />
//           </SelectTrigger>
//           <SelectContent>
//             {states.map((s) => (
//               <SelectItem key={s.value} value={s.value}>
//                 {s.label}
//               </SelectItem>
//             ))}
//           </SelectContent>
//         </Select>
//       </div>
//       {/* Grid des invités */}
//       <div className="grid sm:grid-cols-2 lg:grid-cols-3 items-center justify-center gap-5">
//         {isPending ? (
//           <div className="flex justify-center items-center h-96 col-span-full gap-2 text-white">
//             <Loader2 className="animate-spin" />
//             <span>Chargement...</span>
//           </div>
//         ) : currentGuests.length === 0 ? (
//           <div className="text-center text-gray-400 italic col-span-full mt-12">
//             Aucun invité trouvé 🫤
//           </div>
//         ) : (
//           currentGuests.map((guest, i) => (
//             <motion.div
//               key={guest.id}
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: i * 0.04 }}
//             >
//               <GuestCard guest={guest} />
//             </motion.div>
//           ))
//         )}
//       </div>
//       {/* Pagination responsive */}
//       {!isPending && totalPages > 1 && (
//         <div className="flex justify-center mt-6">
//           <Pagination>
//             <PaginationContent className="flex flex-wrap justify-center gap-2">
//               {Array.from({ length: totalPages }).map((_, i) => (
//                 <PaginationItem key={i}>
//                   <PaginationLink
//                     onClick={() => setPage(i + 1)}
//                     isActive={page === i + 1}
//                     className={`cursor-pointer px-3 ${
//                       page === i + 1
//                         ? "border border-primary hover:bg-primary hover:text-white text-white bg-primary"
//                         : "text-gray-300"
//                     }`}
//                   >
//                     {i + 1}
//                   </PaginationLink>
//                 </PaginationItem>
//               ))}
//             </PaginationContent>
//           </Pagination>
//         </div>
//       )}
//     </>
//   );
// }
import { motion } from "motion/react";
import GuestCard from "@/components/public/guest-card";
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
import { Invitation } from "@/types/types";
import { useMemo, useState } from "react";
import { useEventInvitationsByEventCode } from "@/hooks/use-event";
import DataStatusDisplay from "@/components/data-status-display";
import { useParams } from "next/navigation";

export default function Guests() {
  const { eventCode } = useParams();
  const [search, setSearch] = useState("");
  const [tableFilter, setTableFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [page, setPage] = useState(1);
  const perPage = 9;

  // Utiliser le eventCode de l'URL
  const { data, isPending, error, isError, refetch } =
    useEventInvitationsByEventCode(eventCode as string);
  const guestsData = data as Invitation[];

  // Tables uniques depuis les allocations réelles
  const tables = useMemo(() => {
    if (!guestsData?.length) return ["all"];

    const tableNames = guestsData
      .flatMap(
        (invitation) =>
          invitation.allocations?.map((allocation) => allocation.table?.name) ||
          []
      )
      .filter(Boolean) as string[];

    const unique = Array.from(new Set(tableNames));
    return ["all", ...unique];
  }, [guestsData]);

  // États possibles
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
  }, [search, tableFilter, stateFilter, guestsData]);

  if (isPending || error || isError) {
    return (
      <DataStatusDisplay
        isPending={isPending}
        hasError={isError}
        errorObject={error}
        refetch={refetch}
      />
    );
  }

  const totalPages = Math.ceil(filteredGuests.length / perPage);
  const currentGuests = filteredGuests.slice(
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
        {isPending ? (
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

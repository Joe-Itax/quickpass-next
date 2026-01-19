import { Table, Invitation } from "@/types/types";
import { MapPin } from "lucide-react";
import { motion } from "motion/react";

export default function TableOccupancy({
  tables,
  invitations,
}: {
  tables: Table[];
  invitations: Invitation[];
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {tables.map((table, index) => {
        // CALCUL DES SCANS PAR TABLE
        const scannedInTable = invitations.reduce((acc, inv) => {
          const alloc = inv.allocations?.find(
            (a) => a.tableId === table.id || a.table?.id === table.id,
          );

          if (!alloc) return acc;

          const seatsAssigned = alloc.seatsAssigned || 0;
          const totalPeople = inv.peopleCount || 1;
          const totalScanned = inv.scannedCount || 0;

          // Calcul au prorata : si 5/10 personnes sont scannées pour une table de 4 places
          // On compte (5/10) * 4 = 2 personnes pour cette table précise.
          const ratio = totalScanned / totalPeople;
          const effectiveScanned = Math.min(
            seatsAssigned,
            Math.round(ratio * seatsAssigned),
          );

          return acc + effectiveScanned;
        }, 0);

        const percentage =
          table.capacity > 0
            ? Math.min(100, Math.round((scannedInTable / table.capacity) * 100))
            : 0;

        return (
          <motion.div
            key={table.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="group bg-white/3 hover:bg-white/6 border border-white/10 rounded-[2.5rem] p-5 transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <MapPin size={20} />
              </div>
              <div className="text-right">
                <p className="text-2xl font-black italic tracking-tighter text-white">
                  {percentage}%
                </p>
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                  Occupation
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-black uppercase tracking-tight truncate text-white/90">
                  {table.name}
                </h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">
                  <span className="text-primary">{scannedInTable}</span> /{" "}
                  {table.capacity} places scannées
                </p>
              </div>

              {/* PROGRESS BAR */}
              <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`absolute top-0 left-0 h-full transition-colors ${
                    percentage >= 100
                      ? "bg-green-500 shadow-[0_0_10px_#22c55e]"
                      : "bg-primary shadow-[0_0_10px_#FDB623]"
                  }`}
                />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

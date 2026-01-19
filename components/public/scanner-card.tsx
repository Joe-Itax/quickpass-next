"use client";

import { motion } from "motion/react";
import { ShieldCheck } from "lucide-react";

export function ScannerCard({
  person,
  scannedAt,
}: {
  person: {
    name: string;
  };
  scannedAt: Date;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm"
    >
      <div className="flex items-center gap-4">
        <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
          <ShieldCheck size={20} />
        </div>
        <div>
          <p className="font-bold text-white uppercase tracking-tight leading-none">
            {person.name}
          </p>
          <p className="text-[10px] text-gray-500 font-mono mt-1">
            {new Intl.DateTimeFormat("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }).format(scannedAt)}
          </p>
        </div>
      </div>
      <div className="bg-green-500/10 text-green-500 text-[8px] font-black px-2 py-1 rounded-full border border-green-500/20 uppercase">
        Vérifié
      </div>
    </motion.div>
  );
}

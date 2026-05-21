/**
 * Indicateur de connectivité et synchronisation (global)
 */

"use client";

import { useOffline } from "@/hooks/use-offline";
import { useSync } from "@/hooks/use-sync";
import { WifiOff, RefreshCw, CloudUpload } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function OfflineIndicator() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const { isOnline } = useOffline();
  const eventCode = pathname?.match(/\/scan-portail\/([^/]+)/)?.[1];
  const { isSyncing, syncStats } = useSync(eventCode);

  const isScanPortal = pathname?.startsWith("/scan-portail");

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const showOffline = !isOnline;
  const showSyncing = isSyncing;
  const showPending =
    isOnline && !isSyncing && syncStats.pendingScans > 0 && isScanPortal;

  if (!showOffline && !showSyncing && !showPending) return null;

  return (
    <AnimatePresence mode="wait">
      {showOffline && (
        <motion.div
          key="offline"
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          className="fixed bottom-4 left-4 -translate-x-4 bg-red-600/95 backdrop-blur-md z-900 px-4 py-2 flex items-center gap-3 rounded-full shadow-2xl border border-red-500/50"
        >
          <WifiOff size={16} className="text-white shrink-0" />
          <p className="text-white font-semibold text-xs whitespace-nowrap">
            Mode hors-ligne
          </p>
          {syncStats.pendingScans > 0 && (
            <span className="text-white text-[10px] font-mono bg-black/30 px-2 py-0.5 rounded-full shrink-0">
              {syncStats.pendingScans} en attente
            </span>
          )}
        </motion.div>
      )}

      {showSyncing && (
        <motion.div
          key="syncing"
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 bg-amber-600/95 backdrop-blur-md z-900 px-4 py-2 flex items-center gap-3 rounded-full shadow-2xl border border-amber-500/50"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          >
            <RefreshCw size={16} className="text-white shrink-0" />
          </motion.div>
          <p className="text-white font-semibold text-xs whitespace-nowrap">
            Synchronisation...
          </p>
        </motion.div>
      )}

      {showPending && (
        <motion.div
          key="pending"
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 bg-blue-600/95 backdrop-blur-md z-900 px-4 py-2 flex items-center gap-3 rounded-full shadow-2xl border border-blue-500/50"
        >
          <CloudUpload size={16} className="text-white shrink-0" />
          <p className="text-white font-semibold text-xs whitespace-nowrap">
            {syncStats.pendingScans} en attente
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

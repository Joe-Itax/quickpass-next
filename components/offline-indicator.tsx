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
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="sticky top-0 left-0 right-0 bg-red-600/95 backdrop-blur-sm z-900 px-4 py-2.5 flex items-center justify-between"
        >
          <motion.div className="flex items-center gap-3">
            <WifiOff size={18} className="text-white shrink-0" />
            <div>
              <p className="text-white font-semibold text-sm">
                Mode hors-ligne
              </p>
              <p className="text-white/80 text-xs">
                Les scans sont enregistrés localement et synchronisés au retour
                du réseau
              </p>
            </div>
          </motion.div>
          {syncStats.pendingScans > 0 && (
            <span className="text-white text-xs font-mono bg-black/25 px-2 py-1 rounded shrink-0">
              {syncStats.pendingScans} en attente
            </span>
          )}
        </motion.div>
      )}

      {showSyncing && (
        <motion.div
          key="syncing"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="sticky top-0 left-0 right-0 bg-amber-600/95 backdrop-blur-sm z-900 px-4 py-2.5 flex items-center justify-between"
        >
          <motion.div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            >
              <RefreshCw size={18} className="text-white" />
            </motion.div>
            <motion.div>
              <p className="text-white font-semibold text-sm">
                Synchronisation...
              </p>
              <p className="text-white/80 text-xs">
                Envoi des scans vers le serveur
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}

      {showPending && (
        <motion.div
          key="pending"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="sticky top-0 left-0 right-0 bg-blue-600/90 backdrop-blur-sm z-900 px-4 py-2 flex items-center gap-3"
        >
          <CloudUpload size={16} className="text-white" />
          <p className="text-white text-sm font-medium">
            {syncStats.pendingScans} scan(s) à synchroniser
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

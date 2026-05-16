"use client";

import { CloudOff, Database, RefreshCw } from "lucide-react";
import { motion } from "motion/react";

interface SyncStatusProps {
  bundleReady: boolean;
  invitationCount: number;
  pendingScans: number;
  isPrefetching?: boolean;
  compact?: boolean;
}

export function SyncStatus({
  bundleReady,
  invitationCount,
  pendingScans,
  isPrefetching = false,
  compact = false,
}: SyncStatusProps) {
  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest"
      >
        {isPrefetching ? (
          <>
            <RefreshCw size={12} className="animate-spin text-amber-400" />
            <span className="text-amber-400">Cache...</span>
          </>
        ) : bundleReady ? (
          <>
            <Database size={12} className="text-emerald-400" />
            <span className="text-emerald-400">{invitationCount} passes</span>
          </>
        ) : (
          <>
            <CloudOff size={12} className="text-red-400" />
            <span className="text-red-400">Non chargé</span>
          </>
        )}
        {pendingScans > 0 && (
          <span className="bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">
            {pendingScans} sync
          </span>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2"
    >
      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">
        Mode hors-ligne
      </p>
      <motion.div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">Cache local</span>
        {isPrefetching ? (
          <span className="flex items-center gap-1 text-amber-400 font-bold">
            <RefreshCw size={14} className="animate-spin" /> Chargement...
          </span>
        ) : bundleReady ? (
          <span className="text-emerald-400 font-bold">
            {invitationCount} invitation(s)
          </span>
        ) : (
          <span className="text-red-400 font-bold">Non disponible</span>
        )}
      </motion.div>
      {pendingScans > 0 && (
        <p className="text-xs text-amber-300 font-medium">
          {pendingScans} scan(s) en attente de synchronisation
        </p>
      )}
    </motion.div>
  );
}

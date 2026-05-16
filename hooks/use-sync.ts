/**
 * Synchronisation offline : scans en attente + queue Zustand (admin)
 */

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useOfflineStore } from "@/lib/offline-store";
import { useIsOnline } from "./use-offline";
import { syncPendingScans } from "@/lib/sync-scans";
import { getPendingScanCount } from "@/lib/local-db";

const SYNC_INTERVAL = 15000;
const MAX_RETRIES = 3;

export function useSync(eventCode?: string) {
  const isOnline = useIsOnline();
  const {
    queue,
    isSyncing,
    setSyncStatus,
    setSyncProgress,
    removeFromQueue,
    updateQueueItem,
    addSyncError,
  } = useOfflineStore();

  const [syncStats, setSyncStats] = useState({
    total: 0,
    synced: 0,
    failed: 0,
    pending: 0,
    pendingScans: 0,
  });

  const hasAutoSynced = useRef(false);

  const refreshPendingCount = useCallback(async () => {
    const count = await getPendingScanCount(eventCode);
    setSyncStats((prev) => ({ ...prev, pendingScans: count }));
    return count;
  }, [eventCode]);

  const syncAdminQueue = useCallback(async () => {
    const pendingOps = queue.filter((q) => q.status === "PENDING").slice(0, 5);
    if (pendingOps.length === 0) return { synced: 0, failed: 0 };

    let synced = 0;
    let failed = 0;

    for (const operation of pendingOps) {
      updateQueueItem(operation.id, { status: "SYNCING" });
      try {
        const response = await fetch("/api/sync/process-queue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ operations: [operation] }),
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        removeFromQueue(operation.id);
        synced++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        const retries = operation.retries + 1;
        updateQueueItem(operation.id, {
          retries,
          lastError: errorMsg,
          status: retries >= MAX_RETRIES ? "FAILED" : "PENDING",
        });
        addSyncError(operation.id, errorMsg);
        failed++;
      }
    }

    return { synced, failed };
  }, [queue, removeFromQueue, updateQueueItem, addSyncError]);

  const sync = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    setSyncStatus(true);

    try {
      const pendingScans = await refreshPendingCount();
      let scanSynced = 0;
      let scanFailed = 0;

      if (pendingScans > 0) {
        setSyncProgress({
          current: 0,
          total: pendingScans,
          currentOperation: "Synchronisation des scans",
        });
        const scanResult = await syncPendingScans(eventCode);
        scanSynced = scanResult.synced;
        scanFailed = scanResult.failed;
      }

      const adminResult = await syncAdminQueue();

      const totalSynced = scanSynced + adminResult.synced;
      const totalFailed = scanFailed + adminResult.failed;
      const remaining = await refreshPendingCount();

      setSyncStats({
        total: pendingScans + queue.length,
        synced: totalSynced,
        failed: totalFailed,
        pending: remaining + queue.filter((q) => q.status === "PENDING").length,
        pendingScans: remaining,
      });
    } catch (err) {
      console.error("[SYNC]", err);
    } finally {
      setSyncStatus(false);
      setSyncProgress({ current: 0, total: 0 });
    }
  }, [
    isOnline,
    isSyncing,
    eventCode,
    queue,
    setSyncStatus,
    setSyncProgress,
    syncAdminQueue,
    refreshPendingCount,
  ]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshPendingCount();
  }, [refreshPendingCount]);

  useEffect(() => {
    if (isOnline && !hasAutoSynced.current) {
      hasAutoSynced.current = true;
      sync();
    }
    if (!isOnline) {
      hasAutoSynced.current = false;
    }
  }, [isOnline, sync]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isOnline) sync();
    }, SYNC_INTERVAL);

    const handleForceSync = () => sync();
    window.addEventListener("force-sync", handleForceSync);

    return () => {
      clearInterval(interval);
      window.removeEventListener("force-sync", handleForceSync);
    };
  }, [sync, isOnline]);

  return {
    isOnline,
    isSyncing,
    queue,
    syncStats,
    sync,
    refreshPendingCount,
  };
}

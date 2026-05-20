"use client";

import { useCallback, useEffect, useState } from "react";
import {
  prefetchEventScanBundle,
  processHybridScan,
  type OfflineScanResult,
} from "@/lib/offline-scan";
import { getScanBundle, getPendingScanCount } from "@/lib/local-db";
import { useIsOnline } from "./use-offline";
import { useQueryClient } from "@tanstack/react-query";
import { EVENT_KEYS } from "@/hooks/use-event";

export function useOfflineScan(eventCode: string) {
  const isOnline = useIsOnline();
  const [isPrefetching, setIsPrefetching] = useState(false);
  const [prefetchError, setPrefetchError] = useState<string | null>(null);
  const [bundleReady, setBundleReady] = useState(false);
  const [invitationCount, setInvitationCount] = useState(0);
  const [pendingScans, setPendingScans] = useState(0);
  const queryClient = useQueryClient();

  const refreshStats = useCallback(async () => {
    const bundle = await getScanBundle(eventCode);
    setBundleReady(!!bundle);
    setInvitationCount(bundle?.invitationCount ?? 0);
    const pending = await getPendingScanCount(eventCode);
    setPendingScans(pending);
  }, [eventCode]);

  const invalidateQueries = useCallback(() => {
    // Invalider toutes les queries liées à cet événement pour que l'UI se mette à jour
    queryClient.invalidateQueries({
      queryKey: EVENT_KEYS.oneByEventCode(eventCode),
    });
    queryClient.invalidateQueries({
      queryKey: EVENT_KEYS.eventByEventCode(eventCode),
    });
    queryClient.invalidateQueries({ queryKey: EVENT_KEYS.history(eventCode) });
    // Si on a l'ID de l'événement, on peut invalider les stats
    const bundle = getScanBundle(eventCode);
    bundle.then((b) => {
      if (b) {
        queryClient.invalidateQueries({
          queryKey: EVENT_KEYS.stats(b.eventId),
        });
        queryClient.invalidateQueries({ queryKey: EVENT_KEYS.one(b.eventId) });
      }
    });
    // Invalider aussi la liste globale des événements pour les dashboards
    queryClient.invalidateQueries({ queryKey: EVENT_KEYS.all });
  }, [eventCode, queryClient]);

  const prefetch = useCallback(
    async (terminalCode: string) => {
      setIsPrefetching(true);
      setPrefetchError(null);
      try {
        const bundle = await prefetchEventScanBundle(eventCode, terminalCode);
        setBundleReady(true);
        setInvitationCount(bundle.invitationCount);
        return bundle;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setPrefetchError(msg);
        throw err;
      } finally {
        setIsPrefetching(false);
      }
    },
    [eventCode],
  );

  const scan = useCallback(
    async (qr: string, terminalCode: string): Promise<OfflineScanResult> => {
      const result = await processHybridScan(
        eventCode,
        qr,
        terminalCode,
        isOnline,
      );
      await refreshStats();
      // Invalider les queries pour que les pages admin/stats se mettent à jour
      invalidateQueries();
      if (result.queued) {
        window.dispatchEvent(new CustomEvent("force-sync"));
      }
      return result;
    },
    [eventCode, isOnline, refreshStats, invalidateQueries],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshStats();
  }, [refreshStats]);

  useEffect(() => {
    const onSync = () => refreshStats();
    window.addEventListener("force-sync", onSync);
    return () => window.removeEventListener("force-sync", onSync);
  }, [refreshStats]);

  return {
    isOnline,
    isPrefetching,
    prefetchError,
    bundleReady,
    invitationCount,
    pendingScans,
    prefetch,
    scan,
    refreshStats,
  };
}

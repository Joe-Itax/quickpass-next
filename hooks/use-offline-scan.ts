"use client";

import { useCallback, useEffect, useState } from "react";
import {
  prefetchEventScanBundle,
  processHybridScan,
  type OfflineScanResult,
} from "@/lib/offline-scan";
import { getScanBundle, getPendingScanCount } from "@/lib/local-db";
import { useIsOnline } from "./use-offline";

export function useOfflineScan(eventCode: string) {
  const isOnline = useIsOnline();
  const [isPrefetching, setIsPrefetching] = useState(false);
  const [prefetchError, setPrefetchError] = useState<string | null>(null);
  const [bundleReady, setBundleReady] = useState(false);
  const [invitationCount, setInvitationCount] = useState(0);
  const [pendingScans, setPendingScans] = useState(0);

  const refreshStats = useCallback(async () => {
    const bundle = await getScanBundle(eventCode);
    setBundleReady(!!bundle);
    setInvitationCount(bundle?.invitationCount ?? 0);
    const pending = await getPendingScanCount(eventCode);
    setPendingScans(pending);
  }, [eventCode]);

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
      if (result.queued) {
        window.dispatchEvent(new CustomEvent("force-sync"));
      }
      return result;
    },
    [eventCode, isOnline, refreshStats],
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

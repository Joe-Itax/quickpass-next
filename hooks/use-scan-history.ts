"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useEventHistory } from "@/hooks/use-event";
import { useIsOnline } from "@/hooks/use-offline";
import { getLocalScanLogs, type LocalScanLog } from "@/lib/local-db";
import type { Log } from "@/types/types";

function localLogToDisplay(log: LocalScanLog): Log {
  return {
    id: -Math.abs(log.scannedAt),
    eventCode: log.eventCode,
    terminalCode: log.terminalCode,
    terminal: log.terminalName
      ? { name: log.terminalName } as Log["terminal"]
      : undefined,
    invitationId: log.invitationId,
    guestName: log.guestName,
    status: log.status,
    errorMessage: log.errorMessage,
    scannedAt: new Date(log.scannedAt),
  };
}

/**
 * Historique fusionné : logs serveur + scans locaux (offline / en attente de sync).
 */
export function useScanHistory(eventCode: string) {
  const isOnline = useIsOnline();
  const {
    data: serverData,
    isPending,
    isError,
    error,
    refetch: refetchServer,
  } = useEventHistory(eventCode);
  const [localLogs, setLocalLogs] = useState<LocalScanLog[]>([]);

  const loadLocal = useCallback(async () => {
    const logs = await getLocalScanLogs(eventCode);
    setLocalLogs(logs.filter((l) => !l.synced));
  }, [eventCode]);

  const refetchAll = useCallback(async () => {
    await Promise.all([refetchServer(), loadLocal()]);
  }, [refetchServer, loadLocal]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadLocal();
  }, [loadLocal]);

  useEffect(() => {
    const onRefresh = () => void refetchAll();
    window.addEventListener("scan-completed", onRefresh);
    window.addEventListener("force-sync", onRefresh);
    return () => {
      window.removeEventListener("scan-completed", onRefresh);
      window.removeEventListener("force-sync", onRefresh);
    };
  }, [refetchAll]);

  const data = useMemo(() => {
    const server = (serverData as Log[] | undefined) ?? [];
    const local = localLogs.map(localLogToDisplay);
    return [...local, ...server].sort(
      (a, b) =>
        new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime(),
    );
  }, [serverData, localLogs]);

  const hasDisplayableData = data.length > 0;
  const shouldSurfaceServerError = isError && isOnline && !hasDisplayableData;

  return {
    data,
    isPending: isPending && !hasDisplayableData,
    isError: shouldSurfaceServerError,
    error,
    refetch: refetchAll,
  };
}

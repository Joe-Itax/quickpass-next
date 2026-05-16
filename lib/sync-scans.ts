/**
 * Synchronisation des scans en attente (IndexedDB → serveur)
 */

import {
  getPendingScans,
  markLocalScanLogsSynced,
  removePendingScan,
  removeSyncedLocalScanLogs,
  updatePendingScan,
} from "@/lib/local-db";

const MAX_RETRIES = 5;

export interface ScanSyncResult {
  synced: number;
  failed: number;
  remaining: number;
}

export async function syncPendingScans(
  eventCode?: string,
): Promise<ScanSyncResult> {
  const pending = await getPendingScans(eventCode);
  let synced = 0;
  let failed = 0;

  if (pending.length === 0) {
    return { synced: 0, failed: 0, remaining: 0 };
  }

  const res = await fetch("/api/sync/scans", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      scans: pending.map((s) => ({
        clientId: s.id,
        kind: s.kind,
        scanStatus: s.scanStatus,
        qr: s.qr,
        terminalCode: s.terminalCode,
        eventCode: s.eventCode,
        guestName: s.guestName,
        errorMessage: s.errorMessage,
        invitationId: s.invitationId,
        assignedTable: s.assignedTable,
        scannedAt: s.scannedAt,
      })),
    }),
  });

  if (!res.ok) {
    throw new Error(`Sync scans failed: HTTP ${res.status}`);
  }

  const data = (await res.json()) as {
    results: Array<{ clientId: string; success: boolean; error?: string }>;
  };

  for (const result of data.results) {
    const scan = pending.find((p) => p.id === result.clientId);
    if (!scan) continue;

    if (result.success) {
      await removePendingScan(result.clientId);
      await markLocalScanLogsSynced([result.clientId]);
      synced++;
    } else {
      const retries = scan.retries + 1;
      if (retries >= MAX_RETRIES) {
        await updatePendingScan(result.clientId, {
          status: "failed",
          retries,
          lastError: result.error,
        });
      } else {
        await updatePendingScan(result.clientId, {
          retries,
          lastError: result.error,
        });
      }
      failed++;
    }
  }

  if (eventCode) {
    await removeSyncedLocalScanLogs(eventCode);
  }

  const remaining = await getPendingScans(eventCode);

  if (typeof window !== "undefined" && synced > 0) {
    window.dispatchEvent(new CustomEvent("scan-completed"));
  }

  return {
    synced,
    failed,
    remaining: remaining.length,
  };
}

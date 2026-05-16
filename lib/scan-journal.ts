/**
 * Journal unifié : chaque tentative de scan est enregistrée localement
 * et mise en file pour synchronisation Postgres (succès ET erreurs).
 */

import {
  addLocalScanLog,
  addPendingScan,
  getScanBundle,
  updateCachedInvitationScan,
  type CachedInvitation,
} from "@/lib/local-db";
import { parseQrPayloadUnsafe } from "@/lib/qr-client";

export function dispatchScanCompleted() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("scan-completed"));
  }
}

export type ScanJournalKind = "entry" | "log";

export interface ScanJournalInput {
  id: string;
  eventCode: string;
  terminalCode: string;
  kind: ScanJournalKind;
  scanStatus: "SUCCESS" | "ERROR";
  qr?: string;
  guestName?: string;
  errorMessage?: string;
  invitationId?: number;
  assignedTable?: string;
  scannedAt?: number;
}

/** Enregistre TOUJOURS en local + file de sync */
export async function commitScanJournal(input: ScanJournalInput) {
  const bundle = await getScanBundle(input.eventCode);
  const scannedAt = input.scannedAt ?? Date.now();

  await addLocalScanLog({
    id: input.id,
    eventCode: input.eventCode,
    terminalCode: input.terminalCode,
    terminalName: bundle?.terminalName,
    guestName: input.guestName,
    status: input.scanStatus,
    errorMessage: input.errorMessage,
    invitationId: input.invitationId,
    scannedAt,
    synced: false,
  });

  await addPendingScan({
    id: input.id,
    eventCode: input.eventCode,
    terminalCode: input.terminalCode,
    scannedAt,
    kind: input.kind,
    scanStatus: input.scanStatus,
    qr: input.qr,
    guestName: input.guestName,
    errorMessage: input.errorMessage,
    invitationId: input.invitationId,
    assignedTable: input.assignedTable,
    resultSnapshot: {
      ok: input.scanStatus === "SUCCESS",
      label: input.guestName,
      assignedTable: input.assignedTable,
      error: input.errorMessage,
    },
  });

  dispatchScanCompleted();
}

export function resolveAssignedTable(
  inv: CachedInvitation,
  scanIndex: number,
): string {
  if (!inv.allocations.length) return "Espace libre";

  let tracker = 0;
  for (const alloc of inv.allocations) {
    tracker += alloc.seatsAssigned;
    if (scanIndex < tracker) return alloc.tableName;
  }

  return Array.from(new Set(inv.allocations.map((a) => a.tableName))).join(
    ", ",
  );
}

export async function findCachedInvitation(
  qr: string,
  eventId: number,
  getByQr: (q: string) => Promise<CachedInvitation | undefined>,
  getById: (id: number) => Promise<CachedInvitation | undefined>,
): Promise<CachedInvitation | undefined> {
  const byQr = await getByQr(qr);
  if (byQr && byQr.eventId === eventId) return byQr;

  const payload = parseQrPayloadUnsafe(qr);
  if (payload?.invitationId) {
    const byId = await getById(Number(payload.invitationId));
    if (byId && byId.eventId === eventId) return byId;
  }

  return undefined;
}

export async function applyLocalScanSuccess(
  invitationId: number,
  scannedCount: number,
) {
  await updateCachedInvitationScan(invitationId, scannedCount);
}

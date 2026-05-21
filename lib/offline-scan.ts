/**
 * Moteur de scan hors-ligne pour le portail terrain.
 */

import { parseQrPayloadUnsafe } from "@/lib/qr-client";
import { commitScanJournal, dispatchScanCompleted } from "@/lib/scan-journal";
import {
  cacheInvitationsForScan,
  cacheTables,
  getCachedInvitationById,
  getCachedInvitationByQr,
  getCachedInvitations,
  getScanBundle,
  saveScanBundle,
  saveTerminalSession,
  updateCachedInvitationScan,
  type CachedInvitation,
  type CachedTable,
  type EventScanBundle,
} from "@/lib/local-db";

async function recordOfflineAttempt(params: {
  id: string;
  eventCode: string;
  terminalCode: string;
  kind: "entry" | "log";
  qr?: string;
  guestName?: string;
  status: "SUCCESS" | "ERROR";
  errorMessage?: string;
  invitationId?: number;
  assignedTable?: string;
}) {
  await commitScanJournal({
    id: params.id,
    eventCode: params.eventCode,
    terminalCode: params.terminalCode,
    kind: params.kind,
    scanStatus: params.status,
    qr: params.qr,
    guestName: params.guestName,
    errorMessage: params.errorMessage,
    invitationId: params.invitationId,
    assignedTable: params.assignedTable,
  });
}

export interface OfflineScanResult {
  id?: number;
  label?: string;
  assignedTable?: string;
  scannedCount?: number;
  peopleCount?: number;
  error?: string;
  offline?: boolean;
  queued?: boolean;
}

export interface OfflineBundleResponse {
  event: {
    id: number;
    name: string;
    eventCode: string;
    status: string;
  };
  terminal: {
    id: number;
    code: string;
    name: string;
  };
  invitations: Array<{
    id: number;
    eventId: number;
    label: string;
    peopleCount: number;
    scannedCount: number;
    qrCode: string | null;
    allocations: Array<{
      tableId: number;
      tableName: string;
      seatsAssigned: number;
    }>;
  }>;
  tables: CachedTable[];
}

function resolveAssignedTable(
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

async function findInvitation(
  qr: string,
  eventId: number,
): Promise<CachedInvitation | undefined> {
  const byQr = await getCachedInvitationByQr(qr);
  if (byQr && byQr.eventId === eventId) return byQr;

  const payload = parseQrPayloadUnsafe(qr);
  if (payload?.invitationId) {
    const byId = await getCachedInvitationById(Number(payload.invitationId));
    if (byId && byId.eventId === eventId) return byId;
  }

  return undefined;
}

/** Télécharge et met en cache le bundle de scan pour un événement */
export async function prefetchEventScanBundle(
  eventCode: string,
  terminalCode: string,
): Promise<EventScanBundle> {
  const res = await fetch(
    `/api/events/event-code/${encodeURIComponent(eventCode)}/offline-bundle?terminalCode=${encodeURIComponent(terminalCode)}`,
    { cache: "no-store" },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: string }).error ||
        `Impossible de charger les données (${res.status})`,
    );
  }

  const data = (await res.json()) as OfflineBundleResponse;

  // IMPORTANT: Fusion intelligente des données locales avec le serveur
  // Récupérer les invitations locales pour ne pas perdre les scans offline
  const localInvitations = await getCachedInvitations(data.event.id);
  const localInvitationMap = new Map(
    localInvitations.map((inv) => [inv.id, inv]),
  );

  const invitations = data.invitations.map((inv) => {
    const localInv = localInvitationMap.get(inv.id);
    // Utiliser le scannedCount le plus élevé (local ou serveur)
    // Cela protège contre la perte de scans offline
    const mergedScannedCount = Math.max(
      inv.scannedCount,
      localInv?.scannedCount ?? 0,
    );

    return {
      id: inv.id,
      eventId: inv.eventId,
      label: inv.label,
      peopleCount: inv.peopleCount,
      scannedCount: mergedScannedCount,
      qrCode: inv.qrCode ?? undefined,
      allocations: inv.allocations,
      syncedAt: Date.now(),
    };
  });

  await cacheInvitationsForScan(invitations, data.event.id);
  await cacheTables(data.tables);

  const bundle: EventScanBundle = {
    eventCode: data.event.eventCode,
    eventId: data.event.id,
    eventName: data.event.name,
    terminalCode: data.terminal.code,
    terminalId: data.terminal.id,
    terminalName: data.terminal.name,
    invitationCount: invitations.length,
    syncedAt: Date.now(),
  };

  await saveScanBundle(bundle);

  await saveTerminalSession({
    eventCode,
    terminalCode,
    eventName: data.event.name,
    terminalName: data.terminal.name,
    validatedAt: Date.now(),
  });

  return bundle;
}

/** Traite un scan localement (hors-ligne) */
export async function processOfflineScan(
  eventCode: string,
  qr: string,
  terminalCode: string,
): Promise<OfflineScanResult> {
  const bundle = await getScanBundle(eventCode);
  const clientId = crypto.randomUUID();

  if (!bundle) {
    await recordOfflineAttempt({
      id: clientId,
      eventCode,
      terminalCode,
      kind: "log",
      qr,
      status: "ERROR",
      errorMessage: "Données hors-ligne indisponibles. Cache événement absent.",
    });
    return {
      error:
        "Données hors-ligne indisponibles. Connectez-vous une fois pour précharger l'événement.",
      offline: true,
      queued: true,
    };
  }

  if (bundle.terminalCode !== terminalCode) {
    await recordOfflineAttempt({
      id: clientId,
      eventCode,
      terminalCode,
      kind: "log",
      qr,
      status: "ERROR",
      errorMessage: "Terminal non reconnu pour cet evenement",
    });
    return {
      error: "Terminal non reconnu pour cet événement.",
      offline: true,
      queued: true,
    };
  }

  const inv = await findInvitation(qr, bundle.eventId);

  if (!inv) {
    await recordOfflineAttempt({
      id: clientId,
      eventCode,
      terminalCode,
      kind: "log",
      qr,
      status: "ERROR",
      errorMessage: "Invitation introuvable dans le cache local",
    });
    return {
      error: "Invitation introuvable dans le cache local.",
      offline: true,
      queued: true,
    };
  }

  if (inv.scannedCount >= inv.peopleCount) {
    const tables = resolveAssignedTable(inv, inv.scannedCount - 1);
    await recordOfflineAttempt({
      id: clientId,
      eventCode,
      terminalCode,
      kind: "log",
      qr,
      guestName: inv.label,
      status: "ERROR",
      errorMessage: "Capacité atteinte",
      invitationId: inv.id,
      assignedTable: tables,
    });
    return {
      error: "Capacité atteinte",
      label: inv.label,
      scannedCount: inv.scannedCount,
      peopleCount: inv.peopleCount,
      assignedTable: tables,
      offline: true,
      queued: true,
    };
  }

  const assignedTable = resolveAssignedTable(inv, inv.scannedCount);
  const newCount = inv.scannedCount + 1;

  await updateCachedInvitationScan(inv.id, newCount);

  await recordOfflineAttempt({
    id: clientId,
    eventCode,
    terminalCode,
    kind: "entry",
    qr,
    guestName: inv.label,
    status: "SUCCESS",
    invitationId: inv.id,
    assignedTable,
  });

  return {
    id: inv.id,
    label: inv.label,
    assignedTable,
    scannedCount: newCount,
    peopleCount: inv.peopleCount,
    offline: true,
    queued: true,
  };
}

/** Scan hybride : hors-ligne d'abord (instantané), fallback réseau si non synchronisé */
export async function processHybridScan(
  eventCode: string,
  qr: string,
  terminalCode: string,
  isOnline: boolean,
): Promise<OfflineScanResult> {
  const bundle = await getScanBundle(eventCode);

  // Si le cache est présent, on valide en local immédiatement (Offline-First)
  // La fonction processOfflineScan ajoute le log en base locale
  // et retourne queued: true pour déclencher la synchronisation.
  if (bundle) {
    return processOfflineScan(eventCode, qr, terminalCode);
  }

  // Fallback si on a aucun cache (par exemple première connexion)
  if (isOnline) {
    try {
      const res = await fetch(
        `/api/events/event-code/${encodeURIComponent(eventCode)}/scan`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ qr, terminalCode }),
        },
      );

      const data = await res.json();

      if (res.ok) {
        dispatchScanCompleted();
        return {
          id: data.id,
          label: data.label,
          assignedTable: data.assignedTable,
          scannedCount: data.scannedCount,
          peopleCount: data.peopleCount,
          offline: false,
        };
      }

      dispatchScanCompleted();
      return {
        error: data.error || "Scan refusé",
        label: data.invitation?.label,
        scannedCount: data.invitation?.scannedCount,
        peopleCount: data.invitation?.peopleCount,
        assignedTable: data.invitation?.assignedTable,
        offline: false,
      };
    } catch {
      // Réseau instable et pas de bundle : on laisse le offline_scan remonter l'erreur "bundle manquant"
      return processOfflineScan(eventCode, qr, terminalCode);
    }
  }

  return processOfflineScan(eventCode, qr, terminalCode);
}

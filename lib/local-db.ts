/**
 * Base de données locale IndexedDB (Dexie) pour le mode offline-first.
 */

import Dexie, { type Table } from "dexie";

export interface TableAllocationCache {
  tableId: number;
  tableName: string;
  seatsAssigned: number;
}

export interface CachedInvitation {
  id: number;
  eventId: number;
  label: string;
  email?: string;
  whatsapp?: string;
  peopleCount: number;
  scannedCount: number;
  qrCode?: string;
  allocations: TableAllocationCache[];
  syncedAt: number;
}

export interface CachedEvent {
  id: number;
  name: string;
  description: string;
  date: string;
  location: string;
  fullLocation?: string;
  status: string;
  eventCode: string;
  createdAt: string;
  syncedAt: number;
}

export interface CachedUser {
  id: string;
  email: string;
  name?: string;
  role: string;
  isActive: boolean;
  syncedAt: number;
}

export interface CachedTable {
  id: number;
  eventId: number;
  name: string;
  capacity: number;
  syncedAt: number;
}

/** Métadonnées du terminal actif + bundle de scan pour un événement */
export interface EventScanBundle {
  eventCode: string;
  eventId: number;
  eventName: string;
  terminalCode: string;
  terminalId: number;
  terminalName: string;
  invitationCount: number;
  syncedAt: number;
}

/** Scan effectué hors-ligne, en attente de synchronisation serveur */
export interface PendingScan {
  id: string;
  eventCode: string;
  kind: "entry" | "log";
  scanStatus: "SUCCESS" | "ERROR";
  qr?: string;
  terminalCode: string;
  guestName?: string;
  errorMessage?: string;
  invitationId?: number;
  assignedTable?: string;
  scannedAt: number;
  status: "pending" | "syncing" | "synced" | "failed";
  retries: number;
  lastError?: string;
  /** Résultat affiché à l'opérateur (succès ou erreur locale) */
  resultSnapshot?: {
    ok: boolean;
    label?: string;
    assignedTable?: string;
    scannedCount?: number;
    peopleCount?: number;
    error?: string;
  };
}

export interface TerminalSession {
  eventCode: string;
  terminalCode: string;
  eventName: string;
  terminalName: string;
  validatedAt: number;
}

/** Journal local (scans offline ou en attente de sync) */
export interface LocalScanLog {
  id: string;
  eventCode: string;
  terminalCode: string;
  terminalName?: string;
  invitationId?: number;
  guestName?: string;
  status: "SUCCESS" | "ERROR";
  errorMessage?: string;
  scannedAt: number;
  synced: boolean;
}

export class YambiPassDB extends Dexie {
  events!: Table<CachedEvent, number>;
  invitations!: Table<CachedInvitation, number>;
  users!: Table<CachedUser, string>;
  eventTables!: Table<CachedTable, number>;
  scanBundles!: Table<EventScanBundle, string>;
  pendingScans!: Table<PendingScan, string>;
  terminalSessions!: Table<TerminalSession, string>;
  localScanLogs!: Table<LocalScanLog, string>;

  constructor() {
    super("yambipass-local-db");

    this.version(1).stores({
      events: "id, eventCode, syncedAt",
      invitations: "id, eventId, label",
      users: "id, email",
      eventTables: "id, eventId",
    });

    this.version(2).stores({
      events: "id, eventCode, syncedAt",
      invitations: "id, eventId, label, qrCode",
      users: "id, email",
      eventTables: "id, eventId",
      scanBundles: "eventCode, syncedAt",
      pendingScans: "id, eventCode, status, scannedAt",
      terminalSessions: "eventCode",
    });

    this.version(3).stores({
      events: "id, eventCode, syncedAt",
      invitations: "id, eventId, label, qrCode",
      users: "id, email",
      eventTables: "id, eventId",
      scanBundles: "eventCode, syncedAt",
      pendingScans: "id, eventCode, status, scannedAt",
      terminalSessions: "eventCode",
      localScanLogs: "id, eventCode, scannedAt, synced",
    });

    this.version(4).stores({
      events: "id, eventCode, syncedAt",
      invitations: "id, eventId, label, qrCode",
      users: "id, email",
      eventTables: "id, eventId",
      scanBundles: "eventCode, syncedAt",
      pendingScans: "id, eventCode, status, scannedAt, kind, scanStatus",
      terminalSessions: "eventCode",
      localScanLogs: "id, eventCode, scannedAt, synced",
    });
  }
}

export const db = new YambiPassDB();

// ============================================
// SCAN BUNDLE & SESSION
// ============================================

export async function saveScanBundle(bundle: Omit<EventScanBundle, "syncedAt">) {
  await db.scanBundles.put({
    ...bundle,
    syncedAt: Date.now(),
  });
}

export async function getScanBundle(
  eventCode: string,
): Promise<EventScanBundle | undefined> {
  return db.scanBundles.get(eventCode);
}

export async function saveTerminalSession(session: TerminalSession) {
  await db.terminalSessions.put(session);
}

export async function getTerminalSession(
  eventCode: string,
): Promise<TerminalSession | undefined> {
  return db.terminalSessions.get(eventCode);
}

// ============================================
// INVITATIONS (scan cache)
// ============================================

export async function cacheInvitationsForScan(
  invitations: CachedInvitation[],
  eventId: number,
) {
  const timestamp = Date.now();
  await db.transaction("rw", db.invitations, async () => {
    await db.invitations.where("eventId").equals(eventId).delete();
    await db.invitations.bulkPut(
      invitations.map((i) => ({ ...i, syncedAt: timestamp })),
    );
  });
}

export async function getCachedInvitationByQr(
  qr: string,
): Promise<CachedInvitation | undefined> {
  const byQr = await db.invitations.where("qrCode").equals(qr).first();
  if (byQr) return byQr;
  return undefined;
}

export async function getCachedInvitationById(
  id: number,
): Promise<CachedInvitation | undefined> {
  return db.invitations.get(id);
}

export async function updateCachedInvitationScan(
  id: number,
  scannedCount: number,
) {
  return db.invitations.update(id, { scannedCount, syncedAt: Date.now() });
}

export async function getCachedInvitations(eventId?: number) {
  if (eventId) {
    return db.invitations.where("eventId").equals(eventId).toArray();
  }
  return db.invitations.toArray();
}

// ============================================
// PENDING SCANS
// ============================================

export async function addPendingScan(
  scan: Omit<PendingScan, "status" | "retries">,
) {
  await db.pendingScans.put({
    ...scan,
    status: "pending",
    retries: 0,
  });
}

export async function getPendingScans(eventCode?: string) {
  const isPending = (s: PendingScan) =>
    s.status === "pending" || s.status === "failed";

  if (eventCode) {
    return db.pendingScans
      .where("eventCode")
      .equals(eventCode)
      .filter(isPending)
      .toArray();
  }
  return db.pendingScans.filter(isPending).toArray();
}

export async function getPendingScanCount(eventCode?: string) {
  const list = await getPendingScans(eventCode);
  return list.length;
}

export async function updatePendingScan(
  id: string,
  updates: Partial<PendingScan>,
) {
  return db.pendingScans.update(id, updates);
}

export async function removePendingScan(id: string) {
  return db.pendingScans.delete(id);
}

// ============================================
// LOCAL SCAN LOGS (historique hors-ligne)
// ============================================

export async function addLocalScanLog(log: LocalScanLog) {
  return db.localScanLogs.put(log);
}

export async function getLocalScanLogs(eventCode: string) {
  const logs = await db.localScanLogs
    .where("eventCode")
    .equals(eventCode)
    .toArray();

  return logs.sort((a, b) => b.scannedAt - a.scannedAt);
}

export async function markLocalScanLogsSynced(ids: string[]) {
  await db.localScanLogs.where("id").anyOf(ids).modify({ synced: true });
}

export async function removeSyncedLocalScanLogs(eventCode: string) {
  await db.localScanLogs
    .where("eventCode")
    .equals(eventCode)
    .and((l) => l.synced)
    .delete();
}

// ============================================
// EVENTS / USERS / TABLES (admin cache)
// ============================================

export async function cacheEvents(events: CachedEvent[]) {
  const timestamp = Date.now();
  await db.events.bulkPut(events.map((e) => ({ ...e, syncedAt: timestamp })));
}

export async function getCachedEvents() {
  return db.events.toArray();
}

export async function cacheUsers(users: CachedUser[]) {
  const timestamp = Date.now();
  await db.users.bulkPut(users.map((u) => ({ ...u, syncedAt: timestamp })));
}

export async function getCachedUsers() {
  return db.users.toArray();
}

export async function cacheTables(tables: CachedTable[]) {
  const timestamp = Date.now();
  await db.eventTables.bulkPut(
    tables.map((t) => ({ ...t, syncedAt: timestamp })),
  );
}

export async function getCachedTables(eventId?: number) {
  if (eventId) {
    return db.eventTables.where("eventId").equals(eventId).toArray();
  }
  return db.eventTables.toArray();
}

// ============================================
// UTILS
// ============================================

export async function getCacheStats() {
  return {
    events: await db.events.count(),
    invitations: await db.invitations.count(),
    users: await db.users.count(),
    tables: await db.eventTables.count(),
    pendingScans: await db.pendingScans.count(),
    scanBundles: await db.scanBundles.count(),
  };
}

export async function clearEventScanCache(eventId: number, eventCode: string) {
  await Promise.all([
    db.invitations.where("eventId").equals(eventId).delete(),
    db.scanBundles.delete(eventCode),
    db.pendingScans.where("eventCode").equals(eventCode).delete(),
  ]);
}

export async function clearAllCache() {
  await Promise.all([
    db.events.clear(),
    db.invitations.clear(),
    db.users.clear(),
    db.eventTables.clear(),
    db.scanBundles.clear(),
    db.pendingScans.clear(),
    db.terminalSessions.clear(),
    db.localScanLogs.clear(),
  ]);
}

export async function isCacheAvailable(): Promise<boolean> {
  try {
    const estimate = await navigator.storage.estimate();
    return estimate.quota ? (estimate.usage ?? 0) / estimate.quota < 0.9 : true;
  } catch {
    return true;
  }
}

import { Event2, Invitation, Table } from "@/types/types";
import {
  cacheEvents,
  cacheInvitationsForScan,
  cacheTables,
  getCachedInvitations,
  getCachedTables,
  getScanBundle,
  type CachedInvitation,
} from "@/lib/local-db";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ------------------- UTIL -------------------
const fetcher = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

function cachedInvitationToInvitation(inv: CachedInvitation): Invitation {
  return {
    id: inv.id,
    label: inv.label,
    email: inv.email,
    whatsapp: inv.whatsapp,
    isSentEmail: false,
    isSentWhatsapp: false,
    peopleCount: inv.peopleCount,
    eventId: inv.eventId,
    event: {} as Event2,
    qrCode: inv.qrCode || "",
    table: inv.allocations[0]?.tableName || "",
    scannedCount: inv.scannedCount,
    createdAt: "",
    updatedAt: "",
    userId: null,
    allocations: inv.allocations.map((allocation, index) => ({
      id: inv.id * 1000 + index,
      invitationId: inv.id,
      tableId: allocation.tableId,
      seatsAssigned: allocation.seatsAssigned,
      createdAt: "",
      updatedAt: "",
      table: {
        id: allocation.tableId,
        name: allocation.tableName,
        capacity: allocation.seatsAssigned,
        eventId: inv.eventId,
        createdAt: "",
        updatedAt: "",
      },
    })),
  };
}

function invitationToCached(inv: Invitation): CachedInvitation {
  return {
    id: inv.id,
    eventId: inv.eventId,
    label: inv.label,
    email: inv.email,
    whatsapp: inv.whatsapp,
    peopleCount: inv.peopleCount,
    scannedCount: inv.scannedCount,
    qrCode: inv.qrCode,
    allocations:
      inv.allocations?.map((allocation) => ({
        tableId: allocation.tableId,
        tableName: allocation.table?.name || "",
        seatsAssigned: allocation.seatsAssigned,
      })) || [],
    syncedAt: Date.now(),
  };
}

async function getCachedInvitationsByEventCode(eventCode: string) {
  const bundle = await getScanBundle(eventCode);
  if (!bundle) return [];
  const cached = await getCachedInvitations(bundle.eventId);
  return cached.map(cachedInvitationToInvitation);
}

async function getCachedTablesByEventCode(eventCode: string) {
  const bundle = await getScanBundle(eventCode);
  if (!bundle) return [];
  const cached = await getCachedTables(bundle.eventId);
  return cached.map((table) => ({
    ...table,
    createdAt: "",
    updatedAt: "",
  })) as Table[];
}

// ------------------- QUERY KEYS -------------------
export const EVENT_KEYS = {
  all: ["events"] as const,
  one: (id: number) => ["event", id] as const,
  oneByEventCode: (eventCode: string) => ["event-code", eventCode] as const,
  stats: (id: number) => ["event", id, "stats"] as const,
  invitations: (id: number) => ["event", id, "invitations"] as const,
  eventByEventCode: (eventCode: string) =>
    ["event", eventCode, "invitations"] as const,
  invitation: (id: number, invId: number) =>
    ["event", id, "invitation", invId] as const,
  tables: (id: number) => ["event", id, "tables"] as const,
  tablesByEventCode: (eventCode: string) =>
    ["event", eventCode, "tables"] as const,
  table: (id: number, tableId: number) =>
    ["event", id, "table", tableId] as const,
  history: (eventCode: string) => [eventCode, "history"] as const,
  historyEventId: (eventId: number) => [eventId, "history"] as const,
};

// ===================================================================
// 🟦 EVENTS ROOT
// ===================================================================

// GET all
export function useEvents() {
  return useQuery({
    queryKey: EVENT_KEYS.all,
    queryFn: () => fetcher("/api/events"),
  });
}

// POST create
export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Event2) =>
      fetcher("/api/events", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: EVENT_KEYS.all }),
  });
}

// GET single event
export function useEvent(eventId: number) {
  return useQuery({
    queryKey: EVENT_KEYS.one(eventId),
    queryFn: () => fetcher(`/api/events/${eventId}`),
    enabled: !!eventId,
  });
}

// GET By EventCode
export function useEventByEventCode(eventCode: string) {
  return useQuery({
    queryKey: EVENT_KEYS.oneByEventCode(eventCode),
    queryFn: async () => {
      try {
        const event = await fetcher<Event2>(`/api/events/event-code/${eventCode}`);
        await cacheEvents([
          {
            id: event.id,
            name: event.name,
            description: event.description,
            date: event.date,
            location: event.location,
            fullLocation: event.fullLocation,
            status: event.status,
            eventCode: event.eventCode,
            createdAt: event.createdAt,
            syncedAt: Date.now(),
          },
        ]);
        return event;
      } catch (error) {
        const bundle = await getScanBundle(eventCode);
        if (bundle) {
          return {
            id: bundle.eventId,
            name: bundle.eventName,
            description: "",
            date: "",
            location: "",
            eventCode: bundle.eventCode,
            status: "ONGOING",
            createdById: "",
            createdAt: "",
            updatedAt: "",
            tables: [],
            invitations: [],
            assignments: [],
            terminals: [],
            durationHours: 24,
            stats: {
              id: 0,
              eventId: bundle.eventId,
              totalInvitations: bundle.invitationCount,
              totalCapacity: 0,
              totalPeople: 0,
              totalScanned: 0,
              totalAssignedSeats: 0,
              availableSeats: 0,
              updatedAt: "",
            },
          } as Event2;
        }
        throw error;
      }
    },
    // enabled: false,
    enabled: !!eventCode,
    retry: false,
  });
}

// PATCH update event
export function useUpdateEvent(eventId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Event2) =>
      fetcher(`/api/events/${eventId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: EVENT_KEYS.one(eventId) });
      qc.invalidateQueries({ queryKey: EVENT_KEYS.invitations(eventId) });
      qc.invalidateQueries({ queryKey: EVENT_KEYS.all });
    },
  });
}

// DELETE event
export function useDeleteEvent(eventId?: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id?: number) => {
      const eventIdToDelete = id || eventId;
      if (!eventIdToDelete) {
        throw new Error("Event ID is required");
      }
      return fetcher(`/api/events/${eventIdToDelete}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: EVENT_KEYS.all }),
  });
}

// ===================================================================
// 🟦 EVENT STATS
// ===================================================================

export function useEventStats(eventId: number) {
  return useQuery({
    queryKey: EVENT_KEYS.stats(eventId),
    queryFn: () => fetcher(`/api/events/${eventId}/stats`),
    enabled: !!eventId,
  });
}

export function useRecomputeEventStats(eventId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      fetcher(`/api/events/${eventId}/stats`, { method: "POST" }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: EVENT_KEYS.stats(eventId) }),
  });
}

// ===================================================================
// 🟩 INVITATIONS
// ===================================================================

// GET all invitations
export function useEventInvitations(eventId: number) {
  return useQuery({
    queryKey: EVENT_KEYS.invitations(eventId),
    queryFn: () => fetcher(`/api/events/${eventId}/invitations`),
  });
}

// GET all invitations by EventCode
export function useEventInvitationsByEventCode(eventCode: string) {
  return useQuery({
    queryKey: EVENT_KEYS.eventByEventCode(eventCode),
    queryFn: async () => {
      try {
        const invitations = await fetcher<Invitation[]>(
          `/api/events/event-code/${eventCode}/invitations`,
        );
        const eventId =
          invitations[0]?.eventId ?? (await getScanBundle(eventCode))?.eventId;
        if (eventId) {
          await cacheInvitationsForScan(
            invitations.map(invitationToCached),
            eventId,
          );
        }
        return invitations;
      } catch (error) {
        const cached = await getCachedInvitationsByEventCode(eventCode);
        if (cached.length > 0) return cached;
        throw error;
      }
    },
    enabled: !!eventCode,
    retry: false,
  });
}

// CREATE invitation
export function useCreateInvitation(eventId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Invitation) =>
      fetcher(`/api/events/${eventId}/invitations`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: EVENT_KEYS.invitations(eventId) });
      qc.invalidateQueries({ queryKey: EVENT_KEYS.one(eventId) });
    },
  });
}

// CREATE MASSIVE INVITATION
export function useCreateInvitations(eventId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (guests: Invitation[]) =>
      fetcher(`/api/events/${eventId}/bulk-guests`, {
        method: "POST",
        body: JSON.stringify({ guests }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: EVENT_KEYS.invitations(eventId) });
      qc.invalidateQueries({ queryKey: EVENT_KEYS.one(eventId) });
    },
  });
}

// GET single invitation
export function useInvitation(eventId: number, invitationId: number) {
  return useQuery({
    queryKey: EVENT_KEYS.invitation(eventId, invitationId),
    queryFn: () =>
      fetcher(`/api/events/${eventId}/invitations/${invitationId}`),
    enabled: !!eventId && !!invitationId,
  });
}

// UPDATE invitation
export function useUpdateInvitation(eventId: number, invitationId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Invitation) =>
      fetcher(`/api/events/${eventId}/invitations/${invitationId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: EVENT_KEYS.invitations(eventId),
      });
      qc.invalidateQueries({
        queryKey: EVENT_KEYS.invitation(eventId, invitationId),
      });
      qc.invalidateQueries({
        queryKey: EVENT_KEYS.one(eventId),
      });
    },
  });
}

// DELETE invitation
export function useDeleteInvitation(eventId: number, invitationId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      fetcher(`/api/events/${eventId}/invitations/${invitationId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: EVENT_KEYS.one(eventId) });
    },
  });
}

// ===================================================================
// 🟪 SCAN / REVERSE SCAN
// ===================================================================

export function useScan(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (qr: string) =>
      fetcher(`/api/events/${eventId}/scan`, {
        method: "POST",
        body: JSON.stringify({ qr }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: EVENT_KEYS.invitations(Number(eventId)),
      });
      qc.invalidateQueries({
        queryKey: EVENT_KEYS.tables(Number(eventId)),
      });
      qc.invalidateQueries({
        queryKey: EVENT_KEYS.historyEventId(Number(eventId)),
      });
    },
  });
}

export function useScanByEventCode(eventCode: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ qr, terminalCode }: { qr: string; terminalCode: string }) =>
      fetcher(`/api/events/event-code/${eventCode}/scan`, {
        method: "POST",
        body: JSON.stringify({ qr, terminalCode }),
      }),
    retry: false,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: EVENT_KEYS.history(eventCode) });
    },
  });
}

export function useReverseScan(eventId: number) {
  return useMutation({
    mutationFn: (qr: string) =>
      fetcher(`/api/events/${eventId}/scan/reverse`, {
        method: "POST",
        body: JSON.stringify({ qr }),
      }),
    retry: false,
  });
}

export function useVerifyQR() {
  return useMutation({
    mutationFn: (qr: string) =>
      fetcher(`/api/events/verify-qr`, {
        method: "POST",
        body: JSON.stringify({ qr }),
      }),
    retry: false,
  });
}

// ===================================================================
// 🟧 TABLES
// ===================================================================

// GET all tables
export function useTables(eventId: number) {
  return useQuery({
    queryKey: EVENT_KEYS.tables(eventId),
    queryFn: () => fetcher(`/api/events/${eventId}/tables`),
    enabled: !!eventId,
  });
}

// GET all tables by EventCode
// tablesByEventCode
export function useTablesByEventCode(eventCode: string) {
  return useQuery({
    queryKey: EVENT_KEYS.tablesByEventCode(eventCode),
    queryFn: async () => {
      try {
        const tables = await fetcher<Table[]>(
          `/api/events/event-code/${eventCode}/tables`,
        );
        await cacheTables(
          tables.map((table) => ({
            id: table.id,
            eventId: table.eventId,
            name: table.name,
            capacity: table.capacity,
            syncedAt: Date.now(),
          })),
        );
        return tables;
      } catch (error) {
        const cached = await getCachedTablesByEventCode(eventCode);
        if (cached.length > 0) return cached;
        throw error;
      }
    },
    enabled: !!eventCode,
    retry: false,
  });
}

// GET one table
export function useTable(eventId: number, tableId: number) {
  return useQuery({
    queryKey: EVENT_KEYS.table(eventId, tableId),
    queryFn: () => fetcher(`/api/events/${eventId}/tables/${tableId}`),
    enabled: !!eventId && !!tableId,
  });
}

// CREATE table
export function useCreateTable(eventId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Table) =>
      fetcher(`/api/events/${eventId}/tables`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: EVENT_KEYS.tables(eventId) });
      qc.invalidateQueries({ queryKey: EVENT_KEYS.one(eventId) });
    },
  });
}

// ALLOCATE GUESTS TO TABLE
export function useUpdateTableAllocation(eventId: number, tableId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { guestIds: number[] }) =>
      fetcher(`/api/events/${eventId}/tables/${tableId}/allocate`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      // On invalide tout ce qui touche aux tables et aux invitations
      qc.invalidateQueries({ queryKey: EVENT_KEYS.table(eventId, tableId) });
      qc.invalidateQueries({ queryKey: EVENT_KEYS.invitations(eventId) });
      qc.invalidateQueries({ queryKey: EVENT_KEYS.one(eventId) });
    },
  });
}

// UPDATE table
export function useUpdateTable(eventId: number, tableId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Table) =>
      fetcher(`/api/events/${eventId}/tables/${tableId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: EVENT_KEYS.tables(eventId),
      });
      qc.invalidateQueries({
        queryKey: EVENT_KEYS.table(eventId, tableId),
      });
      qc.invalidateQueries({
        queryKey: EVENT_KEYS.one(eventId),
      });
    },
  });
}

// DELETE table
export function useDeleteTable(eventId: number, tableId?: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id?: number) => {
      const tableIdToDelete = id || tableId;
      if (!tableIdToDelete) {
        throw new Error("Table ID is required");
      }
      return fetcher(`/api/events/${eventId}/tables/${tableIdToDelete}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: EVENT_KEYS.tables(eventId) });
      qc.invalidateQueries({ queryKey: EVENT_KEYS.one(eventId) });
    },
  });
}

// ===================================================================
// 🟥 ASSIGN
// ===================================================================

export function useAssignInvitation(eventId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { tableId: number; invitationId: number }) =>
      fetcher(`/api/events/${eventId}/assign`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: EVENT_KEYS.tables(eventId),
      });
      qc.invalidateQueries({
        queryKey: EVENT_KEYS.invitations(eventId),
      });
    },
  });
}

// Get Assignments
export function useEventAssignments(eventId: number) {
  return useQuery({
    queryKey: ["event", eventId, "assignments"],
    queryFn: () => fetcher(`/api/events/${eventId}/assign`),
    enabled: !!eventId,
  });
}

// ===================================================================
// 🟥 LOGS
// ===================================================================
// GET all logs

export function useEventHistory(eventCode: string) {
  return useQuery({
    queryKey: [eventCode, "history"],
    queryFn: async () => {
      const res = await fetch(`/api/events/event-code/${eventCode}/history`);
      if (!res.ok) throw new Error("Failed to fetch history");
      return res.json();
    },
    enabled: !!eventCode,
    retry: false,
  });
}

// ===================================================================
// 🟥 TERMINALS
// ===================================================================

export function useCreateTerminal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; eventId: string }) => {
      const res = await fetch("/api/events/terminals", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events-with-terminals"] });
      queryClient.invalidateQueries({ queryKey: ["event"] });
    },
  });
}

export function useEventsWithTerminals() {
  return useQuery({
    queryKey: ["events-with-terminals"],
    queryFn: () => fetch("/api/events/terminals").then((res) => res.json()),
  });
}

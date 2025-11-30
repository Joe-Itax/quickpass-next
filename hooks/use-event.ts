import { Event2, Invitation, Table } from "@/types/types";
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
  table: (id: number, tableId: number) =>
    ["event", id, "table", tableId] as const,
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
    queryFn: () => fetcher(`/api/events/event-code/${eventCode}`),
    enabled: !!eventCode,
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
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: EVENT_KEYS.one(eventId) }),
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
    queryFn: () => fetcher(`/api/events/event-code/${eventCode}/invitations`),
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
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: EVENT_KEYS.invitations(eventId) }),
  });
}

// ===================================================================
// 🟪 SCAN / REVERSE SCAN
// ===================================================================

export function useScan(eventId: string) {
  return useMutation({
    mutationFn: (qr: string) =>
      fetcher(`/api/events/${eventId}/scan`, {
        method: "POST",
        body: JSON.stringify({ qr }),
      }),
  });
}

export function useScanByEventCode(eventCode: string) {
  return useMutation({
    mutationFn: (qr: string) =>
      fetcher(`/api/events/event-code/${eventCode}/scan`, {
        method: "POST",
        body: JSON.stringify({ qr }),
      }),
  });
}

export function useReverseScan(eventId: number) {
  return useMutation({
    mutationFn: (qr: string) =>
      fetcher(`/api/events/${eventId}/scan/reverse`, {
        method: "POST",
        body: JSON.stringify({ qr }),
      }),
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

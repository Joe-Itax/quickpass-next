/**
 * Offline Store - Zustand
 * Gère l'état offline et la synchronisation
 */

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

export interface QueuedOperation {
  id: string;
  type: "CREATE" | "UPDATE" | "DELETE";
  resource: string;
  resourceId: string | number;
  data: Record<string, unknown>;
  timestamp: number;
  retries: number;
  maxRetries: number;
  lastError?: string;
  status: "PENDING" | "SYNCING" | "FAILED" | "SYNCED";
}

export interface OfflineState {
  isOnline: boolean;
  isSyncing: boolean;
  syncProgress: {
    current: number;
    total: number;
    currentOperation?: string;
  };

  // Queue operations
  queue: QueuedOperation[];
  syncErrors: Array<{
    operationId: string;
    error: string;
    timestamp: number;
  }>;

  // Actions
  setOnlineStatus: (online: boolean) => void;
  setSyncStatus: (syncing: boolean) => void;
  setSyncProgress: (progress: {
    current: number;
    total: number;
    currentOperation?: string;
  }) => void;

  // Queue operations
  addToQueue: (operation: Omit<QueuedOperation, "id" | "timestamp">) => void;
  removeFromQueue: (id: string) => void;
  updateQueueItem: (id: string, updates: Partial<QueuedOperation>) => void;
  clearQueue: () => void;
  getQueue: () => QueuedOperation[];

  // Sync errors
  addSyncError: (operationId: string, error: string) => void;
  clearSyncErrors: () => void;

  // Utils
  getQueueStats: () => {
    total: number;
    pending: number;
    failed: number;
    syncing: number;
  };
}

export const useOfflineStore = create<OfflineState>()(
  devtools(
    persist(
      (set, get) => ({
        isOnline: typeof navigator !== "undefined" && navigator.onLine,
        isSyncing: false,
        syncProgress: { current: 0, total: 0 },
        queue: [],
        syncErrors: [],

        setOnlineStatus: (online) => set({ isOnline: online }),
        setSyncStatus: (syncing) => set({ isSyncing: syncing }),
        setSyncProgress: (progress) => set({ syncProgress: progress }),

        addToQueue: (operation) => {
          const id = `${Date.now()}-${Math.random()}`;
          const newOperation: QueuedOperation = {
            ...operation,
            id,
            timestamp: Date.now(),
            retries: 0,
            status: "PENDING",
          };
          set((state) => ({
            queue: [...state.queue, newOperation],
          }));
        },

        removeFromQueue: (id) => {
          set((state) => ({
            queue: state.queue.filter((op) => op.id !== id),
          }));
        },

        updateQueueItem: (id, updates) => {
          set((state) => ({
            queue: state.queue.map((op) =>
              op.id === id ? { ...op, ...updates } : op,
            ),
          }));
        },

        clearQueue: () => set({ queue: [] }),

        getQueue: () => get().queue,

        addSyncError: (operationId, error) => {
          set((state) => ({
            syncErrors: [
              ...state.syncErrors,
              {
                operationId,
                error,
                timestamp: Date.now(),
              },
            ],
          }));
        },

        clearSyncErrors: () => set({ syncErrors: [] }),

        getQueueStats: () => {
          const { queue } = get();
          return {
            total: queue.length,
            pending: queue.filter((q) => q.status === "PENDING").length,
            failed: queue.filter((q) => q.status === "FAILED").length,
            syncing: queue.filter((q) => q.status === "SYNCING").length,
          };
        },
      }),
      {
        name: "offline-store",
        version: 1,
        skipHydration: false,
      },
    ),
  ),
);

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase-client";

interface RealtimeSyncProps {
  eventId?: number;
  eventCode?: string;
  onUpdate: () => void;
}

/**
 * Écoute Supabase Realtime. Un seul channel par montage, tous les listeners
 * enregistrés AVANT subscribe() (requis par supabase-js v2).
 */
export function useRealtimeSync({
  eventId,
  eventCode,
  onUpdate,
}: RealtimeSyncProps) {
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (!eventId && !eventCode) {
      console.error(
        "useRealtimeSync: fournir 'eventId' ou 'eventCode'.",
      );
      return;
    }

    const channelName = `sync-${eventId ?? eventCode}-${Math.random().toString(36).slice(2, 9)}`;

    const trigger = () => onUpdateRef.current();

    let channel = supabase.channel(channelName);

    if (eventId) {
      const tables = [
        "Invitation",
        "Table",
        "EventStats",
        "ScanLog",
        "Terminal",
        "WhatsappQueue",
      ] as const;

      for (const table of tables) {
        channel = channel.on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table,
            filter: `eventId=eq.${eventId}`,
          },
          trigger,
        );
      }

      channel = channel.on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "Event",
          filter: `id=eq.${eventId}`,
        },
        trigger,
      );
    } else if (eventCode) {
      channel = channel
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "ScanLog",
            filter: `eventCode=eq.${eventCode}`,
          },
          trigger,
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "Event",
            filter: `eventCode=eq.${eventCode}`,
          },
          trigger,
        );
    }

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, eventCode]);
}

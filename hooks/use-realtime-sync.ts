import { useEffect } from "react";
import { supabase } from "@/lib/supabase-client";

interface RealtimeSyncProps {
  eventId?: number;
  eventCode?: string;
  onUpdate: () => void;
}

export function useRealtimeSync({
  eventId,
  eventCode,
  onUpdate,
}: RealtimeSyncProps) {
  useEffect(() => {
    if (!eventId && !eventCode) {
      console.error(
        "useRealtimeSync error: You must provide either 'eventId' or 'eventCode'.",
      );
      return;
    }

    const channelName = `sync-${eventId || eventCode}`;
    const channel = supabase.channel(channelName);

    if (eventId) {
      // MODE ADMIN : On écoute tout via l'ID
      const tables = [
        "Invitation",
        "Table",
        "EventStats",
        "ScanLog",
        "Terminal",
      ];
      tables.forEach((table) => {
        channel.on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: table,
            filter: `eventId=eq.${eventId}`,
          },
          onUpdate,
        );
      });

      channel.on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "Event",
          filter: `id=eq.${eventId}`,
        },
        onUpdate,
      );
    } else if (eventCode) {
      // MODE PORTAIL : On écoute via le Code
      // On écoute ScanLog car il a la colonne eventCode
      channel.on(
        "postgres_changes",
        {
          event: "INSERT", // Un scan génère un nouveau log
          schema: "public",
          table: "ScanLog",
          filter: `eventCode=eq.${eventCode}`,
        },
        () => {
          console.log("[REALTIME] Nouveau scan détecté via ScanLog");
          onUpdate();
        },
      );

      // On écoute l'Event lui-même pour les changements de statut
      channel.on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "Event",
          filter: `eventCode=eq.${eventCode}`,
        },
        () => {
          console.log("[REALTIME] Changement de statut de l'event");
          onUpdate();
        },
      );
    }

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, eventCode, onUpdate]);
}

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase-client";

export function useRealtimeList(onUpdate: () => void) {
  const callbackRef = useRef(onUpdate);

  useEffect(() => {
    callbackRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    const channelName = `events-realtime-${Math.random().toString(36).substring(7)}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "Event" },
        () => {
          console.log("[REALTIME] Update triggered");
          callbackRef.current(); // On appelle la ref
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // Dépendances vides : on ne s'abonne qu'UNE SEULE FOIS au montage
}

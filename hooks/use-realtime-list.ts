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
          console.log("[REALTIME] Event update triggered");
          callbackRef.current();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "Terminal" },
        () => {
          console.log("[REALTIME] Terminal update triggered");
          callbackRef.current();
        },
      )
      .subscribe();

    // Ping local de secours (toutes les 3s)
    const pollInterval = setInterval(() => {
      callbackRef.current();
    }, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, []); // Dépendances vides : on ne s'abonne qu'UNE SEULE FOIS au montage
}

import { useEffect } from "react";
import { supabase } from "@/lib/supabase-client";

export function useRealtimeList(onUpdate: () => void) {
  useEffect(() => {
    // On crée un canal global pour la liste
    const channel = supabase
      .channel("global-events-changes")
      .on(
        "postgres_changes",
        {
          event: "*", // INSERT (nouvel event), UPDATE (statut), DELETE
          schema: "public",
          table: "Event",
        },
        () => {
          console.log(
            "[REALTIME] Changement détecté dans la liste des événements",
          );
          onUpdate();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onUpdate]);
}

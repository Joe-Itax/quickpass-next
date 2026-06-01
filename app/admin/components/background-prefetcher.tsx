"use client";

import { useEffect } from "react";
import { Event2 } from "@/types/types";

type WindowWithIdleCallback = Window & {
  requestIdleCallback?: (callback: () => void) => number;
};

export default function BackgroundPrefetcher({ events }: { events: Event2[] }) {
  useEffect(() => {
    // Ne s'exécute que sur le client
    if (typeof window === "undefined") return;
    if (!("caches" in window)) return;

    const urlsToPrefetch = events.flatMap((event) => [
      `/admin/events/${event.id}`,
      `/admin/events/${event.id}/tables`,
    ]);

    // On utilise requestIdleCallback pour ne pas ralentir le thread principal
    const idleCallback =
      (window as WindowWithIdleCallback).requestIdleCallback ??
      ((callback: () => void) => window.setTimeout(callback, 1));

    idleCallback(() => {
      urlsToPrefetch.forEach((url) => {
        // On vérifie d'abord si l'URL est déjà dans le cache v3
        caches.open("yambipass-v3").then((cache) => {
          cache.match(url).then((response) => {
            if (!response) {
              // Si pas dans le cache, on déclenche le fetch silently
              // Le Service Worker (cacheFirst) interceptera et mettra en cache
              fetch(url, {
                priority: "low",
              } as RequestInit & { priority: "low" }).catch(() => {});
            }
          });
        });
      });
    });
  }, [events]);

  return null; // Ne rend rien
}

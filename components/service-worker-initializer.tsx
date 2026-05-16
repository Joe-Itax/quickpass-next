"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/sw-registration";

export function ServiceWorkerInitializer() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return null;
}

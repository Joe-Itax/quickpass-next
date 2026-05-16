"use client";

import { useEffect, useState, useCallback, useReducer } from "react";
import { useOfflineStore } from "@/lib/offline-store";

const HEALTH_CHECK_INTERVAL = 30000;

async function pingServer(): Promise<boolean> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch("/api/health", {
      method: "HEAD",
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

export function useOffline() {
  const { isOnline, setOnlineStatus } = useOfflineStore();

  useEffect(() => {
    const check = async () => {
      const online = await pingServer();
      setOnlineStatus(online);
      return online;
    };

    const handleOnline = () => {
      check().then((ok) => {
        if (ok) window.dispatchEvent(new CustomEvent("force-sync"));
      });
    };

    const handleOffline = () => setOnlineStatus(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    check();
    const interval = setInterval(check, HEALTH_CHECK_INTERVAL);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, [setOnlineStatus]);

  return { isOnline };
}

export function useIsOnline(defaultValue = true): boolean {
  const { isOnline } = useOffline();

  const [mounted, forceMount] = useReducer(() => true, false);
  useEffect(() => {
    forceMount();
  }, []);

  if (!mounted) {
    return typeof navigator !== "undefined" ? navigator.onLine : defaultValue;
  }

  return isOnline;
}

export function useConnectivityCheck() {
  const [checking, setChecking] = useState(false);

  const check = useCallback(async () => {
    setChecking(true);
    const ok = await pingServer();
    setChecking(false);
    return ok;
  }, []);

  return { checking, check };
}

/**
 * Enregistrement du Service Worker
 */

export async function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    });

    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener("statechange", () => {
        if (
          newWorker.state === "installed" &&
          navigator.serviceWorker.controller
        ) {
          window.dispatchEvent(
            new CustomEvent("sw-update-available", {
              detail: { registration },
            }),
          );
        }
      });
    });

    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data?.type === "SYNC_COMPLETED") {
        window.dispatchEvent(new CustomEvent("force-sync"));
      }
    });

    return registration;
  } catch (err) {
    console.error("[SW] Registration failed:", err);
    return null;
  }
}

export async function unregisterServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((r) => r.unregister()));
}

export async function skipWaitingServiceWorker() {
  const registrations = await navigator.serviceWorker.getRegistrations();
  registrations.forEach((registration) => {
    registration.waiting?.postMessage({ type: "SKIP_WAITING" });
  });
}

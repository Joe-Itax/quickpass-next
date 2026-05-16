const CACHE_VERSION = "lokapass-v2";
const URLS_TO_CACHE = [
  "/",
  "/offline.html",
  "/logo-app/icon-192.png",
  "/logo-app/icon-512.png",
  "/scan-portail",
];

// ----- INSTALL -----
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_VERSION);
      await Promise.allSettled(
        URLS_TO_CACHE.map((url) => cache.add(url).catch(() => undefined)),
      );
      self.skipWaiting();
    })(),
  );
});

// ----- ACTIVATE -----
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_VERSION)
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

// ----- FETCH -----
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Ne pas intercepter les API de scan/sync (gérées par l'app)
  if (
    url.pathname.startsWith("/api/events/") &&
    (url.pathname.includes("/scan") ||
      url.pathname.includes("/offline-bundle") ||
      url.pathname.startsWith("/api/sync/"))
  ) {
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirstApi(request));
    return;
  }

  if (/\.(js|css|png|jpg|jpeg|gif|svg|ico|webp|woff2?)$/i.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(staleWhileRevalidatePage(request));
    return;
  }

  event.respondWith(cacheFirst(request));
});

async function networkFirstApi(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_VERSION);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return (
      cached ||
      new Response(JSON.stringify({ error: "Offline" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      })
    );
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_VERSION);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("", { status: 503 });
  }
}

async function staleWhileRevalidatePage(request) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(async () => {
      const offline = await caches.match("/offline.html");
      return offline || new Response("Hors-ligne", { status: 503 });
    });

  return cached || networkPromise;
}

// ----- BACKGROUND SYNC -----
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-scans") {
    event.waitUntil(notifyClientsToSync());
  }
});

async function notifyClientsToSync() {
  const clients = await self.clients.matchAll({ type: "window" });
  clients.forEach((client) => {
    client.postMessage({ type: "SYNC_COMPLETED", success: true });
  });
}

// ----- MESSAGES -----
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  if (event.data?.type === "CLEAR_CACHE") {
    event.waitUntil(
      caches.delete(CACHE_VERSION).then(() => {
        event.ports[0]?.postMessage({ success: true });
      }),
    );
  }
});

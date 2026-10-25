// Service worker: offline app shell (ARCHITECTURE.md, section 2.9)
// Bump the version only when a change here requires clearing old caches.
const CACHE_NAME = "joke-machine-v1";

const PRECACHE_URLS = [
  "/",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png",
];

// Hashed build files, icons and the manifest never change under the same URL
function isStaticAsset(url) {
  return (
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/_next/static/") ||
      url.pathname.startsWith("/icons/") ||
      url.pathname === "/manifest.webmanifest")
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // API requests always go straight to the network and are never cached
  if (url.pathname.startsWith("/api/")) return;

  // Navigation: network-first, falling back to the cached single screen
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put("/", copy));
          }
          return response;
        })
        .catch((error) =>
          caches.match("/").then((cached) => {
            if (cached) return cached;
            throw error;
          }),
        ),
    );
    return;
  }

  // Static assets: cache-first
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
  }
});

// Assets the page loaded before the service worker took control (first visit)
self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || data.type !== "CACHE_URLS" || !Array.isArray(data.urls)) return;

  const urls = data.urls.filter((href) => {
    try {
      return isStaticAsset(new URL(href, self.location.origin));
    } catch {
      return false;
    }
  });

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => Promise.all(urls.map((href) => cache.add(href).catch(() => {})))),
  );
});

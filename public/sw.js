const CACHE_NAME = "readable-books-v1";
const ASSETS = [
  "/",
  "/login",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/books/berani-tidak-disukai.pdf",
  "/books/atomic-habits.pdf",
  "/books/deep-work.pdf",
  "/books/psychology-of-money.pdf",
  "/pdf.worker.min.mjs"
];

// Install Service Worker and cache essential assets
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Service Worker and clean old caches
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch resources
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Ignore non-GET requests and internal browser schemes (like chrome-extension)
  if (e.request.method !== "GET" || !url.protocol.startsWith("http")) {
    return;
  }

  // Network-First for API requests, auth calls, hot-reload connections, Firestore, and Firebase reserved paths
  if (
    url.hostname.includes("firestore.googleapis.com") ||
    url.hostname.includes("identitytoolkit.googleapis.com") ||
    url.hostname.includes("securetoken.googleapis.com") ||
    url.pathname.startsWith("/_next/") ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/__/")
  ) {
    e.respondWith(
      fetch(e.request).catch(() => {
        return caches.match(e.request);
      })
    );
    return;
  }

  // Stale-While-Revalidate (Cache-First + background update) for pages, books, fonts, and icons
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch fresh version in background to update cache
        fetch(e.request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(e.request, networkResponse));
            }
          })
          .catch(() => {
            // Silence background fetch errors (e.g. offline)
          });

        return cachedResponse;
      }

      return fetch(e.request).then((networkResponse) => {
        // Cache new successful GET requests of static contents
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          networkResponse.type === "basic"
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return networkResponse;
      });
    })
  );
});

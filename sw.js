const CACHE_NAME = "coach-rvb-v5";

const ASSETS = [
  "./",
  "./index.html",
  "./menu_principal.html",
  "./style.css",
  "./app.js",
  "./menu_principal.js",
  "./manifest.json",
  "./cbc.png"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  // Ignorar Google Apps Script
  if (event.request.url.includes("script.google.com")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Estrategia Network-First para la página de inicio (rompe la caché definitivamente)
  if (event.request.mode === "navigate" || event.request.url.endsWith("index.html")) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Para el resto de assets: Cache First
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

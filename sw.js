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

// Instalación del Service Worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Archivos almacenados en caché exitosamente");
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activación y limpieza de cachés antiguas
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
    })
  );
  self.clients.claim();
});

// Intercepción de peticiones (Estrategia Network-First para la API)
self.addEventListener("fetch", (event) => {
  // Las llamadas a Google Script se procesan siempre por red
  if (event.request.url.includes("script.google.com")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Para assets locales: Caché primero, con caída a red
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

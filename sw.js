const CACHE_NAME = "coach-rvb-v6";

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

// Instalación: Fuerza el guardado de los nuevos assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activación: Purga CUALQUIER versión antigua de caché al instante
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("Eliminando caché antigua:", key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Intercepción de peticiones
self.addEventListener("fetch", (event) => {
  // 1. Ignorar llamadas a la API de Google Apps Script (Siempre por red)
  if (event.request.url.includes("script.google.com")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 2. Estrategia Network-First para HTML y JS (Prioriza cambios nuevos)
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Guardar copia fresca en caché si la respuesta es válida
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Si no hay conexión a internet, sirve desde la caché
        return caches.match(event.request);
      })
  );
});

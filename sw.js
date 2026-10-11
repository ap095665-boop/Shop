
const CACHE_NAME = "shop-manager-v3";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./shop-data.json",
  "./track.html"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      for (const file of FILES_TO_CACHE) {
        try {
          await cache.add(file);
        } catch (error) {
          console.warn("Could not cache:", file, error);
        }
      }

      await self.skipWaiting();
    })
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Handle only this website.
  if (url.origin !== self.location.origin) return;

  /*
   * VIDEO / RANGE REQUESTS
   * Do not cache partial responses (HTTP 206).
   * Let the browser and server handle video streaming.
   */
  if (
    request.headers.has("Range") ||
    request.headers.has("range")
  ) {
    event.respondWith(fetch(request));
    return;
  }

  /*
   * HTML navigation: network first,
   * cached HTML fallback when offline.
   */
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok && response.status === 200) {
            const copy = response.clone();

            event.waitUntil(
              caches.open(CACHE_NAME)
                .then(cache => cache.put(request, copy))
                .catch(error =>
                  console.warn("Navigation cache failed:", error)
                )
            );
          }

          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;

          const path = new URL(request.url).pathname;

          if (
            path.endsWith("/") ||
            path.endsWith("/index.html")
          ) {
            return caches.match("./index.html");
          }

          if (path.endsWith("/track.html")) {
            return caches.match("./track.html");
          }

          return caches.match("./index.html");
        })
    );

    return;
  }

  /*
   * shop-data.json: network first,
   * cached copy when offline.
   */
  if (url.pathname.endsWith("/shop-data.json")) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok && response.status === 200) {
            const copy = response.clone();

            event.waitUntil(
              caches.open(CACHE_NAME)
                .then(cache =>
                  cache.put("./shop-data.json", copy)
                )
                .catch(error =>
                  console.warn("Shop data cache failed:", error)
                )
            );
          }

          return response;
        })
        .catch(() => caches.match("./shop-data.json"))
    );

    return;
  }

  /*
   * Other complete responses: cache first.
   * Never store HTTP 206 or unsuccessful responses.
   */
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      return fetch(request).then(response => {
        if (response.ok && response.status === 200) {
          const copy = response.clone();

          event.waitUntil(
            caches.open(CACHE_NAME)
              .then(cache => cache.put(request, copy))
              .catch(error =>
                console.warn("Resource cache failed:", error)
              )
          );
        }

        return response;
      });
    })
  );
});

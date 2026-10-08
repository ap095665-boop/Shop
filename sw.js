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
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});


self.addEventListener("fetch", event => {

  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  // Only handle this website.
  if (url.origin !== self.location.origin) {
    return;
  }


  /*
   * HTML navigation
   *
   * Network first:
   * - gets the newest HTML page when online
   * - uses its cached copy when offline
   */
  if (request.mode === "navigate") {

    event.respondWith(
      fetch(request)
        .then(response => {

          if (response.ok) {
            const copy = response.clone();

            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, copy);
            });
          }

          return response;
        })
        .catch(() => {

          return caches.match(request).then(cached => {

            if (cached) {
              return cached;
            }

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
          });

        })
    );

    return;
  }


  /*
   * shop-data.json
   *
   * Network first.
   * Cached copy is used offline.
   */
  if (url.pathname.endsWith("/shop-data.json")) {

    event.respondWith(
      fetch(request)
        .then(response => {

          if (response.ok) {
            const copy = response.clone();

            caches.open(CACHE_NAME).then(cache => {
              cache.put("./shop-data.json", copy);
            });
          }

          return response;
        })
        .catch(() => {
          return caches.match("./shop-data.json");
        })
    );

    return;
  }


  /*
   * Other files
   *
   * Cache first.
   */
  event.respondWith(
    caches.match(request).then(cached => {

      if (cached) {
        return cached;
      }

      return fetch(request).then(response => {

        if (response.ok) {

          const copy = response.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, copy);
          });

        }

        return response;
      });

    })
  );

});

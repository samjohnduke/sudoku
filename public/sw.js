var CACHE_VERSION = "v2";
var STATIC_CACHE = "static-" + CACHE_VERSION;
var DATA_CACHE = "data-" + CACHE_VERSION;

var PRECACHE_URLS = [
  "/",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/apple-touch-icon.png",
];

// Install: precache essential resources + puzzle bank
self.addEventListener("install", function (event) {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(function (cache) {
        return cache.addAll(PRECACHE_URLS);
      }),
      caches.open(DATA_CACHE).then(function (cache) {
        return cache.add("/api/puzzles/all");
      }),
    ]).then(function () {
      return self.skipWaiting();
    })
  );
});

// Activate: clean up old caches and notify clients of update
self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      var hadOldCaches = keys.some(function (key) {
        return key !== STATIC_CACHE && key !== DATA_CACHE;
      });
      return Promise.all(
        keys
          .filter(function (key) {
            return key !== STATIC_CACHE && key !== DATA_CACHE;
          })
          .map(function (key) {
            return caches.delete(key);
          })
      ).then(function () {
        return hadOldCaches;
      });
    }).then(function (hadOldCaches) {
      if (hadOldCaches) {
        self.clients.matchAll().then(function (clients) {
          clients.forEach(function (client) {
            client.postMessage({ type: "SW_UPDATED" });
          });
        });
      }
      return self.clients.claim();
    })
  );
});

// Fetch strategy
self.addEventListener("fetch", function (event) {
  var request = event.request;
  var url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip auth, game-save, settings, and sync API calls (network-only)
  if (
    url.pathname.startsWith("/api/auth") ||
    url.pathname === "/api/game/save" ||
    url.pathname === "/api/settings" ||
    url.pathname === "/api/sync/migrate"
  ) {
    return;
  }

  // Puzzle bank: stale-while-revalidate
  if (url.pathname === "/api/puzzles/all") {
    event.respondWith(
      caches.open(DATA_CACHE).then(function (cache) {
        return cache.match(request).then(function (cached) {
          var fetchPromise = fetch(request)
            .then(function (response) {
              if (response.ok) cache.put(request, response.clone());
              return response;
            })
            .catch(function () {
              return cached;
            });
          return cached || fetchPromise;
        });
      })
    );
    return;
  }

  // Random puzzle API: network-first, offline error triggers client-side fallback
  if (url.pathname === "/api/puzzle/random") {
    event.respondWith(
      fetch(request).catch(function () {
        return new Response(JSON.stringify({ error: "offline" }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        });
      })
    );
    return;
  }

  // Static assets (JS, CSS, fonts, images): cache-first
  if (
    url.pathname.startsWith("/assets/") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".ico") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".webmanifest") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".woff")
  ) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(function (cache) {
        return cache.match(request).then(function (cached) {
          if (cached) return cached;
          return fetch(request).then(function (response) {
            if (response.ok) cache.put(request, response.clone());
            return response;
          });
        });
      })
    );
    return;
  }

  // HTML pages (navigation): network-first, cache fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(function (response) {
          var clone = response.clone();
          caches.open(STATIC_CACHE).then(function (cache) {
            cache.put(request, clone);
          });
          return response;
        })
        .catch(function () {
          return caches.match(request).then(function (cached) {
            return cached || caches.match("/");
          });
        })
    );
    return;
  }

  // Everything else: network-first
  event.respondWith(
    fetch(request).catch(function () {
      return caches.match(request);
    })
  );
});

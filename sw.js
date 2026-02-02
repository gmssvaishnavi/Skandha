const CACHE_NAME = 'kavasam-runtime-v1';
const GITHUB_BASE = 'https://raw.githubusercontent.com/vrsaparna/Kanthan/main/';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Runtime caching for GitHub raw content (network-first, then cache)
  if (req.url.startsWith(GITHUB_BASE)) {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          // cache the successful response
          const copy = networkRes.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
          return networkRes;
        })
        .catch(() => {
          return caches.match(req).then(cached => cached || new Response(null, { status: 503 }));
        })
    );
    return;
  }

  // App shell & other same-origin requests: try cache first, then network
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(req).then(cached => cached || fetch(req).then(networkRes => {
        // populate runtime cache for future offline use
        const copy = networkRes.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        return networkRes;
      }).catch(() => cached))
    );
    return;
  }

  // default: let the browser handle it
});

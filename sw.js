// Budget Tracker service worker
// Bump CACHE_VERSION whenever you ship an update so clients refresh.
const CACHE_VERSION = 'budget-tracker-v2';

// App shell files to precache (relative to this SW's scope: /budget-tracker/)
const PRECACHE_URLS = [
  './',
  './index.html',
  './favicon-32.png',
  './apple-touch-icon.png'
];

// Install: precache the app shell, then activate immediately.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate: remove any old caches that don't match the current version.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_VERSION)
            .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch strategy:
// - Navigations (loading the page): network-first, fall back to cached index.html offline.
// - Other GET requests (icons, etc.): cache-first, fall back to network.
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put('./index.html', copy));
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      return cached || fetch(request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
        return response;
      }).catch(() => cached);
    })
  );
});

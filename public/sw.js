const CACHE_NAME = 'ssi-static-v1';
const API_CACHE = 'ssi-api-v1';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/favicon.ico',
        OFFLINE_URL,
      ]);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Basic fetch handler: cache-first for navigation/static, stale-while-revalidate for API
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  // API requests: stale-while-revalidate
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.open(API_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const networkFetch = fetch(request).then((res) => {
          if (res && res.ok) cache.put(request, res.clone());
          return res;
        }).catch(() => null);
        return cached || networkFetch;
      })
    );
    return;
  }

  // Navigation or static assets: cache first
  event.respondWith(
    caches.match(request).then((resp) => {
      return resp || fetch(request).then((res) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, res.clone());
          return res;
        });
      }).catch(() => caches.match(OFFLINE_URL));
    })
  );
});

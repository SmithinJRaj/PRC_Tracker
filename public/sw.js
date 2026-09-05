const CACHE_NAME = 'tathva-erp-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Ignore non-HTTP traffic (e.g. chrome-extension://)
  if (!event.request.url.startsWith('http')) return;

  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Network First strategy
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Clone the response before returning it since it's a stream
        const responseToCache = networkResponse.clone();
        
        // Don't cache opaque responses or non-success responses
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      })
      .catch(() => {
        // Fallback to cache if network fails
        return caches.match(event.request);
      })
  );
});

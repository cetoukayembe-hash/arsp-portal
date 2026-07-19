const CACHE_NAME = 'arsp-portal-v3';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Network-first: always fetch from network, never cache
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});

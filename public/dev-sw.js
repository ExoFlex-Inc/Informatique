// dev-sw.js
self.addEventListener('install', (event) => {
  console.log('Dev Service Worker installed');
  event.waitUntil(
    caches.open('dev-cache').then((cache) => {
      return cache.addAll([
        '/', // Add assets to cache here
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
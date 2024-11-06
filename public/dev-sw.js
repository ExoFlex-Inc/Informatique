// dev-sw.js
self.addEventListener("install", (event) => {
  console.log("Development Service Worker installed.");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activated.");
  self.clients.claim();
});

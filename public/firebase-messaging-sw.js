// Import Workbox scripts
importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/6.5.3/workbox-sw.js",
);

if (workbox) {
  console.log(`Workbox is loaded`);

  // Register Workbox modules
  workbox.loadModule("workbox-routing");
  workbox.loadModule("workbox-strategies");
  workbox.loadModule("workbox-core");

  // Claim clients immediately after activation
  workbox.core.clientsClaim();
  self.skipWaiting();

  // Define custom cache name and assets to cache
  const customCacheName = 'custom-cache';
  const assetsToCache = [
    '/',
    '/index.html',
    '/assets/exoflex_team.jpg',
    '/assets/logo_only.png',
    '/assets/logo.png',
    '/assets/user.png',
  ];

  // Cache custom assets during service worker installation
  self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open(customCacheName).then((cache) => {
        return cache.addAll(assetsToCache);
      })
    );
  });

  // Access the pre-defined cache names for use in this app
  const data = {
    race: false,
    debug: false,
    credentials: "same-origin",
    networkTimeoutSeconds: 0,
    fallback: "index.html",
  };

  const workboxCacheName = "runtime-cache";

  // Strategy for handling requests
  const buildStrategy = () => {
    if (data.networkTimeoutSeconds > 0) {
      return new workbox.strategies.NetworkFirst({
        cacheName: workboxCacheName,
        networkTimeoutSeconds: data.networkTimeoutSeconds,
      });
    } else {
      return new workbox.strategies.NetworkFirst({ cacheName: workboxCacheName });
    }
  };

  // Retrieve the manifest (fallback if undefined)
  const manifest = self.__WB_MANIFEST || [];
  const manifestURLs = manifest.map(
    (entry) => new URL(entry.url, self.location.href).href,
  );

  // Cache manifest resources during service worker installation
  self.addEventListener("install", (event) => {
    event.waitUntil(
      caches
        .open(workboxCacheName)
        .then((cache) =>
          cache.addAll(
            manifestURLs.map(
              (url) => new Request(url, { credentials: data.credentials }),
            ),
          ),
        ),
    );
  });

  // Activate handler: clear outdated caches
  self.addEventListener("activate", (event) => {
    event.waitUntil(
      caches.open(workboxCacheName).then((cache) => {
        cache.keys().then((keys) => {
          keys.forEach((request) => {
            if (!manifestURLs.includes(request.url) && !assetsToCache.includes(request.url)) {
              cache.delete(request);
            }
          });
        });
      }),
    );
  });

  // Register route for caching based on manifest URLs
  workbox.routing.registerRoute(
    ({ url }) => manifestURLs.includes(url.href),
    buildStrategy(),
  );

  // Set default handler to network only
  workbox.routing.setDefaultHandler(new workbox.strategies.NetworkOnly());

  // Set catch handler to return fallback for documents if offline
  workbox.routing.setCatchHandler(({ event }) => {
    if (event.request.destination === "document") {
      return caches.match(data.fallback).then((response) => {
        return response || Response.error();
      });
    }
    return Response.error();
  });
} else {
  console.log(`Workbox didn't load`);
}

// Firebase
// Import Firebase scripts
importScripts("https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js");
importScripts(
  "https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js",
);

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAQQjCJyLSZBXgBM3D6G5BxqfurfpS_OP4",
  authDomain: "exoflex-46e22.firebaseapp.com",
  projectId: "exoflex-46e22",
  storageBucket: "exoflex-46e22.appspot.com",
  messagingSenderId: "361171602737",
  appId: "1:361171602737:web:8c93faef025bad18bd7410",
  measurementId: "G-R0PPB7W550",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log("Received background message:", payload);
});
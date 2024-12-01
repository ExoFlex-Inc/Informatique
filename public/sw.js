import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";

import { initializeApp } from "firebase/app";
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";

// Precache assets; self.__WB_MANIFEST is injected by Workbox
precacheAndRoute(self.__WB_MANIFEST);

// Clean old caches
cleanupOutdatedCaches();

// Define allowList for navigation requests in development
let allowList;
if (import.meta.env.DEV) {
  allowList = [/^\/$/];
}

// Register Navigation Route to serve index.html for navigation requests
registerRoute(
  new NavigationRoute(createHandlerBoundToURL("index.html"), { allowList }),
);

// Initialize Firebase
const firebaseApp = initializeApp({
  apiKey: "AIzaSyAQQjCJyLSZBXgBM3D6G5BxqfurfpS_OP4",
  authDomain: "exoflex-46e22.firebaseapp.com",
  projectId: "exoflex-46e22",
  storageBucket: "exoflex-46e22.appspot.com",
  messagingSenderId: "361171602737",
  appId: "1:361171602737:web:8c93faef025bad18bd7410",
  measurementId: "G-R0PPB7W550",
});

// Initialize Firebase Messaging
const messaging = getMessaging(firebaseApp);

// Handle background messages via Firebase
onBackgroundMessage(messaging, (payload) => {
  const notificationTitle = payload.notification.title || "Notification";
  const notificationOptions = {
    body: payload.notification.body || "New message",
    icon: payload.notification.icon || "assets/logo_192x192.png",
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click events
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === "/" && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow("/");
      }
    }),
  );
});

// Install event: Skip waiting to activate the new service worker immediately
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

// Activate event: Claim clients to control pages immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

import { initializeApp } from "firebase/app";
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { NetworkFirst, NetworkOnly } from "workbox-strategies";
import { clientsClaim } from "workbox-core";

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
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Handle background messages
onBackgroundMessage(messaging, (payload) => {
  console.log("Received background message:", payload);
  const notificationTitle = payload.notification?.title || "Background Notification";
  const notificationOptions = {
    body: payload.notification?.body,
    icon: payload.notification?.icon,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Claim clients immediately after activation
clientsClaim();
self.skipWaiting();

// Precache static assets
precacheAndRoute([
  { url: "/", revision: null },
  { url: "/index.html", revision: null },
  { url: "/logo.png", revision: null },
]);

// Add custom caching logic
registerRoute(
  ({ request }) => request.destination === "document",
  new NetworkFirst()
);

registerRoute(
  ({ request }) => request.destination === "image",
  new NetworkFirst()
);

// Set default handler to NetworkOnly
registerRoute(() => true, new NetworkOnly());
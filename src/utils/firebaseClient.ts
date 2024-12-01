// firebaseClient.ts

import { initializeApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
  type Messaging,
} from "firebase/messaging";

// Firebase configuration object
const firebaseConfig = {
  apiKey: "AIzaSyAQQjCJyLSZBXgBM3D6G5BxqfurfpS_OP4",
  authDomain: "exoflex-46e22.firebaseapp.com",
  projectId: "exoflex-46e22",
  storageBucket: "exoflex-46e22.appspot.com",
  messagingSenderId: "361171602737",
  appId: "1:361171602737:web:8c93faef025bad18bd7410",
  measurementId: "G-R0PPB7W550",
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firebase Messaging
const messaging: Messaging = getMessaging(app);

/**
 * Function to register a service worker.
 * @returns Promise<ServiceWorkerRegistration>
 */
export const getOrRegisterServiceWorker =
  (): Promise<ServiceWorkerRegistration> => {
    if ("serviceWorker" in navigator) {
      // Determine the service worker file based on the environment
      const swPath =
        import.meta.env.MODE === "production" ? "/sw.js" : "/dev-sw.js?dev-sw";

      // Determine the service worker type based on the environment
      const swType =
        import.meta.env.MODE === "production" ? "classic" : "module";

      return navigator.serviceWorker
        .register(swPath, { type: swType })
        .then((registration) => {
          console.log(
            "Service Worker registered with scope:",
            registration.scope,
          );

          // Wait until the service worker is ready
          return navigator.serviceWorker.ready.then(() => {
            console.log("Service Worker is ready.");
            return registration; // Return the registration once it's ready
          });
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
          throw error; // Propagate the error to be handled by the caller
        });
    } else {
      return Promise.reject(
        new Error("Service workers are not supported in this browser."),
      );
    }
  };

/**
 * Function to get Firebase token for push notifications.
 * @param vapidKey - Your VAPID key for FCM.
 * @param registration - The ServiceWorkerRegistration object.
 * @returns Promise<void>
 */
export const getFirebaseToken = async (
  vapidKey: string,
  registration: ServiceWorkerRegistration,
): Promise<string | null> => {
  try {
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.log("Unable to get permission to notify.");
      return null;
    }

    console.log("Notification permission granted.");

    // Get the registration token
    const currentToken = await getToken(messaging, {
      vapidKey: vapidKey, // Replace with your VAPID key
      serviceWorkerRegistration: registration,
    });

    if (currentToken) {
      console.log("FCM Token:", currentToken);
      // TODO: Send the token to your server and update the UI if necessary
      return currentToken;
    } else {
      console.log(
        "No registration token available. Request permission to generate one.",
      );
      return null;
    }
  } catch (err) {
    console.error(
      "Error occurred while requesting permission or retrieving token.",
      err,
    );
    return null;
  }
};

/**
 * Function to handle foreground messages.
 * @returns Promise<any> - Resolves with the message payload.
 */
export const onForegroundMessage = (): Promise<any> =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });

// Export messaging and Firebase configuration for other uses
export { messaging, app };

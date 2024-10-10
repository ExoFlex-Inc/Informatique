import { initializeApp } from "firebase/app";
import { getMessaging, onMessage } from "firebase/messaging";

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

// Initialize Firebase app client
const app = initializeApp(firebaseConfig);

// Initialize Firebase Messaging
const messaging = getMessaging(app);

export { messaging, onMessage };

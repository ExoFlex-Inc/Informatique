importScripts("https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js");

// Replace with your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAQQjCJyLSZBXgBM3D6G5BxqfurfpS_OP4",
  authDomain: "exoflex-46e22.firebaseapp.com",
  projectId: "exoflex-46e22",
  storageBucket: "exoflex-46e22.appspot.com",
  messagingSenderId: "361171602737",
  appId: "1:361171602737:web:8c93faef025bad18bd7410",
  measurementId: "G-R0PPB7W550"
};


// Initialize Firebase
firebase.initializeApp(firebaseConfig);

console.log("Firebase Messaging SW Initialized");

// Initialize Firebase Messaging
let messaging = null;
try {
  messaging = firebase.messaging.isSupported() ? firebase.messaging() : null;
} catch (err) {
  console.error("Failed to initialize Firebase Messaging:", err);
}

// To display background notifications
if (messaging) {
  messaging.onBackgroundMessage((payload) => {
    console.log("Received background message: ", payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
      body: payload.notification.body,
      icon: payload.notification.image || "/default-icon.png", // Default icon
      data: {
        url: payload.data?.openUrl, // Ensure `openUrl` is set in the payload
      },
    };

    // Show the notification
    self.registration.showNotification(notificationTitle, notificationOptions);
  });
}
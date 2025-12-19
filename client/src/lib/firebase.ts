import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, type Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

let app: ReturnType<typeof initializeApp> | null = null;
let messaging: Messaging | null = null;

export function initializeFirebase() {
  if (!firebaseConfig.apiKey) {
    console.warn("Firebase config not found");
    return null;
  }
  
  if (!app) {
    app = initializeApp(firebaseConfig);
  }
  
  if (!messaging && typeof window !== "undefined" && "Notification" in window) {
    try {
      messaging = getMessaging(app);
    } catch (error) {
      console.warn("Failed to initialize Firebase messaging:", error);
    }
  }
  
  return { app, messaging };
}

export async function requestNotificationPermission(): Promise<string | null> {
  try {
    console.log("Checking notification permission...");
    const currentPermission = Notification.permission;
    console.log("Current permission state:", currentPermission);
    
    if (currentPermission === "denied") {
      console.log("Notifications are blocked by the browser");
      return null;
    }
    
    const permission = await Notification.requestPermission();
    console.log("Permission after request:", permission);
    
    if (permission !== "granted") {
      console.log("Notification permission not granted");
      return null;
    }

    console.log("Initializing Firebase...");
    const firebase = initializeFirebase();
    if (!firebase?.messaging) {
      console.warn("Firebase messaging not available - config may be missing");
      return null;
    }
    console.log("Firebase initialized successfully");

    console.log("Registering service worker...");
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    console.log("Service worker registered:", registration.scope);
    
    console.log("Getting FCM token with VAPID key:", vapidKey ? "present" : "missing");
    const token = await getToken(firebase.messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      console.log("FCM Token obtained successfully");
      return token;
    } else {
      console.log("No registration token available - check VAPID key");
      return null;
    }
  } catch (error) {
    console.error("Error getting FCM token:", error);
    return null;
  }
}

export function onForegroundMessage(callback: (payload: unknown) => void) {
  const firebase = initializeFirebase();
  if (!firebase?.messaging) {
    return () => {};
  }

  return onMessage(firebase.messaging, (payload) => {
    console.log("Foreground message received:", payload);
    callback(payload);
  });
}

export async function disableNotifications(): Promise<void> {
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      if (registration.active?.scriptURL.includes("firebase-messaging-sw.js")) {
        await registration.unregister();
      }
    }
  } catch (error) {
    console.error("Error disabling notifications:", error);
  }
}

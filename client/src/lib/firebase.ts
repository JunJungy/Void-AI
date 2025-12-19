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
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("Notification permission denied");
      return null;
    }

    const firebase = initializeFirebase();
    if (!firebase?.messaging) {
      console.warn("Messaging not available");
      return null;
    }

    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    
    const token = await getToken(firebase.messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      console.log("FCM Token obtained");
      return token;
    } else {
      console.log("No registration token available");
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

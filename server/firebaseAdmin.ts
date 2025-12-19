import * as admin from "firebase-admin";

let firebaseApp: admin.app.App | null = null;

export function initializeFirebaseAdmin(): admin.app.App | null {
  if (firebaseApp) {
    return firebaseApp;
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  
  if (!serviceAccountJson) {
    console.warn("FIREBASE_SERVICE_ACCOUNT_JSON not configured - push notifications disabled");
    return null;
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    
    console.log("Firebase Admin initialized successfully");
    return firebaseApp;
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
    return null;
  }
}

export async function sendPushNotification(
  fcmToken: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<boolean> {
  const app = initializeFirebaseAdmin();
  
  if (!app) {
    console.warn("Firebase Admin not initialized - cannot send notification");
    return false;
  }

  try {
    const message: admin.messaging.Message = {
      token: fcmToken,
      notification: {
        title,
        body,
      },
      webpush: {
        notification: {
          icon: "/pwa-192x192.png",
          badge: "/pwa-192x192.png",
        },
        fcmOptions: {
          link: data?.url || "/library",
        },
      },
      data,
    };

    const response = await admin.messaging().send(message);
    console.log("Push notification sent successfully:", response);
    return true;
  } catch (error: any) {
    console.error("Error sending push notification:", error);
    if (error.code === "messaging/registration-token-not-registered") {
      console.log("Token is invalid or expired - should be cleaned up");
    }
    return false;
  }
}

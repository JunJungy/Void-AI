importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCgFWXsWmGfyhK1_1xZ-HA8flK0h7F9P6w",
  authDomain: "notifier-a7971.firebaseapp.com",
  projectId: "notifier-a7971",
  storageBucket: "notifier-a7971.firebasestorage.app",
  messagingSenderId: "1089940482816",
  appId: "1:1089940482816:web:b0f020aac6f4a2e95a21e5",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload);
  
  const notificationTitle = payload.notification?.title || 'Your track is ready!';
  const notificationOptions = {
    body: payload.notification?.body || 'Your AI-generated music has finished processing.',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: 'void-ai-notification',
    data: payload.data,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/library';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(urlToOpen);
          return;
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

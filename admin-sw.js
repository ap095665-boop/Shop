importScripts(
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyBSjmCORx8kAqY64jkLDpq20wtThqxW0w",
  authDomain: "shopmanager-45fac.firebaseapp.com",
  projectId: "shopmanager-45fac",
  storageBucket: "shopmanager-45fac.firebasestorage.app",
  messagingSenderId: "66583287766",
  appId: "1:66583287766:web:83e892ad557cef52853677"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("[admin-sw] Background message:", payload);

  const notification = payload.notification || {};
  const data = payload.data || {};

  const title =
    notification.title ||
    data.title ||
    "Shop Manager";

  const body =
    notification.body ||
    data.body ||
    "You have a new notification.";

  self.registration.showNotification(title, {
    body,
    icon: "/admin-icon-192.png",
    badge: "/admin-icon-192.png",
    data
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl =
    event.notification?.data?.url ||
    "/admin.html";

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true
    }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.focus();
          return client.navigate(targetUrl);
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

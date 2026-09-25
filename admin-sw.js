importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBSjmCORxkAqYx64jkLDpq20wtThqxW0w",
  authDomain: "shopmanager-45fac.firebaseapp.com",
  projectId: "shopmanager-45fac",
  storageBucket: "shopmanager-45fac.firebasestorage.app",
  messagingSenderId: "66583287766",
  appId: "1:66583287766:web:83e892ad557cef52853677"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notification = payload.notification || {};
  const data = payload.data || {};

  const title =
    notification.title ||
    data.title ||
    "New Shop Order";

  const body =
    notification.body ||
    data.body ||
    "A customer order needs attention.";

  self.registration.showNotification(title, {
    body: body,
    icon: "/admin-icon-192.png",
    badge: "/admin-icon-192.png",
    data: data
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const target =
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

          if ("navigate" in client) {
            return client.navigate(target);
          }

          return client;
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(target);
      }
    })
  );
});

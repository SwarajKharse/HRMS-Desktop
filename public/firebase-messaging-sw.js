importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js");

const firebaseConfig = {
  apiKey: "AIzaSyC2FUKyQJkje46LAaz_t6kMDPlj_ccD8bQ",
  authDomain: "test-fcm-78e8c.firebaseapp.com",
  projectId: "test-fcm-78e8c",
  storageBucket: "test-fcm-78e8c.firebasestorage.app",
  messagingSenderId: "1059883462023",
  appId: "1:1059883462023:web:03650f6e29561610bd3722"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {

  const notificationTitle = payload.notification.title || "Background Notification";
  const notificationOptions = {
    body: payload.notification.body || "You have a new message.",
    icon: payload.notification.image || "/default-icon.png",
    click_action: payload.notification.click_action || "/",
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const clickAction = event.notification.data?.click_action || "/";
  event.waitUntil(clients.openWindow(clickAction));
});
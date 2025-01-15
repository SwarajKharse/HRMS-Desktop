import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyC2FUKyQJkje46LAaz_t6kMDPlj_ccD8bQ",
  authDomain: "test-fcm-78e8c.firebaseapp.com",
  projectId: "test-fcm-78e8c",
  storageBucket: "test-fcm-78e8c.firebasestorage.app",
  messagingSenderId: "1059883462023",
  appId: "1:1059883462023:web:03650f6e29561610bd3722"
};

const vapidKey = "BDGcUl97Ht-3mT09bS2bInQvvrj7Ulz36EX9ImzooM2eVghVRKkfrIFDx2NypCdaTlZucWntmx3dfIl_uq9mX6U";

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const requestFCMToken = async () => {
  return Notification.requestPermission()
  .then(permission => {
    if (permission === "granted") {
      return getToken(messaging, { vapidKey });
    }
    else {
      throw new Error("Notification permission denied");
    }
  })
  .catch(error => {
    console.error("Error requesting FCM token:", error);
    throw error;
  });
};

export const listenToNotifications = (onNotification) => {
  onMessage(messaging, (payload) => {
    console.log("Message received:", payload);
    if (onNotification) {
      onNotification(payload.notification);
    }
  });
};

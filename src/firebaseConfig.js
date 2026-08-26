import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";

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

let messagingPromise = null;
const getMessagingIfSupported = () => {
  if (!messagingPromise) {
    messagingPromise = (async () => {
      try {
        if (typeof Notification === "undefined") return null;
        const supported = await isSupported();
        return supported ? getMessaging(app) : null;
      } catch (error) {
        console.error("Error checking messaging support:", error);
        return null;
      }
    })();
  }
  return messagingPromise;
};

export const requestFCMToken = async () => {
  try {
    const messaging = await getMessagingIfSupported();
    if (!messaging) return null;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    return await getToken(messaging, { vapidKey });
  } catch (error) {
    console.error("Error requesting FCM token:", error);
    return null;
  }
};

export const listenToNotifications = (onNotification) => {
  let unsubscribe = () => {};
  (async () => {
    const messaging = await getMessagingIfSupported();
    if (!messaging) return;
    unsubscribe = onMessage(messaging, (payload) => {
      if (onNotification) {
        onNotification(payload.notification);
      }
    });
  })();
  return () => unsubscribe();
};

import { createContext, useContext, useState, useEffect } from 'react';
import { listenToNotifications } from '../firebaseConfig';

const NotificationsContext = createContext(null);

export const NotificationsProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const unsubscribe = listenToNotifications((notification) => {
      if (notification) {
        // Add new notification to the list
        setNotifications(prev => [{
          id: Date.now(),
          title: notification.title,
          body: notification.body,
          timestamp: new Date(),
          read: false,
          ...notification
        }, ...prev]);

        // Show browser notification
        if (Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.body,
            icon: '/logo192.png' // Add your app icon path here
          });
        }
      }
    });

    // Request notification permission if not granted
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const clearNotification = (notificationId) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== notificationId)
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return (
    <NotificationsContext.Provider value={{
      notifications,
      markAsRead,
      markAllAsRead,
      clearNotification,
      clearAllNotifications
    }}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};
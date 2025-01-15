import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { listenToNotifications, requestFCMToken } from '../firebaseConfig';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing auth
    const user = authService.getUser();
    if (user) {
      setUser(user);
    }
    setLoading(false);

    // Setup notification listener
    const unsubscribe = listenToNotifications((notification) => {
      if (notification) {
        new Notification(notification.title, {
          body: notification.body
        });
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const login = async (usernameOrEmail, password) => {
    const fcmToken = await requestFCMToken();
    const { user } = await authService.login(usernameOrEmail, password, fcmToken);
    setUser(user);
  };

  const register = async (userData) => {
    await authService.register(userData);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
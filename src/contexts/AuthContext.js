import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { employeeService } from '../services/employeeService';
import { listenToNotifications, requestFCMToken } from '../firebaseConfig';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const authenticateAndFetchUser = async () => {
      setLoading(true);
      setError(null);
      try {
        const user = authService.getUser();
        if (user) {
          setUser(user);
          const employeeData = await employeeService.getEmployeeById(user.userId);
          setEmployee(employeeData);
        }
      } catch (error) {
        console.error("Error in auth or employee fetch:", error);
        setError(error.message || "Failed to load user or employee data");
      } finally {
        setLoading(false);
      }
    };

    authenticateAndFetchUser();

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
    try {
      const employeeData = await employeeService.getEmployeeById(user.userId);
      setEmployee(employeeData);
    } catch (error) {
      console.error("Failed to fetch employee data on login:", error);
      setError(error.message || "Failed to fetch employee data");
    }
  };

  const register = async (userData) => {
    await authService.register(userData);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setEmployee(null);
  };

  return (
    <AuthContext.Provider value={{ user, employee, error, login, logout, register, loading }}>
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
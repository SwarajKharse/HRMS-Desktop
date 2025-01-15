import axios from 'axios';
import { requestFCMToken } from '../firebaseConfig';

const BASE_URL = 'http://localhost:8080/api/employee';

export const authService = {
  login: async (email, password) => {
    try {
      const fcmToken = await requestFCMToken();
      console.log(fcmToken);
      console.log("current time: ", new Date().getTime());
      
      // Changed to send data in request body instead of query params
      const response = await axios.post(`${BASE_URL}/login`, {
        email,
        password,
        fcmToken
      });

      const token = response.data;
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      localStorage.setItem('jwtToken', token);
      localStorage.setItem('deviceId', payload.deviceId);
      localStorage.setItem('user', JSON.stringify(payload));

      return { token, deviceId: payload.deviceId, user: payload };
    } catch (error) {
      throw new Error(error.response?.data || 'Login failed');
    }
  },

  register: async (employeeData) => {
    try {
      const response = await axios.post(`${BASE_URL}/register`, employeeData, {
        headers: { 'Content-Type': 'application/json' }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data || 'Registration failed');
    }
  },

  logout: async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      const deviceId = localStorage.getItem('deviceId');

      await axios.post(`${BASE_URL}/logout`, null, {
        params: { deviceId },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      localStorage.removeItem('jwtToken');
      localStorage.removeItem('deviceId');
      localStorage.removeItem('user');
    } catch (error) {
      throw new Error(error.response?.data || 'Logout failed');
    }
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('jwtToken');
  },

  getToken: () => {
    return localStorage.getItem('jwtToken');
  },

  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};

// Add axios interceptor for JWT token
axios.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
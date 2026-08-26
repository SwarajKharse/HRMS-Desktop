import axios from 'axios';
import { requestFCMToken } from '../firebaseConfig';

const BASE_URL = `${process.env.REACT_APP_API_URL}/employee`;

export const authService = {
  login: async (phone, password) => {
    try {
      const fcmToken = await requestFCMToken();
      
      // Changed to send data in request body instead of query params
      const response = await axios.post(`${BASE_URL}/login`, {
        phone,
        password,
        fcmToken
      });

      const token = response.data;
      const payload = JSON.parse(atob(token.split('.')[1]));
      
        localStorage.setItem('jwtToken', token);
      if (payload.deviceId != null) {
        localStorage.setItem('deviceId', payload.deviceId);
      } else {
        localStorage.removeItem('deviceId');
      }
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
    const token = localStorage.getItem('jwtToken');
    const rawDeviceId = localStorage.getItem('deviceId');
    // getItem returns the STRING "undefined"/"null" if a non-value was stored
    const deviceId =
      rawDeviceId && rawDeviceId !== 'undefined' && rawDeviceId !== 'null'
        ? rawDeviceId
        : null;

    try {
      await axios.post(`${BASE_URL}/logout`, null, {
        params: deviceId ? { deviceId } : {},
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (error) {
      // Server-side device unregister failed. Not a reason to keep the user
      // signed in — always clear the local session.
      console.error('Logout API call failed, clearing session anyway:', error);
    } finally {
      localStorage.removeItem('jwtToken');
      localStorage.removeItem('deviceId');
      localStorage.removeItem('user');
      window.location.reload();
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
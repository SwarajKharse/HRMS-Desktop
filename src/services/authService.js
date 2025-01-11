import axios from 'axios';

const BASE_URL = 'http://localhost:8080/api';

export const authService = {
  login: async (email, password) => {
    try {
      // Generate a simple FCM token for demo purposes
      // In production, this would come from your Firebase configuration
      const fcmToken = 'demo-fcm-token-' + Date.now();

      const response = await axios.post(`${BASE_URL}/login`, null, {
        params: {
          fcmToken
        },
        data: {
          email,
          password
        }
      });

      if (response.data) {
        localStorage.setItem('token', response.data);
        localStorage.setItem('isAuthenticated', 'true');
      }

      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isAuthenticated');
    window.location.href = '/login';
  },

  isAuthenticated: () => {
    return localStorage.getItem('isAuthenticated') === 'true';
  },

  getToken: () => {
    return localStorage.getItem('token');
  }
};


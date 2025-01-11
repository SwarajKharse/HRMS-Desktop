import axios from 'axios';

const BASE_URL = 'http://localhost:8080/api';

export const leaveService = {
  getEmployeeLeaves: async (employeeId) => {
    try {
      const response = await axios.get(`${BASE_URL}/leaves/${employeeId}/leaves`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getHolidays: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/leaves/holidays`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  applyLeave: async (leaveData) => {
    try {
      const response = await axios.post(`${BASE_URL}/leaves`, leaveData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};
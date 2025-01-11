import axios from 'axios';

const BASE_URL = 'http://localhost:8080/api';

export const payrollService = {
  getPayrolls: async (employeeId) => {
    try {
      const response = await axios.get(`${BASE_URL}/payroll/${employeeId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  addPayroll: async (payrollData) => {
    try {
      const response = await axios.post(`${BASE_URL}/payroll`, payrollData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};


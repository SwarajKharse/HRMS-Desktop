import axios from 'axios';
import { authService } from './authService';

const BASE_URL = "http://localhost:8080/api/payslip";

const getAuthHeaders = () => {
  const token = authService.getToken();
  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

export const payslipService = {
  getPayslipsByEmployeeId: async (empId) => {
    try {
      const response = await axios.get(`${BASE_URL}/employee/${empId}`, getAuthHeaders());
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error fetching payslips');
    }
  },

  downloadPayslipPdf: async (payslipId) => {
    try {
      const response = await axios.get(`${BASE_URL}/download/${payslipId}`, {
        ...getAuthHeaders(),
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error downloading payslip');
    }
  }
};

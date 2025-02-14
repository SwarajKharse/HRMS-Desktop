import axios from 'axios';
import { authService } from './authService';

const BASE_URL = `${process.env.REACT_APP_API_URL}/payslip`;

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

  getAllPayslipsByMonthAndYear: async (month, year) => {
    try {
      const response = await axios.get(`${BASE_URL}/month/${month}/year/${year}`, getAuthHeaders());
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error fetching payslips');
    }
  },

  getById: async (payslipId) => {
    try {
      const response = await axios.get(`${BASE_URL}/${payslipId}`, getAuthHeaders());
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error fetching payslip');
    }
  },

  refreshPayslip: async (empId, month, year) => {
    try {
      const response = await axios.post(`${BASE_URL}/refresh/${empId}/${month}/${year}`, null, getAuthHeaders())
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || "Error refreshing payslip")
    }
  },

  refreshAllPayslips: async (month, year) => {
    try {
      const response = await axios.post(`${BASE_URL}/refresh-all/${month}/${year}`, null, getAuthHeaders())
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || "Error refreshing payslips")
    }
  },

  downloadPayslipPdf: async (payslipId) => {
    try {
      const response = await axios.get(`${BASE_URL}/pdf/${payslipId}`, {
        ...getAuthHeaders(),
        responseType: "blob",
      })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || "Error downloading payslip")
    }
  },
};

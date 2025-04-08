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

  getAllPayslipsByMonthAndYear: async (orgId, month, year) => {
    try {
      const response = await axios.get(`${BASE_URL}/org/${orgId}/month/${month}/year/${year}`, getAuthHeaders());
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

  refreshAllPayslips: async (orgId, month, year) => {
    try {
      const response = await axios.post(`${BASE_URL}/refresh-all/org/${orgId}/${month}/${year}`, null, getAuthHeaders())
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

  downloadPayslipByEmpIdPdf: async (empId, month, year) => {
    try {
      const response = await axios.get(`${BASE_URL}/pdf-employee?empId=${empId}&month=${month}&year=${year}`, {
        ...getAuthHeaders(),
        responseType: "blob",
      })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || "Error downloading payslip")
    }
  },

  exportPayslips: async (orgId, month, year) => {
    try {
      const response = await axios.get(`${BASE_URL}/export/${orgId}/month/${month}/year/${year}`, {
        ...getAuthHeaders(),
        responseType: "blob",
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Error exporting payslips");
    }
  },

  exportMonthlySalary: async (orgId, month, year) => {
    try {
      const response = await axios.get(`${BASE_URL}/monthly-salary`, {
        ...getAuthHeaders(),
        responseType: "blob",
        params: {
          orgId,
          month,
          year
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Error exporting monthly salary");
    }
  },

  exportIndividualMonthlySalary: async (empId, month, year) => {
    try {
      const response = await axios.get(`${BASE_URL}/monthly-salary-individual`, {
        ...getAuthHeaders(),
        responseType: "blob",
        params: {
          empId,
          month,
          year
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Error exporting monthly salary");
    }
  },

  exportAllIndividualMonthlySalaryZip: async (orgId, month, year) => {
    try {
      const response = await axios.get(`${BASE_URL}/monthly-salary-zip`, {
        ...getAuthHeaders(),
        responseType: "blob",
        params: {
          orgId,
          month,
          year
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Error exporting individual monthly salary zip");
    }
  },

  exportAllPayslipsPdfZip: async (orgId, month, year) => {
    try {
      const response = await axios.get(`${BASE_URL}/payslips-pdf-zip`, {
        ...getAuthHeaders(),
        responseType: "blob",
        params: {
          orgId,
          month,
          year
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Error exporting payslips pdf zip");
    }
  },
};

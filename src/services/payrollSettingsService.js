import axios from "axios";
import { authService } from "./authService";

const BASE_URL = `${process.env.REACT_APP_API_URL}/payroll-settings`;

const getAuthHeaders = () => {
  const token = authService.getToken();
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  }
};

const getAuthTokenHeader = () => {
  const token = authService.getToken();
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
};

export const payrollSettingsService = {
  // getPayrollByEmployee: async (empId) => {
  //   try {
  //     const response = await axios.get(`${BASE_URL}/employee/${empId}`, getAuthHeaders());
  //     return response.data;
  //   } catch (error) {
  //     throw new Error(error.response?.data?.message || "Error fetching payroll details");
  //   }
  // },

  getByEmployeeIdAndMonth: async (employeeId, month, year) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/employee/${employeeId}?month=${month}&year=${year}`,
        getAuthHeaders(),
      )
      return response.data
    } catch (error) {
      if (error.response?.status === 404) {
        // Return null if no data found for this month
        return null
      }
      throw new Error(error.response?.data?.message || "Error fetching payroll settings")
    }
  },

  createOrUpdatePayroll: async (payrollData) => {
    try {
      if (payrollData.id) {
        const response = await axios.put(`${BASE_URL}/`, payrollData, getAuthHeaders());
        return response.data;
      } else {
        const response = await axios.post(`${BASE_URL}/`, payrollData, getAuthHeaders());
        return response.data;
      }
    } catch (error) {
      throw new Error(error.response?.data?.message || "Error saving payroll details");
    }
  },

  deletePayroll: async (id) => {
    try {
      const response = await axios.delete(`${BASE_URL}/${id}`, getAuthHeaders());
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Error deleting payroll details");
    }
  },

  exportPayroll: async (orgId) => {
    try {
      const response = await axios.get(`${BASE_URL}/export/${orgId}`, {
        ...getAuthHeaders(),
        responseType: "blob",
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Error exporting payroll details");
    }
  },

  importPayroll: async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await axios.post(`${BASE_URL}/import`, formData, {
        headers: {
          ...getAuthTokenHeader().headers,
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Error importing payroll details");
    }
  },

  calculateOnGross: async (orgId, empId, grossSalary) => {
    try {
      const response = await axios.post(`${BASE_URL}/calc-on-gross`, {
        orgId,
        empId,
        grossSalary,
      }, getAuthHeaders());
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Error calculating payroll details");
    }
  },

  exportCTCBreakdown: async (orgId, month, year) => {
    try {
      const response = await axios.get(`${BASE_URL}/export-all-ctc?orgId=${orgId}&month=${month}&year=${year}`, {
        ...getAuthHeaders(),
        responseType: "blob",
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Error exporting CTC breakdown details");
    }
  },
};

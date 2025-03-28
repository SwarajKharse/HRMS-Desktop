import axios from 'axios';
import { authService } from './authService';

const BASE_URL = `${process.env.REACT_APP_API_URL}/employee`;

// Add authorization headers to all requests
const getAuthHeaders = () => {
  return {
    headers: {
      'Content-Type': 'application/json'
    }
  };
};

export const employeeService = {
  getAllEmployees: async () => {
    try {
      const user = authService.getUser();
      const response = await axios.get(`${BASE_URL}/org/${user.orgId}`, getAuthHeaders());
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getEmployeeById: async (id) => {
    try {
      const response = await axios.get(`${BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 403) {
        throw new Error("You do not have permission to view this employee");
      }
      throw error.response?.data || error.message;
    }
  },

  createEmployee: async (employeeData) => {
    try {
      const response = await axios.post(`${BASE_URL}/`, employeeData, getAuthHeaders());
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateEmployee: async (id, employeeData) => {
    try {
      const response = await axios.put(`${BASE_URL}/${id}`, employeeData, getAuthHeaders());
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getManagerList : async (designation) => {
    try {
      const user = authService.getUser();
      const response = await axios.get(`${BASE_URL}/manager/${user.orgId}/${designation}`, getAuthHeaders());
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  deleteEmployee: async (id) => {
    try {
      await axios.delete(`${BASE_URL}/${id}`, getAuthHeaders());
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getPastEmployeesByOrgId: async (orgId) => {
    try {
      const response = await axios.get(`${BASE_URL}/pastEmployees/org/${orgId}`, getAuthHeaders())
      return await response.data
    } catch (error) {
      throw new Error(error.message)
    }
  },

  getGeofencingByOrgId: async (orgId) => {
    try {
      const response = await axios.get(`${BASE_URL}/geofencing/org/${orgId}`, getAuthHeaders())
      return await response.data;
    } catch (error) {
      throw new Error(error.message)
    }
  },

  updateGeofencingByEmployeeId: async (employeeId, geofencingData) => {
    try {
      const response = await axios.put(`${BASE_URL}/geofencing/${employeeId}`, geofencingData, getAuthHeaders());
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  activateEmployee: async (id) => {
    try {
      const response = await axios.put(`${BASE_URL}/activate/${id}`, getAuthHeaders());
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  deactivateEmployee: async (id) => {
    try {
      const response = await axios.put(`${BASE_URL}/deactivate/${id}`, getAuthHeaders());
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  exportEmployees: async (orgId) => {
    try {
      const response = await axios.get(`${BASE_URL}/export/${orgId}`, {
        ...getAuthHeaders(),
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },  

  importEmployees: async (file, orgId) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("orgId", orgId);
      const response = await axios.post(`${BASE_URL}/import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  resetPassword: async (empId, newPassword) => {
    try {
      const response = await axios.post(`${BASE_URL}/resetPassword`, {
        empId,
        newPassword
      }, getAuthHeaders());
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};
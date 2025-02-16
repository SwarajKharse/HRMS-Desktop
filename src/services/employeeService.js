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
      const response = await axios.get(`${BASE_URL}/${id}`, getAuthHeaders());
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

  getManagerList : async () => {
    try {
      const user = authService.getUser();
      const manager = "Manager";
      const response = await axios.get(`${BASE_URL}/manager/${user.orgId}/${manager}`, getAuthHeaders());
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
};
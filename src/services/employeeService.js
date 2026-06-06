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
      const response = await axios.get(`${BASE_URL}/manager/${user.orgId}/${encodeURIComponent(designation)}`, getAuthHeaders());
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Everyone who can be ASSIGNED to a role: the role itself plus the higher
  // roles allowed to act as it. Built on getManagerList, so no backend change.
  getAssignableList: async (role) => {
    const ASSIGNABLE = {
      "Sales Support Engineer": ["Sales Support Engineer", "Sales Team Lead"],
      "Business Development Manager": [
        "Business Development Manager", "Sales Team Lead", "Techno Commercial Head",
        "Site Engineer", "Project Manager", "Managing Director", "Vice President",
      ],
      "Purchaser": ["Purchaser", "Purchase Manager"],
      "Site Engineer": ["Site Engineer", "Project Manager"],
      "Accountant": ["Accountant", "Accounts Manager"],
      "Store Incharge": ["Store Incharge", "Store Manager"],
    };
    const designations = ASSIGNABLE[role] || [role];
    const lists = await Promise.all(
      designations.map((d) => employeeService.getManagerList(d).catch(() => []))
    );
    const seen = new Set();
    const merged = [];
    lists.flat().forEach((emp) => {
      if (emp && !seen.has(emp.id)) {
        seen.add(emp.id);
        merged.push(emp);
      }
    });
    return merged;
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
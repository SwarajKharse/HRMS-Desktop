import axios from "axios"

const BASE_URL = `${process.env.REACT_APP_API_URL}/department`;

export const departmentService = {
  getDepartmentsByOrgId: async (orgId) => {
    try {
      const response = await axios.get(`${BASE_URL}/org/${orgId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  createDepartment: async (departmentData) => {
    try {
      const response = await axios.post(`${BASE_URL}/`, departmentData)
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateDepartment: async (departmentData) => {
    try {
      const response = await axios.put(`${BASE_URL}/`, departmentData)
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  deleteDepartment: async (id) => {
    try {
      const response = await axios.delete(`${BASE_URL}/${id}`)
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },
}
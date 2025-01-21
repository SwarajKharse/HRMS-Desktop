import axios from "axios"

const BASE_URL = "http://localhost:8080/api/role"

export const roleService = {
  getRolesByOrgId: async (orgId) => {
    try {
      const response = await axios.get(`${BASE_URL}/org/${orgId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  createRole: async (roleData) => {
    try {
      const response = await axios.post(`${BASE_URL}/`, roleData)
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  updateRole: async (roleData) => {
    try {
      const response = await axios.put(`${BASE_URL}/`, roleData)
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  deleteRole: async (id) => {
    try {
      const response = await axios.delete(`${BASE_URL}/${id}`)
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },
}
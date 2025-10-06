import axios from "axios"

const BASE_URL = `${process.env.REACT_APP_API_URL}/designation`;

export const designationService = {
  getDesignationsByOrgId: async (orgId) => {
    try {
      const response = await axios.get(`${BASE_URL}/org/${orgId}`)
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  createDesignation: async (designationData) => {
    try {
      const response = await axios.post(`${BASE_URL}/`, designationData)
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  updateDesignation: async (designationData) => {
    try {
      const response = await axios.put(`${BASE_URL}/`, designationData)
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  deleteDesignation: async (id) => {
    try {
      const response = await axios.delete(`${BASE_URL}/${id}`)
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },
}


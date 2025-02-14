import axios from "axios"

const BASE_URL = `${process.env.REACT_APP_API_URL}/organization`;

export const organizationService = {
  createOrganization: async (orgData) => {
    try {
      const response = await axios.post(`${BASE_URL}/`, orgData, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  getOrganization: async (id) => {
    try {
      const response = await axios.get(`${BASE_URL}/${id}`)
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  updateOrganization: async (orgData) => {
    try {
      const response = await axios.put(`${BASE_URL}/`, orgData, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },
}
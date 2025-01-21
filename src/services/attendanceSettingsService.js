import axios from "axios"

const BASE_URL = "http://localhost:8080/api/attendance-settings"

export const attendanceSettingsService = {
  getByOrgId: async (orgId) => {
    try {
      const response = await axios.get(`${BASE_URL}/org/${orgId}`)
      return response.data
    } catch (error) {
      if (error.response?.status === 404) {
        return null
      }
      throw error.response?.data || error.message
    }
  },

  save: async (settings) => {
    try {
      const response = await axios.post(`${BASE_URL}/`, settings)
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  update: async (id, settings) => {
    try {
      const response = await axios.put(`${BASE_URL}/${id}`, settings)
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },
}


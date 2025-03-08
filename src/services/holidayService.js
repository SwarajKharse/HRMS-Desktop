import axios from "axios"

const BASE_URL = `${process.env.REACT_APP_API_URL}/holiday`;

export const holidayService = {
  getHolidaysByOrgId: async (orgId) => {
    try {
      const response = await axios.get(`${BASE_URL}/org/${orgId}`)
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  getHolidaysByYear: async (orgId, year) => {
    try {
      const response = await axios.get(`${BASE_URL}/year/${orgId}/${year}`)
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  createHoliday: async (holidayData) => {
    try {
      const response = await axios.post(`${BASE_URL}/`, holidayData)
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  updateHoliday: async (id, holidayData) => {
    try {
      const response = await axios.put(`${BASE_URL}/`, holidayData)
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  deleteHoliday: async (id) => {
    try {
      const response = await axios.delete(`${BASE_URL}/${id}`)
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },
}
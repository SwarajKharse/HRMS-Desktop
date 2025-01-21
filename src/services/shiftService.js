import axios from "axios"

const BASE_URL = "http://localhost:8080/api/shift"

export const shiftService = {
  getShiftsByOrgId: async (orgId) => {
    try {
      const response = await axios.get(`${BASE_URL}/org/${orgId}`)
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  createShift: async (shiftData) => {
    try {
      console.log(shiftData)
      const response = await axios.post(`${BASE_URL}/`, shiftData)
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  updateShift: async (id, shiftData) => {
    try {
      console.log(shiftData)
      const response = await axios.put(`${BASE_URL}/${id}`, shiftData)
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  deleteShift: async (id) => {
    try {
      const response = await axios.delete(`${BASE_URL}/${id}`)
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },
}
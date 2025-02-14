import axios from "axios"

const BASE_URL = `${process.env.REACT_APP_API_URL}/attendance-settings`

export const attendanceSettingsService = {
  getAttendanceSettingsByOrgId: async (orgId) => {
    try {
      const response = await axios.get(`${BASE_URL}/org/${orgId}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || "Error fetching attendance settings")
    }
  },

  createAttendanceSettings: async (settings) => {
    try {
      const response = await axios.post(`${BASE_URL}/`, settings)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || "Error creating attendance settings")
    }
  },

  updateAttendanceSettings: async (settings) => {
    try {
      const response = await axios.put(`${BASE_URL}/`, settings)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || "Error updating attendance settings")
    }
  },
}
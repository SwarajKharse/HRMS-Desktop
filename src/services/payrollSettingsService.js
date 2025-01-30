import axios from "axios"

const BASE_URL = "http://localhost:8080/api/payroll-settings"

export const payrollSettingsService = {
  getPayrollSettingsByOrgId: async (orgId) => {
    try {
      const response = await axios.get(`${BASE_URL}/org/${orgId}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || "Error fetching payroll settings")
    }
  },

  createOrUpdatePayrollSettings: async (settings) => {
    try {
      const response = await axios.put(`${BASE_URL}/`, settings)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || "Error saving payroll settings")
    }
  },
}


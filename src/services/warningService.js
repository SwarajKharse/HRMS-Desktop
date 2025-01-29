import axios from 'axios';

const BASE_URL = "http://localhost:8080/api/warning-letter"

export const warningService = {
  issueWarning: async (employeeId, reason) => {
    try {
      const response = await axios.post(`${BASE_URL}/issue-warning/${employeeId}`, { reason })
      return response.data
    } catch (error) {
      throw error
    }
  },

  getWarningsByEmployeeId: async (employeeId) => {
    try {
      const response = await axios.get(`${BASE_URL}/warnings/${employeeId}`)
      return response.data
    } catch (error) {
      throw error
    }
  },

  getWarningsByOrgId: async (orgId) => {
    try {
      const response = await axios.get(`${BASE_URL}/warnings/org/${orgId}`)
      return response.data
    } catch (error) {
      throw error
    }
  },
}


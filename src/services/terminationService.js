import axios from 'axios';

const BASE_URL = `${process.env.REACT_APP_API_URL}/termination`;

export const terminationService = {
  applyTermination: async (employeeId, reason) => {
    try {
      const response = await axios.post(`${BASE_URL}/apply-termination/${employeeId}`, { reason })
      return response.data
    } catch (error) {
      throw error
    }
  },

  getTerminationsByOrgId: async (orgId) => {
    try {
      const response = await axios.get(`${BASE_URL}/terminations/org/${orgId}`)
      return response.data
    } catch (error) {
      throw error
    }
  },

  getTerminationsByEmployeeId: async (employeeId) => {
    try {
      const response = await axios.get(`${BASE_URL}/terminations/employee/${employeeId}`)
      return response.data
    } catch (error) {
      throw error
    }
  },
}

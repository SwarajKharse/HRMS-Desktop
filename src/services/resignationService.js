import axios from 'axios';

const BASE_URL = "http://localhost:8080/api/resignation"

export const resignationService = {
  applyResignation: async (employeeId, reason) => {
    try {
      const response = await axios.post(`${BASE_URL}/${employeeId}/apply-resignation`, { reason })
      return response.data
    } catch (error) {
      throw error
    }
  },

  approveResignation: async (employeeId) => {
    try {
      const response = await axios.put(`${BASE_URL}/${employeeId}/resignation/approve`)
      return response.data
    } catch (error) {
      throw error
    }
  },

  rejectResignation: async (employeeId) => {
    try {
      const response = await axios.put(`${BASE_URL}/${employeeId}/resignation/reject`)
      return response.data
    } catch (error) {
      throw error
    }
  },

  getAllResignationsByOrgId: async (orgId) => {
    try {
      const response = await axios.get(`${BASE_URL}/org/${orgId}/resignations`)
      return response.data
    } catch (error) {
      throw error
    }
  },

  getResignationByEmployeeId: async (employeeId) => {
    try {
      const response = await axios.get(`${BASE_URL}/${employeeId}/resignation`)
      return response.data
    } catch (error) {
      throw error
    }
  },
}

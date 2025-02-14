import axios from "axios"

const BASE_URL = `${process.env.REACT_APP_API_URL}/leave-type`;

export const leaveTypeService = {
  getLeaveTypesByOrgId: async (orgId) => {
    try {
      const response = await axios.get(`${BASE_URL}/org/${orgId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  createLeaveType: async (leaveTypeData) => {
    try {
      const response = await axios.post(`${BASE_URL}/`, leaveTypeData);
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  updateLeaveType: async (leaveTypeData) => {
    try {
      const response = await axios.put(`${BASE_URL}/`, leaveTypeData)
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  deleteLeaveType: async (id) => {
    try {
      const response = await axios.delete(`${BASE_URL}/${id}`)
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },
}
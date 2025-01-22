import axios from 'axios';

const BASE_URL = 'http://localhost:8080/api/leave-request';

export const leaveService = {
  getLeavesByEmployeeId: async (empId) => {
    try {
      const response = await axios.get(`${BASE_URL}/employee/${empId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  applyLeave: async (leaveData) => {
    try {
      const response = await axios.post(`${BASE_URL}/`, leaveData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  approveLeave: async (id, leaveData) => {
    try {
      // Ensure we're sending the complete leave object with employee data
      const payload = {
        ...leaveData,
        status: 'APPROVED',
        // employee: {
        //   id: leaveData.employee.id
        // }
      };
      const response = await axios.put(`${BASE_URL}/${id}`, payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  rejectLeave: async (id, leaveData) => {
    try {
      // Ensure we're sending the complete leave object with employee data
      const payload = {
        ...leaveData,
        status: 'REJECTED',
        // employee: {
        //   id: leaveData.employee.id
        // }
      };
      const response = await axios.delete(`${BASE_URL}/${id}`, payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};
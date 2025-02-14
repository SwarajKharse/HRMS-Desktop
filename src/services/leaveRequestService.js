import axios from 'axios';

const BASE_URL = 'http://localhost:8080/api/leave-request';

export const leaveRequestService = {

  // Manager specific endpoints
  getManagerPendingRequests: async (managerId) => {
    try {
      const response = await axios.get(`${BASE_URL}/manager/requests/${managerId}`)
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  managerApproveLeave: async (leaveId, managerComments) => {
    try {
      const response = await axios.put(`${BASE_URL}/manager/approve/${leaveId}`, {
        managerComments,
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  managerRejectLeave: async (leaveId, managerComments) => {
    try {
      const response = await axios.put(`${BASE_URL}/manager/reject/${leaveId}`, {
        managerComments,
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  // HR specific endpoints
  getHRPendingRequests: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/hr/requests`)
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  hrApproveLeave: async (leaveId, hrComments) => {
    try {
      const response = await axios.put(`${BASE_URL}/hr/approve/${leaveId}`, {
        hrComments,
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  hrRejectLeave: async (leaveId, hrComments) => {
    try {
      const response = await axios.put(`${BASE_URL}/hr/reject/${leaveId}`, {
        hrComments,
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },
  
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
        status: 'Approved',
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
        status: 'Rejected',
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
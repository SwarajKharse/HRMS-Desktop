import axios from 'axios';

const BASE_URL = 'http://localhost:8080/api';

export const attendanceService = {
  getAttendance: async (employeeId, startDate, endDate) => {
    try {
      const response = await axios.get(`${BASE_URL}/attendance/${employeeId}`, {
        params: { startDate, endDate }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};
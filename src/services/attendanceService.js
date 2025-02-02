import axios from 'axios';
import { format } from 'date-fns';

const BASE_URL = 'http://localhost:8080/api/attendance';

export const attendanceService = {

  getTodayAttendance: async (employeeId) => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const response = await axios.get(`${BASE_URL}/employee/${employeeId}/date/${today}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getAttendance: async (employeeId, startDate, endDate) => {
    try {
      const response = await axios.get(`${BASE_URL}/${employeeId}`, {
        params: { startDate, endDate }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getAttendanceReport: async (date) => {
    try {
      const response = await axios.get(`${BASE_URL}/daily`, {
        params: {
          date: date.toISOString().split("T")[0],
        },
      })
      return response.data
    } catch (error) {
      throw new Error("Failed to fetch attendance report")
    }
  },

  getMonthlyAttendance: async (employeeId, month, year) => {
    try {
      const response = await axios.get(`${BASE_URL}/employee/${employeeId}/month/${month + 1}/year/${year}`)
      return response.data
    } catch (error) {
      throw new Error("Failed to fetch monthly attendance")
    }
  },

  updateAttendance: async (attendance) => {
    try {
      const response = await axios.put(`${BASE_URL}/update`, attendance)
      return response.data
    } catch (error) {
      throw new Error("Failed to update attendance")
    }
  }
};
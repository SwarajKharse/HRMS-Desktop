import axios from 'axios';
import { format } from 'date-fns';
import { authService } from './authService';

const BASE_URL = `${process.env.REACT_APP_API_URL}/attendance`;

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
          orgId: authService.getUser().orgId,
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
  },

  markKioskAttendance: async (selectedAction, body) => {
    try {
      const response = await axios.post(`${BASE_URL}/kiosk/${selectedAction}`, body, {
        headers: { 'Content-Type': 'application/json' }
      });
      return await response.json();
    } catch (error) {
      throw new Error("Failed to mark attendance")
    }
  },

  markUpdateOvertime: async (attendanceId, overtime, isIncluded) => {
    try {
      const response = await axios.put(`${BASE_URL}/update/overtime`, { attendanceId, overtime, isIncluded });
      return response.data;
    } catch (error) {
      throw new Error("Failed to update overtime")
    }
  },

  markUpdateLateCheckIn: async (attendanceId, isIncluded) => {
    try {
      const response = await axios.put(`${BASE_URL}/update/lateCheckIn`, { attendanceId, isIncluded });
      return response.data;
    } catch (error) {
      throw new Error("Failed to update leave")
    }
  },

  markUpdateEarlyCheckOut: async (attendanceId, isIncluded) => {
    try {
      const response = await axios.put(`${BASE_URL}/update/earlyCheckOut`, { attendanceId, isIncluded });
      return response.data;
    } catch (error) {
      throw new Error("Failed to update leave")
    }
  },

  exportAttendances: async (orgId) => {
    try {
      const response = await axios.get(`${BASE_URL}/export/${orgId}`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw new Error("Failed to export attendances")
    }
  },

  importAttendances: async (file, orgId) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('orgId', orgId);
      const response = await axios.post(`${BASE_URL}/import`, formData,  {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw new Error("Failed to import attendances")
    }
  },
};
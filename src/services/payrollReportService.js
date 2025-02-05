import axios from "axios"
import { authService } from "./authService"

const BASE_URL = "http://localhost:8080/api/payroll-reports"

const getAuthHeaders = () => {
  const token = authService.getToken()
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  }
}

export const payrollReportService = {
  getPayrollReportByEmployeeId: async (empId) => {
    try {
      const response = await axios.get(`${BASE_URL}/employee/${empId}`, getAuthHeaders())
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || "Error fetching payroll report")
    }
  },
}
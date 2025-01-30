import axios from "axios"
import { authService } from "./authService"

const BASE_URL = "http://localhost:8080/api/payroll"

const getAuthHeaders = () => {
  const token = authService.getToken()
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  }
}

export const payrollPerEmployeeService = {
  getPayrollByEmployee: async (empId) => {
    try {
      const response = await axios.get(`${BASE_URL}/employee/${empId}`, getAuthHeaders())
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || "Error fetching payroll details")
    }
  },

  createOrUpdatePayroll: async (payrollData) => {
    try {
      const response = await axios.put(`${BASE_URL}/`, payrollData, getAuthHeaders())
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || "Error saving payroll details")
    }
  },
}
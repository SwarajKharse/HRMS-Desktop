import axios from 'axios';

const BASE_URL = 'http://localhost:8080/api';

export const employeeService = {
  getAllEmployees: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/employees`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  createEmployee: async (employeeData) => {
    try {
      const response = await axios.post(`${BASE_URL}/employees`, employeeData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};


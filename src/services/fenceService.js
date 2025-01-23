import axios from "axios"

const BASE_URL = "http://localhost:8080/api/fences"

export const fenceService = {
  getFences: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  saveFences: async (fences) => {
    try {
      const response = await axios.post(`${BASE_URL}/`, fences);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
}


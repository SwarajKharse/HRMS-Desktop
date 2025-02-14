import axios from "axios"

const BASE_URL = `${process.env.REACT_APP_API_URL}/fences`;

export const fenceService = {
  getFences: async (orgId) => {
    try {
      const response = await axios.get(`${BASE_URL}/org/${orgId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  saveFences: async (orgId, fences) => {
    try {
      const response = await axios.post(`${BASE_URL}/org/${orgId}`, fences);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
}


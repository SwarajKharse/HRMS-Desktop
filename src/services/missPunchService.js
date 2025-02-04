import axios from "axios"

const BASE_URL = "http://localhost:8080/api/miss-punch";

export const missPunchService = {
  apply: async (missPunchData) => {
    try{
      const response = await axios.post(`${BASE_URL}/apply`, missPunchData)
      return response.data;
    }catch(error){
      throw error.response?.data || error.message;
    }
  },

  getPendingRequests: async () => {
    try{
      const response = await axios.get(`${BASE_URL}/pending`)
      return response.data;
    }catch(error){
      throw error.response?.data || error.message;
    }
  },

  getEmployeeRequests: async (empId) => {
    try{
      const response = await axios.get(`${BASE_URL}/emp/${empId}`)
      return response.data;
    }catch(error){
      throw error.response?.data || error.message;
    }
  },

  approve: async (id, comments) => {
    try{
      const response = await axios.post(`${BASE_URL}/approve/${id}`, comments)
      return response.data
    }catch(error){
      throw error.response?.data || error.message;
    }
  },

  reject: async (id, comments) => {
    try{
      const response = await axios.post(`${BASE_URL}/reject/${id}`, comments)
      return response.data
    }catch(error){
      throw error.response?.data || error.message;
    }
  },
}
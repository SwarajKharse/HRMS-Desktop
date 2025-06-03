"use client"

import axios from "axios"
import { authService } from "./authService"

//const BASE_URL = 'http://127.0.0.1:8081/api/lead';
const BASE_URL = `${process.env.REACT_APP_API_URL}/project`


//const { leadservice } = useAuth()

// Add authorization headers to all requests
const getAuthHeaders = () => {
  return {
    headers: {
      "Content-Type": "application/json",
    },
  }
}

export const projectService = {
  createProject: async (leadData,id) => {
    try {

      console.log(leadData);
      const response = await axios.post(`${BASE_URL}/create/${leadData.amc_or_project}/${id}`, leadData, getAuthHeaders())
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

}

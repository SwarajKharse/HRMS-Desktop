"use client"

import axios from "axios"
import { authService } from "./authService"

//const BASE_URL = 'http://127.0.0.1:8081/api/lead';
const BASE_URL = `${process.env.REACT_APP_API_URL}/lead`

const EMP_BASE_URL = `${process.env.REACT_APP_API_URL}/employee`
//const { leadservice } = useAuth()

// Add authorization headers to all requests
const getAuthHeaders = () => {
  return {
    headers: {
      "Content-Type": "application/json",
    },
  }
}

export const leadService = {
  createLead: async (leadData) => {
    try {
      console.log("Service -------------------------------")
      console.log(leadData)
      const response = await axios.post(`${BASE_URL}/create`, leadData, getAuthHeaders())
      //await leadService(leadData)
      console.log(response)
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  createAdditionalDetails: async (leadData) => {
    try {
      console.log("Service -------------------------------")
      console.log(leadData)
      const response = await axios.post(`${BASE_URL}/createadditionaldetails`, leadData, getAuthHeaders())
      //await leadService(leadData)
      console.log(response)
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  getUnassignedLeads: async (
    page = 0,
    size = 20,
    leadPriority = "",
    dateReceived = "",
    leadType = "",
    leadSource = "",
  ) => {
    try {
      // Build query string for filtering based on the backend's expected format
      const queryParams = {
        page,
        size,
      }

      // Format the query string according to what the backend expects
      let queryString = ""

      if (leadPriority) {
        queryString += `priority=${leadPriority}`
      }

      if (dateReceived) {
        if (queryString) queryString += "&"
        // Format date as ISO string (YYYY-MM-DD)
        queryString += `date=${dateReceived}`
        console.log("Date filter:", dateReceived)
      }

      if (leadType) {
        if (queryString) queryString += "&"
        queryString += `leadType=${leadType}`
        console.log("Lead Type filter:", leadType)
      }

      if (leadSource) {
        if (queryString) queryString += "&"
        queryString += `leadSource=${leadSource}`
        console.log("Lead Source filter:", leadSource)
      }

      if (queryString) {
        queryParams.query = queryString
      }

      console.log("Sending API request with params:", queryParams)

      const response = await axios.get(`${BASE_URL}/unassignedleads`, {
        params: queryParams,
      })

      return response.data
    } catch (error) {
      console.error("API Error:", error)
      throw new Error("Failed to fetch lead details: " + (error.message || "Unknown error"))
    }
  },

  getAssignedLeads: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/assignedleads`, {
        params: {
          /* date: date.toISOString().split("T")[0],
          userId: authService.getUser().userId, */
          query: "",
        },
      })
      return response.data
    } catch (error) {
      throw new Error("Failed to fetch lead details")
    }
  },

  getSSEWonLeads: async (sseid) => {
    try {
      const response = await axios.get(`${BASE_URL}/ssewonleads`, {
        params: {
          sseid: sseid,
        },
      })
      return response.data
    } catch (error) {
      throw new Error("Failed to fetch lead details")
    }
  },

  getLeadsForBDMAssignment: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/leadsforbdmassignment`, {
        params: {
          /* date: date.toISOString().split("T")[0],
          userId: authService.getUser().userId, */
          query: "",
        },
      })
      return response.data
    } catch (error) {
      throw new Error("Failed to fetch lead details")
    }
  },

  getSSEList: async () => {
    try {
      const user = authService.getUser()
      const manager = "Manager"
      const response = await axios.get(
        `${EMP_BASE_URL}/manager/${user.orgId}/${"Sales Support Engineer"}`,
        getAuthHeaders(),
      )
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  getBDMList: async () => {
    try {
      const user = authService.getUser()
      const manager = "Manager"
      const response = await axios.get(
        `${EMP_BASE_URL}/manager/${user.orgId}/${"Business Development Manager"}`,
        getAuthHeaders(),
      )
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  updateLead: async (id, leadData, flag) => {
    try {
      const response = await axios.put(`${BASE_URL}/updatelead/${id}/${flag}`, leadData, getAuthHeaders())
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  updateBDMFieldVisit: async (id, formData) => {
    try {
      console.log("Inside Try----------------")
      const response = await axios.post(`${BASE_URL}/updatebdmfieldvisit/${id}`, formData, {
        headers: {
          //...formData.getHeaders(),
          // Don't set Content-Type here - axios will automatically set it
        },
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  updateSSEProposalApproval: async (id, formData) => {
    try {
      const response = await axios.post(`${BASE_URL}/updatesseproposalapproval/${id}`, formData, {
        headers: {
          // Don't set Content-Type here - axios will automatically set it
        },
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  getLeadSourceList: async () => {
    try {
      const user = authService.getUser()
      const response = await axios.get(`${BASE_URL}/leadsource`, getAuthHeaders())
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  getLeadTypeList: async () => {
    try {
      const user = authService.getUser()
      const response = await axios.get(`${BASE_URL}/leadtype`, getAuthHeaders())
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  getLeadProductTypeList: async () => {
    try {
      const user = authService.getUser()
      const response = await axios.get(`${BASE_URL}/leadproducttype`, getAuthHeaders())
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  getLeadsAssignesToSSE: async (sseid) => {
    try {
      const response = await axios.get(`${BASE_URL}/sseassignedleads`, {
        params: {
          sseid: sseid,
        },
      })
      return response.data
    } catch (error) {
      throw new Error("Failed to fetch lead details")
    }
  },

  getSSEInprogressLeads: async (sseid) => {
    try {
      const response = await axios.get(`${BASE_URL}/sseinprogressleads`, {
        params: {
          sseid: sseid,
        },
      })
      return response.data
    } catch (error) {
      throw new Error("Failed to fetch lead details")
    }
  },

  getLeadsAssignesToBDM: async (bdmid) => {
    try {
      const response = await axios.get(`${BASE_URL}/bdmassignedleads`, {
        params: {
          bdmid: bdmid,
        },
      })
      return response.data
    } catch (error) {
      throw new Error("Failed to fetch lead details")
    }
  },
}

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
    leadCode = "",
    fromDate = "",
    toDate = "",
    assignedSse = "",
    assignedBdm = "",
    leadPriority = "",
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

      if (leadCode) {
        queryString += `leadCode=${leadCode}`
      }

      if (fromDate) {
        if (queryString) queryString += "&"
        queryString += `fromDate=${fromDate}`
      }

      if (toDate) {
        if (queryString) queryString += "&"
        queryString += `toDate=${toDate}`
      }

      if (assignedSse) {
        if (queryString) queryString += "&"
        queryString += `assignedSse=${assignedSse}`
      }

      if (assignedBdm) {
        if (queryString) queryString += "&"
        queryString += `assignedBdm=${assignedBdm}`
      }

      if (leadPriority) {
        if (queryString) queryString += "&"
        queryString += `priority=${leadPriority}`
      }

      if (leadType) {
        if (queryString) queryString += "&"
        queryString += `leadType=${leadType}`
      }

      if (leadSource) {
        if (queryString) queryString += "&"
        queryString += `leadSource=${leadSource}`
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

  exportUnassignedLeads: async (
    format = "csv",
    leadCode = "",
    fromDate = "",
    toDate = "",
    assignedSse = "",
    assignedBdm = "",
    leadPriority = "",
    leadType = "",
    leadSource = "",
  ) => {
    try {
      // Build query string for filtering based on the backend's expected format
      let queryString = ""

      if (leadCode) {
        queryString += `leadCode=${leadCode}`
      }

      if (fromDate) {
        if (queryString) queryString += "&"
        queryString += `fromDate=${fromDate}`
      }

      if (toDate) {
        if (queryString) queryString += "&"
        queryString += `toDate=${toDate}`
      }

      if (assignedSse) {
        if (queryString) queryString += "&"
        queryString += `assignedSse=${assignedSse}`
      }

      if (assignedBdm) {
        if (queryString) queryString += "&"
        queryString += `assignedBdm=${assignedBdm}`
      }

      if (leadPriority) {
        if (queryString) queryString += "&"
        queryString += `priority=${leadPriority}`
      }

      if (leadType) {
        if (queryString) queryString += "&"
        queryString += `leadType=${leadType}`
      }

      if (leadSource) {
        if (queryString) queryString += "&"
        queryString += `leadSource=${leadSource}`
      }

      console.log("Exporting with filters:", queryString)

      // Make the request with responseType blob to handle file download
      const response = await axios.get(`${BASE_URL}/export/unassignedleads`, {
        params: {
          query: queryString,
          format: format,
        },
        responseType: "blob", // Important for file downloads
      })

      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", format === "excel" ? "unassigned_leads.xlsx" : "unassigned_leads.csv")
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      return true
    } catch (error) {
      console.error("Export API Error:", error)
      throw new Error("Failed to export leads: " + (error.message || "Unknown error"))
    }
  },

  exportAssignedLeads: async (
      format = "csv",
      leadCode = "",
      fromDate = "",
      toDate = "",
      assignedSse = "",
      assignedBdm = "",
      leadPriority = "",
      leadType = "",
      leadSource = "",
    ) => {
      try {
        let queryString = ""
  
        if (leadCode) {
          queryString += `leadCode=${leadCode}`
        }
  
        if (fromDate) {
          if (queryString) queryString += "&"
          queryString += `fromDate=${fromDate}`
        }
  
        if (toDate) {
          if (queryString) queryString += "&"
          queryString += `toDate=${toDate}`
        }
  
        if (assignedSse) {
          if (queryString) queryString += "&"
          queryString += `assignedSse=${assignedSse}`
        }
  
        if (assignedBdm) {
          if (queryString) queryString += "&"
          queryString += `assignedBdm=${assignedBdm}`
        }
  
        if (leadPriority) {
          if (queryString) queryString += "&"
          queryString += `priority=${leadPriority}`
        }
  
        if (leadType) {
          if (queryString) queryString += "&"
          queryString += `leadType=${leadType}`
        }
  
        if (leadSource) {
          if (queryString) queryString += "&"
          queryString += `leadSource=${leadSource}`
        }
  
        console.log("Exporting with filters:", queryString)
  
        const response = await axios.get(`${BASE_URL}/export/assignedleads`, {
          params: {
            query: queryString,
            format: format,
          },
          responseType: "blob",
        })
  
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement("a")
        link.href = url
        link.setAttribute("download", format === "excel" ? "assigned_leads.xlsx" : "assigned_leads.csv")
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
  
        return true
      } catch (error) {
        console.error("Export API Error:", error)
        throw new Error("Failed to export assigned leads: " + (error.message || "Unknown error"))
      }
    },

  exportLeadsForBDMAssignment: async (
    format = "csv",
    leadPriority = "",
    dateReceived = "",
    leadType = "",
    leadSource = "",
  ) => {
    try {
      // Build query string for filtering based on the backend's expected format
      let queryString = ""

      if (leadPriority) {
        queryString += `priority=${leadPriority}`
      }

      if (dateReceived) {
        if (queryString) queryString += "&"
        // Format date as ISO string (YYYY-MM-DD)
        queryString += `date=${dateReceived}`
      }

      if (leadType) {
        if (queryString) queryString += "&"
        queryString += `leadType=${leadType}`
      }

      if (leadSource) {
        if (queryString) queryString += "&"
        queryString += `leadSource=${leadSource}`
      }

      console.log("Exporting with filters:", queryString)

      // Make the request with responseType blob to handle file download
      const response = await axios.get(`${BASE_URL}/export/leadsforbdmassignment`, {
        params: {
          query: queryString,
          format: format,
        },
        responseType: "blob", // Important for file downloads
      })

      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", format === "excel" ? "leads_bdm_assignment.xlsx" : "leads_bdm_assignment.csv")
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      return true
    } catch (error) {
      console.error("Export API Error:", error)
      throw new Error("Failed to export leads: " + (error.message || "Unknown error"))
    }
  },

  exportSalesTLWonOrLostLeads: async (
    format = "csv",
    leadPriority = "",
    dateReceived = "",
    leadType = "",
    leadSource = "",
  ) => {
    try {
      // Build query string for filtering based on the backend's expected format
      let queryString = ""

      if (leadPriority) {
        queryString += `priority=${leadPriority}`
      }

      if (dateReceived) {
        if (queryString) queryString += "&"
        // Format date as ISO string (YYYY-MM-DD)
        queryString += `date=${dateReceived}`
      }

      if (leadType) {
        if (queryString) queryString += "&"
        queryString += `leadType=${leadType}`
      }

      if (leadSource) {
        if (queryString) queryString += "&"
        queryString += `leadSource=${leadSource}`
      }

      console.log("Exporting with filters:", queryString)

      // Make the request with responseType blob to handle file download
      const response = await axios.get(`${BASE_URL}/export/salestlwonorlostleads`, {
        params: {
          query: queryString,
          format: format,
        },
        responseType: "blob", // Important for file downloads
      })

      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", format === "excel" ? "salestl_won_lost_leads.xlsx" : "salestl_won_lost_leads.csv")
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      return true
    } catch (error) {
      console.error("Export API Error:", error)
      throw new Error("Failed to export leads: " + (error.message || "Unknown error"))
    }
  },

  getAssignedLeads: async (
      page = 0,
      size = 30,
      leadCode = "",
      fromDate = "",
      toDate = "",
      assignedSse = "",
      assignedBdm = "",
      leadPriority = "",
      leadType = "",
      leadSource = "",
    ) => {
      try {
        const queryParams = {
          page,
          size,
        }
  
        let queryString = ""
  
        if (leadCode) {
          queryString += `leadCode=${leadCode}`
        }
  
        if (fromDate) {
          if (queryString) queryString += "&"
          queryString += `fromDate=${fromDate}`
        }
  
        if (toDate) {
          if (queryString) queryString += "&"
          queryString += `toDate=${toDate}`
        }
  
        if (assignedSse) {
          if (queryString) queryString += "&"
          queryString += `assignedSse=${assignedSse}`
        }
  
        if (assignedBdm) {
          if (queryString) queryString += "&"
          queryString += `assignedBdm=${assignedBdm}`
        }
  
        if (leadPriority) {
          if (queryString) queryString += "&"
          queryString += `priority=${leadPriority}`
        }
  
        if (leadType) {
          if (queryString) queryString += "&"
          queryString += `leadType=${leadType}`
        }
  
        if (leadSource) {
          if (queryString) queryString += "&"
          queryString += `leadSource=${leadSource}`
        }
  
        if (queryString) {
          queryParams.query = queryString
        }
  
        console.log("Sending API request with params:", queryParams)
  
        const response = await axios.get(`${BASE_URL}/assignedleads`, {
          params: queryParams,
        })
  
        return response.data
      } catch (error) {
        console.error("API Error:", error)
        throw new Error("Failed to fetch assigned leads: " + (error.message || "Unknown error"))
      }
    },

  getSSEWonLeads: async (sseid,
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
        sseid,
        page,
        size
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

      const response = await axios.get(`${BASE_URL}/ssewonleads`, {
        params: queryParams,
      })
      return response.data
    } catch (error) {
      throw new Error("Failed to fetch lead details")
    }
  },

  getSalesTlWonLeads: async (sseid,
    page = 0,
    size = 30,
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

      const response = await axios.get(`${BASE_URL}/salestlwonleads`, {
        params: queryParams,
      })
      return response.data
    } catch (error) {
      throw new Error("Failed to fetch lead details")
    }
  },

  getLeadsForBDMAssignment: async (
    page = 0,
    size = 30,
    leadPriority = "",
    dateReceived = "",
    leadType = "",
    leadSource = ""
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

      const response = await axios.get(`${BASE_URL}/leadsforbdmassignment`, {
        params: queryParams,
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
      let finalResult = [];

      const responsesalesTl = await axios.get(
        `${EMP_BASE_URL}/manager/${user.orgId}/${"Sales Manager"}`,
        getAuthHeaders(),
      )
      finalResult = [...response.data, ...responsesalesTl.data];
      return finalResult
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
      // Ensure document_type is set if proposal_document exists
      if (formData.get("proposal_document") && !formData.get("document_type")) {
        formData.append("document_type", "proposal")
      }

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

  updateSalesTLProposalApproval: async (id, formData) => {
    try {
      // Ensure document_type is set if proposal_document exists
      if (formData.get("proposal_document") && !formData.get("document_type")) {
        formData.append("document_type", "proposal")
      }

      const response = await axios.post(`${BASE_URL}/updatesalestlproposalapproval/${id}`, formData, {
        headers: {
          // Don't set Content-Type here - axios will automatically set it
        },
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  updatePOorRejectionReason: async (id, formData) => {
    try {
      // Ensure document_type is set if proposal_document exists
      if (formData.get("po_document") && !formData.get("document_type")) {
        formData.append("document_type", "po_document")
      }

      const response = await axios.post(`${BASE_URL}/updatepoorrejectionreason/${id}`, formData, {
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

  getLeadsAssignesToSSE: async (sseid,
    page = 0,
    size = 30,
    leadPriority = "",
    dateReceived = "",
    leadType = "",
    leadSource = ""
  ) => {
    try {

      // Build query string for filtering based on the backend's expected format
      const queryParams = {
        sseid,
        page,
        size
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

      const response = await axios.get(`${BASE_URL}/sseassignedleads`, {
        params: queryParams,
      })
      return response.data
    } catch (error) {
      throw new Error("Failed to fetch lead details")
    }
  },

  getSSEInprogressLeads: async (sseid,
    page = 0,
    size = 30,
    leadPriority = "",
    dateReceived = "",
    leadType = "",
    leadSource = ""
  ) => {
    try {

      // Build query string for filtering based on the backend's expected format
      const queryParams = {
        sseid,
        page,
        size
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

      const response = await axios.get(`${BASE_URL}/sseinprogressleads`, {
        params: queryParams,
      })
      return response.data
    } catch (error) {
      throw new Error("Failed to fetch lead details")
    }
  },

  getLeadsAssignesToBDM: async (bdmid,
    page = 0,
    size = 30,
    leadPriority = "",
    dateReceived = "",
    leadType = "",
    leadSource = ""
  ) => {
    try {

      // Build query string for filtering based on the backend's expected format
      const queryParams = {
        bdmid,
        page,
        size
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

      const response = await axios.get(`${BASE_URL}/bdmassignedleads`, {
        params: queryParams,
      })
      return response.data
    } catch (error) {
      throw new Error("Failed to fetch lead details")
    }
  },

  getLeadDocuments: async (leadId, documentType) => {
    try {
      const response = await axios.get(`${BASE_URL}/documents/${leadId}`, {
        params: {
          documentType: documentType,
        },
      })
      return response.data
    } catch (error) {
      console.error("Error fetching lead documents:", error)
      throw error.response?.data || error.message
    }
  },

  createLeadProductType: async (data) => {
    try {
      console.log(data)
      const payload = {
        label: data.label,
        id: null
        // Don't include an ID field here
      }
      const response = await axios.post(`${BASE_URL}/create-lead-product-type`, payload)
      return response.data
    } catch (error) {
      console.error("Error creating lead product type:", error)
      throw error
    }
  },

  updateLeadProductType: async (id, data) => {
    try {
      const payload = {
        label: data.label,
        id: id
      }
      const response = await axios.put(`${BASE_URL}/update-lead-product-type/${id}`, payload)
      return response.data
    } catch (error) {
      console.error("Error updating lead product type:", error)
      throw error
    }
  },

  deleteLeadProductType: async (id) => {
    try {
      const response = await axios.delete(`${BASE_URL}/delete-lead-product-type/${id}`)
      return response.data
    } catch (error) {
      console.error("Error deleting lead product type:", error)
      throw error
    }
  },

  createLeadSource: async (data) => {
    try {
      const response = await axios.post(`${BASE_URL}/create-lead-source`, data)
      return response.data
    } catch (error) {
      console.error("Error creating lead source:", error)
      throw error
    }
  },

  updateLeadSource: async (id, data) => {
    try {
      const payload = {
        label: data.label,
        id: id
      }
      const response = await axios.put(`${BASE_URL}/update-lead-source/${id}`, payload)
      return response.data
    } catch (error) {
      console.error("Error updating lead source:", error)
      throw error
    }
  },

  deleteLeadSource: async (id) => {
    try {
      const response = await axios.delete(`${BASE_URL}/delete-lead-source/${id}`)
      return response.data
    } catch (error) {
      console.error("Error deleting lead source:", error)
      throw error
    }
  },

  createLeadType: async (data) => {
    try {
      const response = await axios.post(`${BASE_URL}/create-lead-type`, data)
      return response.data
    } catch (error) {
      console.error("Error creating lead type:", error)
      throw error
    }
  },

  updateLeadType: async (id, data) => {
    try {
      const payload = {
        label: data.label,
        id: id
      }
      const response = await axios.put(`${BASE_URL}/update-lead-type/${id}`, payload)
      return response.data
    } catch (error) {
      console.error("Error updating lead type:", error)
      throw error
    }
  },

  deleteLeadType: async (id) => {
    try {
      const response = await axios.delete(`${BASE_URL}/delete-lead-type/${id}`)
      return response.data
    } catch (error) {
      console.error("Error deleting lead type:", error)
      throw error
    }
  },

  getLeadsCreatedByBDM: async (bdmid,
    page = 0,
    size = 30,
    leadPriority = "",
    dateReceived = "",
    leadType = "",
    leadSource = ""
  ) => {
    try {

      // Build query string for filtering based on the backend's expected format
      const queryParams = {
        bdmid,
        page,
        size
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

      const response = await axios.get(`${BASE_URL}/bdmcreatedleads`, {
        params: queryParams,
      })
      return response.data
    } catch (error) {
      throw new Error("Failed to fetch lead details")
    }
  },
}

import axios from "axios"
import { authService } from "./authService"

const API_URL = `${process.env.REACT_APP_API_URL}`

const getAuthHeaders = () => {
  return {
    headers: {
      "Content-Type": "application/json",
      // Add authorization header if your authService provides a token
      // FIX 1: Uncomment this line to send the authorization token
      'Authorization': `Bearer ${authService.getToken()}`,
    },
  }
}

const getAuthHeadersForFormData = () => {
  return {
    headers: {
      Authorization: `Bearer ${authService.getToken()}`,
    },
  }
}

export const projectService = {
  createOrUpdateProject: async (projectData, amc_or_project, leadId) => {
    try {
      const response = await axios.post(
        `${API_URL}/projects/createOrUpdate/${leadId}?amc_or_project=${amc_or_project}`,
        projectData,
        getAuthHeaders(),
      )
      return response.data
    } catch (error) {
      console.error("Error creating or updating project:", error.response ? error.response.data : error.message)
      throw error
    }
  },
  getProjectByLeadId: async (leadId) => {
    try {
      const response = await axios.get(`${API_URL}/projects/byLead/${leadId}`, getAuthHeaders())
      return response.data
    } catch (error) {
      console.error("Error fetching project by lead ID:", error.response ? error.response.data : error.message)
      throw error
    }
  },
  createOrUpdateBOQ: async (projectId, boqRequest) => {
    try {
      const response = await axios.post(`${API_URL}/projects/${projectId}/boq`, boqRequest, getAuthHeaders())
      return response.data
    } catch (error) {
      console.error("Error creating or updating BOQ:", error.response ? error.response.data : error.message)
      throw error
    }
  },
  getBOQByProjectId: async (projectId) => {
    try {
      const response = await axios.get(`${API_URL}/projects/${projectId}/boq`, getAuthHeaders())
      return response.data
    } catch (error) {
      console.error("Error fetching BOQ by project ID:", error.response ? error.response.data : error.message)
      throw error
    }
  },
  saveBOQWithMaterialRequisition: async (projectId, enhancedBOQRequest) => {
    try {
      const response = await axios.post(
        `${API_URL}/projects/${projectId}/boq/saveWithMTR`,
        enhancedBOQRequest,
        getAuthHeaders(),
      )
      return response.data
    } catch (error) {
      console.error(
        "Error saving BOQ with material requisitions:",
        error.response ? error.response.data : error.message,
      )
      throw error
    }
  },
  updateProjectTitle: async (projectId, newTitle) => {
    try {
      const response = await axios.put(`${API_URL}/projects/${projectId}/title`, { title: newTitle }, getAuthHeaders())
      return response.data
    } catch (error) {
      console.error("Error updating project title:", error.response ? error.response.data : error.message)
      throw error
    }
  },
  // MODIFIED: Corrected to pass approvalDetails as the request body
  // Removed redundant 'status' and 'remarks' from parameters as they are part of approvalDetails
  async updateBOQItemApprovalStatus(boqItemId, approvalDetails) {
    try {
      console.log("Updating approval status for BOQ item:", boqItemId)
      console.log("Approval Details payload:", JSON.stringify(approvalDetails, null, 2))
      const response = await axios.put(
        `${API_URL}/projects/boqItem/${boqItemId}/approval`,
        approvalDetails, // This is the object containing approvalType, statusValue, remarks
        getAuthHeaders(),
      )
      return response.data
    } catch (error) {
      console.error("Error updating approval status:", error.response ? error.response.data : error.message)
      throw error
    }
  },
  getNewProjects: async (page = 0, size = 10, query = "") => {
    try {
      const response = await axios.get(`${API_URL}/projects/getnewprojects`, {
        ...getAuthHeaders(),
        params: { page, size, query },
      })
      return response.data
    } catch (error) {
      console.error("Error fetching new projects:", error.response ? error.response.data : error.message)
      throw error
    }
  },
  getProjectDetails: async (projectId) => {
    try {
      const response = await axios.get(`${API_URL}/projects/${projectId}/project`, {
        ...getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error("Error fetching project details:", error.response ? error.response.data : error.message)
      throw error
    }
  },
  saveProjectPlans: async (projectId, planData) => {
    try {
      const response = await axios.post(`${API_URL}/projects/${projectId}/plans`, planData, getAuthHeaders())
      if (response.status < 200 || response.status >= 300) {
        throw new Error("Failed to save project plans")
      }
      return response.data
    } catch (error) {
      console.error("Error saving project plans:", error.response ? error.response.data : error.message)
      throw error
    }
  },
  getProjectPlansByProjectId: async (projectId) => {
    try {
      const response = await axios.get(`${API_URL}/projects/${projectId}/plans`, getAuthHeaders())
      return response.data
    } catch (error) {
      console.error("Error fetching project plans:", error.response ? error.response.data : error.message)
      throw error
    }
  },
  async getProjectPlanHistory(projectId, planType) {
    const response = await axios.get(
      `${API_URL}/projects/${projectId}/plans/history?planType=${planType}`,
      getAuthHeaders(),
    )
    return response.data
  },
  getLeadByLeadId: async (leadId) => {
    try {
      const response = await axios.get(`${API_URL}/projects/${leadId}/leaddetails`, getAuthHeaders())
      return response.data
    } catch (error) {
      console.error("Error fetching project by lead ID:", error.response ? error.response.data : error.message)
      throw error
    }
  },
  getProjectManagerList: async () => {
    try {
      const user = { orgId: 1 } // Placeholder for user object
      const response = await axios.get(`${API_URL}/projects/pmlist/${user.orgId || 1}`, getAuthHeaders())
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },
  getSiteEngineerList: async () => {
    try {
      const user = { orgId: 1 } // Placeholder for user object
      const response = await axios.get(`${API_URL}/projects/selist/${user.orgId || 1}`, getAuthHeaders())
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },
  getSiteEngineerProjects: async (page = 0, size = 30, assignedSE) => {
    try {
      const queryParams = {
        page,
        size,
        assignedSE,
      }
      const queryString = ""
      if (queryString) {
        queryParams.query = queryString
      }
      console.log("Sending API request with params:", queryParams)
      const response = await axios.get(`${API_URL}/projects/siteengineerprojects`, {
        params: queryParams,
      })
      return response.data
    } catch (error) {
      console.error("API Error:", error)
      throw new Error("Failed to fetch assigned leads: " + (error.message || "Unknown error"))
    }
  },
  async updateProjectDetails(projectId, details) {
    try {
      const response = await axios.put(`${API_URL}/projects/${projectId}/update-details`, details, getAuthHeaders())
      return response.data
    } catch (error) {
      console.error("Error updating project details:", error.response ? error.response.data : error.message)
      throw error
    }
  },
  saveProjectPlanBOQ: async (boqData) => {
    try {
      const response = await axios.post(`${API_URL}/projects/saveProjectPlanBOQ`, boqData, getAuthHeaders())
      return response.data
    } catch (error) {
      console.error("Error saving project plan BOQ:", error.response ? error.response.data : error.message)
      throw error
    }
  },
  getProjectPlanBOQ: async (projectId, projectPlanId) => {
    try {
      const response = await axios.get(`${API_URL}/projects/${projectId}/plans/${projectPlanId}/boq`, getAuthHeaders())
      return response.data
    } catch (error) {
      console.error("Error fetching project plan BOQ:", error.response ? error.response.data : error.message)
      throw error
    }
  },

  async getProjectDocuments(projectId) {
    try {
      console.log("[v0] Fetching documents for project ID:", projectId)
      const response = await fetch(`${API_URL}/projects/${projectId}/documents`, {
        method: "GET",
        ...getAuthHeaders(),
      })
      if (!response.ok) {
        console.error("[v0] Failed to fetch documents, status:", response.status)
        throw new Error("Failed to fetch documents")
      }
      const documents = await response.json()
      console.log("[v0] Service received documents:", documents)
      return documents
    } catch (error) {
      console.error("Error fetching project documents:", error)
      return []
    }
  },

  async uploadProjectDocument(formData) {
    try {
      const response = await fetch(`${API_URL}/projects/upload-project-document`, {
        method: "POST",
        body: formData,
        ...getAuthHeadersForFormData(),
      })

      if (!response.ok) throw new Error("Failed to upload document")
      return await response.json()
    } catch (error) {
      console.error("Error uploading document:", error)
      throw error
    }
  },

  async uploadImageToS3(file, documentType, leadId) {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("documentType", documentType)
    formData.append("leadId", leadId)

    return await this.uploadProjectDocument(formData)
  },

  async deleteProjectDocument(documentId, fileUrl) {
    try {
      const response = await fetch(`${API_URL}/projects/documents/${documentId}`, {
        method: "DELETE",
        ...getAuthHeaders(),
      })
      if (!response.ok) throw new Error("Failed to delete document")
      return true
    } catch (error) {
      console.error("Error deleting document:", error)
      throw error
    }
  }

}
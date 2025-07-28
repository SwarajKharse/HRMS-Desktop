import axios from "axios"

const API_URL = `${process.env.REACT_APP_API_URL}`

const getAuthHeaders = () => {
  return {
    headers: {
      "Content-Type": "application/json",
      // Add authorization header if your authService provides a token
      // 'Authorization': `Bearer ${authService.getToken()}`,
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
  updateBOQItemApprovalStatus: async (boqItemId, approvalType, status, remarks) => {
    try {
      const response = await axios.put(`${API_URL}/projects/boqItem/${boqItemId}/approval`, null, {
        ...getAuthHeaders(),
        params: {
          approvalType,
          status,
          remarks,
        },
      })
      return response.data
    } catch (error) {
      console.error("Error updating BOQ Item approval status:", error.response ? error.response.data : error.message)
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
  // Get project details (now returns ProjectResponseDTO without plan data maps)
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
  // Unified save function for all plans
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
  // Unified fetch function for all plans
  getProjectPlansByProjectId: async (projectId) => {
    try {
      const response = await axios.get(`${API_URL}/projects/${projectId}/plans`, getAuthHeaders())
      return response.data
    } catch (error) {
      console.error("Error fetching project plans:", error.response ? error.response.data : error.message)
      throw error
    }
  },
  // New unified fetch function for project plan history
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

  getSiteEngineerProjects: async (
    page = 0,
    size = 30,
    assignedSE,
  ) => {
    try {
      const queryParams = {
        page,
        size,
        assignedSE
      }

      let queryString = ""

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
}
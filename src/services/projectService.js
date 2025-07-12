import axios from "axios"

const API_URL = `${process.env.REACT_APP_API_URL}`

const getAuthHeaders = () => {
  return {
    headers: {
      "Content-Type": "application/json",
    },
  }
}

export const projectService = {
  createOrUpdateProject: async (projectData, amc_or_project, leadId) => {
    try {
      const response = await axios.post(
        `${API_URL}/projects/createOrUpdate/${leadId}?amc_or_project=${amc_or_project}`,
        projectData,
      )
      return response.data
    } catch (error) {
      console.error("Error creating or updating project:", error.response ? error.response.data : error.message)
      throw error
    }
  },

  getProjectByLeadId: async (leadId) => {
    try {
      const response = await axios.get(`${API_URL}/projects/byLead/${leadId}`)
      return response.data
    } catch (error) {
      console.error("Error fetching project by lead ID:", error.response ? error.response.data : error.message)
      throw error
    }
  },

  createOrUpdateBOQ: async (projectId, boqRequest) => {
    try {
      const response = await axios.post(`${API_URL}/projects/${projectId}/boq`, boqRequest)
      return response.data
    } catch (error) {
      console.error("Error creating or updating BOQ:", error.response ? error.response.data : error.message)
      throw error
    }
  },

  getBOQByProjectId: async (projectId) => {
    try {
      const response = await axios.get(`${API_URL}/projects/${projectId}/boq`)
      return response.data
    } catch (error) {
      console.error("Error fetching BOQ by project ID:", error.response ? error.response.data : error.message)
      throw error
    }
  },

  saveBOQWithMaterialRequisition: async (projectId, enhancedBOQRequest) => {
    try {
      const response = await axios.post(`${API_URL}/projects/${projectId}/boq/saveWithMTR`, enhancedBOQRequest)
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
      // Frontend sends a JSON object { title: "..." }
      const response = await axios.put(`${API_URL}/projects/${projectId}/title`, { title: newTitle })
      return response.data
    } catch (error) {
      console.error("Error updating project title:", error.response ? error.response.data : error.message)
      throw error
    }
  },

  updateBOQItemApprovalStatus: async (boqItemId, approvalType, status, remarks) => {
    try {
      const response = await axios.put(`${API_URL}/projects/boqItem/${boqItemId}/approval`, null, {
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

  // Get project details
  getProjectDetails: async (projectId) => {
    try {
      const response = await axios.get(`${API_URL}/projects/${projectId}/project`, {
        ...getAuthHeaders()
      })
      return response.data
    } catch (error) {
      console.error("Error fetching project details:", error)
      throw error
    }
  },

  // Save project initiation plan
  saveProjectInitiationPlan: async (planData) => {
    try {
      const response = await fetch(`/api/projects/${planData.projectId}/initiation-plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(planData),
      })

      if (!response.ok) {
        throw new Error("Failed to save project initiation plan")
      }

      return await response.json()
    } catch (error) {
      console.error("Error saving project initiation plan:", error)
      throw error
    }
  },

  getLeadByLeadId: async (leadId) => {
    try {
      const response = await axios.get(`${API_URL}/projects/${leadId}/leaddetails`)
      return response.data
    } catch (error) {
      console.error("Error fetching project by lead ID:", error.response ? error.response.data : error.message)
      throw error
    }
  },
}

//export default projectService

const API_BASE_URL = `${process.env.REACT_APP_API_URL}/project`

const getAuthHeaders = () => {
  return {
    headers: {
      "Content-Type": "application/json",
    },
  }
}

class ProjectService {
  // Enhanced method for saving BOQ with material requisitions
  async saveBOQWithMaterialRequisition(projectId, boqData) {
    try {
      console.log("Saving BOQ with material requisitions for project:", projectId)
      console.log("BOQ Data:", JSON.stringify(boqData, null, 2))

      const response = await fetch(`${API_BASE_URL}/${projectId}/boq/material-requisition`, {
        method: "POST",
        ...getAuthHeaders(),
        body: JSON.stringify(boqData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log("BOQ saved successfully:", result)
      return result
    } catch (error) {
      console.error("Error saving BOQ with material requisitions:", error)
      throw error
    }
  }

  async createOrUpdateBOQ(projectId, boqData) {
    try {
      console.log("Creating/updating BOQ for project:", projectId)

      const response = await fetch(`${API_BASE_URL}/${projectId}/boq`, {
        method: "POST",
        ...getAuthHeaders(),
        body: JSON.stringify(boqData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error creating/updating BOQ:", error)
      throw error
    }
  }

  async getBOQ(projectId) {
    try {
      console.log("Fetching BOQ for project:", projectId)

      const response = await fetch(`${API_BASE_URL}/${projectId}/boq`, {
        method: "GET",
        ...getAuthHeaders(),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error fetching BOQ:", error)
      throw error
    }
  }

  // Method for updating BOQ item approval status
  async updateBOQItemApprovalStatus(projectId, boqItemId, approvalData) {
    try {
      console.log("Updating approval status for BOQ item:", boqItemId)

      const response = await fetch(`${API_BASE_URL}/${projectId}/boq/item/${boqItemId}/approval`, {
        method: "PUT",
        ...getAuthHeaders(),
        body: JSON.stringify(approvalData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error updating approval status:", error)
      throw error
    }
  }

  async getProjectByLeadId(leadId) {
    try {
      const response = await fetch(`${API_BASE_URL}/lead/${leadId}`, {
        method: "GET",
        ...getAuthHeaders(),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error fetching project by lead ID:", error)
      throw error
    }
  }

  async createOrUpdateProject(projectData, amcOrProject, leadId) {
    try {
      const response = await fetch(`${API_BASE_URL}/create/${amcOrProject}/${leadId}`, {
        method: "POST",
        ...getAuthHeaders(),
        body: JSON.stringify(projectData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error creating/updating project:", error)
      throw error
    }
  }

  async updateProjectTitle(projectId, newTitle) {
    try {
      const response = await fetch(`${API_BASE_URL}/${projectId}/title`, {
        method: "PUT",
       ...getAuthHeaders(),
        body: JSON.stringify(newTitle),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error updating project title:", error)
      throw error
    }
  }

  async getNewProjects(page = 0, size = 30) {
    try {
      const response = await fetch(`${API_BASE_URL}/getnewprojects?page=${page}&size=${size}`, {
        method: "GET",
        ...getAuthHeaders(),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error fetching new projects:", error)
      throw error
    }
  }
}

export const projectService = new ProjectService()

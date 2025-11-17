import axios from "axios"

const API_BASE_URL = `${process.env.REACT_APP_API_URL}`

const getAuthHeaders = () => {
  return {
    headers: {
      "Content-Type": "application/json",
    },
  }
}

export const receivableService = {
  getProjects: async (page = 0, size = 10, search = "", projectName = "", status = "") => {
    try {
      const params = {
        page: page.toString(),
        size: size.toString(),
        ...(search && { search }),
        ...(projectName && { projectName }),
        ...(status && { status }),
      }

      const response = await axios.get(`${API_BASE_URL}/receivables/projects`, {
        params,
        ...getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error("Error fetching projects:", error)
      throw error
    }
  },

  getAllInvoices: async (
    page = 0,
    size = 10,
    search = "",
    invoiceType = "",
    approvalStatus = "",
    paymentStatus = "",
    projectId = null,
  ) => {
    try {
      const params = {
        page: page.toString(),
        size: size.toString(),
        ...(search && { search }),
        ...(invoiceType && { invoiceType }),
        ...(approvalStatus && { approvalStatus }),
        ...(paymentStatus && { paymentStatus }),
        ...(projectId && { projectId: projectId.toString() }),
      }

      const response = await axios.get(`${API_BASE_URL}/receivables/invoices`, {
        params,
        ...getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error("Error fetching invoices:", error)
      throw error
    }
  },

  bulkUpdateInvoices: async (updates) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/receivables/invoices/bulk-update`, updates, {
        ...getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error("Error updating invoices:", error)
      throw error
    }
  },

  uploadPaymentDocumentForInvoice: async (invoiceId, formData) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/receivables/invoices/${invoiceId}/payment-document`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      )
      return response.data
    } catch (error) {
      console.error("Error uploading payment document:", error)
      throw error
    }
  },

  getAssistantProjects: async (page = 0, size = 10, search = "", projectName = "", status = "", employeeId) => {
    try {
      const params = {
        page: page.toString(),
        size: size.toString(),
        ...(search && { search }),
        ...(projectName && { projectName }),
        ...(status && { status }),
        ...(employeeId && { employeeId }),
      }

      const response = await axios.get(`${API_BASE_URL}/receivables/my-projects`, {
        params,
        ...getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error("Error fetching projects:", error)
      throw error
    }
  },

  getProjectNames: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/receivables/project-names`, {
        ...getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error("Error fetching project names:", error)
      throw error
    }
  },

  getProjectById: async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/receivables/projects/${id}`, {
        ...getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error("Error fetching project:", error)
      throw error
    }
  },

  getAssistants: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/receivables/assistants`, {
        ...getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error("Error fetching assistants:", error)
      throw error
    }
  },

  assignAssistant: async (projectId, assistantId) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/receivables/projects/${projectId}/assign-assistant`,
        { assistantId },
        {
          ...getAuthHeaders(),
        },
      )
      return response.data
    } catch (error) {
      console.error("Error assigning assistant:", error)
      throw error
    }
  },

  updateProject: async (projectId, projectData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/receivables/projects/${projectId}`, projectData, {
        ...getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error("Error updating project:", error)
      throw error
    }
  },

  getProjectStatuses: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/receivables/project-statuses`, {
        ...getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error("Error fetching project statuses:", error)
      throw error
    }
  },

  downloadFile: async (projectId, fileType) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/receivables/projects/${projectId}/download/${fileType}`, {
        ...getAuthHeaders(),
        responseType: "blob",
      })
      return response.data
    } catch (error) {
      console.error(`Error downloading ${fileType}:`, error)
      throw error
    }
  },

  getProjectBOQ: async (projectId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/receivables/projects/${projectId}/boq`, {
        ...getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error("Error fetching project BOQ:", error)
      throw error
    }
  },
}
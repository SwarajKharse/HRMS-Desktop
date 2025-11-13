import axios from "axios"

const API_URL = `${process.env.REACT_APP_API_URL}`

const getAuthHeaders = () => {
  // This function should ideally retrieve authentication tokens (e.g., from localStorage or a context)
  // and include them in the headers. For now, it's a placeholder.
  return {
    headers: {
      "Content-Type": "application/json",
      // Example: "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
    },
  }
}

export const materialRequisitionService = {
  fetchMaterialRequisitions: async (queryParams) => {
    try {
      const response = await axios.get(`${API_URL}/material-requisitions?${queryParams}`, {
        ...getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error("Error fetching material requisitions:", error.response ? error.response.data : error.message)
      throw error
    }
  },

  updateMaterialRequisition: async (mtrId, updatedData, currentUserId) => {
    try {
      const response = await axios.put(
        `${API_URL}/material-requisitions/${mtrId}?currentUserId=${currentUserId}`,
        updatedData,
        {
          ...getAuthHeaders(),
        },
      )
      return response.data
    } catch (error) {
      console.error(
        `Error updating material requisition ${mtrId}:`,
        error.response ? error.response.data : error.message,
      )
      throw error
    }
  },

  deleteMaterialRequisition: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/material-requisitions/${id}`)
      return response.data
    } catch (error) {
      console.error("Error deleting material requisition:", error)
      throw error
    }
  },

  approveMaterialRequisition: async (id, approvalData) => {
    try {
      const response = await axios.put(`${API_URL}/material-requisitions/${id}/approve`, approvalData)
      return response.data
    } catch (error) {
      console.error("Error approving material requisition:", error)
      throw error
    }
  },

  getMaterialRequisitionById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/api/material-requisitions/${id}`, {
        ...getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error("Error fetching material requisition:", error)
      throw error
    }
  },

  getMaterialRequisitionsByStoreIncharge: async (
    storeInchargeId,
    filters = {},
    page = 0,
    size = 10,
    sortBy = "createdAt",
    sortDir = "DESC",
  ) => {
    try {
      const params = {
        storeInchargeId,
        page,
        size,
        sortBy,
        sortDir,
        ...filters,
      }

      // Remove undefined/null values
      Object.keys(params).forEach((key) => {
        if (params[key] === undefined || params[key] === null || params[key] === "") {
          delete params[key]
        }
      })

      const response = await axios.get(`${API_URL}/material-requisitions/store-incharge`, {
        params,
        ...getAuthHeaders(),
      })

      return response.data
    } catch (error) {
      console.error(
        "Error fetching material requisitions by store incharge:",
        error.response ? error.response.data : error.message,
      )
      throw error
    }
  },

  addDCQty: async (mtrId, dcQtyData, currentUserId) => {
    try {
      const response = await axios.post(
        `${API_URL}/material-requisitions/${mtrId}/dc-qty?currentUserId=${currentUserId}`,
        dcQtyData,
        {
          ...getAuthHeaders(),
        },
      )
      return response.data
    } catch (error) {
      console.error("Error adding DC Qty:", error.response ? error.response.data : error.message)
      throw error
    }
  },

  getDCQtyByMtrId: async (mtrId) => {
    try {
      const response = await axios.get(`${API_URL}/material-requisitions/${mtrId}/dc-qty`, {
        ...getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error("Error fetching DC Qty:", error.response ? error.response.data : error.message)
      throw error
    }
  },

  updateDCQty: async (dcQtyId, dcQtyData, currentUserId) => {
    try {
      const response = await axios.put(
        `${API_URL}/material-requisitions/dc-qty/${dcQtyId}?currentUserId=${currentUserId}`,
        dcQtyData,
        {
          ...getAuthHeaders(),
        },
      )
      return response.data
    } catch (error) {
      console.error("Error updating DC Qty:", error.response ? error.response.data : error.message)
      throw error
    }
  },

  deleteDCQty: async (dcQtyId) => {
    try {
      const response = await axios.delete(`${API_URL}/material-requisitions/dc-qty/${dcQtyId}`, {
        ...getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error("Error deleting DC Qty:", error.response ? error.response.data : error.message)
      throw error
    }
  },

}
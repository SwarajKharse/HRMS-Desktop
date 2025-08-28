import axios from "axios"

const API_BASE_URL = `${process.env.REACT_APP_API_URL}` || "https://your-api-base-url.com"

export const comparisonSheetService = {
  updateMaterialRequisition: async (mtrId, payload) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/material-requisitions/${mtrId}`, payload)
      return response.data
    } catch (error) {
      console.error("Error updating material requisition:", error)
      throw error
    }
  },

  getMaterialRequisitionById: async (mtrId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/material-requisitions/${mtrId}/with-comparison-sheet`)
      return response.data
    } catch (error) {
      console.error("Error fetching material requisition with comparison sheet:", error)
      throw error
    }
  },

  getMaterialRequisitions: async (filters = {}) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/material-requisitions`, {
        params: filters,
      })
      return response.data
    } catch (error) {
      console.error("Error fetching material requisitions:", error)
      throw error
    }
  },

  getPMApprovedMaterialRequisitions: async (filters = {}) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/material-requisitions/pm-approved`, {
        params: filters,
      })
      return response.data
    } catch (error) {
      console.error("Error fetching PM approved material requisitions:", error)
      throw error
    }
  },

  updatePMApprovalStatus: async (mtrId, status, remarks = "") => {
    try {
      const response = await axios.put(`${API_BASE_URL}/material-requisitions/${mtrId}/pm-approval`, null, {
        params: {
          status: status,
          remarks: remarks,
          currentUserId: 1,
        },
      })
      return response.data
    } catch (error) {
      console.error("Error updating PM approval status:", error)
      throw error
    }
  },

  getPurchasers: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/material-requisitions/employees/purchasers`)
      return response.data
    } catch (error) {
      console.error("Error fetching purchasers:", error)
      throw error
    }
  },

  assignPurchaser: async (mtrId, purchaserId) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/material-requisitions/${mtrId}/assign-purchaser`, null, {
        params: {
          purchaserId: purchaserId,
          currentUserId: 1,
        },
      })
      return response.data
    } catch (error) {
      console.error("Error assigning purchaser:", error)
      throw error
    }
  },

  getComparisonSheet: async (mtrId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/material-requisitions/${mtrId}/comparison-sheets`)
      return response.data
    } catch (error) {
      console.error("Error fetching comparison sheet:", error)
      throw error
    }
  },

  saveComparisonSheet: async (comparisonData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/material-requisitions/comparison-sheet`, comparisonData, {
        params: {
          currentUserId: 1,
        },
      })
      return response.data
    } catch (error) {
      console.error("Error saving comparison sheet:", error)
      throw error
    }
  },

  updateSelectedVendor: async (comparisonSheetId, selectedVendor) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/material-requisitions/comparison-sheet/${comparisonSheetId}/select-vendor`,
        null,
        {
          params: {
            selectedVendor: selectedVendor,
          },
        },
      )
      return response.data
    } catch (error) {
      console.error("Error updating selected vendor:", error)
      throw error
    }
  },

  getComparisonSheetById: async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/material-requisitions/comparison-sheet/${id}`)
      return response.data
    } catch (error) {
      console.error("Error fetching comparison sheet by ID:", error)
      throw error
    }
  },
}
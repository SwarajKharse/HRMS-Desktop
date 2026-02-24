import axios from "axios"

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080/api"


const getAuthHeaders = () => {
  return {
    headers: {
      "Content-Type": "application/json",
    },
  }
}

export const materialRequisitionService = {
  // Fetch all material requisitions with filters
  fetchMaterialRequisitions: async (queryParams) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/material-requisitions?${queryParams}`,
        getAuthHeaders(),
      )
      return response.data
    } catch (error) {
      console.error("Error fetching material requisitions:", error.response ? error.response.data : error.message)
      throw error
    }
  },

  // Fetch approved MTRs for purchase
  // This filters MTRs where:
  // 1. BOQMTR.pmApprovalStatus = 'APPROVED' (MTR approved by project manager)
  // 2. BOQItem.salestlApprovalStatus = 'APPROVED' (Product approved by sales TL)
  fetchApprovedMTRsForPurchase: async (queryParams) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/material-requisitions/approved-for-purchase?${queryParams}`,
        getAuthHeaders(),
      )
      return response.data
    } catch (error) {
      console.error(
        "Error fetching approved MTRs for purchase:",
        error.response ? error.response.data : error.message,
      )
      throw error
    }
  },

  // Get material requisition details by ID
  getMaterialRequisitionDetails: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/material-requisitions/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
      if (!response.ok) {
        throw new Error("Failed to fetch material requisition details")
      }
      return await response.json()
    } catch (error) {
      console.error("Error fetching MTR details:", error)
      throw error
    }
  },

  // Update material requisition
  updateMaterialRequisition: async (id, data, currentUserId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/material-requisitions/${id}?currentUserId=${currentUserId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      )
      if (!response.ok) {
        throw new Error("Failed to update material requisition")
      }
      return await response.json()
    } catch (error) {
      console.error("Error updating MTR:", error)
      throw error
    }
  },

  // Update PM (Project Manager) approval status
  updatePMApprovalStatus: async (id, status, remarks, currentUserId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/material-requisitions/${id}/pm-approval?status=${status}&remarks=${remarks || ""}&currentUserId=${currentUserId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      if (!response.ok) {
        throw new Error("Failed to update PM approval status")
      }
      return await response.json()
    } catch (error) {
      console.error("Error updating PM approval status:", error)
      throw error
    }
  },

  // Create comparison sheet for MTR
  createComparisonSheet: async (mtrId, currentUserId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/material-requisitions/${mtrId}/comparison-sheet?currentUserId=${currentUserId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      if (!response.ok) {
        throw new Error("Failed to create comparison sheet")
      }
      return await response.json()
    } catch (error) {
      console.error("Error creating comparison sheet:", error)
      throw error
    }
  },

  // Save comparison sheet with items and selected vendor
  saveComparisonSheet: async (boqMtrId, items, selectedVendor, currentUserId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/material-requisitions/comparison-sheet?currentUserId=${currentUserId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            boqMtrId,
            items,
            selectedVendor,
          }),
        }
      )
      if (!response.ok) {
        throw new Error("Failed to save comparison sheet")
      }
      return await response.json()
    } catch (error) {
      console.error("Error saving comparison sheet:", error)
      throw error
    }
  },

  // Get comparison sheets by MTR ID
  getComparisonSheetsByMtrId: async (mtrId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/material-requisitions/${mtrId}/comparison-sheets`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      if (!response.ok) {
        throw new Error("Failed to fetch comparison sheets")
      }
      return await response.json()
    } catch (error) {
      console.error("Error fetching comparison sheets:", error)
      throw error
    }
  },

  // Get material requisitions by project ID
  getMaterialRequisitionsByProjectId: async (projectId, currentUserId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/material-requisitions/project/${projectId}?currentUserId=${currentUserId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      if (!response.ok) {
        throw new Error("Failed to fetch material requisitions by project")
      }
      return await response.json()
    } catch (error) {
      console.error("Error fetching MTRs by project:", error)
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

      const response = await axios.get(`${API_BASE_URL}/material-requisitions/store-incharge`, {
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

  // Create material requisition
  createMaterialRequisition: async (data, currentUserId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/material-requisitions?currentUserId=${currentUserId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      )
      if (!response.ok) {
        throw new Error("Failed to create material requisition")
      }
      return await response.json()
    } catch (error) {
      console.error("Error creating MTR:", error)
      throw error
    }
  },

  // Upload file (if needed for MTR documents)
  uploadFile: async (file, mtrId) => {
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("mtrId", mtrId)

      const response = await fetch(`${API_BASE_URL}/material-requisitions/upload`, {
        method: "POST",
        body: formData,
      })
      if (!response.ok) {
        throw new Error("Failed to upload file")
      }
      return await response.json()
    } catch (error) {
      console.error("Error uploading file:", error)
      throw error
    }
  },

  selectVendorForComparisonSheet: async (comparisonSheetId, selectedVendor) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/material-requisitions/comparison-sheet/${comparisonSheetId}/select-vendor?selectedVendor=${encodeURIComponent(selectedVendor)}`,
        {},
        getAuthHeaders(),
      )
      return response.data
    } catch (error) {
      console.error("Error selecting vendor:", error.response ? error.response.data : error.message)
      throw error
    }
  },

  // Get DC quantities by MTR ID
  getDCQtyByMtrId: async (mtrId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/material-requisitions/${mtrId}/dc-qty`,
        getAuthHeaders(),
      )
      return response.data
    } catch (error) {
      console.error("Error fetching DC Qty by MTR ID:", error.response ? error.response.data : error.message)
      throw error
    }
  },

  // Add new DC quantity
  addDCQty: async (mtrId, dcQtyData, currentUserId) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/material-requisitions/${mtrId}/dc-qty?currentUserId=${currentUserId}`,
        dcQtyData,
        getAuthHeaders(),
      )
      return response.data
    } catch (error) {
      console.error("Error adding DC Qty:", error.response ? error.response.data : error.message)
      throw error
    }
  },

  // Update DC quantity
  updateDCQty: async (dcQtyId, dcQtyData, currentUserId) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/material-requisitions/dc-qty/${dcQtyId}?currentUserId=${currentUserId}`,
        dcQtyData,
        getAuthHeaders(),
      )
      return response.data
    } catch (error) {
      console.error("Error updating DC Qty:", error.response ? error.response.data : error.message)
      throw error
    }
  },

  // Delete DC quantity
  deleteDCQty: async (dcQtyId) => {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/material-requisitions/dc-qty/${dcQtyId}`,
        getAuthHeaders(),
      )
      return response.data
    } catch (error) {
      console.error("Error deleting DC Qty:", error.response ? error.response.data : error.message)
      throw error
    }
  },

   getTotalDCQtyByMtrId: async (mtrId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/material-requisitions/${mtrId}/total-dc-qty`,
        getAuthHeaders(),
      )
      return response.data
    } catch (error) {
      console.error("Error fetching total DC Qty for MTR:", error.response ? error.response.data : error.message)
      throw error
    }
  },
}
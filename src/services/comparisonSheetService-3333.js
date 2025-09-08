import axios from "axios"

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080/api"

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

  getAllVendors: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/material-requisitions/vendors`)
      return response.data
    } catch (error) {
      console.error("Error fetching vendors:", error)
      throw error
    }
  },

  searchVendors: async (searchTerm) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/material-requisitions/vendors/search`, {
        params: { q: searchTerm },
      })
      return response.data
    } catch (error) {
      console.error("Error searching vendors:", error)
      throw error
    }
  },

  createVendor: async (vendorName) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/material-requisitions/vendors`, null, {
        params: {
          vendorName: vendorName,
          currentUserId: 1,
        },
      })
      return response.data
    } catch (error) {
      console.error("Error creating vendor:", error)
      throw error
    }
  },

  getMTRWithComparisonSheet: async (mtrId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/material-requisitions/${mtrId}/with-comparison-sheet`)
      return response.data
    } catch (error) {
      console.error("Error fetching MTR with comparison sheet:", error)
      throw error
    }
  },

  getMTRsByApprovedVendor: async ({ vendorName, assignedPurchaser }) => {
    try {
      console.log("[v0] getMTRsByApprovedVendor called with:", { vendorName, assignedPurchaser })
      console.log("[v0] vendorName type:", typeof vendorName)
      console.log("[v0] vendorName value:", vendorName)
      console.log("[v0] assignedPurchaser type:", typeof assignedPurchaser)
      console.log("[v0] assignedPurchaser value:", assignedPurchaser)

      const params = new URLSearchParams({
        size: "1000",
      })

      if (assignedPurchaser) {
        params.append("assignedPurchaser", String(assignedPurchaser))
      }

      const endpoint = `${API_BASE_URL}/material-requisitions/pm-approved`
      console.log("[v0] Final API URL:", `${endpoint}?${params}`)

      const response = await axios.get(`${endpoint}?${params}`)

      let mtrs = response.data.content || response.data
      console.log("[v0] Raw API response:", response.data)
      console.log("[v0] Extracted MTRs from content:", mtrs)

      if (Array.isArray(mtrs)) {
        // Filter only approved MTRs since we're looking for approved vendor MTRs
        mtrs = mtrs.filter((mtr) => {
          console.log("[v0] Checking MTR:", { id: mtr.id, pmApprovalStatus: mtr.pmApprovalStatus })
          return mtr.pmApprovalStatus === "APPROVED"
        })

        console.log("[v0] Found approved MTRs:", mtrs.length)
        console.log(
          "[v0] MTR details:",
          mtrs.map((mtr) => ({
            id: mtr.id,
            mtrCode: mtr.mtrCode,
            pmApprovalStatus: mtr.pmApprovalStatus,
            assignedPurchaser: mtr.assignedPurchaser,
            projectName: mtr.projectName,
            purchaseMTR : mtr.purchaseMTR
          })),
        )
      } else {
        console.error("[v0] MTRs is not an array:", mtrs)
        mtrs = []
      }

      console.log("[v0] Final filtered MTRs:", mtrs)
      return mtrs
    } catch (error) {
      console.error("[v0] Error fetching MTRs by approved vendor:", error)
      console.error("[v0] Error status:", error.response?.status)
      console.error("[v0] Error message:", error.response?.data)
      console.error("[v0] Request URL:", error.config?.url)

      if (error.response?.status === 404) {
        console.warn("[v0] Backend endpoint not found, returning mock data for testing")
        return [
          {
            id: 1,
            mtrNumber: "MTR-001",
            description: "Test MTR 1",
            selectedVendorName: vendorName,
            pmApprovalStatus: "APPROVED",
          },
          {
            id: 2,
            mtrNumber: "MTR-002",
            description: "Test MTR 2",
            selectedVendorName: vendorName,
            pmApprovalStatus: "APPROVED",
          },
        ]
      }

      throw error
    }
  },

  uploadPOForMTRs: async (formData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/material-requisitions/upload-po`, formData, {
        headers: {
          //"Content-Type": "multipart/form-data",
        },
      })
      return response.data
    } catch (error) {
      console.error("Error uploading PO for MTRs:", error)
      throw error
    }
  },

  getPODetails: async (mtrId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/material-requisitions/${mtrId}/po-details`)
      return response.data
    } catch (error) {
      console.error("Error fetching PO details:", error)
      throw error
    }
  },
}
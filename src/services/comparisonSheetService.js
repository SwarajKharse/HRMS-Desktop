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

  getMaterialRequisitionById: async (mtrId, itemKind = "BILLABLE") => {
    try {
      const response = await axios.get(`${API_BASE_URL}/material-requisitions/${mtrId}/with-comparison-sheet`, {
        params: { itemKind },
      })
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

  updatePurchaseManagerApprovalStatus: async (mtrId, status, remarks = "", itemKind = "BILLABLE") => {
    try {
      const response = await axios.put(`${API_BASE_URL}/material-requisitions/${mtrId}/pm-approval`, null, {
        params: {
          status: status,
          remarks: remarks,
          itemKind: itemKind,
          currentUserId: 1,
        },
      })
      return response.data
    } catch (error) {
      console.error("Error updating Purchase Manager approval status:", error)
      throw error
    }
  },

  getMTRsByApprovedVendor: async ({ vendorName, assignedPurchaser }) => {
    try {
      console.log("[v0] getMTRsByApprovedVendor called with:", { vendorName, assignedPurchaser })

      const response = await axios.get(`${API_BASE_URL}/material-requisitions/purchasemanager-approved/vendor`, {
        params: {
          purchaserId: assignedPurchaser,
          vendorName: vendorName,
        },
      })

      const mtrs = response.data || []
      console.log("[v0] Fetched MTRs with vendor match from backend:", mtrs.length)
      console.log(
        "[v0] Filtered MTR details:",
        mtrs.map((mtr) => ({
          id: mtr.id,
          mtrCode: mtr.mtrCode,
          projectName: mtr.projectName,
          productName: mtr.productName,
        })),
      )

      return mtrs
    } catch (error) {
      console.error("[v0] Error fetching MTRs by approved vendor:", error)
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

  saveComparisonSheet: async (comparisonData,currentUserId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/material-requisitions/comparison-sheet`, comparisonData, {
        params: {
          currentUserId: currentUserId,
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

  getMTRWithComparisonSheet: async (mtrId, itemKind = "BILLABLE") => {
    try {
      const response = await axios.get(`${API_BASE_URL}/material-requisitions/${mtrId}/with-comparison-sheet`, {
        params: { itemKind },
      })
      return response.data
    } catch (error) {
      console.error("Error fetching MTR with comparison sheet:", error)
      throw error
    }
  },

 /*  getMTRsByApprovedVendor: async ({ vendorName, assignedPurchaser }) => {
    try {
      console.log("getMTRsByApprovedVendor called with:", { vendorName, assignedPurchaser })
      console.log("vendorName type:", typeof vendorName)
      console.log("vendorName value:", vendorName)
      console.log("assignedPurchaser type:", typeof assignedPurchaser)
      console.log("assignedPurchaser value:", assignedPurchaser)

      const params = new URLSearchParams({
        size: "1000",
      })

      if (assignedPurchaser) {
        params.append("assignedPurchaser", String(assignedPurchaser))
      }

      const endpoint = `${API_BASE_URL}/material-requisitions/pm-approved`
      console.log("Final API URL:", `${endpoint}?${params}`)

      const response = await axios.get(`${endpoint}?${params}`)

      let mtrs = response.data.content || response.data
      console.log("Raw API response:", response.data)
      console.log("Extracted MTRs from content:", mtrs)

      if (Array.isArray(mtrs)) {
        // Filter only approved MTRs since we're looking for approved vendor MTRs
        mtrs = mtrs.filter((mtr) => {
          console.log("Checking MTR:", { id: mtr.id, pmApprovalStatus: mtr.pmApprovalStatus })
          return mtr.pmApprovalStatus === "APPROVED"
        })

        console.log("Found approved MTRs:", mtrs.length)
        console.log(
          "MTR details:",
          mtrs.map((mtr) => ({
            id: mtr.id,
            mtrCode: mtr.mtrCode,
            pmApprovalStatus: mtr.pmApprovalStatus,
            assignedPurchaser: mtr.assignedPurchaser,
            projectName: mtr.projectName,
            purchaseMTR: mtr.purchaseMTR,
          })),
        )
      } else {
        console.error("MTRs is not an array:", mtrs)
        mtrs = []
      }

      console.log("Final filtered MTRs:", mtrs)
      return mtrs
    } catch (error) {
      console.error("Error fetching MTRs by approved vendor:", error)
      console.error("Error status:", error.response?.status)
      console.error("Error message:", error.response?.data)
      console.error("Request URL:", error.config?.url)

      if (error.response?.status === 404) {
        console.warn("Backend endpoint not found, returning mock data for testing")
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
  }, */

  uploadPOForMTRs: async (formData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/material-requisitions/upload-po`, formData, {
        headers: {
          //"Content-Type": "multipart/form-data",
        },
      })

      // Track uploaded POs in localStorage since backend doesn't provide retrieval endpoints
      if (response.data && response.data.uploadedPOs) {
        const uploadedPOs = JSON.parse(localStorage.getItem("uploadedPOs") || "{}")
        const poNumber = formData.get("poNumber")
        const fileName = formData.get("file")?.name || "Unknown"
        const mtrIds = formData.getAll("mtrIds")
        const currentUserId = formData.get("currentUserId")

        // Store PO info for each MTR
        mtrIds.forEach((mtrId) => {
          uploadedPOs[mtrId] = {
            poNumber: poNumber,
            fileName: fileName,
            uploadDate: new Date().toISOString(),
            approvalStatus: "PENDING",
            currentUserId: currentUserId,
          }
        })

        localStorage.setItem("uploadedPOs", JSON.stringify(uploadedPOs))
      }

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
      return []
    }
  },

  checkPOStatus: async (mtrId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/material-requisitions/${mtrId}/po-status`)
      return response.data
    } catch (error) {
      // If endpoint doesn't exist (403/404), fallback to localStorage for backward compatibility
      if (error.response?.status === 403 || error.response?.status === 404) {
        console.warn(`PO status endpoint not found for MTR ${mtrId}, using localStorage fallback`)
        const uploadedPOs = JSON.parse(localStorage.getItem("uploadedPOs") || "{}")
        const mtrPO = uploadedPOs[mtrId]

        if (mtrPO) {
          return {
            mtrId: mtrId,
            hasPO: true,
            poCount: 1,
            latestPO: {
              poNumber: mtrPO.poNumber,
              fileName: mtrPO.fileName,
              createdAt: mtrPO.uploadDate,
              approvalStatus: mtrPO.approvalStatus || "PENDING",
            },
          }
        }

        return { mtrId: mtrId, hasPO: false, poCount: 0 }
      }

      console.error("Error checking PO status:", error)
      return { mtrId: mtrId, hasPO: false, poCount: 0 }
    }
  },

  getPOsByMtrId: async (mtrId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/material-requisitions/${mtrId}/purchase-orders`)
      return response.data || []
    } catch (error) {
      // If endpoint doesn't exist (403/404), return empty array
      if (error.response?.status === 403 || error.response?.status === 404) {
        console.warn(`PO details endpoint not found for MTR ${mtrId}`)
        return []
      }
      console.error("Error fetching POs by MTR ID:", error)
      return []
    }
  },

  getMTRsWithPOStatus: async (filters = {}) => {
    try {
      // First get the approved MTRs
      const mtrsResponse = await comparisonSheetService.getPMApprovedMaterialRequisitions(filters)
      const mtrs = mtrsResponse.content || mtrsResponse

      if (!Array.isArray(mtrs)) {
        return { content: [], totalElements: 0, totalPages: 0 }
      }

      // Then check PO status for each MTR using the proper backend endpoint
      const mtrsWithPOStatus = await Promise.all(
        mtrs.map(async (mtr) => {
          const poStatus = await comparisonSheetService.checkPOStatus(mtr.id)
          return {
            ...mtr,
            poStatus: poStatus,
          }
        }),
      )

      return {
        content: mtrsWithPOStatus,
        totalElements: mtrsResponse.totalElements || mtrsWithPOStatus.length,
        totalPages: mtrsResponse.totalPages || 1,
        size: mtrsResponse.size || filters.size || 10,
        number: mtrsResponse.number || 0,
      }
    } catch (error) {
      console.error("Error fetching MTRs with PO status:", error)
      throw error
    }
    },
  
  getPOsByMtrIdWithDetails: async (mtrId) => {
    try {
      console.log("Making API call to fetch detailed POs for MTR:", mtrId)
      const url = `${API_BASE_URL}/material-requisitions/${mtrId}/purchase-orders-detailed`
      console.log("API URL:", url)

      const response = await axios.get(url)
      console.log("API response status:", response.status)
      console.log("API response data:", response.data)

      return response.data || []
    } catch (error) {
      console.error("Error fetching detailed POs by MTR ID:", error)
      console.error("Error response data:", error.response?.data)
      console.error("Error response status:", error.response?.status)
      console.error("Request URL:", error.config?.url)
      return []
    }
  },

  approvePO: async (poId, approvalStatus, remarks = "",currentUserId) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/material-requisitions/purchase-orders/${poId}/approval`, {
        approvalStatus: approvalStatus,
        approvalRemarks: remarks,
        currentUserId: currentUserId,
      })
      return response.data
    } catch (error) {
      console.error("Error updating PO approval:", error)
      throw error
    }
  },
}
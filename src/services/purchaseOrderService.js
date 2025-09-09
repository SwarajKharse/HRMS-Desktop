import axios from "axios"

const API_BASE_URL = `${process.env.REACT_APP_API_URL}` || "https://your-api-base-url.com"

export const purchaseOrderService = {
  getVendorNames: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/purchase-orders/vendors`)
      return response.data
    } catch (error) {
      console.error("Error fetching vendor names:", error)
      throw error
    }
  },

  getPurchaseOrdersByVendor: async (vendorName) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/purchase-orders/vendor/${encodeURIComponent(vendorName)}`)
      return response.data
    } catch (error) {
      console.error("Error fetching purchase orders by vendor:", error)
      throw error
    }
  },

  uploadPurchaseOrder: async (formData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/purchase-orders/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      return response.data
    } catch (error) {
      console.error("Error uploading purchase order:", error)
      throw error
    }
  },

  associatePOWithMTRs: async (poId, mtrIds) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/purchase-orders/${poId}/associate-mtrs`, mtrIds)
      return response.data
    } catch (error) {
      console.error("Error associating PO with MTRs:", error)
      throw error
    }
  },

  getPurchaseOrdersByMTR: async (mtrId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/purchase-orders/mtr/${mtrId}`)
      return response.data
    } catch (error) {
      console.error("Error fetching purchase orders by MTR:", error)
      throw error
    }
  },

  removePOFromMTR: async (mtrId, poId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/purchase-orders/mtr/${mtrId}/po/${poId}`)
      return response.data
    } catch (error) {
      console.error("Error removing PO from MTR:", error)
      throw error
    }
  },

  getProjectNamesByMTRIds: async (mtrIds) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/purchase-orders/project-names`, mtrIds)
      return response.data
    } catch (error) {
      console.error("Error fetching project names:", error)
      throw error
    }
  },

  getMTRsByVendor: async (vendorName) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/material-requisitions/by-vendor/${encodeURIComponent(vendorName)}`,
      )
      return response.data
    } catch (error) {
      console.error("Error fetching MTRs by vendor:", error)
      throw error
    }
  },

  getAllVendors: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/material-requisitions/vendors`)
      return response.data
    } catch (error) {
      console.error("Error fetching all vendors:", error)
      throw error
    }
  },

  updatePurchaseOrder: async (poId, formData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/material-requisitions/purchase-orders/${poId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      return response.data
    } catch (error) {
      console.error("Error updating purchase order:", error)
      throw error
    }
  },

  deletePurchaseOrder: async (poId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/material-requisitions/purchase-orders/${poId}`)
      return response.data
    } catch (error) {
      console.error("Error deleting purchase order:", error)
      throw error
    }
  },

  approvePurchaseOrder: async (poId, approvalData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/material-requisitions/purchase-orders/${poId}/approve`, approvalData)
      return response.data
    } catch (error) {
      console.error("Error approving purchase order:", error)
      throw error
    }
  },

  getPurchaseOrderById: async (poId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/material-requisitions/purchase-orders/${poId}`)
      return response.data
    } catch (error) {
      console.error("Error fetching purchase order:", error)
      throw error
    }
  },
}
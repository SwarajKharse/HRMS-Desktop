import axios from "axios"

const API_BASE_URL = `${process.env.REACT_APP_API_URL}` || "https://your-api-base-url.com"

export const grnService = {
  uploadGRN: async (formData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/goods-receipt-notes/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      return response.data
    } catch (error) {
      console.error("Error uploading GRN:", error)
      throw error
    }
  },

  getGRNsByPO: async (poId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/goods-receipt-notes/po/${poId}`)
      return response.data
    } catch (error) {
      console.error("Error fetching GRNs:", error)
      return []
    }
  },

  approveGRN: async (grnId, approvalData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/goods-receipt-notes/${grnId}/approve`, approvalData)
      return response.data
    } catch (error) {
      console.error("Error approving GRN:", error)
      throw error
    }
  },

  getPendingGRNs: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/goods-receipt-notes/pending-approval`)
      return response.data
    } catch (error) {
      console.error("Error fetching pending GRNs:", error)
      throw error
    }
  },

  transferToAccounts: async (grnId, handedOverBy) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/goods-receipt-notes/${grnId}/handover-to-accounts`, null, {
        params: { handedOverBy }
      })
      return response.data
    } catch (error) {
      console.error("Error transferring to accounts:", error)
      throw error
    }
  },
}
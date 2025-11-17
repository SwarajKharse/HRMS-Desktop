import axios from "axios"

const API_BASE_URL = `${process.env.REACT_APP_API_URL}`

const getAuthHeaders = () => {
  return {
    headers: {
      "Content-Type": "application/json",
    },
  }
}

export const financeReceivableService = {
  getAllReceivables: async (page = 0, size = 10, search = "", type = "", status = "") => {
    try {
      const params = {
        page: page.toString(),
        size: size.toString(),
        ...(search && { search }),
        ...(type && { type }),
        ...(status && { status }),
      }

      const response = await axios.get(`${API_BASE_URL}/finance-receivables`, {
        params,
        ...getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error("Error fetching receivables:", error)
      throw error
    }
  },

  getLeadDetails: async (projectId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/finance-receivables/lead-details/${projectId}`, {
        ...getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error("Error fetching lead details:", error)
      throw error
    }
  },

  updateFinancePaymentStatus: async (invoiceId, financePaymentStatus) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/finance-receivables/update-finance-status`,
        { invoiceId, financePaymentStatus },
        {
          ...getAuthHeaders(),
        },
      )
      return response.data
    } catch (error) {
      console.error("Error updating finance payment status:", error)
      throw error
    }
  },

  updateHandoverStatus: async (projectId, handoverStatus) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/finance-receivables/update-handover-status`,
        { projectId, handoverStatus },
        {
          ...getAuthHeaders(),
        },
      )
      return response.data
    } catch (error) {
      console.error("Error updating handover status:", error)
      throw error
    }
  },
}
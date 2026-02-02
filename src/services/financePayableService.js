import axios from "axios"

const API_BASE_URL = process.env.REACT_APP_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"

const getAuthHeaders = () => {
  return {
    headers: {
      "Content-Type": "application/json",
    },
  }
}

export const financePayableService = {
  getAllPayables: async (
    page = 0,
    size = 10,
    search = "",
    projectName = "",
    status = "",
    startDate = "",
    endDate = "",
  ) => {
    try {
      const params = {
        page: page.toString(),
        size: size.toString(),
        ...(search && { search }),
        ...(projectName && { projectName }),
        ...(status && { status }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      }

      const response = await axios.get(`${API_BASE_URL}/finance-payables`, {
        params,
        ...getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error("Error fetching payables:", error)
      throw error
    }
  },

  approveOrRejectPayable: async (poId, approvalStatus, remarks, financeUserId) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/finance-payables/${poId}/approve-reject`,
        {  approvalStatus, remarks, financeUserId },
        {
          ...getAuthHeaders(),
        },
      )
      return response.data
    } catch (error) {
      console.error("Error approving/rejecting payable:", error)
      throw error
    }
  },

  approvePIApproval: async (piId, approvalStatus, remarks, financeUserId) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/finance-payables/${piId}/approve-reject-pi`,
        { approvalStatus, remarks, userId: financeUserId },
        {
          ...getAuthHeaders(),
        },
      )
      return response.data
    } catch (error) {
      console.error("Error approving PI:", error)
      throw error
    }
  },

  handoverToPurchase: async (piId, financeUserId) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/finance-payables/handover-to-purchase`,
        { piId, financeUserId },
        {
          ...getAuthHeaders(),
        },
      )
      return response.data
    } catch (error) {
      console.error("Error handing over to purchase:", error)
      throw error
    }
  },
}
import axios from "axios"

const API_BASE_URL = `${process.env.REACT_APP_API_URL}` || "https://your-api-base-url.com"

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

export const purchaseInvoiceService = {
  uploadPurchaseInvoice: async (formData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/purchase-invoices/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      return response.data
    } catch (error) {
      console.error("Error uploading purchase invoice:", error)
      throw error
    }
  },

  getProjectNames: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/purchase-invoices/project-names`)
      return response.data
    } catch (error) {
      console.error("Error fetching project names:", error)
      throw error
    }
  },

  getAllPurchaseInvoices: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/purchase-invoices`)
      return response.data
    } catch (error) {
      console.error("Error fetching purchase invoices:", error)
      throw error
    }
  },

  getPurchaseInvoiceById: async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/purchase-invoices/${id}`)
      return response.data
    } catch (error) {
      console.error("Error fetching purchase invoice:", error)
      throw error
    }
  },

  approvePurchaseInvoice: async (id, approvalData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/purchase-invoices/${id}/approve`, approvalData)
      return response.data
    } catch (error) {
      console.error("Error approving purchase invoice:", error)
      throw error
    }
  },

  getPurchaseInvoiceByPOId: async (poId) => {
    try {
      console.log(`[v0] Fetching PI for PO ID: ${poId}`)
      const response = await axios.get(`${API_BASE_URL}/purchase-invoices/by-po/${poId}`, {
        ...getAuthHeaders(),
      })
      console.log(`[v0] PI response for PO ${poId}:`, response.data)
      return response.data
    } catch (error) {
      console.error(`[v0] Error fetching purchase invoice by PO ID ${poId}:`, error)
      // Return null instead of throwing error to handle "not found" cases gracefully
      if (error.response && error.response.status === 404) {
        return null
      }
      throw error
    }
  },

  getPurchaseInvoices: async (page = 0, size = 10, search = "", projectName = "", status = "") => {
    try {
      const params = {
        page: page.toString(),
        size: size.toString(),
        ...(search && { search }),
        ...(projectName && { projectName }),
        ...(status && { status }),
      }

      const response = await axios.get(`${API_BASE_URL}/purchase-invoices/paginated`, {
        params,
        ...getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error("Error fetching purchase invoices:", error)
      throw error
    }
  },

  getAccountants: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/purchase-invoices/accountants`, {
        ...getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error("Error fetching accountants:", error)
      throw error
    }
  },

  assignAccountant: async (piId, accountantId) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/purchase-invoices/${piId}/assign-accountant`,
        { accountantId },
        {
          ...getAuthHeaders(),
        },
      )
      return response.data
    } catch (error) {
      console.error("Error assigning accountant:", error)
      throw error
    }
  },



   getAssignedPurchaseInvoices: async (page = 0, size = 10, search = "", projectName = "", status = "",currentUserId) => {
    try {
      const params = {
        page: page.toString(),
        size: size.toString(),
        ...(search && { search }),
        ...(projectName && { projectName }),
        ...(status && { status }),
        ...(currentUserId && {currentUserId})
      }

      const response = await axios.get(`${API_BASE_URL}/purchase-invoices/assinedpis`, {
        params,
        ...getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error("Error fetching purchase invoices:", error)
      throw error
    }
  },
   
   getPaymentCycles: async () => {
    try {
      console.log("[v0] Fetching payment cycles...")
      const response = await axios.get(`${API_BASE_URL}/purchase-invoices/payment-cycles`, {
        ...getAuthHeaders(),
      })
      console.log("[v0] Payment cycles response:", response.data)
      return response.data
    } catch (error) {
      console.error("Error fetching payment cycles:", error)
      throw error
    }
  },

  updatePurchaseInvoiceForm: async (id, formData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/purchase-invoices/${id}/update-form`, formData, {
        ...getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error("Error updating purchase invoice form:", error)
      throw error
    }
  },

  completePayment: async (piId, approvalStatus, paymentDoneDate, receiptFile) => {
    try {
      const formData = new FormData()
      formData.append("accountManagerApprovalStatus", approvalStatus)
      formData.append("paymentDoneDate", paymentDoneDate)

      // Add current user ID (you should get this from your auth context)
      // formData.append("completedBy", getCurrentUserId())

      if (receiptFile) {
        formData.append("receiptFile", receiptFile)
      }

      const response = await axios.put(`${API_BASE_URL}/purchase-invoices/${piId}/complete-payment`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      return response.data
    } catch (error) {
      console.error("Error completing payment:", error)
      throw error
    }
  },
}
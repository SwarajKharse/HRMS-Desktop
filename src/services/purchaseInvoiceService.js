import axios from "axios"

const API_BASE_URL = `${process.env.REACT_APP_API_URL}` || "https://your-api-base-url.com"

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
}
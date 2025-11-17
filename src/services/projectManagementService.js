import axios from "axios"

const API_BASE_URL = `${process.env.REACT_APP_API_URL}`

const getAuthHeaders = () => {
  return {
    headers: {
      "Content-Type": "application/json",
    },
  }
}

const getMultipartHeaders = () => {
  return {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  }
}

export const projectManagementService = {
  getProjectPurchaseOrders: async (projectId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/project-management/projects/${projectId}/purchase-orders`,
        getAuthHeaders(),
      )
      return response.data
    } catch (error) {
      console.error("Error fetching project purchase orders:", error)
      throw error
    }
  },

  updatePurchaseOrderStatus: async (purchaseOrderId, status) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/project-management/purchase-orders/${purchaseOrderId}/status`,
        { status },
        getAuthHeaders(),
      )
      return response.data
    } catch (error) {
      console.error("Error updating purchase order status:", error)
      throw error
    }
  },

  uploadInvoiceDocument: async (projectId, formData) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/project-management/projects/${projectId}/invoice-documents`,
        formData,
        getMultipartHeaders(),
      )
      return response.data
    } catch (error) {
      console.error("Error uploading invoice document:", error)
      throw error
    }
  },

  uploadPaymentDocument: async (invoiceDocumentId, formData) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/project-management/invoice-documents/${invoiceDocumentId}/payment-documents`,
        formData,
        getMultipartHeaders(),
      )
      return response.data
    } catch (error) {
      console.error("Error uploading payment document:", error)
      throw error
    }
  },

  getProjectInvoiceDocuments: async (projectId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/project-management/projects/${projectId}/invoice-documents`,
        getAuthHeaders(),
      )
      return response.data
    } catch (error) {
      console.error("Error fetching invoice documents:", error)
      throw error
    }
  },

  updateInvoiceApprovalStatus: async (invoiceDocumentId, approvalStatus, remarks) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/project-management/invoice-documents/${invoiceDocumentId}/approval-status`,
        { approvalStatus, remarks },
        getAuthHeaders(),
      )
      return response.data
    } catch (error) {
      console.error("Error updating approval status:", error)
      throw error
    }
  },

  updateInvoiceSharedDate: async (invoiceDocumentId, sharedDate) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/project-management/invoice-documents/${invoiceDocumentId}/shared-date`,
        { sharedDate },
        getAuthHeaders(),
      )
      return response.data
    } catch (error) {
      console.error("Error updating shared date:", error)
      throw error
    }
  },
}
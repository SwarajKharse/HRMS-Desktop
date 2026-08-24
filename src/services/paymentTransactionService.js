import axios from "axios"

const API_BASE_URL = process.env.REACT_APP_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"

export const paymentTransactionService = {
  create: async ({ piId, grnId, requestedAmount, scheduledDate, createdBy }) => {
    const response = await axios.post(`${API_BASE_URL}/payment-transactions`, {
      piId, grnId, requestedAmount, scheduledDate, createdBy,
    })
    return response.data
  },

  reschedulePending: async (id, { scheduledDate, amount, userId }) => {
    const response = await axios.post(`${API_BASE_URL}/payment-transactions/${id}/reschedule-pending`, {
      scheduledDate, amount, userId,
    })
    return response.data
  },

  amApprove: async (id, { decision, approvedAmount, remarks, userId }) => {
    const response = await axios.put(`${API_BASE_URL}/payment-transactions/${id}/am-approve`, {
      decision, approvedAmount, remarks, userId,
    })
    return response.data
  },

  fmApprove: async (id, { decision, approvedAmount, remarks, userId }) => {
    const response = await axios.put(`${API_BASE_URL}/payment-transactions/${id}/fm-approve`, {
      decision, approvedAmount, remarks, userId,
    })
    return response.data
  },

  raiseToFm: async (transactionIds, userId) => {
    const response = await axios.post(`${API_BASE_URL}/payment-transactions/raise-to-fm`, {
      transactionIds, userId,
    })
    return response.data
  },

  completePayment: async (id, { paymentDoneDate, file, userId }) => {
    const formData = new FormData()
    if (paymentDoneDate) formData.append("paymentDoneDate", paymentDoneDate)
    if (file) formData.append("file", file)
    if (userId) formData.append("userId", userId)
    const response = await axios.put(`${API_BASE_URL}/payment-transactions/${id}/complete-payment`, formData)
    return response.data
  },

  markNotPaid: async (id, { remarks, userId }) => {
    const response = await axios.put(`${API_BASE_URL}/payment-transactions/${id}/mark-not-paid`, {
      remarks, userId,
    })
    return response.data
  },

  getCalendar: async (start, end) => {
    const response = await axios.get(`${API_BASE_URL}/payment-transactions/calendar`, { params: { start, end } })
    return response.data
  },

  getByDate: async (date) => {
    const response = await axios.get(`${API_BASE_URL}/payment-transactions/by-date`, { params: { date } })
    return response.data
  },

  getPending: async () => {
    const response = await axios.get(`${API_BASE_URL}/payment-transactions/pending`)
    return response.data
  },

  getEligible: async () => {
    const response = await axios.get(`${API_BASE_URL}/payment-transactions/eligible`)
    return response.data
  },

  step1: async ({ txnId, piId, grnId, status, paymentCycle, scheduledDate, amount, userId }) => {
    const response = await axios.post(`${API_BASE_URL}/payment-transactions/step1`, {
      txnId, piId, grnId, status, paymentCycle, scheduledDate, amount, userId,
    })
    return response.data
  },

  move: async (id, { scheduledDate, userId }) => {
    const response = await axios.put(`${API_BASE_URL}/payment-transactions/${id}/move`, {
      scheduledDate, userId,
    })
    return response.data
  },

  getAround: async (date, direction) => {
    const response = await axios.get(`${API_BASE_URL}/payment-transactions/around`, { params: { date, direction } })
    return response.data
  },

  getByPI: async (piId) => {
    const response = await axios.get(`${API_BASE_URL}/payment-transactions/by-pi/${piId}`)
    return response.data
  },

  getByGRN: async (grnId) => {
    const response = await axios.get(`${API_BASE_URL}/payment-transactions/by-grn/${grnId}`)
    return response.data
  },
}

import axios from "axios"

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080/api"

const paymentCycleService = {
  getAllPaymentCycles: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/payment-cycles/all`)
      return response
    } catch (error) {
      console.error("Error fetching all payment cycles:", error)
      throw error
    }
  },

  getAllEnabledPaymentCycles: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/payment-cycles/enabled`)
      return response
    } catch (error) {
      console.error("Error fetching enabled payment cycles:", error)
      throw error
    }
  },

  getPaymentCyclesByStatus: async (status) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/payment-cycles/status/${status}`)
      return response
    } catch (error) {
      console.error("Error fetching payment cycles by status:", error)
      throw error
    }
  },

  updatePaymentCycles: async (paymentCycles) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/payment-cycles/update-bulk`,
        paymentCycles
      )
      return response
    } catch (error) {
      console.error("Error updating payment cycles:", error)
      throw error
    }
  },

  updatePaymentCycle: async (id, paymentCycle) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/payment-cycles/${id}`,
        paymentCycle
      )
      return response
    } catch (error) {
      console.error("Error updating payment cycle:", error)
      throw error
    }
  },

  initializePaymentCycles: async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/payment-cycles/initialize`)
      return response
    } catch (error) {
      console.error("Error initializing payment cycles:", error)
      throw error
    }
  },
}

export { paymentCycleService }
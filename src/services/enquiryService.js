"use client"

import axios from "axios"

const BASE_URL = `${process.env.REACT_APP_API_URL}/enquiry`

const getAuthHeaders = () => {
  return {
    headers: {
      "Content-Type": "application/json",
    },
  }
}

export const enquiryService = {
  getNewEnquiries: async (page = 0, size = 10) => {
    try {
      const response = await axios.get(`${BASE_URL}/new`, {
        params: { page, size },
        ...getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  getEnquiryById: async (id) => {
    try {
      const response = await axios.get(`${BASE_URL}/${id}`, getAuthHeaders())
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  getDiscardedEnquiries: async (page = 0, size = 10) => {
    try {
      const response = await axios.get(`${BASE_URL}/discarded`, {
        params: { page, size },
        ...getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  discardEnquiry: async (id) => {
    try {
      const response = await axios.put(`${BASE_URL}/${id}/discard`, null, getAuthHeaders())
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  markConverted: async (id, leadId) => {
    try {
      const response = await axios.put(`${BASE_URL}/${id}/mark-converted`, null, {
        params: { leadId },
        ...getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },
}

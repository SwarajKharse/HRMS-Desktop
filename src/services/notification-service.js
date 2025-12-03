import axios from "axios"

const BASE_URL = `${process.env.REACT_APP_API_URL}/notifications`

const getAuthHeaders = () => {
  return {
    headers: {
      "Content-Type": "application/json",
    },
  }
}

export const notificationService = {
  // Get all notifications for a user
  getAllNotifications: async (userId) => {
    try {
      const response = await axios.get(`${BASE_URL}/user/${userId}`, getAuthHeaders())
      return response.data
    } catch (error) {
      console.error("Error in getAllNotifications:", error)
      throw error.response?.data || error.message
    }
  },

  // Get unread notifications for a user
  getUnreadNotifications: async (userId) => {
    try {
      const response = await axios.get(`${BASE_URL}/user/${userId}/unread`, getAuthHeaders())
      return response.data
    } catch (error) {
      console.error("Error in getUnreadNotifications:", error)
      throw error.response?.data || error.message
    }
  },

  // Get unread count for a user
  getUnreadCount: async (userId) => {
    try {
      const response = await axios.get(`${BASE_URL}/user/${userId}/unread-count`, getAuthHeaders())
      return response.data
    } catch (error) {
      console.error("Error in getUnreadCount:", error)
      throw error.response?.data || error.message
    }
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    try {
      const response = await axios.put(`${BASE_URL}/${notificationId}/mark-read`, {}, getAuthHeaders())
      return response.data
    } catch (error) {
      console.error("Error in markAsRead:", error)
      throw error.response?.data || error.message
    }
  },

  // Mark notification as unread
  markAsUnread: async (notificationId) => {
    try {
      const response = await axios.put(`${BASE_URL}/${notificationId}/mark-unread`, {}, getAuthHeaders())
      return response.data
    } catch (error) {
      console.error("Error in markAsUnread:", error)
      throw error.response?.data || error.message
    }
  },

  // Mark all notifications as read for a user
  markAllAsRead: async (userId) => {
    try {
      const response = await axios.put(`${BASE_URL}/user/${userId}/mark-all-read`, {}, getAuthHeaders())
      return response.data
    } catch (error) {
      console.error("Error in markAllAsRead:", error)
      throw error.response?.data || error.message
    }
  },

  // Delete a notification
  deleteNotification: async (notificationId) => {
    try {
      const response = await axios.delete(`${BASE_URL}/${notificationId}`, getAuthHeaders())
      return response.data
    } catch (error) {
      console.error("Error in deleteNotification:", error)
      throw error.response?.data || error.message
    }
  },

  // Send custom notification
  sendCustomNotification: async (data) => {
    try {
      const response = await axios.post(`${BASE_URL}/send`, data, getAuthHeaders())
      return response.data
    } catch (error) {
      console.error("Error in sendCustomNotification:", error)
      throw error.response?.data || error.message
    }
  },
}
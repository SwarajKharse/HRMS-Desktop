import axios from "axios"

const API_URL = `${process.env.REACT_APP_API_URL}`

const getAuthHeaders = () => {
  return {
    headers: {
      "Content-Type": "application/json",
      // Add authentication headers as needed
      // "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
    },
  }
}

export const comparisonSheetService = {
  // Save comparison sheet data
  saveComparisonSheet: async (comparisonData) => {
    try {
      const currentUserId = 1 // TODO: Get from authentication context

      const response = await axios.post(
        `${API_URL}/material-requisitions/comparison-sheet`,
        {
          boqMtrId: comparisonData.boqMtrId,
          items: comparisonData.items,
          selectedVendor: comparisonData.selectedVendor,
          createdBy: comparisonData.createdBy || currentUserId.toString(),
        },
        {
          ...getAuthHeaders(),
          params: {
            currentUserId: currentUserId,
          },
        },
      )
      return response.data
    } catch (error) {
      console.error("Error saving comparison sheet:", error.response ? error.response.data : error.message)
      throw error
    }
  },

  // Get comparison sheet for MTR
  getComparisonSheet: async (mtrId) => {
    try {
      const response = await axios.get(`${API_URL}/material-requisitions/${mtrId}/comparison-sheets`, {
        ...getAuthHeaders(),
      })
      return response.data || []
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return []
      }
      console.error("Error fetching comparison sheet:", error.response ? error.response.data : error.message)
      throw error
    }
  },
}

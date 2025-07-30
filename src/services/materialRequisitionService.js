import axios from "axios"

const API_URL = `${process.env.REACT_APP_API_URL}`

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

export const materialRequisitionService = {
  fetchMaterialRequisitions: async (queryParams) => {
    try {
      const response = await axios.get(`${API_URL}/material-requisitions?${queryParams}`, {
        ...getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      console.error("Error fetching material requisitions:", error.response ? error.response.data : error.message)
      throw error
    }
  },

  updateMaterialRequisition: async (mtrId, updatedData) => {
    try {
      const response = await axios.put(
        `${API_URL}/material-requisitions/${mtrId}`,
        updatedData, // The data to be sent in the request body
        {
          ...getAuthHeaders(),
        },
      )
      return response.data
    } catch (error) {
      console.error(
        `Error updating material requisition ${mtrId}:`,
        error.response ? error.response.data : error.message,
      )
      throw error
    }
  },
}

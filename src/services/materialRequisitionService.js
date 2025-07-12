import axios from "axios"

const API_URL = `${process.env.REACT_APP_API_URL}`

const getAuthHeaders = () => {
  return {
    headers: {
      "Content-Type": "application/json",
    },
  }
}

export const materialRequisitionService = {
  fetchMaterialRequisitions: async (queryParams) => {
    try {
      const response = await axios.get(
        `${API_URL}/material-requisitions?${queryParams}`, {
          ...getAuthHeaders(),
        }
      )
      return response.data
    } catch (error) {
      console.error("Error creating or updating project:", error.response ? error.response.data : error.message)
      throw error
    }
  },

  
}

//export default projectService

import axios from "axios"

const API_BASE_URL = `${process.env.REACT_APP_API_URL}` || "https://your-api-base-url.com"

export const dcQtyService = {
  getDCQtyList: async (filters) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/boq-mtr-dc-qty/list`, filters)
      return response.data
    } catch (error) {
      console.error("Error fetching DC qty list:", error)
      throw error
    }
  },

  getDCQtiesByProject: async (projectId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/boq-mtr-dc-qty/by-project/${projectId}`)
      return response.data
    } catch (error) {
      console.error("Error fetching DC quantities by project:", error)
      throw error
    }
  },

  uploadDCChalan: async (file, dcQtyIds, uploadedBy) => {
    try {
      const formData = new FormData()
      formData.append("file", file)
      dcQtyIds.forEach(id => formData.append("dcQtyIds", id))
      formData.append("uploadedBy", uploadedBy)

      const response = await axios.post(
        `${API_BASE_URL}/boq-mtr-dc-qty/upload-dc-chalan`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      )
      return response.data
    } catch (error) {
      console.error("Error uploading DC chalan:", error)
      throw error
    }
  },
}
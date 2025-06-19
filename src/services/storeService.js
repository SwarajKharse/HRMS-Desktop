"use client"

import axios from "axios"
const BASE_URL = `${process.env.REACT_APP_API_URL}/store`

const getAuthHeaders = () => {
  return {
    headers: {
      "Content-Type": "application/json",
    },
  }
}

export const storeService = {
  /************** Product Categories Start  *************/

  exportCategories: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/exportcategories`, {
        ...getAuthHeaders(),
        responseType: "blob",
      })
      return response.data
    } catch (error) {
      if (error.response) {
        throw {
          status: error.response.status,
          message: error.response.status === 403 ? "Permission denied" : "Export failed",
        }
      }
      throw error
    }
  },

  importCategories: async (file) => {
    try {
      const formData = new FormData()
      formData.append("file", file)
      const response = await axios.post(`${BASE_URL}/importcategories`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  getAllCategories: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/getallcategories`, getAuthHeaders())
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  /************** Product Categories End  *************/

  /************** Product Sub Categories Start  *************/

  exportSubCategories: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/exportsubcategories`, {
        ...getAuthHeaders(),
        responseType: "blob",
      })
      return response.data
    } catch (error) {
      if (error.response) {
        throw {
          status: error.response.status,
          message: error.response.status === 403 ? "Permission denied" : "Export failed",
        }
      }
      throw error
    }
  },

  importSubCategories: async (file) => {
    try {
      const formData = new FormData()
      formData.append("file", file)
      const response = await axios.post(`${BASE_URL}/importsubcategories`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  getSubCategories: async (page = 0, size = 10, search = "") => {
    try {
      console.log("Fetching subcategories with params:", { page, size, search })

      const response = await axios.get(`${BASE_URL}/getsubcategories`, {
        params: {
          page,
          size,
          search: search || "",
        },
        ...getAuthHeaders(),
      })

      return response
    } catch (error) {
      console.error("Error in getSubCategories:", error)
      throw error
    }
  },

  /************** Product Sub Categories End  **********************/

  /************** Product List start  **********************/

  getProducts: async (page = 0, size = 10, search = "", filters = {}) => {
    try {
      const response = await axios.get(`${BASE_URL}/getproducts`, {
        params: {
          page,
          size,
          search: search || "",
          leadProductType: filters.leadProductType || "",
          productCategory: filters.productCategory || "",
          uom: filters.uom || "",
        },
        ...getAuthHeaders(),
      })

      return response
    } catch (error) {
      console.error("Error in getProducts:", error)
      throw error
    }
  },

  exportProducts: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/exportproducts`, {
        ...getAuthHeaders(),
        responseType: "blob",
      })
      return response.data
    } catch (error) {
      if (error.response) {
        throw {
          status: error.response.status,
          message: error.response.status === 403 ? "Permission denied" : "Export failed",
        }
      }
      throw error
    }
  },

  importProducts: async (file) => {
    try {
      const formData = new FormData()
      formData.append("file", file)

      // Log the file being sent
      console.log("Importing file:", file.name, "Size:", file.size)

      const response = await axios.post(`${BASE_URL}/importproducts`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        // Add timeout and onUploadProgress for better user experience
        timeout: 60000, // 60 seconds timeout
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          console.log(`Upload progress: ${percentCompleted}%`)
        },
      })

      console.log("Import response:", response)
      return response.data
    } catch (error) {
      console.error("Import error details:", error)

      // Provide more detailed error information
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("Error response data:", error.response.data)
        console.error("Error response status:", error.response.status)
        throw {
          message: error.response.data?.message || "Server error: " + error.response.status,
          status: error.response.status,
          data: error.response.data,
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error("No response received:", error.request)
        throw {
          message: "No response from server. Please check your network connection.",
          request: error.request,
        }
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error("Error message:", error.message)
        throw {
          message: error.message || "An unexpected error occurred",
        }
      }
    }
  },

  getProductsList: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/getallproducts`, {
        params: {},
        ...getAuthHeaders(),
      })

      return response
    } catch (error) {
      console.error("Error in getProducts:", error)
      throw error
    }
  },

  /************** Product List End  **********************/

  /************** SkillSet List  **********************/

  getSkillSetList: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/getallskillset`, {
        params: {},
        ...getAuthHeaders(),
      })

      return response
    } catch (error) {
      console.error("Error in getSkillSetList:", error)
      throw error
    }
  },

  /************** SkillSet List End  ******************/

  /************** Tools List  **********************/

  getToolsList: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/getalltools`, {
        params: {},
        ...getAuthHeaders(),
      })

      return response
    } catch (error) {
      console.error("Error in getToolsList:", error)
      throw error
    }
  },

  /************** Tools List End  ******************/

  getAllMainGroups: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/getallmaingroups`, getAuthHeaders())
      return response.data
    } catch (error) {
      console.error("Error fetching main groups:", error)
      throw error.response?.data || error.message
    }
  },

  createMainGroup: async (data) => {
    try {
      const response = await axios.post(`${BASE_URL}/createmaingroup`, data, getAuthHeaders())
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  // Categories by Main Group
  getCategoriesByMainGroup: async (mainGroupId) => {
    try {
      const response = await axios.get(`${BASE_URL}/getcategoriesbymaingroup/${mainGroupId}`, getAuthHeaders())
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  createCategory: async (data) => {
    try {
      const response = await axios.post(`${BASE_URL}/createcategory`, data, getAuthHeaders())
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  // Subcategories by Category
  getSubcategoriesByCategory: async (categoryId) => {
    try {
      const response = await axios.get(`${BASE_URL}/getsubcategoriesbycategory/${categoryId}`, getAuthHeaders())
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  createSubcategory: async (data) => {
    try {
      const response = await axios.post(`${BASE_URL}/createsubcategory`, data, getAuthHeaders())
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  // Create Product
  createProduct: async (data) => {
    try {
      const response = await axios.post(`${BASE_URL}/createproduct`, data, getAuthHeaders())
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  updateProduct: async (productId, data) => {
    try {
      const response = await axios.put(`${BASE_URL}/updateproduct/${productId}`, data, getAuthHeaders())
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },
}

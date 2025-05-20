"use client"

import axios from "axios"
import { authService } from "./authService"
import ImportCategory from "../components/Store/ImportCategory"
const BASE_URL = `${process.env.REACT_APP_API_URL}/store`

const EMP_BASE_URL = `${process.env.REACT_APP_API_URL}/employee`

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
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw {
          status: error.response.status,
          message: error.response.status === 403 ? 'Permission denied' : 'Export failed'
        };
      }
      throw error;
    }
  },

  importCategories: async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await axios.post(`${BASE_URL}/importcategories`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getAllCategories: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/getallcategories`, getAuthHeaders());
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /************** Product Categories End  *************/

  /************** Product Sub Categories Start  *************/

  exportSubCategories: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/exportsubcategories`, {
        ...getAuthHeaders(),
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw {
          status: error.response.status,
          message: error.response.status === 403 ? 'Permission denied' : 'Export failed'
        };
      }
      throw error;
    }
  },

  importSubCategories: async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await axios.post(`${BASE_URL}/importsubcategories`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getSubCategories: async (page = 0, size = 10, search = "") => {
    try {
      console.log("Fetching subcategories with params:", { page, size, search });

      const response = await axios.get(`${BASE_URL}/getsubcategories`, {
        params: {
          page,
          size,
          search: search || ""
        },
        ...getAuthHeaders()
      });

      return response;
    } catch (error) {
      console.error("Error in getSubCategories:", error);
      // Rethrow the error to be handled by the component
      throw error;
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
          uom: filters.uom || ""
        },
        ...getAuthHeaders()
      });

      return response;
    } catch (error) {
      console.error("Error in getProducts:", error);
      throw error;
    }
  },

  exportProducts: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/exportproducts`, {
        ...getAuthHeaders(),
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw {
          status: error.response.status,
          message: error.response.status === 403 ? 'Permission denied' : 'Export failed'
        };
      }
      throw error;
    }
  },

  importProducts: async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      // Log the file being sent
      console.log("Importing file:", file.name, "Size:", file.size);

      const response = await axios.post(`${BASE_URL}/importproducts`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        // Add timeout and onUploadProgress for better user experience
        timeout: 60000, // 60 seconds timeout
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload progress: ${percentCompleted}%`);
        }
      });

      console.log("Import response:", response);
      return response.data;
    } catch (error) {
      console.error("Import error details:", error);

      // Provide more detailed error information
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);
        throw {
          message: error.response.data?.message || "Server error: " + error.response.status,
          status: error.response.status,
          data: error.response.data
        };
      } else if (error.request) {
        // The request was made but no response was received
        console.error("No response received:", error.request);
        throw {
          message: "No response from server. Please check your network connection.",
          request: error.request
        };
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error("Error message:", error.message);
        throw {
          message: error.message || "An unexpected error occurred"
        };
      }
    }
  }

  /************** Product List End  **********************/

}

"use client"

import axios from "axios"

const BASE_URL = `${process.env.REACT_APP_API_URL}/project`

const getAuthHeaders = () => {
  return {
    headers: {
      "Content-Type": "application/json",
    },
  }
}

export const projectService = {
  createOrUpdateProject: async (projectData, leadId) => {
    try {
      console.log("Creating/Updating project:", projectData)
      const response = await axios.post(
        `${BASE_URL}/create/${projectData.amc_or_project}/${leadId}`,
        projectData,
        getAuthHeaders(),
      )
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  getProjectByLeadId: async (leadId) => {
    try {
      console.log("Fetching project for lead:", leadId)
      const response = await axios.get(`${BASE_URL}/lead/${leadId}`, getAuthHeaders())
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  createOrUpdateBOQ: async (projectId, boqData) => {
    try {
      console.log("Saving BOQ for project:", projectId, boqData)
      const response = await axios.post(`${BASE_URL}/${projectId}/boq`, boqData, getAuthHeaders())
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  // Fixed method name to match what frontend is calling
  getBOQByProjectId: async (projectId) => {
    try {
      console.log("Fetching BOQ for project:", projectId)
      const response = await axios.get(`${BASE_URL}/${projectId}/boq`, getAuthHeaders())
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  // Keep the old method for backward compatibility
  getBOQ: async (projectId) => {
    return await projectService.getBOQByProjectId(projectId)
  },

  // New method for enhanced BOQ updates
  updateBOQ: async (projectId, enhancedBOQData) => {
    try {
      console.log("Updating enhanced BOQ for project:", projectId, enhancedBOQData)
      const response = await axios.put(`${BASE_URL}/${projectId}/boq`, enhancedBOQData, getAuthHeaders())
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  updateProjectTitle: async (projectId, newTitle) => {
    try {
      console.log("Updating project title:", projectId, newTitle)
      const response = await axios.put(`${BASE_URL}/${projectId}/title`, newTitle, getAuthHeaders())
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  getNewProjects: async (page, leadsPerPage) => {
    try {
      const queryParams = {
        page,
        size: leadsPerPage, // Changed from leadsPerPage to size to match backend
      }

      const response = await axios.get(`${BASE_URL}/getnewprojects`, {
        params: queryParams,
        ...getAuthHeaders(),
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },
}
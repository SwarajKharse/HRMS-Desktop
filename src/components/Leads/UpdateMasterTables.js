"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { leadService } from "../../services/leadService"
import { FiEdit2, FiAlertCircle, FiCheck, FiDownload, FiPlus, FiSave, FiX, FiTrash2 } from "react-icons/fi"

function MasterTables() {
  // State for each table
  const [leadSources, setLeadSources] = useState([])
  const [leadTypes, setLeadTypes] = useState([])
  const [leadProductTypes, setLeadProductTypes] = useState([])
  
  // Loading states
  const [loadingSources, setLoadingSources] = useState(true)
  const [loadingTypes, setLoadingTypes] = useState(true)
  const [loadingProductTypes, setLoadingProductTypes] = useState(true)
  
  // Error and success messages
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  
  // Active tab state
  const [activeTab, setActiveTab] = useState("lead-sources")
  
  // Search states
  const [sourceSearchQuery, setSourceSearchQuery] = useState("")
  const [typeSearchQuery, setTypeSearchQuery] = useState("")
  const [productTypeSearchQuery, setProductTypeSearchQuery] = useState("")
  
  // New item states
  const [newSourceLabel, setNewSourceLabel] = useState("")
  const [newTypeLabel, setNewTypeLabel] = useState("")
  const [newProductTypeLabel, setNewProductTypeLabel] = useState("")
  
  // Edit states
  const [editingSourceId, setEditingSourceId] = useState(null)
  const [editingTypeId, setEditingTypeId] = useState(null)
  const [editingProductTypeId, setEditingProductTypeId] = useState(null)
  const [editSourceLabel, setEditSourceLabel] = useState("")
  const [editTypeLabel, setEditTypeLabel] = useState("")
  const [editProductTypeLabel, setEditProductTypeLabel] = useState("")
  
  // Submission states
  const [submittingSource, setSubmittingSource] = useState(false)
  const [submittingType, setSubmittingType] = useState(false)
  const [submittingProductType, setSubmittingProductType] = useState(false)
  
  // Delete confirmation dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [itemToDelete, setItemToDelete] = useState({ id: null, type: null })
  
  // Pagination states
  const [currentSourcePage, setCurrentSourcePage] = useState(1)
  const [currentTypePage, setCurrentTypePage] = useState(1)
  const [currentProductTypePage, setCurrentProductTypePage] = useState(1)
  const [totalSourcePages, setTotalSourcePages] = useState(1)
  const [totalTypePages, setTotalTypePages] = useState(1)
  const [totalProductTypePages, setTotalProductTypePages] = useState(1)
  const [totalSourceResults, setTotalSourceResults] = useState(0)
  const [totalTypeResults, setTotalTypeResults] = useState(0)
  const [totalProductTypeResults, setTotalProductTypeResults] = useState(0)
  const itemsPerPage = 10

  // Fetch lead sources
  const fetchLeadSources = useCallback(async () => {
    try {
      setLoadingSources(true)
      setError(null)
      
      // Convert to 0-based index for the API
      const page = currentSourcePage - 1
      
      const data = await leadService.getLeadSourceList(page, itemsPerPage, sourceSearchQuery)
      
      console.log("data ----------------------------")
      console.log(data)

      setLeadSources(data || data || [])
      
      // If the API returns pagination info
      if (data.totalPages) {
        setTotalSourcePages(data.totalPages)
        setTotalSourceResults(data.totalResults)
      } else {
        // If the API returns just an array, calculate pagination locally
        setTotalSourceResults(data.length)
        setTotalSourcePages(Math.ceil(data.length / itemsPerPage))
      }
    } catch (error) {
      console.error("Error fetching lead sources:", error)
      setError("Failed to fetch lead sources: " + (error.message || "Unknown error"))
    } finally {
      setLoadingSources(false)
    }
  }, [currentSourcePage, sourceSearchQuery])

  // Fetch lead types
  const fetchLeadTypes = useCallback(async () => {
    try {
      setLoadingTypes(true)
      setError(null)
      
      // Convert to 0-based index for the API
      const page = currentTypePage - 1
      
      const data = await leadService.getLeadTypeList(page, itemsPerPage, typeSearchQuery)
      
      setLeadTypes(data.results || data || [])
      
      // If the API returns pagination info
      if (data.totalPages) {
        setTotalTypePages(data.totalPages)
        setTotalTypeResults(data.totalResults)
      } else {
        // If the API returns just an array, calculate pagination locally
        setTotalTypeResults(data.length)
        setTotalTypePages(Math.ceil(data.length / itemsPerPage))
      }
    } catch (error) {
      console.error("Error fetching lead types:", error)
      setError("Failed to fetch lead types: " + (error.message || "Unknown error"))
    } finally {
      setLoadingTypes(false)
    }
  }, [currentTypePage, typeSearchQuery])

  // Fetch lead product types
  const fetchLeadProductTypes = useCallback(async () => {
    try {
      setLoadingProductTypes(true)
      setError(null)
      
      // Convert to 0-based index for the API
      const page = currentProductTypePage - 1
      
      const data = await leadService.getLeadProductTypeList(page, itemsPerPage, productTypeSearchQuery)
      
      setLeadProductTypes(data.results || data || [])
      
      // If the API returns pagination info
      if (data.totalPages) {
        setTotalProductTypePages(data.totalPages)
        setTotalProductTypeResults(data.totalResults)
      } else {
        // If the API returns just an array, calculate pagination locally
        setTotalProductTypeResults(data.length)
        setTotalProductTypePages(Math.ceil(data.length / itemsPerPage))
      }
    } catch (error) {
      console.error("Error fetching lead product types:", error)
      setError("Failed to fetch lead product types: " + (error.message || "Unknown error"))
    } finally {
      setLoadingProductTypes(false)
    }
  }, [currentProductTypePage, productTypeSearchQuery])

  // Fetch data on component mount and when dependencies change
  useEffect(() => {
    if (activeTab === "lead-sources") {
      fetchLeadSources()
    } else if (activeTab === "lead-types") {
      fetchLeadTypes()
    } else if (activeTab === "lead-product-types") {
      fetchLeadProductTypes()
    }
  }, [activeTab, fetchLeadSources, fetchLeadTypes, fetchLeadProductTypes])

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentSourcePage(1)
  }, [sourceSearchQuery])

  useEffect(() => {
    setCurrentTypePage(1)
  }, [typeSearchQuery])

  useEffect(() => {
    setCurrentProductTypePage(1)
  }, [productTypeSearchQuery])

  // Handle page changes
  const handleSourcePageChange = (pageNumber) => {
    setCurrentSourcePage(pageNumber)
  }

  const handleTypePageChange = (pageNumber) => {
    setCurrentTypePage(pageNumber)
  }

  const handleProductTypePageChange = (pageNumber) => {
    setCurrentProductTypePage(pageNumber)
  }

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setError(null)
  }

  // Handle search
  const handleSearchChange = (type, value) => {
    if (type === "source") {
      setSourceSearchQuery(value)
    } else if (type === "type") {
      setTypeSearchQuery(value)
    } else if (type === "productType") {
      setProductTypeSearchQuery(value)
    }
  }

  // Clear search
  const clearSearch = (type) => {
    if (type === "source") {
      setSourceSearchQuery("")
    } else if (type === "type") {
      setTypeSearchQuery("")
    } else if (type === "productType") {
      setProductTypeSearchQuery("")
    }
  }

  // Add new lead source
  const handleAddLeadSource = async () => {
    if (!newSourceLabel.trim()) {
      setError("Lead source label cannot be empty")
      return
    }

    try {
      setSubmittingSource(true)
      setError(null)
      
      await leadService.createLeadSource({ label: newSourceLabel })
      
      setSuccessMessage("Lead source added successfully")
      setTimeout(() => setSuccessMessage(null), 3000)
      
      setNewSourceLabel("")
      fetchLeadSources()
    } catch (error) {
      console.error("Error adding lead source:", error)
      setError("Failed to add lead source: " + (error.message || "Unknown error"))
    } finally {
      setSubmittingSource(false)
    }
  }

  // Add new lead type
  const handleAddLeadType = async () => {
    if (!newTypeLabel.trim()) {
      setError("Lead type label cannot be empty")
      return
    }

    try {
      setSubmittingType(true)
      setError(null)
      
      await leadService.createLeadType({ label: newTypeLabel })
      
      setSuccessMessage("Lead type added successfully")
      setTimeout(() => setSuccessMessage(null), 3000)
      
      setNewTypeLabel("")
      fetchLeadTypes()
    } catch (error) {
      console.error("Error adding lead type:", error)
      setError("Failed to add lead type: " + (error.message || "Unknown error"))
    } finally {
      setSubmittingType(false)
    }
  }

  // Add new lead product type
  const handleAddLeadProductType = async () => {
    if (!newProductTypeLabel.trim()) {
      setError("Lead product type label cannot be empty")
      return
    }

    try {
      setSubmittingProductType(true)
      setError(null)
      
      await leadService.createLeadProductType({ label: newProductTypeLabel })
      
      setSuccessMessage("Lead product type added successfully")
      setTimeout(() => setSuccessMessage(null), 3000)
      
      setNewProductTypeLabel("")
      fetchLeadProductTypes()
    } catch (error) {
      console.error("Error adding lead product type:", error)
      setError("Failed to add lead product type: " + (error.message || "Unknown error"))
    } finally {
      setSubmittingProductType(false)
    }
  }

  // Start editing
  const startEditing = (item, type) => {
    if (type === "source") {
      setEditingSourceId(item.id)
      setEditSourceLabel(item.label)
    } else if (type === "type") {
      setEditingTypeId(item.id)
      setEditTypeLabel(item.label)
    } else if (type === "productType") {
      setEditingProductTypeId(item.id)
      setEditProductTypeLabel(item.label)
    }
  }

  // Cancel editing
  const cancelEditing = (type) => {
    if (type === "source") {
      setEditingSourceId(null)
      setEditSourceLabel("")
    } else if (type === "type") {
      setEditingTypeId(null)
      setEditTypeLabel("")
    } else if (type === "productType") {
      setEditingProductTypeId(null)
      setEditProductTypeLabel("")
    }
  }

  // Update lead source
  const handleUpdateLeadSource = async (id) => {
    if (!editSourceLabel.trim()) {
      setError("Lead source label cannot be empty")
      return
    }

    try {
      setSubmittingSource(true)
      setError(null)
      
      await leadService.updateLeadSource(id, { label: editSourceLabel })
      
      setSuccessMessage("Lead source updated successfully")
      setTimeout(() => setSuccessMessage(null), 3000)
      
      setEditingSourceId(null)
      fetchLeadSources()
    } catch (error) {
      console.error("Error updating lead source:", error)
      setError("Failed to update lead source: " + (error.message || "Unknown error"))
    } finally {
      setSubmittingSource(false)
    }
  }

  // Update lead type
  const handleUpdateLeadType = async (id) => {
    if (!editTypeLabel.trim()) {
      setError("Lead type label cannot be empty")
      return
    }

    try {
      setSubmittingType(true)
      setError(null)
      
      await leadService.updateLeadType(id, { label: editTypeLabel })
      
      setSuccessMessage("Lead type updated successfully")
      setTimeout(() => setSuccessMessage(null), 3000)
      
      setEditingTypeId(null)
      fetchLeadTypes()
    } catch (error) {
      console.error("Error updating lead type:", error)
      setError("Failed to update lead type: " + (error.message || "Unknown error"))
    } finally {
      setSubmittingType(false)
    }
  }

  // Update lead product type
  const handleUpdateLeadProductType = async (id) => {
    if (!editProductTypeLabel.trim()) {
      setError("Lead product type label cannot be empty")
      return
    }

    try {
      setSubmittingProductType(true)
      setError(null)
      
      await leadService.updateLeadProductType(id, { label: editProductTypeLabel })
      
      setSuccessMessage("Lead product type updated successfully")
      setTimeout(() => setSuccessMessage(null), 3000)
      
      setEditingProductTypeId(null)
      fetchLeadProductTypes()
    } catch (error) {
      console.error("Error updating lead product type:", error)
      setError("Failed to update lead product type: " + (error.message || "Unknown error"))
    } finally {
      setSubmittingProductType(false)
    }
  }

  // Confirm delete
  const confirmDelete = (id, type) => {
    setItemToDelete({ id, type })
    setShowDeleteDialog(true)
  }

  // Delete item
  const handleDelete = async () => {
    try {
      setError(null)
      
      if (itemToDelete.type === "source") {
        await leadService.deleteLeadSource(itemToDelete.id)
        setSuccessMessage("Lead source deleted successfully")
        fetchLeadSources()
      } else if (itemToDelete.type === "type") {
        await leadService.deleteLeadType(itemToDelete.id)
        setSuccessMessage("Lead type deleted successfully")
        fetchLeadTypes()
      } else if (itemToDelete.type === "productType") {
        await leadService.deleteLeadProductType(itemToDelete.id)
        setSuccessMessage("Lead product type deleted successfully")
        fetchLeadProductTypes()
      }
      
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error("Error deleting item:", error)
      setError("Failed to delete item: " + (error.message || "Unknown error"))
    } finally {
      setShowDeleteDialog(false)
      setItemToDelete({ id: null, type: null })
    }
  }


  // Loading spinner
  const renderLoading = () => (
    <div className="flex justify-center my-4">
      <div className="relative w-8 h-8">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-200 rounded-full animate-pulse"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-600 rounded-full animate-spin border-t-transparent"></div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-8">
      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-3 border border-red-100"
        >
          <FiAlertCircle className="w-5 h-5" />
          <span className="font-medium">{error}</span>
        </motion.div>
      )}

      {/* Success Message */}
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-green-50 text-green-600 p-4 rounded-lg border border-green-100 flex items-center shadow-sm"
        >
          <FiCheck className="w-5 h-5 mr-2" />
          <span className="font-medium">{successMessage}</span>
        </motion.div>
      )}

      {/* Master Tables Container */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Master Tables</h2>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => handleTabChange("lead-sources")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${
                  activeTab === "lead-sources"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              Lead Sources
            </button>
            <button
              onClick={() => handleTabChange("lead-types")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${
                  activeTab === "lead-types"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              Lead Types
            </button>
            <button
              onClick={() => handleTabChange("lead-product-types")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${
                  activeTab === "lead-product-types"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              Lead Product Types
            </button>
          </nav>
        </div>

        {/* Lead Sources Tab Content */}
        {activeTab === "lead-sources" && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              {/* <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search lead sources..."
                  value={sourceSearchQuery}
                  onChange={(e) => handleSearchChange("source", e.target.value)}
                  className="text-xs pl-3 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                />
                {sourceSearchQuery && (
                  <button
                    onClick={() => clearSearch("source")}
                    className="text-xs px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div> */}
              
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="New lead source"
                  value={newSourceLabel}
                  onChange={(e) => setNewSourceLabel(e.target.value)}
                  className="text-xs pl-3 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                />
                <button
                  onClick={handleAddLeadSource}
                  disabled={submittingSource || !newSourceLabel.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                >
                  {submittingSource ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    <FiPlus className="w-4 h-4" />
                  )}
                  Add
                </button>
              </div>
            </div>

            {loadingSources && leadSources.length === 0 ? (
              renderLoading()
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden rounded-lg border border-gray-200"
                >
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            ID
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Label
                          </th>
                          <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {leadSources.length === 0 ? (
                          <tr>
                            <td colSpan="3" className="px-6 py-8 text-center text-gray-500 font-medium">
                              No lead sources found
                            </td>
                          </tr>
                        ) : (
                          leadSources.map((source) => (
                            <motion.tr
                              key={source.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {source.id}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {editingSourceId === source.id ? (
                                  <input
                                    type="text"
                                    value={editSourceLabel}
                                    onChange={(e) => setEditSourceLabel(e.target.value)}
                                    className="text-xs pl-3 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 w-full max-w-xs"
                                  />
                                ) : (
                                  source.label
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                {editingSourceId === source.id ? (
                                  <div className="flex justify-end space-x-2">
                                    <button
                                      onClick={() => handleUpdateLeadSource(source.id)}
                                      disabled={submittingSource}
                                      className="text-indigo-600 hover:text-indigo-900 transition-colors"
                                    >
                                      {submittingSource ? (
                                        <div className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
                                      ) : (
                                        <FiSave size={18} />
                                      )}
                                    </button>
                                    <button
                                      onClick={() => cancelEditing("source")}
                                      className="text-gray-600 hover:text-gray-900 transition-colors"
                                    >
                                      <FiX size={18} />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex justify-end space-x-2">
                                    <button
                                      onClick={() => startEditing(source, "source")}
                                      className="text-indigo-600 hover:text-indigo-900 transition-colors"
                                      title="Edit"
                                    >
                                      <FiEdit2 size={18} />
                                    </button>
                                    {/* <button
                                      onClick={() => confirmDelete(source.id, "source")}
                                      className="text-red-600 hover:text-red-900 transition-colors"
                                      title="Delete"
                                    >
                                      <FiTrash2 size={18} />
                                    </button> */}
                                  </div>
                                )}
                              </td>
                            </motion.tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}

            {/* Pagination for Lead Sources */}
            {/* {renderPagination(
              currentSourcePage,
              totalSourcePages,
              totalSourceResults,
              handleSourcePageChange,
              itemsPerPage,
              loadingSources
            )} */}
          </div>
        )}

        {/* Lead Types Tab Content */}
        {activeTab === "lead-types" && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              {/* <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search lead types..."
                  value={typeSearchQuery}
                  onChange={(e) => handleSearchChange("type", e.target.value)}
                  className="text-xs pl-3 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                />
                {typeSearchQuery && (
                  <button
                    onClick={() => clearSearch("type")}
                    className="text-xs px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div> */}
              
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="New lead type"
                  value={newTypeLabel}
                  onChange={(e) => setNewTypeLabel(e.target.value)}
                  className="text-xs pl-3 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                />
                <button
                  onClick={handleAddLeadType}
                  disabled={submittingType || !newTypeLabel.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                >
                  {submittingType ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    <FiPlus className="w-4 h-4" />
                  )}
                  Add
                </button>
              </div>
            </div>

            {loadingTypes && leadTypes.length === 0 ? (
              renderLoading()
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden rounded-lg border border-gray-200"
                >
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            ID
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Label
                          </th>
                          <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {leadTypes.length === 0 ? (
                          <tr>
                            <td colSpan="3" className="px-6 py-8 text-center text-gray-500 font-medium">
                              No lead types found
                            </td>
                          </tr>
                        ) : (
                          leadTypes.map((type) => (
                            <motion.tr
                              key={type.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {type.id}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {editingTypeId === type.id ? (
                                  <input
                                    type="text"
                                    value={editTypeLabel}
                                    onChange={(e) => setEditTypeLabel(e.target.value)}
                                    className="text-xs pl-3 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 w-full max-w-xs"
                                  />
                                ) : (
                                  type.label
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                {editingTypeId === type.id ? (
                                  <div className="flex justify-end space-x-2">
                                    <button
                                      onClick={() => handleUpdateLeadType(type.id)}
                                      disabled={submittingType}
                                      className="text-indigo-600 hover:text-indigo-900 transition-colors"
                                    >
                                      {submittingType ? (
                                        <div className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
                                      ) : (
                                        <FiSave size={18} />
                                      )}
                                    </button>
                                    <button
                                      onClick={() => cancelEditing("type")}
                                      className="text-gray-600 hover:text-gray-900 transition-colors"
                                    >
                                      <FiX size={18} />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex justify-end space-x-2">
                                    <button
                                      onClick={() => startEditing(type, "type")}
                                      className="text-indigo-600 hover:text-indigo-900 transition-colors"
                                      title="Edit"
                                    >
                                      <FiEdit2 size={18} />
                                    </button>
                                    {/* <button
                                      onClick={() => confirmDelete(type.id, "type")}
                                      className="text-red-600 hover:text-red-900 transition-colors"
                                      title="Delete"
                                    >
                                      <FiTrash2 size={18} />
                                    </button> */}
                                  </div>
                                )}
                              </td>
                            </motion.tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}

            {/* Pagination for Lead Types */}
           {/*  {renderPagination(
              currentTypePage,
              totalTypePages,
              totalTypeResults,
              handleTypePageChange,
              itemsPerPage,
              loadingTypes
            )} */}
          </div>
        )}

        {/* Lead Product Types Tab Content */}
        {activeTab === "lead-product-types" && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              {/* <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search lead product types..."
                  value={productTypeSearchQuery}
                  onChange={(e) => handleSearchChange("productType", e.target.value)}
                  className="text-xs pl-3 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                />
                {productTypeSearchQuery && (
                  <button
                    onClick={() => clearSearch("productType")}
                    className="text-xs px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div> */}
              
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="New lead product type"
                  value={newProductTypeLabel}
                  onChange={(e) => setNewProductTypeLabel(e.target.value)}
                  className="text-xs pl-3 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                />
                <button
                  onClick={handleAddLeadProductType}
                  disabled={submittingProductType || !newProductTypeLabel.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                >
                  {submittingProductType ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    <FiPlus className="w-4 h-4" />
                  )}
                  Add
                </button>
              </div>
            </div>

            {loadingProductTypes && leadProductTypes.length === 0 ? (
              renderLoading()
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden rounded-lg border border-gray-200"
                >
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            ID
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Label
                          </th>
                          <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {leadProductTypes.length === 0 ? (
                          <tr>
                            <td colSpan="3" className="px-6 py-8 text-center text-gray-500 font-medium">
                              No lead product types found
                            </td>
                          </tr>
                        ) : (
                          leadProductTypes.map((productType) => (
                            <motion.tr
                              key={productType.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {productType.id}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {editingProductTypeId === productType.id ? (
                                  <input
                                    type="text"
                                    value={editProductTypeLabel}
                                    onChange={(e) => setEditProductTypeLabel(e.target.value)}
                                    className="text-xs pl-3 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 w-full max-w-xs"
                                  />
                                ) : (
                                  productType.label
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                {editingProductTypeId === productType.id ? (
                                  <div className="flex justify-end space-x-2">
                                    <button
                                      onClick={() => handleUpdateLeadProductType(productType.id)}
                                      disabled={submittingProductType}
                                      className="text-indigo-600 hover:text-indigo-900 transition-colors"
                                    >
                                      {submittingProductType ? (
                                        <div className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
                                      ) : (
                                        <FiSave size={18} />
                                      )}
                                    </button>
                                    <button
                                      onClick={() => cancelEditing("productType")}
                                      className="text-gray-600 hover:text-gray-900 transition-colors"
                                    >
                                      <FiX size={18} />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex justify-end space-x-2">
                                    <button
                                      onClick={() => startEditing(productType, "productType")}
                                      className="text-indigo-600 hover:text-indigo-900 transition-colors"
                                      title="Edit"
                                    >
                                      <FiEdit2 size={18} />
                                    </button>
                                    {/* <button
                                      onClick={() => confirmDelete(productType.id, "productType")}
                                      className="text-red-600 hover:text-red-900 transition-colors"
                                      title="Delete"
                                    >
                                      <FiTrash2 size={18} />
                                    </button> */}
                                  </div>
                                )}
                              </td>
                            </motion.tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}

            {/* Pagination for Lead Product Types */}
            {/* {renderPagination(
              currentProductTypePage,
              totalProductTypePages,
              totalProductTypeResults,
              handleProductTypePageChange,
              itemsPerPage,
              loadingProductTypes
            )} */}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete this item? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MasterTables

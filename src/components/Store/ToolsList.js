"use client"
import { useState, useEffect } from "react"
import { FiSearch, FiX, FiPlus } from "react-icons/fi" // Removed FiFilter
import { FcViewDetails } from "react-icons/fc"
import { storeService } from "../../services/storeService"
import ToolsImportExport from "./ToolsImportExport"
import AddTool from "./AddTool"
import ToolEditForm from "./ToolEditForm"

const ToolsList = () => {
  // State for tools and pagination
  const [tools, setTools] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [showImportExportDialog, setShowImportExportDialog] = useState(false)
  const [showAddToolDialog, setShowAddToolDialog] = useState(false)
  const [selectedTool, setSelectedTool] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [successMessage, setSuccessMessage] = useState(null)

  // State for filters (only search query for tools)
  const [searchQuery, setSearchQuery] = useState("")

  // State for mobile filter visibility (removed as filters are removed)
  // const [showMobileFilters, setShowMobileFilters] = useState(false)

  const handleDetails = (e, id) => {
    e.stopPropagation()
    const tool = tools.find((item) => item.id === id)
    setSelectedTool(tool)
    setShowForm(true)
  }

  // Fetch tools with filters and pagination
  const fetchTools = async (page = 0, size = 10, search = "") => {
    try {
      setLoading(true)
      setError(null)
      const response = await storeService.getTools(page, size, search)
      if (response && response.data) {
        setTools(response.data.content || [])
        setTotalPages(response.data.totalPages || 1)
        setTotalItems(response.data.totalElements || 0)
        setCurrentPage(page)
      } else {
        setError("Invalid response format from server")
      }
    } catch (error) {
      console.error("Error fetching tools:", error)
      setError("Failed to fetch tools: " + (error.message || "Unknown error"))
    } finally {
      setLoading(false)
    }
  }

  // Initial data load
  useEffect(() => {
    fetchTools(currentPage, itemsPerPage, searchQuery)
  }, [])

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTools(0, itemsPerPage, searchQuery)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Handle page change
  const handlePageChange = (pageNumber) => {
    fetchTools(pageNumber, itemsPerPage, searchQuery)
  }

  // Reset all filters (only search query for tools)
  const resetFilters = () => {
    setSearchQuery("")
    fetchTools(0, itemsPerPage, "")
  }

  const handleEditTool = async () => {
    try {
      await fetchTools()
      setShowForm(false)
      setSelectedTool(null)
      setSuccessMessage("Tool updated successfully")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      setError("Failed to update tool")
    }
  }

  // Handle import/export success
  const handleImportExportSuccess = () => {
    fetchTools(currentPage, itemsPerPage, searchQuery)
    setShowImportExportDialog(false)
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white rounded-xl p-4 md:p-6 shadow-sm">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">Tools</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowAddToolDialog(true)}
            className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center gap-2 font-medium"
          >
            <FiPlus size={18} />
            Add Tool
          </button>
          <button
            onClick={() => setShowImportExportDialog(true)}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:shadow-lg hover:from-indigo-700 hover:to-blue-700 transition-all duration-200 flex items-center gap-2 font-medium"
          >
            Import/Export Data
          </button>
        </div>
        {/* Mobile Filter Toggle - Removed */}
        {/* <button
          className="md:hidden flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg"
          onClick={() => setShowMobileFilters(!showMobileFilters)}
        >
          <FiFilter />
          {showMobileFilters ? "Hide Filters" : "Show Filters"}
        </button> */}
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 text-green-600 p-4 rounded-lg flex items-center gap-3 border border-green-100">
          <span className="font-medium">{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="ml-auto text-green-500 hover:text-green-700">
            <FiX />
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-3 border border-red-100">
          <span className="font-medium">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
            <FiX />
          </button>
        </div>
      )}

      {/* Adjusted grid layout */}
      <div className="grid grid-cols-1 gap-6">
        {/* Filters - Desktop (simplified for Tools) - Removed */}
        {/* <div className="hidden md:block w-full bg-white rounded-xl shadow-sm p-4 min-w-[280px] max-w-[280px]">
          <div className="mb-4">
            <h2 className="font-semibold text-gray-700 mb-3">Filters</h2>
            <button onClick={resetFilters} className="text-sm text-blue-600 hover:text-blue-800">
              Reset all filters
            </button>
          </div>
        </div> */}

        {/* Filters - Mobile (simplified for Tools) - Removed */}
        {/* {showMobileFilters && (
          <div className="md:hidden w-full bg-white rounded-xl shadow-sm p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-gray-700">Filters</h2>
              <div className="flex gap-3">
                <button onClick={resetFilters} className="text-sm text-blue-600 hover:text-blue-800">
                  Reset all
                </button>
                <button onClick={() => setShowMobileFilters(false)} className="text-gray-500">
                  <FiX size={20} />
                </button>
              </div>
            </div>
          </div>
        )} */}

        {/* Tools List */}
        <div className="flex-1 min-w-0">
          {/* Search Bar */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search tools by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Tools Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {loading && tools.length === 0 ? (
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : tools.length === 0 ? (
              <div className="text-center p-8 text-gray-500">No tools found matching your criteria</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 table-fixed">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[70%]">
                        Tool Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[30%]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tools.map((tool) => (
                      <tr key={tool.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div
                            className="text-sm font-medium text-gray-900 truncate max-w-[300px]"
                            title={tool.tool_name}
                          >
                            {tool.tool_name}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <button
                              className="text-gray-400 hover:text-indigo-600 transition-colors"
                              onClick={(e) => handleDetails(e, tool.id)}
                              title="Details"
                            >
                              <FcViewDetails size={24} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 flex flex-col sm:flex-row justify-between items-center border-t border-gray-200 bg-gray-50">
                <div className="text-sm text-gray-700 mb-2 sm:mb-0">
                  Showing <span className="font-medium">{tools.length}</span> of{" "}
                  <span className="font-medium">{totalItems}</span> tools
                </div>
                <div className="flex justify-center items-center gap-1 sm:gap-2">
                  <button
                    onClick={() => handlePageChange(0)}
                    disabled={currentPage === 0}
                    className="hidden sm:inline-flex items-center px-2 py-1 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    First
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 0}
                    className="inline-flex items-center px-2 py-1 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Prev
                  </button>
                  {(() => {
                    let startPage = 0
                    let endPage = totalPages - 1
                    const maxVisible = window.innerWidth < 640 ? 3 : 5
                    if (totalPages > maxVisible) {
                      const halfVisible = Math.floor(maxVisible / 2)
                      startPage = Math.max(0, currentPage - halfVisible)
                      endPage = Math.min(totalPages - 1, startPage + maxVisible - 1)
                      if (endPage - startPage + 1 < maxVisible) {
                        startPage = Math.max(0, endPage - maxVisible + 1)
                      }
                    }
                    const pageNumbers = []
                    for (let i = startPage; i <= endPage; i++) {
                      pageNumbers.push(
                        <button
                          key={i}
                          onClick={() => handlePageChange(i)}
                          className={`inline-flex items-center px-3 py-1 border ${
                            currentPage === i
                              ? "border-blue-500 bg-blue-50 text-blue-600"
                              : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                          } rounded-md text-sm font-medium`}
                        >
                          {i + 1}
                        </button>,
                      )
                    }
                    if (startPage > 0) {
                      pageNumbers.unshift(
                        <span key="start-ellipsis" className="px-1 text-gray-500">
                          ...
                        </span>,
                      )
                    }
                    if (endPage < totalPages - 1) {
                      pageNumbers.push(
                        <span key="end-ellipsis" className="px-1 text-gray-500">
                          ...
                        </span>,
                      )
                    }
                    return pageNumbers
                  })()}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages - 1}
                    className="inline-flex items-center px-2 py-1 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => handlePageChange(totalPages - 1)}
                    disabled={currentPage === totalPages - 1}
                    className="hidden sm:inline-flex items-center px-2 py-1 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Last
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Import/Export Dialog */}
      {showImportExportDialog && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4"
          onClick={() => {
            setShowImportExportDialog(false)
          }}
        >
          <ToolsImportExport
            onClose={() => setShowImportExportDialog(false)}
            onSuccess={() => {
              setShowImportExportDialog(false)
              fetchTools(currentPage, itemsPerPage, searchQuery)
              setSuccessMessage("Tools imported successfully!")
              setTimeout(() => setSuccessMessage(null), 5000)
            }}
          />
        </div>
      )}

      {/* Add Tool Dialog */}
      {showAddToolDialog && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4"
          onClick={() => {
            setShowAddToolDialog(false)
          }}
        >
          <AddTool
            onClose={() => setShowAddToolDialog(false)}
            onSuccess={() => {
              setShowAddToolDialog(false)
              fetchTools(currentPage, itemsPerPage, searchQuery)
              setSuccessMessage("Tool added successfully!")
              setTimeout(() => setSuccessMessage(null), 5000)
            }}
          />
        </div>
      )}

      {showForm && (
        <ToolEditForm
          tool={selectedTool}
          onClose={() => {
            setShowForm(false)
            setSelectedTool(null)
          }}
          onSubmit={handleEditTool}
        />
      )}
    </div>
  )
}

export default ToolsList
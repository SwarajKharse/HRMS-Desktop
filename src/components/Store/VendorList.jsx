"use client"
import { useState, useEffect } from "react"
import { FiSearch, FiX, FiPlus, FiEdit2 } from "react-icons/fi"
import { storeService } from "../../services/storeService"
import AddVendor from "./AddVendor"
import EditVendor from "./EditVendor"

const VendorList = () => {
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [successMessage, setSuccessMessage] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")

  // Fetch vendors with filters and pagination
  const fetchVendors = async (page = 0, size = 10, search = "", status = "ALL") => {
    try {
      setLoading(true)
      setError(null)
      const statusParam = status === "ALL" ? null : status
      console.log("[v0] fetchVendors called with status:", status, "statusParam:", statusParam)
      const response = await storeService.getVendors(page, size, search, statusParam)
      if (response && response.data) {
        setVendors(response.data.content || [])
        setTotalPages(response.data.totalPages || 1)
        setTotalItems(response.data.totalElements || 0)
        setCurrentPage(page)
      } else {
        setError("Invalid response format from server")
      }
    } catch (error) {
      console.error("Error fetching vendors:", error)
      setError("Failed to fetch vendors: " + (error.message || "Unknown error"))
    } finally {
      setLoading(false)
    }
  }

  // Initial data load
  useEffect(() => {
    fetchVendors(currentPage, itemsPerPage, searchQuery, statusFilter)
  }, [])

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchVendors(0, itemsPerPage, searchQuery, statusFilter)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Handle status filter change
  const handleStatusChange = (status) => {
    setStatusFilter(status)
    fetchVendors(0, itemsPerPage, searchQuery, status)
  }

  // Handle page change
  const handlePageChange = (pageNumber) => {
    fetchVendors(pageNumber, itemsPerPage, searchQuery, statusFilter)
  }

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery("")
    setStatusFilter("ALL")
    fetchVendors(0, itemsPerPage, "", "ALL")
  }

  // Handle edit vendor
  const handleEditVendor = (vendor) => {
    setSelectedVendor(vendor)
    setShowEditForm(true)
  }

  // Handle add vendor success
  const handleAddVendorSuccess = () => {
    fetchVendors(currentPage, itemsPerPage, searchQuery, statusFilter)
    setShowAddDialog(false)
    setSuccessMessage("Vendor added successfully!")
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  // Handle edit vendor success
  const handleEditSuccess = () => {
    fetchVendors(currentPage, itemsPerPage, searchQuery, statusFilter)
    setShowEditForm(false)
    setSelectedVendor(null)
    setSuccessMessage("Vendor updated successfully!")
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white rounded-xl p-4 md:p-6 shadow-sm">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">Vendor Management</h1>
        <button
          onClick={() => setShowAddDialog(true)}
          className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center gap-2 font-medium"
        >
          <FiPlus size={18} />
          Add Vendor
        </button>
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

      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-end">
          {/* Status Filter */}
          <div className="flex-shrink-0 md:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          {/* Search Bar */}
          <div className="flex-1 min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-2 md:opacity-0 md:h-0">Search</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" size={18} />
              </div>
              <input
                type="text"
                placeholder="Search vendors by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Reset Button */}
          <button
            onClick={resetFilters}
            className="px-4 py-2.5 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 font-medium rounded-lg border border-blue-200 transition-colors flex-shrink-0"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Vendors Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading && vendors.length === 0 ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : vendors.length === 0 ? (
          <div className="text-center p-8 text-gray-500">No vendors found matching your criteria</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact Person
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{vendor.vendorName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">{vendor.contactPerson || "-"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">{vendor.email || "-"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">{vendor.phone || "-"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          vendor.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {vendor.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleEditVendor(vendor)}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                        title="Edit"
                      >
                        <FiEdit2 size={20} />
                      </button>
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
              Showing <span className="font-medium">{vendors.length}</span> of{" "}
              <span className="font-medium">{totalItems}</span> vendors
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

      {/* Add Vendor Dialog */}
      {showAddDialog && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4"
          onClick={() => setShowAddDialog(false)}
        >
          <AddVendor onClose={() => setShowAddDialog(false)} onSuccess={handleAddVendorSuccess} />
        </div>
      )}

      {/* Edit Vendor Dialog */}
      {showEditForm && selectedVendor && (
        <EditVendor vendor={selectedVendor} onClose={() => setShowEditForm(false)} onSubmit={handleEditSuccess} />
      )}
    </div>
  )
}

export default VendorList
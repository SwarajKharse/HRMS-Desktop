"use client"

import { useState, useEffect } from "react"
import { financeReceivableService } from "../../services/financeReceivableService"
import { Eye, Search, Filter } from "lucide-react"

const FinanceRecievable = () => {
  const [receivables, setReceivables] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [size] = useState(10)

  // Filters
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [selectedLead, setSelectedLead] = useState(null)
  const [selectedReceivable, setSelectedReceivable] = useState(null)
  const [loadingLead, setLoadingLead] = useState(false)

  useEffect(() => {
    fetchReceivables()
  }, [page, search, typeFilter, statusFilter])

  const fetchReceivables = async () => {
    setLoading(true)
    try {
      const response = await financeReceivableService.getAllReceivables(page, size, search, typeFilter, statusFilter)
      console.log("[v0] API Response:", response)

      const validReceivables = (response.content || []).filter((item) => {
        if (!item) {
          console.log("[v0] Found null/undefined item in response")
          return false
        }
        if (!item.id) {
          console.log("[v0] Found item without id:", item)
          return false
        }
        return true
      })

      console.log("[v0] Valid receivables:", validReceivables)
      setReceivables(validReceivables)
      setTotalPages(response.totalPages || 0)
      setTotalElements(response.totalElements || 0)
    } catch (error) {
      console.error("[v0] Error fetching receivables:", error)
      alert("Failed to fetch receivables")
      setReceivables([])
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = async (receivable) => {
    setSelectedReceivable(receivable)
    setLoadingLead(true)
    setShowModal(true)

    try {
      const leadDetails = await financeReceivableService.getLeadDetails(receivable.projectId)
      setSelectedLead(leadDetails)
    } catch (error) {
      console.error("Error fetching lead details:", error)
      alert("Failed to fetch lead details")
    } finally {
      setLoadingLead(false)
    }
  }

  const handleAdvanceReceived = async () => {
    if (!selectedReceivable) return

    try {
      await financeReceivableService.updateFinancePaymentStatus(selectedReceivable.id, "ADVANCE_RECEIVED")
      alert("Advance received status updated successfully")
      setShowModal(false)
      fetchReceivables()
    } catch (error) {
      console.error("Error updating advance received:", error)
      alert("Failed to update advance received status")
    }
  }

  const handleHandoverStatusChange = async (receivable, newStatus) => {
    try {
      await financeReceivableService.updateHandoverStatus(receivable.projectId, newStatus)
      alert("Handover status updated successfully")
      fetchReceivables()
    } catch (error) {
      console.error("Error updating handover status:", error)
      alert("Failed to update handover status")
    }
  }

  const handleSearchChange = (e) => {
    setSearch(e.target.value)
    setPage(0)
  }

  const handleTypeFilterChange = (e) => {
    setTypeFilter(e.target.value)
    setPage(0)
  }

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value)
    setPage(0)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedLead(null)
    setSelectedReceivable(null)
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Finance Receivables</h1>

        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by Lead Code or Document Number"
                value={search}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Type Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={typeFilter}
                onChange={handleTypeFilterChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="">All Types</option>
                <option value="PO">PO</option>
                <option value="PI">PI</option>
                <option value="TI">TI</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="COMPLETE">Complete</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Document Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lead Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Project Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Finance Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Handover Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {receivables.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                          No receivables found
                        </td>
                      </tr>
                    ) : (
                      receivables.map((receivable) => (
                        <tr key={`${receivable.type}-${receivable.id}`} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                receivable.type === "PO"
                                  ? "bg-blue-100 text-blue-800"
                                  : receivable.type === "PI"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-purple-100 text-purple-800"
                              }`}
                            >
                              {receivable.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {receivable.documentNumber || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {receivable.leadCode || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {receivable.projectName || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {receivable.type !== "PO" ? (
                              <span
                                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  receivable.financePaymentStatus === "ADVANCE_RECEIVED"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {receivable.financePaymentStatus || "PENDING"}
                              </span>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={receivable.handoverStatus || "PENDING"}
                              onChange={(e) => handleHandoverStatusChange(receivable, e.target.value)}
                              className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="PENDING">Pending</option>
                              <option value="COMPLETE">HandOver to Project</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => handleViewDetails(receivable)}
                              className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Showing {page * size + 1} to {Math.min((page + 1) * size, totalElements)} of {totalElements} results
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 0}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm text-gray-700">
                    Page {page + 1} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages - 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Lead Details</h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
              >
                &times;
              </button>
            </div>

            <div className="px-6 py-4">
              {loadingLead ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : selectedLead ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Lead Code</label>
                      <p className="text-base text-gray-900 mt-1">{selectedLead.leadCode || "N/A"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Customer Name</label>
                      <p className="text-base text-gray-900 mt-1">{selectedLead.customerName || "N/A"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-base text-gray-900 mt-1">{selectedLead.customerEmail || "N/A"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <p className="text-base text-gray-900 mt-1">{selectedLead.customerPhone || "N/A"}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-gray-500">Address</label>
                      <p className="text-base text-gray-900 mt-1">
                        {selectedLead.address || "N/A"}
                        {selectedLead.city && `, ${selectedLead.city}`}
                        {selectedLead.state && `, ${selectedLead.state}`}
                        {selectedLead.pincode && ` - ${selectedLead.pincode}`}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Lead Status</label>
                      <p className="text-base text-gray-900 mt-1">{selectedLead.leadStatus || "N/A"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Lead Source</label>
                      <p className="text-base text-gray-900 mt-1">{selectedLead.leadSource || "N/A"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Project Name</label>
                      <p className="text-base text-gray-900 mt-1">{selectedLead.projectName || "N/A"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Project Status</label>
                      <p className="text-base text-gray-900 mt-1">{selectedLead.projectStatus || "N/A"}</p>
                    </div>
                  </div>

                  {/* Advance Received Button - Only for first PI/TI */}
                  {selectedReceivable &&
                    selectedReceivable.type !== "PO" &&
                    selectedReceivable.isFirstInvoice &&
                    selectedReceivable.financePaymentStatus !== "ADVANCE_RECEIVED" && (
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <button
                          onClick={handleAdvanceReceived}
                          className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium"
                        >
                          Mark as Advance Received
                        </button>
                      </div>
                    )}

                  {/* Information for other invoices */}
                  {selectedReceivable && selectedReceivable.type !== "PO" && !selectedReceivable.isFirstInvoice && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800">
                          This is not the first invoice. Advance received option is only available for the first PI/TI.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Information for PO */}
                  {selectedReceivable && selectedReceivable.type === "PO" && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <p className="text-sm text-gray-800">
                          This is a Purchase Order. Finance payment status is not applicable.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No lead details available</p>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200">
              <button
                onClick={closeModal}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FinanceRecievable
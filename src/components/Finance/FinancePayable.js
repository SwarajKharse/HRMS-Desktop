"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FiAlertCircle, FiCheck, FiX, FiFileText, FiExternalLink } from "react-icons/fi"
import { financePayableService } from "../../services/financePayableService"
import { purchaseInvoiceService } from "../../services/purchaseInvoiceService"
import { useAuth } from "../../contexts/AuthContext" // Import useAuth hook

function ApprovalModal({ isOpen, onClose, invoice, onSuccess }) {
  const [approvalStatus, setApprovalStatus] = useState("")
  const [remarks, setRemarks] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isOpen && invoice) {
      setApprovalStatus(invoice.financeManagerApprovalStatus || "")
      setRemarks(invoice.financeManagerApprovalRemarks || "")
      setError(null)
    }
  }, [isOpen, invoice])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!approvalStatus) {
      setError("Please select approval status")
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Get current user ID from localStorage or context
      const currentUserId = localStorage.getItem("userId") || 1

      await financePayableService.approveOrRejectPayable(invoice.id, approvalStatus, remarks, currentUserId)

      onSuccess()
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update approval status")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !invoice) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Approve/Reject PO</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <FiX size={24} />
            </button>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 flex items-center gap-2">
              <FiAlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Approval Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Approval Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={approvalStatus}
                  onChange={(e) => setApprovalStatus(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required
                  disabled={loading}
                >
                  <option value="">Select Status</option>
                  <option value="APPROVED">Approve</option>
                  <option value="REJECTED">Reject</option>
                </select>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={4}
                  placeholder="Add any comments or remarks..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? "Saving..." : "Submit"}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

function FinancePayable() {
  const { user } = useAuth() // Declare useAuth hook at the top level
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [purchaseInvoices, setPurchaseInvoices] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [projectNameFilter, setProjectNameFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [successMessage, setSuccessMessage] = useState(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const itemsPerPage = 10

  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)

  // PI approval modal states
  const [showPIApprovalModal, setShowPIApprovalModal] = useState(false)
  const [selectedPOForPIApproval, setSelectedPOForPIApproval] = useState(null)
  const [newPIApprovalStatus, setNewPIApprovalStatus] = useState("")
  const [piApprovalRemarks, setPiApprovalRemarks] = useState("")
  const [updatingPIApproval, setUpdatingPIApproval] = useState(false)

  // PI data map
  const [piDataMap, setPiDataMap] = useState({})

  const [expandedRows, setExpandedRows] = useState({})
  const [expandedPIHistory, setExpandedPIHistory] = useState({})

  const fetchPurchaseInvoices = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const page = currentPage - 1
      const data = await financePayableService.getAllPayables(
        page,
        itemsPerPage,
        searchQuery,
        projectNameFilter,
        statusFilter,
        startDate,
        endDate,
      )
      setPurchaseInvoices(data.content || [])
      setTotalPages(data.totalPages || 1)
      setTotalResults(data.totalItems || 0)

      // Fetch PI data for each PO
      const piMap = {}
      for (const po of data.content || []) {
        try {
          // Fetch PI data based on PO ID or MTR ID
          const piList = await purchaseInvoiceService.getPurchaseInvoicesByPO(po.id)
          console.log("[v0] PI List received:", piList)
          if (piList && piList.length > 0) {
            // Get the latest PI
            const latestPI = piList[piList.length - 1]
            piMap[po.id] = {
              piNumber: latestPI.piNumber,
              piFileUrl: latestPI.fileUrl,
              expectedPaymentDate: latestPI.expectedPaymentDate,
              payableAmount: latestPI.payableAmount,
              approvalStatus: latestPI.approvalStatus || "PENDING",
              financeManagerApprovalStatus: latestPI.approvedFromFinance || "PENDING",
              handoverFromFinance: latestPI.handoverFromFinance || "PENDING",
              piList: piList,
              id: latestPI.id,
            }
          } else {
            piMap[po.id] = {
              piNumber: null,
              piFileUrl: null,
              expectedPaymentDate: null,
              payableAmount: null,
              approvalStatus: "PENDING",
              financeManagerApprovalStatus: "PENDING",
              handoverFromFinance: "PENDING",
              piList: [],
              id: null,
            }
          }
        } catch (error) {
          console.log("[v0] Error fetching PI data for PO", po.id, error.message)
          piMap[po.id] = {
            piNumber: null,
            piFileUrl: null,
            expectedPaymentDate: null,
            payableAmount: null,
            approvalStatus: "PENDING",
            financeManagerApprovalStatus: "PENDING",
            handoverFromFinance: "PENDING",
            piList: [],
            id: null,
          }
        }
      }
      setPiDataMap(piMap)
    } catch (error) {
      setError("Failed to fetch purchase invoices")
      console.error("[v0] Error fetching purchase invoices:", error)
    } finally {
      setLoading(false)
    }
  }, [currentPage, itemsPerPage, searchQuery, projectNameFilter, statusFilter, startDate, endDate])

  useEffect(() => {
    fetchPurchaseInvoices()
  }, [fetchPurchaseInvoices])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, projectNameFilter, statusFilter, startDate, endDate])

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleRowClick = (invoice) => {
    setExpandedRows((prev) => ({
      ...prev,
      [invoice.id]: !prev[invoice.id],
    }))
  }

  const handleApproveReject = (e, invoice) => {
    e.stopPropagation()
    setSelectedInvoice(invoice)
    setShowApprovalModal(true)
  }

  const handleHandoverToPurchase = async (e, invoice) => {
    e.stopPropagation()

    if (invoice.financeManagerApprovalStatus !== "APPROVED" || piDataMap[invoice.id]?.financeManagerApprovalStatus !== "APPROVED") {
      setError("Cannot handover to purchase. Both PO and PI must be approved first.")
      setTimeout(() => setError(null), 3000)
      return
    }

    if (window.confirm("Are you sure you want to handover this invoice to purchase?")) {
      try {
        setLoading(true)
        const currentUserId = user?.userId || 1
        const piId = piDataMap[invoice.id]?.id
        
        console.log("[v0] Handover to Purchase - PI ID:", piId, "User ID:", currentUserId)
        
        await financePayableService.handoverToPurchase(piId, currentUserId)
        setSuccessMessage("Successfully handed over to purchase!")
        await fetchPurchaseInvoices()
        setTimeout(() => setSuccessMessage(null), 3000)
      } catch (err) {
        console.error("[v0] Handover error:", err)
        setError(err.response?.data?.error || "Failed to handover to purchase")
        setTimeout(() => setError(null), 3000)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleApprovalSuccess = async () => {
    setSuccessMessage("Invoice status updated successfully!")
    await fetchPurchaseInvoices()
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  const handleUpdatePIApproval = async () => {
    if (!selectedPOForPIApproval || !newPIApprovalStatus) return

    try {
      setUpdatingPIApproval(true)
      setError(null)

      const currentUserId = user?.userId || 1

      console.log("[v0] Updating PI Approval - PI ID:", selectedPOForPIApproval.piId, "Status:", newPIApprovalStatus, "User ID:", currentUserId)

      // Call the backend API to update PI approval using PI ID, not PO ID
      await financePayableService.approvePIApproval(
        selectedPOForPIApproval.piId,
        newPIApprovalStatus,
        piApprovalRemarks,
        currentUserId
      )

      setSuccessMessage("PI approval updated successfully!")
      setShowPIApprovalModal(false)
      setSelectedPOForPIApproval(null)
      setNewPIApprovalStatus("")
      setPiApprovalRemarks("")
      
      // Refresh the data to get updated values from backend
      await fetchPurchaseInvoices()
      
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error("[v0] Error updating PI approval:", error)
      setError(error.response?.data?.error || "Failed to update PI approval")
      setTimeout(() => setError(null), 3000)
    } finally {
      setUpdatingPIApproval(false)
    }
  }

  const clearFilters = () => {
    setSearchQuery("")
    setProjectNameFilter("")
    setStatusFilter("")
    setStartDate("")
    setEndDate("")
    setCurrentPage(1)
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatCurrency = (amount) => {
    if (!amount) return "₹0"
    return `₹${Number.parseFloat(amount).toLocaleString("en-IN")}`
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      APPROVED: "bg-green-100 text-green-700",
      REJECTED: "bg-red-100 text-red-700",
      PENDING: "bg-yellow-100 text-yellow-700",
    }
    return statusConfig[status] || statusConfig.PENDING
  }

  if (loading && purchaseInvoices.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="relative w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-200 rounded-full animate-pulse"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Finance Payables</h1>
          <p className="text-gray-600 mt-1">Manage and approve purchase invoices</p>
        </div>

        {/* Messages */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-3 border border-red-100 mb-4"
            >
              <FiAlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">{error}</span>
            </motion.div>
          )}

          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-green-50 text-green-600 p-4 rounded-lg border border-green-100 flex items-center mb-4"
            >
              <FiCheck className="w-5 h-5 mr-2 flex-shrink-0" />
              <span className="font-medium">{successMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                placeholder="PO Number or Project Name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
              <input
                type="text"
                placeholder="Filter by project"
                value={projectNameFilter}
                onChange={(e) => setProjectNameFilter(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                />
              </div>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Clear All Filters
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading && (
            <div className="flex justify-center py-4">
              <div className="relative w-8 h-8">
                <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-200 rounded-full animate-pulse"></div>
                <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
              </div>
            </div>
          )}

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {[ "Project Name", "Number", "Documents", "PM Status", "PO Status", "Expected Payment Date", "Payable Amount", "Handover", "Actions", ].map((header) => (
                    <th
                      key={header}
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {purchaseInvoices.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="px-6 py-12 text-center text-gray-500 font-medium">
                      No purchase invoices found
                    </td>
                  </tr>
                ) : (
                  purchaseInvoices.map((invoice) => (
                    <motion.tr
                      key={invoice.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {/* Project Name */}
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{invoice.projectName}</div>
                      </td>

                      {/* Number (PO & PI combined) */}
                      <td className="px-6 py-4">
                        <div className="space-y-0.5 text-xs">
                          <div>PO: {invoice.poNumber}</div>
                          {piDataMap[invoice.id]?.piNumber && (
                            <div>PI: {piDataMap[invoice.id].piNumber}</div>
                          )}
                        </div>
                      </td>

                      {/* Documents */}
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-3 text-xs">
                          <div>
                            <span className="font-medium">PO:</span>{" "}
                            {invoice.fileUrl ? (
                              <a
                                href={invoice.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Document
                              </a>
                            ) : (
                              <span className="text-gray-400">No Document</span>
                            )}
                          </div>
                          {piDataMap[invoice.id]?.piFileUrl && (
                            <div>
                              <span className="font-medium">PI:</span>{" "}
                              <a
                                href={piDataMap[invoice.id].piFileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Document
                              </a>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* PM Status - No click handler */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusBadge(
                                invoice.purchaseManagerApprovalStatus || "PENDING",
                              )}`}
                            >
                              PO: {invoice.purchaseManagerApprovalStatus || "PENDING"}
                            </span>
                          </div>
                          {piDataMap[invoice.id]?.piNumber && (
                            <div>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusBadge(
                                  piDataMap[invoice.id]?.approvalStatus || "PENDING",
                                )}`}
                              >
                                PI: {piDataMap[invoice.id]?.approvalStatus || "PENDING"}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* PO Status - Clickable */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div>
                            <button
                              onClick={() => {
                                setSelectedInvoice(invoice)
                                setShowApprovalModal(true)
                              }}
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium cursor-pointer hover:opacity-80 ${getStatusBadge(
                                invoice.financeManagerApprovalStatus || "PENDING",
                              )}`}
                            >
                              PO: {invoice.financeManagerApprovalStatus || "PENDING"}
                            </button>
                          </div>
                          {piDataMap[invoice.id]?.piNumber && (
                            <div>
                              <button
                                onClick={() => {
                                  // Pass both PO data and PI ID
                                  setSelectedPOForPIApproval({
                                    ...invoice,
                                    piId: piDataMap[invoice.id]?.id,
                                  })
                                  setNewPIApprovalStatus(piDataMap[invoice.id]?.financeManagerApprovalStatus || "PENDING")
                                  setPiApprovalRemarks("")
                                  setShowPIApprovalModal(true)
                                }}
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium cursor-pointer hover:opacity-80 ${getStatusBadge(
                                  piDataMap[invoice.id]?.financeManagerApprovalStatus || "PENDING",
                                )}`}
                              >
                                PI: {piDataMap[invoice.id]?.financeManagerApprovalStatus || "PENDING"}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Expected Payment Date */}
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {piDataMap[invoice.id]?.expectedPaymentDate
                            ? formatDate(piDataMap[invoice.id].expectedPaymentDate)
                            : "N/A"}
                        </div>
                      </td>

                      {/* Payable Amount with PI History */}
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          {piDataMap[invoice.id]?.piList && piDataMap[invoice.id].piList.length > 0 ? (
                            <div>
                              {/* Latest PI Amount */}
                              <div className="border border-gray-200 rounded p-2 bg-gray-50">
                                <button
                                  onClick={() => {
                                    setExpandedPIHistory((prev) => ({
                                      ...prev,
                                      [invoice.id]: !prev[invoice.id],
                                    }))
                                  }}
                                  className="w-full text-left flex items-center justify-between hover:bg-gray-100 p-1 rounded"
                                >
                                  <div className="font-medium text-gray-900 text-sm">
                                    {formatCurrency(piDataMap[invoice.id]?.payableAmount)}
                                  </div>
                                  <svg
                                    className={`w-4 h-4 text-gray-600 transition-transform ${
                                      expandedPIHistory[invoice.id] ? "rotate-180" : ""
                                    }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                  </svg>
                                </button>
                              </div>

                              {/* PI History - Expandable */}
                              {expandedPIHistory[invoice.id] && piDataMap[invoice.id].piList.length > 1 && (
                                <div className="border border-gray-300 rounded p-2 bg-white">
                                  <div className="text-xs font-semibold text-gray-700 mb-2">PI History ({piDataMap[invoice.id].piList.length} total)</div>
                                  <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {piDataMap[invoice.id].piList
                                      .slice()
                                      .reverse()
                                      .map((pi, index) => (
                                        <div key={pi.id || index} className="border-l-2 border-gray-300 pl-2 py-1">
                                          <div className="flex justify-between items-center">
                                            <div className="text-xs text-gray-700">
                                              <span className="font-medium">PI #{piDataMap[invoice.id].piList.length - index}:</span>{" "}
                                              {pi.piNumber || "N/A"}
                                            </div>
                                            <span className="text-xs font-medium text-gray-900">{formatCurrency(pi.payableAmount)}</span>
                                          </div>
                                          <div className="flex flex-wrap gap-1 mt-1">
                                            <span
                                              className={`inline-flex items-center px-1 py-0.5 rounded text-xs font-medium ${
                                                pi.approvalStatus === "APPROVED"
                                                  ? "bg-green-100 text-green-800"
                                                  : pi.approvalStatus === "REJECTED"
                                                    ? "bg-red-100 text-red-800"
                                                    : "bg-yellow-100 text-gray-800"
                                              }`}
                                            >
                                              PM: {pi.approvalStatus || "PENDING"}
                                            </span>
                                            <span
                                              className={`inline-flex items-center px-1 py-0.5 rounded text-xs font-medium ${
                                                pi.approvedFromFinance === "APPROVED"
                                                  ? "bg-green-100 text-green-800"
                                                  : pi.approvedFromFinance === "REJECTED"
                                                    ? "bg-red-100 text-red-800"
                                                    : "bg-yellow-100 text-gray-800"
                                              }`}
                                            >
                                              FM: {pi.approvedFromFinance || "PENDING"}
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-500 text-xs">N/A</span>
                          )}
                        </div>
                      </td>

                      {/* Handover */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            piDataMap[invoice.id]?.handoverFromFinance === "PENDING"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {piDataMap[invoice.id]?.handoverFromFinance || "PENDING"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <button
                          onClick={(e) => handleHandoverToPurchase(e, invoice)}
                          disabled={invoice.financeManagerApprovalStatus !== "APPROVED" || piDataMap[invoice.id]?.financeManagerApprovalStatus !== "APPROVED" || piDataMap[invoice.id]?.handoverFromFinance === "COMPLETE"}
                          className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Handover
                        </button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-200">
            {purchaseInvoices.length === 0 ? (
              <div className="p-8 text-center text-gray-500 font-medium">No purchase invoices found</div>
            ) : (
              purchaseInvoices.map((invoice) => (
                <motion.div key={invoice.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{invoice.piNumber}</div>
                        <div className="text-xs text-gray-600 mt-1">PO: {invoice.poNumber || "N/A"}</div>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                          invoice.financeManagerApprovalStatus || "PENDING",
                        )}`}
                      >
                        {invoice.financeManagerApprovalStatus || "PENDING"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="font-medium text-gray-700">Amount:</span>
                        <div className="font-semibold text-gray-900">{formatCurrency(invoice.payableAmount)}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Expected Date:</span>
                        <div className="text-gray-900">{formatDate(invoice.expectedPaymentDate)}</div>
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium text-gray-700">Project:</span>
                        <div className="text-gray-900">{invoice.projectName}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">PM Status:</span>
                        <div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                              invoice.purchaseManagerApprovalStatus || "PENDING",
                            )}`}
                          >
                            {invoice.purchaseManagerApprovalStatus || "PENDING"}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">PO Status:</span>
                        <div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                              invoice.financeManagerApprovalStatus || "PENDING",
                            )}`}
                          >
                            {invoice.financeManagerApprovalStatus || "PENDING"}
                          </span>
                        </div>
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium text-gray-700">Documents:</span>
                        <div className="flex gap-3 mt-1">
                          {invoice.fileUrl ? (
                            <a
                              href={invoice.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium"
                            >
                              <FiFileText className="w-3.5 h-3.5" />
                              <span>PO Doc</span>
                              <FiExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400">No PO</span>
                          )}
                          {invoice.piFileUrl ? (
                            <a
                              href={invoice.piFileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium"
                            >
                              <FiFileText className="w-3.5 h-3.5" />
                              <span>PI Doc</span>
                              <FiExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400">No PI</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Handover:</span>
                        <div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              piDataMap[invoice.id]?.handoverFromFinance === "COMPLETE"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {piDataMap[invoice.id]?.handoverFromFinance || "PENDING"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => {
                          setSelectedInvoice(invoice)
                          setShowApprovalModal(true)
                        }}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        Approve/Reject
                      </button>
                      <button
                        onClick={(e) => handleHandoverToPurchase(e, invoice)}
                        disabled={invoice.financeManagerApprovalStatus !== "APPROVED" || piDataMap[invoice.id]?.financeManagerApprovalStatus !== "APPROVED" || piDataMap[invoice.id]?.handoverFromFinance === "COMPLETE"}
                        className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Handover
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Showing {purchaseInvoices.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{" "}
                  {Math.min(currentPage * itemsPerPage, totalResults)} of {totalResults} results
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <div className="hidden md:flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          disabled={loading}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === pageNum
                              ? "bg-blue-600 text-white"
                              : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                  </div>
                  <div className="md:hidden px-4 py-2 text-sm font-medium text-gray-700">
                    Page {currentPage} of {totalPages}
                  </div>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || loading}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Approval Modal */}
      <ApprovalModal
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        invoice={selectedInvoice}
        onSuccess={handleApprovalSuccess}
      />

      {/* PI Approval Modal */}
      {showPIApprovalModal && selectedPOForPIApproval && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-md"
          >
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Update PI Approval Status</h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Approval Status</label>
                <select
                  value={newPIApprovalStatus}
                  onChange={(e) => setNewPIApprovalStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Remarks (Optional)</label>
                <textarea
                  value={piApprovalRemarks}
                  onChange={(e) => setPiApprovalRemarks(e.target.value)}
                  placeholder="Enter approval remarks..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="4"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowPIApprovalModal(false)
                    setSelectedPOForPIApproval(null)
                    setNewPIApprovalStatus("")
                    setPiApprovalRemarks("")
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdatePIApproval}
                  disabled={updatingPIApproval}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {updatingPIApproval ? "Updating..." : "Update"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default FinancePayable
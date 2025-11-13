"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FiAlertCircle, FiCheck, FiX, FiFileText, FiExternalLink } from "react-icons/fi"
import { financePayableService } from "../../services/financePayableService"

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
            <h3 className="text-xl font-semibold text-gray-900">Approve/Reject Invoice</h3>
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

          {/* Invoice Details */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">Invoice Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-medium text-gray-700">PO Number:</span>
                <span className="ml-2 text-gray-900">{invoice.poNumber || "N/A"}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">PI Number:</span>
                <span className="ml-2 text-gray-900">{invoice.piNumber || "N/A"}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Project:</span>
                <span className="ml-2 text-gray-900">{invoice.projectName}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Amount:</span>
                <span className="ml-2 text-gray-900 font-semibold">
                  ₹{Number.parseFloat(invoice.payableAmount || invoice.amount || 0).toLocaleString("en-IN")}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Expected Date:</span>
                <span className="ml-2 text-gray-900">
                  {invoice.expectedPaymentDate ? new Date(invoice.expectedPaymentDate).toLocaleDateString() : "N/A"}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Current Status:</span>
                <span
                  className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                    invoice.financeManagerApprovalStatus === "APPROVED"
                      ? "bg-green-100 text-green-700"
                      : invoice.financeManagerApprovalStatus === "REJECTED"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {invoice.financeManagerApprovalStatus || "PENDING"}
                </span>
              </div>
            </div>

            {/* File Links */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <span className="font-medium text-gray-700 text-sm">Files: </span>
              {invoice.fileUrl ? (
                <a
                  href={invoice.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline hover:text-blue-800 text-sm"
                >
                  {invoice.fileName || "PO File"}
                </a>
              ) : (
                <span className="text-gray-400 text-sm">No PO file</span>
              )}
              {invoice.piFileUrl && (
                <>
                  <span className="mx-2 text-gray-400">|</span>
                  <a
                    href={invoice.piFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-800 text-sm"
                  >
                    {invoice.piFileName || "PI File"}
                  </a>
                </>
              )}
            </div>
          </div>

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

  const [expandedRows, setExpandedRows] = useState({})

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
    } catch (error) {
      setError("Failed to fetch purchase invoices")
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

    if (invoice.financeManagerApprovalStatus !== "APPROVED") {
      setError("Cannot handover to purchase. Invoice must be approved first.")
      setTimeout(() => setError(null), 3000)
      return
    }

    if (window.confirm("Are you sure you want to handover this invoice to purchase?")) {
      try {
        setLoading(true)
        const currentUserId = localStorage.getItem("userId") || 1
        await financePayableService.handoverToPurchase(invoice.id, currentUserId)
        setSuccessMessage("Successfully handed over to purchase!")
        await fetchPurchaseInvoices()
        setTimeout(() => setSuccessMessage(null), 3000)
      } catch (err) {
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
                  {[
                    "PO Number",
                    "PI Number",
                    "Amount",
                    "Project Name",
                    "Expected Date",
                    "Documents",
                    "Status",
                    "Handover",
                    "Actions",
                  ].map((header) => (
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
                    <td colSpan="9" className="px-6 py-12 text-center text-gray-500 font-medium">
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
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{invoice.poNumber || "N/A"}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{invoice.piNumber || "N/A"}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900">
                          {formatCurrency(invoice.payableAmount)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{invoice.projectName}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{formatDate(invoice.expectedPaymentDate)}</div>
                      </td>
                      {/* Documents column with PO and PI file links */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {invoice.fileUrl ? (
                            <a
                              href={invoice.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium transition-colors"
                              onClick={(e) => e.stopPropagation()}
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
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <FiFileText className="w-3.5 h-3.5" />
                              <span>PI Doc</span>
                              <FiExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400">No PI</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                            invoice.financeManagerApprovalStatus || "PENDING",
                          )}`}
                        >
                          {invoice.financeManagerApprovalStatus || "PENDING"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            invoice.handoverFromFinance === "COMPLETE"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {invoice.handoverFromFinance}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => handleApproveReject(e, invoice)}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            Approve/Reject
                          </button>
                          <button
                            onClick={(e) => handleHandoverToPurchase(e, invoice)}
                            disabled={
                              invoice.financeManagerApprovalStatus !== "APPROVED" ||
                              invoice.handoverFromFinance === "COMPLETE"
                            }
                            className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Handover
                          </button>
                        </div>
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
                      {/* Document links to mobile view */}
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
                              invoice.handoverFromFinance === "COMPLETE"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {invoice.handoverFromFinance}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={(e) => handleApproveReject(e, invoice)}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        Approve/Reject
                      </button>
                      <button
                        onClick={(e) => handleHandoverToPurchase(e, invoice)}
                        disabled={
                          invoice.financeManagerApprovalStatus !== "APPROVED" ||
                          invoice.handoverFromFinance === "COMPLETE"
                        }
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
    </div>
  )
}

export default FinancePayable
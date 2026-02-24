"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate } from "react-router-dom"
import {
  FiAlertCircle,
  FiCheck,
  FiChevronRight,
  FiFileText,
  FiCalendar,
  FiDollarSign,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiUpload, // Added upload icon for payment receipt
} from "react-icons/fi"
import { purchaseInvoiceService } from "../../../services/purchaseInvoiceService"
import { useAuth } from "../../../contexts/AuthContext"
import PurchaseInvoiceFormIntegration from "./PurchaseInvoiceFormIntegration"

function PayablePIComponent() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [projectNameFilter, setProjectNameFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [successMessage, setSuccessMessage] = useState(null)

  const [uploadingReceipt, setUploadingReceipt] = useState(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const itemsPerPage = 10

  // Modal state
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedPiId, setSelectedPiId] = useState(null)
  const [showUpdateForm, setShowUpdateForm] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)

  // State for expanded rows on mobile
  const [expandedRows, setExpandedRows] = useState({})
  const { user } = useAuth()

  const fetchPurchaseInvoices = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const currentUserId = user.userId
      const page = currentPage - 1
      const data = await purchaseInvoiceService.getAssignedPurchaseInvoices(
        page,
        itemsPerPage,
        searchQuery,
        projectNameFilter,
        statusFilter,
        currentUserId,
      )
      setInvoices(data.content || [])
      setTotalPages(data.totalPages || 1)
      setTotalResults(data.totalItems || 0)
      setLoading(false)
    } catch (error) {
      setError("Failed to fetch purchase invoices")
      setLoading(false)
    }
  }, [currentPage, itemsPerPage, searchQuery, projectNameFilter, statusFilter, user.userId])

  useEffect(() => {
    fetchPurchaseInvoices()
  }, [fetchPurchaseInvoices])

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, projectNameFilter, statusFilter])

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber)
    if (window.innerWidth < 768) {
      window.scrollTo(0, 0)
    }
  }

  const handleUploadReceipt = async (e, invoice) => {
    e.stopPropagation()
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "application/pdf"
    input.onchange = async (event) => {
      const file = event.target.files[0]
      if (file) {
        try {
          setUploadingReceipt(invoice.id)
          await purchaseInvoiceService.uploadPaymentReceipt(invoice.id, file)
          setSuccessMessage("Payment receipt uploaded successfully!")
          await fetchPurchaseInvoices()
          setTimeout(() => setSuccessMessage(null), 3000)
        } catch (error) {
          setError("Failed to upload payment receipt")
          setTimeout(() => setError(null), 3000)
        } finally {
          setUploadingReceipt(null)
        }
      }
    }
    input.click()
  }

  const handleUpdateInvoice = (e, invoice) => {
    e.stopPropagation()
    setSelectedInvoice(invoice)
    setShowUpdateForm(true)
  }

  const handleUpdateSuccess = async () => {
    setSuccessMessage("Invoice updated successfully!")
    await fetchPurchaseInvoices()
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  const handleRowClick = (invoice) => {
    setExpandedRows((prev) => ({
      ...prev,
      [invoice.id]: !prev[invoice.id],
    }))
  }

  const handleAssignAccountant = (e, piId) => {
    e.stopPropagation()
    setSelectedPiId(piId)
    setShowAssignModal(true)
  }

  const handleAssignSuccess = async () => {
    setSuccessMessage("Accountant assigned successfully!")
    await fetchPurchaseInvoices()
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  const clearFilters = () => {
    setSearchQuery("")
    setProjectNameFilter("")
    setStatusFilter("")
    setCurrentPage(1)
  }

  const formatDate = (dateString) => {
    if (!dateString) return ""
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

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return <FiCheckCircle className="w-4 h-4 text-green-500" />
      case "rejected":
        return <FiXCircle className="w-4 h-4 text-red-500" />
      case "pending":
        return <FiClock className="w-4 h-4 text-yellow-500" />
      case "paid":
        return <FiCheckCircle className="w-4 h-4 text-blue-500" />
      default:
        return <FiAlertCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "paid":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Get the correct payment status - prioritize rejection over payment status
  const getDisplayPaymentStatus = (invoice) => {
    if (invoice.accountManagerApprovalStatus === "REJECTED") {
      return "REJECTED"
    }
    return invoice.paymentStatus || "PENDING"
  }

  if (loading && invoices.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="relative w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-200 rounded-full animate-pulse"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-600 rounded-full animate-spin border-t-transparent"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 md:gap-8">
      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 text-red-600 p-3 md:p-4 rounded-lg flex items-center gap-2 md:gap-3 border border-red-100 mx-2 md:mx-0"
        >
          <FiAlertCircle className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
          <span className="text-sm md:font-medium">{error}</span>
        </motion.div>
      )}

      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-green-50 text-green-600 p-3 md:p-4 rounded-lg border border-green-100 flex items-center shadow-sm mx-2 md:mx-0"
        >
          <FiCheck className="w-4 h-4 md:w-5 md:h-5 mr-2 flex-shrink-0" />
          <span className="text-sm md:font-medium">{successMessage}</span>
        </motion.div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-4 mx-2 md:mx-0">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search PO, PI, Project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="Filter by Project Name"
              value={projectNameFilter}
              onChange={(e) => setProjectNameFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <div>
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Purchase Invoice List */}
      <div className="bg-white rounded-xl shadow-sm p-3 md:p-6 mx-2 md:mx-0">
        <div className="md:hidden flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Purchase Invoices</h2>
        </div>

        {loading && (
          <div className="flex justify-center my-4">
            <div className="relative w-8 h-8">
              <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-200 rounded-full animate-pulse"></div>
              <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-600 rounded-full animate-spin border-t-transparent"></div>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden rounded-lg border border-gray-200"
          >
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      "PO / PI Number",
                      "Pay Amount",
                      "Project Name",
                      "Expected Payment Date",
                      "PI Status",
                      "Payment Status",
                      "Files",
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
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-8 text-center text-gray-500 font-medium">
                        No purchase invoices found
                      </td>
                    </tr>
                  ) : (
                    invoices.map((invoice) => (
                      <motion.tr
                        key={invoice.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-gray-50 cursor-pointer transition-colors group"
                        onClick={() => handleRowClick(invoice)}
                      >
                        {/* Combined PO Number and PI Number Column */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                              PO: {invoice.purchaseOrder?.poNumber || "N/A"}
                            </div>
                            <div className="text-sm font-medium text-gray-600">
                              PI: {invoice.piNumber}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(invoice.payableAmount)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{invoice.projectName}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{formatDate(invoice.expectedPaymentDate)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.approvalStatus)}`}
                          >
                            {getStatusIcon(invoice.approvalStatus)}
                            <span className="ml-1">{invoice.approvalStatus || "PENDING"}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(getDisplayPaymentStatus(invoice))}`}
                          >
                            {getStatusIcon(getDisplayPaymentStatus(invoice))}
                            <span className="ml-1">{getDisplayPaymentStatus(invoice)}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-2">
                            {invoice.purchaseOrder?.fileUrl ? (
                              <div className="text-xs">
                                <span className="font-semibold text-gray-700">PO: </span>
                                <a
                                  href={invoice.purchaseOrder.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 underline hover:text-blue-800"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {invoice.purchaseOrder.fileName && invoice.purchaseOrder.fileName.length > 15
                                    ? `${invoice.purchaseOrder.fileName.substring(0, 15)}...`
                                    : invoice.purchaseOrder.fileName || "PO File"}
                                </a>
                              </div>
                            ) : null}
                            {invoice.fileUrl && (
                              <div className="text-xs">
                                <span className="font-semibold text-gray-700">PI: </span>
                                <a
                                  href={invoice.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 underline hover:text-blue-800"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {invoice.fileName && invoice.fileName.length > 15
                                    ? `${invoice.fileName.substring(0, 15)}...`
                                    : invoice.fileName || "PI File"}
                                </a>
                              </div>
                            )}
                            {invoice.paymentReceiptUrl && (
                              <div className="text-xs">
                                <span className="font-semibold text-gray-700">Receipt: </span>
                                <a
                                  href={invoice.paymentReceiptUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-green-600 underline hover:text-green-800"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {invoice.paymentReceiptFilename && invoice.paymentReceiptFilename.length > 12
                                    ? `${invoice.paymentReceiptFilename.substring(0, 12)}...`
                                    : invoice.paymentReceiptFilename || "Receipt"}
                                </a>
                              </div>
                            )}
                            {!invoice.fileUrl && !invoice.paymentReceiptUrl && !invoice.purchaseOrder?.fileUrl && (
                              <span className="text-xs text-gray-400">No files</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {invoice.approvalStatus === "APPROVED" && !invoice.paymentReceiptUrl && (
                              <button
                                className="px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors text-sm font-medium flex items-center gap-1"
                                onClick={(e) => handleUploadReceipt(e, invoice)}
                                disabled={uploadingReceipt === invoice.id}
                                title="Upload Payment Receipt"
                              >
                                <FiUpload size={14} />
                                {uploadingReceipt === invoice.id ? "Uploading..." : "Upload Receipt"}
                              </button>
                            )}
                            <button
                              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm font-medium"
                              onClick={(e) => handleUpdateInvoice(e, invoice)}
                              title="Update Invoice"
                            >
                              Update
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden">
              {invoices.length === 0 ? (
                <div className="p-4 text-center text-gray-500 font-medium">No payable invoices found</div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {invoices.map((invoice) => (
                    <motion.div
                      key={invoice.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleRowClick(invoice)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                          <FiFileText className="h-4 w-4 text-blue-600" />
                          {invoice.piNumber}
                        </div>
                        <div className="flex gap-1">
                          {invoice.approvalStatus === "APPROVED" && !invoice.paymentReceiptUrl && (
                            <button
                              className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium"
                              onClick={(e) => handleUploadReceipt(e, invoice)}
                              disabled={uploadingReceipt === invoice.id}
                              title="Upload Receipt"
                            >
                              <FiUpload size={12} />
                            </button>
                          )}
                          <button
                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium"
                            onClick={(e) => handleUpdateInvoice(e, invoice)}
                            title="Update Invoice"
                          >
                            Update
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-y-1 text-xs">
                        <div className="flex items-center gap-1">
                          <FiFileText className="h-3 w-3" />
                          <span className="font-medium">PO:</span> {invoice.purchaseOrder?.poNumber || "N/A"}
                        </div>
                        <div className="flex items-center gap-1">
                          <FiDollarSign className="h-3 w-3" />
                          <span className="font-medium">Amount:</span> {formatCurrency(invoice.payableAmount)}
                        </div>
                        <div className="flex items-center gap-1">
                          <FiCalendar className="h-3 w-3" />
                          <span className="font-medium">Date:</span> {formatDate(invoice.expectedPaymentDate)}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">PI Status:</span>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.approvalStatus)}`}
                          >
                            {getStatusIcon(invoice.approvalStatus)}
                            <span className="ml-1">{invoice.approvalStatus || "PENDING"}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Payment:</span>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.paymentStatus)}`}
                          >
                            {getStatusIcon(invoice.paymentStatus)}
                            <span className="ml-1">{invoice.paymentStatus || "PENDING"}</span>
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Files:</span>{" "}
                          <div className="flex flex-col gap-1 mt-1">
                            {invoice.purchaseOrder?.fileUrl ? (
                              <div className="text-xs">
                                <span className="font-semibold">PO: </span>
                                <a
                                  href={invoice.purchaseOrder.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 underline hover:text-blue-800"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {invoice.purchaseOrder.fileName && invoice.purchaseOrder.fileName.length > 8
                                    ? `${invoice.purchaseOrder.fileName.substring(0, 8)}...`
                                    : invoice.purchaseOrder.fileName || "PO File"}
                                </a>
                              </div>
                            ) : null}
                            {invoice.fileUrl ? (
                              <div className="text-xs">
                                <span className="font-semibold">PI: </span>
                                <a
                                  href={invoice.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 underline hover:text-blue-800"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {invoice.fileName && invoice.fileName.length > 8
                                    ? `${invoice.fileName.substring(0, 8)}...`
                                    : invoice.fileName || "PI File"}
                                </a>
                              </div>
                            ) : null}
                            {invoice.paymentReceiptUrl ? (
                              <div className="text-xs">
                                <span className="font-semibold">Receipt: </span>
                                <a
                                  href={invoice.paymentReceiptUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-green-600 underline hover:text-green-800"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {invoice.paymentReceiptFilename && invoice.paymentReceiptFilename.length > 8
                                    ? `${invoice.paymentReceiptFilename.substring(0, 8)}...`
                                    : invoice.paymentReceiptFilename || "Receipt"}
                                </a>
                              </div>
                            ) : null}
                            {!invoice.fileUrl && !invoice.paymentReceiptUrl && !invoice.purchaseOrder?.fileUrl && (
                              <span className="text-gray-400">No files</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-center mt-2">
                        <FiChevronRight
                          className={`text-gray-400 transition-transform ${expandedRows[invoice.id] ? "rotate-90" : ""}`}
                          size={16}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-4 flex justify-center items-center gap-2 flex-wrap">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || loading}
              className="px-3 py-1 rounded-md border text-sm disabled:opacity-50"
            >
              Prev
            </button>
            <div className="md:hidden px-3 py-1 text-sm">
              Page {currentPage} of {totalPages}
            </div>
            <div className="hidden md:flex">
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
                    className={`px-3 py-1 rounded-md border text-sm ${
                      currentPage === pageNum ? "bg-indigo-600 text-white" : "bg-white text-gray-600"
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || loading}
              className="px-3 py-1 rounded-md border text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}

        <div className="mt-2 text-xs md:text-sm text-gray-500 text-center">
          Showing {invoices.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{" "}
          {Math.min(currentPage * itemsPerPage, totalResults)} of {totalResults} purchase invoices
        </div>
      </div>

      {showUpdateForm && selectedInvoice && (
        <PurchaseInvoiceFormIntegration
          invoice={selectedInvoice}
          onClose={() => setShowUpdateForm(false)}
          onSuccess={handleUpdateSuccess}
          isOpen={showUpdateForm}
        />
      )}
    </div>
  )
}

export default PayablePIComponent
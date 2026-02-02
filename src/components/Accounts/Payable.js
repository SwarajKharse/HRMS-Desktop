"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { FiAlertCircle, FiCheck, FiChevronRight, FiUser } from "react-icons/fi"
import { purchaseInvoiceService } from "../../services/purchaseInvoiceService"
import { useAuth } from "../../contexts/AuthContext"

function AssignAccountantModal({ isOpen, onClose, piId, onAssign }) {
  const [accountants, setAccountants] = useState([])
  const [selectedAccountant, setSelectedAccountant] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [currentAssignee, setCurrentAssignee] = useState(null)
  const { user } = useAuth()

  useEffect(() => {
    if (isOpen) {
      fetchAccountants()
      fetchCurrentAssignee()
    }
  }, [isOpen, piId])

  const fetchAccountants = async () => {
    try {
      setLoading(true)
      const data = await purchaseInvoiceService.getAccountants()
      setAccountants(data)
    } catch (err) {
      setError("Failed to fetch accountants")
    } finally {
      setLoading(false)
    }
  }

  const fetchCurrentAssignee = async () => {
    try {
      const invoices = await purchaseInvoiceService.getPurchaseInvoices(0, 1000, "", "", "")
      const invoice = invoices.content?.find((inv) => inv.id === piId)

      console.log("invoices")
      console.log(invoice)

      if (invoice?.assignedAccountant) {
        setCurrentAssignee(invoice.assignedAccountant)
        setSelectedAccountant(invoice.assignedAccountant.id.toString())
      } else {
        setCurrentAssignee(null)
        setSelectedAccountant("")
      }
    } catch (err) {
      console.error("Failed to fetch current assignee:", err)
    }
  }

  const handleAssign = async () => {
    if (!selectedAccountant) return

    try {
      setLoading(true)
      await purchaseInvoiceService.assignAccountant(piId, selectedAccountant)
      onAssign()
      onClose()
    } catch (err) {
      setError("Failed to assign accountant")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4">Assign Accountant</h3>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 flex items-center gap-2">
            <FiAlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Accountant</label>
          {currentAssignee && (
            <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
              <span className="text-sm text-blue-800">Currently assigned: {currentAssignee.name}</span>
            </div>
          )}
          <select
            value={selectedAccountant}
            onChange={(e) => setSelectedAccountant(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={loading}
          >
            <option value="">Choose an accountant...</option>
            {accountants.map((accountant) => (
              <option key={accountant.id} value={accountant.id}>
                {accountant.firstName} {accountant.lastName} - {accountant.designation?.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedAccountant || loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Assigning..." : "Assign"}
          </button>
        </div>
      </div>
    </div>
  )
}

function PaymentCompletionModal({ isOpen, onClose, invoice, onComplete }) {
  const [approvalStatus, setApprovalStatus] = useState("")
  const [paymentDoneDate, setPaymentDoneDate] = useState("")
  const [paymentReceipt, setPaymentReceipt] = useState(null)
  const [receiptFileName, setReceiptFileName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isOpen && invoice) {
      setApprovalStatus(invoice.accountManagerApprovalStatus || "")

      // Check if payment has already been completed
      if (invoice.paymentDoneDate) {
        setPaymentDoneDate(invoice.paymentDoneDate.split("T")[0]) // Convert to date format
      } else {
        setPaymentDoneDate("")
      }

      if (invoice.paymentReceiptUrl) {
        setReceiptFileName(invoice.paymentReceiptFilename || "Payment Receipt Uploaded")
      } else {
        setReceiptFileName("")
      }

      setPaymentReceipt(null)
      setError(null)
    }
  }, [isOpen, invoice])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!approvalStatus || !paymentDoneDate) {
      setError("Please fill all required fields")
      return
    }

    if (!paymentReceipt && !invoice.paymentReceiptUrl) {
      setError("Please upload a payment receipt")
      return
    }

    try {
      setLoading(true)
      setError(null)

      const formData = new FormData()
      formData.append("piId", invoice.id)
      formData.append("approvalStatus", approvalStatus)
      formData.append("paymentDoneDate", paymentDoneDate)
      formData.append("paymentReceipt", paymentReceipt)

      await purchaseInvoiceService.completePayment(invoice.id, approvalStatus, paymentDoneDate, paymentReceipt)

      onComplete()
      onClose()
    } catch (err) {
      setError("Failed to complete payment")
      console.error("Payment completion error:", err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !invoice) return null

  const isPaymentComplete = invoice.paymentDoneDate && invoice.paymentReceiptUrl

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Complete Payment - {invoice.piNumber}</h3>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 flex items-center gap-2">
            <FiAlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {isPaymentComplete && (
          <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4 flex items-center gap-2">
            <FiCheck className="w-4 h-4" />
            <span className="text-sm">Payment has been completed successfully</span>
          </div>
        )}

        {/* Invoice Details */}
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h4 className="font-medium text-gray-900 mb-2">Invoice Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div>
              <span className="font-medium">PO Number:</span> {invoice.purchaseOrder?.poNumber || "N/A"}
            </div>
            <div>
              <span className="font-medium">PI Number:</span> {invoice.piNumber}
            </div>
            <div>
              <span className="font-medium">Project:</span> {invoice.projectName}
            </div>
            <div>
              <span className="font-medium">Amount:</span> ₹
              {Number.parseFloat(invoice.payableAmount || 0).toLocaleString("en-IN")}
            </div>
            <div>
              <span className="font-medium">Expected Date:</span>{" "}
              {invoice.expectedPaymentDate ? new Date(invoice.expectedPaymentDate).toLocaleDateString() : "N/A"}
            </div>
            <div>
              <span className="font-medium">Status:</span> {invoice.status}
            </div>
          </div>

          {/* File Links */}
          <div className="mt-2">
            <span className="font-medium text-sm">Files: </span>
            {invoice.fileUrl ? (
              <a
                href={invoice.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-800 text-sm"
              >
                {invoice.fileName || "PI File"}
              </a>
            ) : (
              <span className="text-gray-400 text-sm">No PI file</span>
            )}
            {invoice.purchaseOrder?.fileUrl && (
              <>
                <span className="mx-2">|</span>
                <a
                  href={invoice.purchaseOrder.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline hover:text-blue-800 text-sm"
                >
                  {invoice.purchaseOrder.fileName || "PO File"}
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
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
                disabled={loading || isPaymentComplete}
              >
                <option value="">Select Status</option>
                <option value="APPROVED">Approve</option>
                <option value="REJECTED">Reject</option>
              </select>
            </div>

            {/* Payment Done Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Done Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={paymentDoneDate}
                onChange={(e) => setPaymentDoneDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
                disabled={loading || isPaymentComplete}
              />
            </div>

            {/* Payment Receipt Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Receipt {!isPaymentComplete && <span className="text-red-500">*</span>}
              </label>
              {receiptFileName && (
                <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                  <span className="text-sm text-blue-800">
                    Uploaded:
                    {invoice.paymentReceiptUrl && (
                      <>
                        {" "}
                        <a
                          href={invoice.paymentReceiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline text-blue-600 hover:text-blue-800"
                        >
                          {receiptFileName}
                        </a>
                      </>
                    )}
                  </span>
                </div>
              )}
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setPaymentReceipt(e.target.files[0])}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required={!isPaymentComplete}
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">Accepted formats: PDF, JPG, PNG</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            {!isPaymentComplete && (
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? "Processing..." : "Complete Payment"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

function Payable() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [purchaseInvoices, setPurchaseInvoices] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [projectNameFilter, setProjectNameFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [successMessage, setSuccessMessage] = useState(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const itemsPerPage = 10

  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedPiId, setSelectedPiId] = useState(null)

  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState(null)

  const [expandedRows, setExpandedRows] = useState({})

  const fetchPurchaseInvoices = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const page = currentPage - 1
      const data = await purchaseInvoiceService.getPurchaseInvoices(
        page,
        itemsPerPage,
        searchQuery,
        projectNameFilter,
        statusFilter,
      )
      
      // Filter PIs to only show those with handoverFromFinance === "APPROVED"
      const filteredInvoices = (data.content || []).filter(
        (invoice) => invoice.handoverFromFinance === "COMPLETE"
      )
      
      setPurchaseInvoices(filteredInvoices)
      setTotalPages(data.totalPages || 1)
      setTotalResults(data.totalItems || 0)
      setLoading(false)
    } catch (error) {
      setError("Failed to fetch purchase invoices")
      setLoading(false)
    }
  }, [currentPage, itemsPerPage, searchQuery, projectNameFilter, statusFilter])

  useEffect(() => {
    fetchPurchaseInvoices()
  }, [fetchPurchaseInvoices])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, projectNameFilter, statusFilter])

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber)
    if (window.innerWidth < 768) {
      window.scrollTo(0, 0)
    }
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

  const handleCompletePayment = (e, invoice) => {
    e.stopPropagation()
    setSelectedInvoiceForPayment(invoice)
    setShowPaymentModal(true)
  }

  const handleAssignSuccess = async () => {
    setSuccessMessage("Accountant assigned successfully!")
    await fetchPurchaseInvoices()
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  const handlePaymentSuccess = async () => {
    setSuccessMessage("Payment completed successfully!")
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

  if (loading && purchaseInvoices.length === 0) {
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
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      "PO Number",
                      "PI Number",
                      "Pay Amount",
                      "Project Name",
                      "Expected Payment Date",
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
                  {purchaseInvoices.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center text-gray-500 font-medium">
                        No purchase invoices found
                      </td>
                    </tr>
                  ) : (
                    purchaseInvoices.map((invoice) => (
                      <motion.tr
                        key={invoice.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-gray-50 cursor-pointer transition-colors group"
                        onClick={() => handleRowClick(invoice)}
                      >
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                            {invoice.purchaseOrder?.poNumber || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{invoice.piNumber}</div>
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
                          <div className="flex flex-wrap gap-1">
                            {invoice.fileUrl ? (
                              <div className="text-xs">
                                <a
                                  href={invoice.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 underline hover:text-blue-800"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {invoice.fileName && invoice.fileName.length > 10
                                    ? `${invoice.fileName.substring(0, 10)}...`
                                    : invoice.fileName || "File"}
                                </a>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">No files</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {invoice.assignedEmployee ? (
                              <div className="flex items-center gap-2">
                                <div className="text-sm">
                                  <div className="font-medium text-gray-900">
                                    {invoice.assignedEmployee.firstName} {invoice.assignedEmployee.lastName}
                                  </div>
                                  {invoice.assignedEmployee.designation?.name && (
                                    <div className="text-xs text-gray-500">
                                      {invoice.assignedEmployee.designation.name}
                                    </div>
                                  )}
                                </div>
                                <button
                                  className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors text-xs"
                                  onClick={(e) => handleAssignAccountant(e, invoice.id)}
                                  title="Reassign Accountant"
                                >
                                  Change
                                </button>
                              </div>
                            ) : (
                              <button
                                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm font-medium flex items-center gap-1"
                                onClick={(e) => handleAssignAccountant(e, invoice.id)}
                                title="Assign Accountant"
                              >
                                <FiUser size={14} />
                                Assign
                              </button>
                            )}
                            <button
                              className="px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors text-sm font-medium"
                              onClick={(e) => handleCompletePayment(e, invoice)}
                              title="Complete Payment"
                            >
                              Complete Payment
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="md:hidden">
              {purchaseInvoices.length === 0 ? (
                <div className="p-4 text-center text-gray-500 font-medium">No purchase invoices found</div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {purchaseInvoices.map((invoice) => (
                    <motion.div
                      key={invoice.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleRowClick(invoice)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-sm font-semibold text-gray-900">{invoice.piNumber}</div>
                        {invoice.assignedEmployee ? (
                          <div className="text-right">
                            <div className="text-xs font-medium text-gray-900">
                              {invoice.assignedEmployee.firstName} {invoice.assignedEmployee.lastName}
                            </div>
                            {invoice.assignedEmployee.designation?.name && (
                              <div className="text-xs text-gray-500">{invoice.assignedEmployee.designation.name}</div>
                            )}
                            <button
                              className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs mt-1"
                              onClick={(e) => handleAssignAccountant(e, invoice.id)}
                              title="Reassign Accountant"
                            >
                              Change
                            </button>
                          </div>
                        ) : (
                          <button
                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium flex items-center gap-1"
                            onClick={(e) => handleAssignAccountant(e, invoice.id)}
                            title="Assign Accountant"
                          >
                            <FiUser size={12} />
                            Assign
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 gap-y-1 text-xs">
                        <div>
                          <span className="font-medium">PO:</span> {invoice.purchaseOrder?.poNumber || "N/A"}
                        </div>
                        <div>
                          <span className="font-medium">Amount:</span> {formatCurrency(invoice.payableAmount)}
                        </div>
                        <div>
                          <span className="font-medium">Project:</span> {invoice.projectName}
                        </div>
                        <div>
                          <span className="font-medium">Expected Date:</span> {formatDate(invoice.expectedPaymentDate)}
                        </div>
                        <div>
                          <span className="font-medium">Files:</span>{" "}
                          {invoice.fileUrl ? (
                            <div className="flex flex-wrap gap-1 mt-1">
                              <div className="text-xs">
                                <a
                                  href={invoice.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 underline hover:text-blue-800"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {invoice.fileName && invoice.fileName.length > 8
                                    ? `${invoice.fileName.substring(0, 8)}...`
                                    : invoice.fileName || "File"}
                                </a>
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">No files</span>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 flex justify-center">
                        <button
                          className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs font-medium"
                          onClick={(e) => handleCompletePayment(e, invoice)}
                          title="Complete Payment"
                        >
                          Complete Payment
                        </button>
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
                    className={`px-3 py-1 rounded-md border text-sm ${currentPage === pageNum ? "bg-indigo-600 text-white" : "bg-white text-gray-600"}`}
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
          Showing {purchaseInvoices.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{" "}
          {Math.min(currentPage * itemsPerPage, totalResults)} of {totalResults} purchase invoices
        </div>
      </div>

      <AssignAccountantModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        piId={selectedPiId}
        onAssign={handleAssignSuccess}
      />

      <PaymentCompletionModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        invoice={selectedInvoiceForPayment}
        onComplete={handlePaymentSuccess}
      />
    </div>
  )
}

export default Payable
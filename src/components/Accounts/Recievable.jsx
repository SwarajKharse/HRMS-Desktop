"use client"

import { useState, useEffect, useCallback } from "react"
import {
  FiAlertCircle,
  FiCheck,
  FiChevronRight,
  FiUser,
  FiX,
  FiFileText,
  FiUpload,
  FiSave,
  FiDownload,
} from "react-icons/fi"
import { receivableService } from "../../services/receivableService"

function BOQModal({ isOpen, onClose, projectId }) {
  const [boqData, setBOQData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isOpen && projectId) {
      fetchBOQData()
    }
  }, [isOpen, projectId])

  const fetchBOQData = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await receivableService.getProjectBOQ(projectId)
      setBOQData(data)
    } catch (err) {
      setError("Failed to fetch BOQ data")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-semibold">BOQ Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <FiX size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading && (
            <div className="flex justify-center items-center py-8">
              <div className="relative w-8 h-8">
                <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-200 rounded-full animate-pulse"></div>
                <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-600 rounded-full animate-spin border-t-transparent"></div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2">
              <FiAlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {boqData && !loading && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold mb-2">{boqData.projectName}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-purple-700">Total Supply Amount:</span>
                    <div className="text-lg font-semibold">₹{boqData.totalSupplyAmount?.toFixed(2) || "0.00"}</div>
                  </div>
                  <div>
                    <span className="font-medium text-amber-600">Total Installation Amount:</span>
                    <div className="text-lg font-semibold">
                      ₹{boqData.totalInstallationAmount?.toFixed(2) || "0.00"}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-green-700">Grand Total:</span>
                    <div className="text-xl font-bold">₹{boqData.grandTotal?.toFixed(2) || "0.00"}</div>
                  </div>
                </div>
              </div>

              {boqData.items && boqData.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Make
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Qty
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Supply Rate
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Installation Rate
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Supply Amount
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Installation Amount
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {boqData.items.map((item, index) => (
                        <tr key={item.id || index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">
                              {item.productName || "Unknown Product"}
                            </div>
                            <div className="text-xs text-gray-500">HSN: {item.hsnCode || "N/A"}</div>
                            <div className="text-xs text-gray-400">UOM: {item.uom || "N/A"}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.categoryName || "N/A"}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.make || "-"}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.qty || 0}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">₹{item.supplyRate?.toFixed(2) || "0.00"}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            ₹{item.installationRate?.toFixed(2) || "0.00"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            ₹{item.supplyAmount?.toFixed(2) || "0.00"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            ₹{item.installationAmount?.toFixed(2) || "0.00"}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                            ₹{item.total?.toFixed(2) || "0.00"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">No BOQ items found</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AssignAssistantModal({ isOpen, onClose, projectId, onAssign }) {
  const [assistants, setAssistants] = useState([])
  const [selectedAssistant, setSelectedAssistant] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [currentAssignee, setCurrentAssignee] = useState(null)

  useEffect(() => {
    if (isOpen) {
      fetchAssistants()
      fetchCurrentAssignee()
    }
  }, [isOpen, projectId])

  const fetchAssistants = async () => {
    try {
      setLoading(true)
      const data = await receivableService.getAssistants()
      setAssistants(data)
    } catch (err) {
      setError("Failed to fetch assistants")
    } finally {
      setLoading(false)
    }
  }

  const fetchCurrentAssignee = async () => {
    try {
      const projects = await receivableService.getProjects(0, 1000, "", "", "")
      const project = projects.content?.find((proj) => proj.id === projectId)

      if (project?.assignedAssistant) {
        setCurrentAssignee(project.assignedAssistant)
        setSelectedAssistant(project.assignedAssistant.id.toString())
      } else {
        setCurrentAssignee(null)
        setSelectedAssistant("")
      }
    } catch (err) {
      console.error("Failed to fetch current assignee:", err)
    }
  }

  const handleAssign = async () => {
    if (!selectedAssistant) return

    try {
      setLoading(true)
      await receivableService.assignAssistant(projectId, Number.parseInt(selectedAssistant))
      onAssign()
      onClose()
    } catch (err) {
      console.error("Failed to assign assistant:", err)
      setError("Failed to assign assistant")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4">Assign Assistant</h3>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 flex items-center gap-2">
            <FiAlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Assistant</label>
          {currentAssignee && (
            <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
              <span className="text-sm text-blue-800">
                Currently assigned: {currentAssignee.firstName || ""} {currentAssignee.lastName || ""}
              </span>
            </div>
          )}
          <select
            value={selectedAssistant}
            onChange={(e) => setSelectedAssistant(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={loading}
          >
            <option value="">Choose an assistant...</option>
            {assistants.map((assistant) => (
              <option key={assistant.id} value={assistant.id}>
                {assistant.firstName || ""} {assistant.lastName || ""}
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
            disabled={!selectedAssistant || loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Assigning..." : "Assign"}
          </button>
        </div>
      </div>
    </div>
  )
}

function getUserId() {
  const userStr = localStorage.getItem("user")
  if (userStr) {
    try {
      // </CHANGE> Fixed double JSON.JSON.parse to JSON.parse
      const user = JSON.parse(userStr)
      return user.userId || user.id || 1
    } catch (e) {
      return 1
    }
  }
  return 1
}

function InvoiceManagementModal({ isOpen, onClose, onSuccess, projectId, projectName }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const itemsPerPage = 10

  const [searchQuery, setSearchQuery] = useState("")
  const [invoiceTypeFilter, setInvoiceTypeFilter] = useState("")
  const [approvalStatusFilter, setApprovalStatusFilter] = useState("")
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("")

  const [invoiceUpdates, setInvoiceUpdates] = useState({})
  const [uploadingPaymentFor, setUploadingPaymentFor] = useState(null)
  const [paymentFile, setPaymentFile] = useState(null)
  const [paymentDocType, setPaymentDocType] = useState("PAYMENT_ADVICE")

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const page = currentPage - 1
      const data = await receivableService.getAllInvoices(
        page,
        itemsPerPage,
        searchQuery,
        invoiceTypeFilter,
        approvalStatusFilter,
        paymentStatusFilter,
        projectId,
      )
      setInvoices(data.content || [])
      setTotalPages(data.totalPages || 1)
      setTotalResults(data.totalItems || 0)
      setLoading(false)
    } catch (err) {
      setError("Failed to fetch invoices")
      setLoading(false)
    }
  }, [currentPage, itemsPerPage, searchQuery, invoiceTypeFilter, approvalStatusFilter, paymentStatusFilter, projectId])

  useEffect(() => {
    if (isOpen) {
      fetchInvoices()
    }
  }, [isOpen, fetchInvoices])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, invoiceTypeFilter, approvalStatusFilter, paymentStatusFilter])

  const handleInvoiceChange = (invoiceId, field, value) => {
    setInvoiceUpdates((prev) => ({
      ...prev,
      [invoiceId]: {
        ...prev[invoiceId],
        invoiceId,
        [field]: value,
        updatedBy: getUserId(),
      },
    }))
  }

  const handleBulkUpdate = async () => {
    const updates = Object.values(invoiceUpdates).filter(
      (update) => update.approvalStatus || update.paymentStatus || update.sharedDate,
    )

    if (updates.length === 0) {
      setError("No changes to save")
      return
    }

    try {
      setLoading(true)
      setError(null)
      await receivableService.bulkUpdateInvoices(updates)
      setSuccess("Invoices updated successfully!")
      setInvoiceUpdates({})
      await fetchInvoices()
      setTimeout(() => {
        setSuccess(null)
        if (onSuccess) onSuccess()
      }, 2000)
    } catch (err) {
      setError("Failed to update invoices")
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentDocumentUpload = async (invoiceId) => {
    if (!paymentFile) {
      setError("Please select a file")
      return
    }

    try {
      setLoading(true)
      setError(null)

      const formData = new FormData()
      formData.append("file", paymentFile)
      formData.append("documentType", paymentDocType)
      formData.append("uploadedBy", getUserId())

      await receivableService.uploadPaymentDocumentForInvoice(invoiceId, formData)
      setSuccess("Payment document uploaded successfully!")
      setUploadingPaymentFor(null)
      setPaymentFile(null)
      setPaymentDocType("PAYMENT_ADVICE")
      await fetchInvoices()
      setTimeout(() => setSuccess(null), 2000)
    } catch (err) {
      setError("Failed to upload payment document")
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber)
  }

  const clearFilters = () => {
    setSearchQuery("")
    setInvoiceTypeFilter("")
    setApprovalStatusFilter("")
    setPaymentStatusFilter("")
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

  const getApprovalStatusColor = (status) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800"
      case "REJECTED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-yellow-100 text-yellow-800"
    }
  }

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case "FULL_AMOUNT_RECEIVED":
        return "bg-green-100 text-green-800"
      case "PARTIALLY_RECEIVED":
        return "bg-blue-100 text-blue-800"
      case "ADVANCE_RECEIVED":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-7xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-semibold">Manage PI/TI Invoices {projectName && `- ${projectName}`}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <FiX size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2 mb-4">
              <FiAlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-50 text-green-600 p-4 rounded-lg flex items-center gap-2 mb-4">
              <FiCheck className="w-5 h-5" />
              <span>{success}</span>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <input
                type="text"
                placeholder="Search Invoice #, Project..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <select
                value={invoiceTypeFilter}
                onChange={(e) => setInvoiceTypeFilter(e.target.value)}
                className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Types</option>
                <option value="PI">PI</option>
                <option value="TI">TI</option>
              </select>
              <select
                value={approvalStatusFilter}
                onChange={(e) => setApprovalStatusFilter(e.target.value)}
                className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Approval Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Payment Status</option>
                <option value="PENDING">Pending</option>
                <option value="ADVANCE_RECEIVED">Advance Received</option>
                <option value="PARTIALLY_RECEIVED">Partially Received</option>
                <option value="FULL_AMOUNT_RECEIVED">Full Amount Received</option>
              </select>
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Clear
              </button>
            </div>
          </div>

          {loading && invoices.length === 0 ? (
            <div className="flex justify-center py-8">
              <div className="relative w-8 h-8">
                <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-200 rounded-full animate-pulse"></div>
                <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-600 rounded-full animate-spin border-t-transparent"></div>
              </div>
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No invoices found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Approval</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shared Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Documents</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.map((invoice, index) => {
                    const isFirstPI = index === 0 && invoice.invoiceType === "PI"
                    return (
                      <tr key={invoice.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">{invoice.invoiceNumber}</div>
                          <div className="text-xs text-gray-500">{formatDate(invoice.createdAt)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
                            {invoice.invoiceType}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">{invoice.projectName}</div>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={invoiceUpdates[invoice.id]?.approvalStatus || invoice.approvalStatus}
                            onChange={(e) => handleInvoiceChange(invoice.id, "approvalStatus", e.target.value)}
                            className={`text-xs font-semibold rounded px-2 py-1 border-0 ${getApprovalStatusColor(
                              invoiceUpdates[invoice.id]?.approvalStatus || invoice.approvalStatus,
                            )}`}
                          >
                            <option value="PENDING">Pending</option>
                            <option value="APPROVED">Approved</option>
                            <option value="REJECTED">Rejected</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={invoiceUpdates[invoice.id]?.paymentStatus || invoice.paymentStatus}
                            onChange={(e) => handleInvoiceChange(invoice.id, "paymentStatus", e.target.value)}
                            className={`text-xs font-semibold rounded px-2 py-1 border-0 ${getPaymentStatusColor(
                              invoiceUpdates[invoice.id]?.paymentStatus || invoice.paymentStatus,
                            )}`}
                          >
                            <option value="PENDING">Pending</option>
                            {isFirstPI && <option value="ADVANCE_RECEIVED">Advance Received</option>}
                            <option value="PARTIALLY_RECEIVED">Partially Received</option>
                            <option value="FULL_AMOUNT_RECEIVED">Full Amount Received</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="date"
                            value={invoiceUpdates[invoice.id]?.sharedDate || invoice.sharedDate || ""}
                            onChange={(e) => handleInvoiceChange(invoice.id, "sharedDate", e.target.value)}
                            className="text-xs p-1 border border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <a
                              href={invoice.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs"
                            >
                              <FiFileText size={12} /> Invoice
                            </a>
                            {invoice.supportDocumentUrl && (
                              <a
                                href={invoice.supportDocumentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-600 hover:text-green-800 flex items-center gap-1 text-xs"
                              >
                                <FiFileText size={12} /> Support
                              </a>
                            )}
                            {invoice.paymentDocuments && invoice.paymentDocuments.length > 0 && (
                              <div className="space-y-1">
                                {invoice.paymentDocuments.map((doc, idx) => (
                                  <a
                                    key={doc.id || idx}
                                    href={doc.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:text-blue-800 underline block"
                                    title={doc.fileName}
                                  >
                                    <FiDownload className="inline mr-1" size={12} />
                                    {doc.documentType} {idx + 1}
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {uploadingPaymentFor === invoice.id ? (
                            <div className="space-y-2">
                              <select
                                value={paymentDocType}
                                onChange={(e) => setPaymentDocType(e.target.value)}
                                className="text-xs p-1 border border-gray-300 rounded w-full"
                              >
                                <option value="PAYMENT_ADVICE">Payment Advice</option>
                                <option value="RECEIPT">Receipt</option>
                              </select>
                              <input
                                type="file"
                                onChange={(e) => setPaymentFile(e.target.files[0])}
                                className="text-xs w-full"
                              />
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handlePaymentDocumentUpload(invoice.id)}
                                  disabled={loading}
                                  className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50"
                                >
                                  Upload
                                </button>
                                <button
                                  onClick={() => {
                                    setUploadingPaymentFor(null)
                                    setPaymentFile(null)
                                  }}
                                  className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setUploadingPaymentFor(invoice.id)}
                              className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 flex items-center gap-1"
                            >
                              <FiUpload size={12} /> Payment Doc
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-4 flex justify-center items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className="px-3 py-1 rounded-md border text-sm disabled:opacity-50"
              >
                Prev
              </button>
              <div className="px-3 py-1 text-sm">
                Page {currentPage} of {totalPages}
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

          <div className="mt-2 text-xs text-gray-500 text-center">
            Showing {invoices.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{" "}
            {Math.min(currentPage * itemsPerPage, totalResults)} of {totalResults} invoices
          </div>
        </div>

        <div className="border-t p-4 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100"
          >
            Close
          </button>
          <button
            onClick={handleBulkUpdate}
            disabled={loading || Object.keys(invoiceUpdates).length === 0}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
          >
            <FiSave /> Save All Changes
          </button>
        </div>
      </div>
    </div>
  )
}

function Recievable() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [projects, setProjects] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [projectNameFilter, setProjectNameFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [successMessage, setSuccessMessage] = useState(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const itemsPerPage = 10

  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState(null)

  const [showBOQModal, setShowBOQModal] = useState(false)
  const [selectedBOQProjectId, setSelectedBOQProjectId] = useState(null)

  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [selectedInvoiceProjectId, setSelectedInvoiceProjectId] = useState(null)
  const [selectedInvoiceProjectName, setSelectedInvoiceProjectName] = useState(null)

  const [expandedRows, setExpandedRows] = useState({})

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const page = currentPage - 1
      const data = await receivableService.getProjects(page, itemsPerPage, searchQuery, projectNameFilter, statusFilter)
      setProjects(data.content || [])
      setTotalPages(data.totalPages || 1)
      setTotalResults(data.totalItems || 0)
      setLoading(false)
    } catch (error) {
      setError("Failed to fetch projects")
      setLoading(false)
    }
  }, [currentPage, itemsPerPage, searchQuery, projectNameFilter, statusFilter])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, projectNameFilter, statusFilter])

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber)
    if (window.innerWidth < 768) {
      window.scrollTo(0, 0)
    }
  }

  const handleRowClick = (project) => {
    setExpandedRows((prev) => ({
      ...prev,
      [project.id]: !prev[project.id],
    }))
  }

  const handleAssignAssistant = (e, projectId) => {
    e.stopPropagation()
    setSelectedProjectId(projectId)
    setShowAssignModal(true)
  }

  const handleViewBOQ = (e, projectId) => {
    e.stopPropagation()
    setSelectedBOQProjectId(projectId)
    setShowBOQModal(true)
  }

  const handleAssignSuccess = async () => {
    setSuccessMessage("Assistant assigned successfully!")
    await fetchProjects()
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  const handleInvoiceManagementSuccess = async () => {
    setSuccessMessage("Invoices updated successfully!")
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  const handleManageInvoices = (e, projectId, projectName) => {
    e.stopPropagation()
    setSelectedInvoiceProjectId(projectId)
    setSelectedInvoiceProjectName(projectName)
    setShowInvoiceModal(true)
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

  if (loading && projects.length === 0) {
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
        <div className="bg-red-50 text-red-600 p-3 md:p-4 rounded-lg flex items-center gap-2 md:gap-3 border border-red-100 mx-2 md:mx-0 animate-in fade-in duration-300">
          <FiAlertCircle className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
          <span className="text-sm md:font-medium">{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 text-green-600 p-3 md:p-4 rounded-lg border border-green-100 flex items-center shadow-sm mx-2 md:mx-0 animate-in fade-in duration-300">
          <FiCheck className="w-4 h-4 md:w-5 md:h-5 mr-2 flex-shrink-0" />
          <span className="text-sm md:font-medium">{successMessage}</span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-4 mx-2 md:mx-0">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search Project ID, Name..."
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
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="CANCELLED">Cancelled</option>
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
          <h2 className="text-lg font-semibold text-gray-800">Projects</h2>
        </div>

        {loading && (
          <div className="flex justify-center my-4">
            <div className="relative w-8 h-8">
              <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-200 rounded-full animate-pulse"></div>
              <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-600 rounded-full animate-spin border-t-transparent"></div>
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-lg border border-gray-200 animate-in fade-in duration-200">
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    "Project ID",
                    "Project Name",
                    "Lead Contact",
                    "Created Date",
                    "PO Copy",
                    "BOQ",
                    "Proposal Copy",
                    "PI/TI",
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
                {projects.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-8 text-center text-gray-500 font-medium">
                      No projects found
                    </td>
                  </tr>
                ) : (
                  projects.map((project) => (
                    <tr
                      key={project.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors group animate-in fade-in duration-200"
                      onClick={() => handleRowClick(project)}
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                          {project.leadCode || `#${project.id}`}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {project.projectName || project.project_name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {project.leadContactName || "N/A"}
                          {project.leadContactPhone && (
                            <div className="text-xs text-gray-500">{project.leadContactPhone}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{formatDate(project.createdAt)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          {project.leadDocuments && project.leadDocuments.length > 0 ? (
                            <>
                              {(() => {
                                const latestPO = project.leadDocuments.find((doc) => doc.documentType === "po_document")
                                return latestPO ? (
                                  <a
                                    href={latestPO.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                    title={latestPO.fileName}
                                  >
                                    <FiDownload size={14} />
                                    <span className="text-xs font-medium">PO</span>
                                  </a>
                                ) : (
                                  <span className="text-xs text-gray-400">No PO</span>
                                )
                              })()}
                            </>
                          ) : (
                            <span className="text-xs text-gray-400">No PO</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-start gap-2">
                          {project.hasBOQ ? (
                            <button
                              onClick={(e) => handleViewBOQ(e, project.id)}
                              className="text-green-600 hover:text-green-800 flex items-center gap-1 transition-colors"
                              title="View BOQ Details"
                            >
                              <FiFileText size={14} />
                              <span className="text-xs font-medium">View</span>
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">No BOQ</span>
                          )}
                          {project.leadDocuments && project.leadDocuments.length > 0 && (
                            <>
                              {(() => {
                                const latestBOQ = project.leadDocuments.find(
                                  (doc) => doc.documentType === "boq_document",
                                )
                                return latestBOQ ? (
                                  <a
                                    href={latestBOQ.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs"
                                    title={latestBOQ.fileName}
                                  >
                                    <FiDownload size={14} />
                                    <span className="text-xs font-medium">PDF</span>
                                  </a>
                                ) : null
                              })()}
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          {project.leadDocuments && project.leadDocuments.length > 0 ? (
                            <>
                              {(() => {
                                const latestProposal = project.leadDocuments.find(
                                  (doc) => doc.documentType === "proposal" && doc.status === "1",
                                )
                                return latestProposal ? (
                                  <a
                                    href={latestProposal.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                    title={latestProposal.fileName}
                                  >
                                    <FiDownload size={14} />
                                    <span className="text-xs font-medium">Proposal</span>
                                  </a>
                                ) : (
                                  <span className="text-xs text-gray-400">No Proposal</span>
                                )
                              })()}
                            </>
                          ) : (
                            <span className="text-xs text-gray-400">No Proposal</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={(e) =>
                            handleManageInvoices(e, project.id, project.projectName || project.project_name)
                          }
                          className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors text-sm font-medium flex items-center gap-1"
                          title="Manage PI/TI Invoices"
                        >
                          <FiFileText size={14} />
                          Manage
                        </button>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {project.assignedAssistant ? (
                            <div className="flex items-center gap-2">
                              <div className="text-sm">
                                <div className="font-medium text-gray-900">
                                  {project.assignedAssistant.firstName} {project.assignedAssistant.lastName}
                                </div>
                                {project.assignedAssistant.designation && (
                                  <div className="text-xs text-gray-500">{project.assignedAssistant.designation}</div>
                                )}
                              </div>
                              <button
                                className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors text-xs"
                                onClick={(e) => handleAssignAssistant(e, project.id)}
                                title="Reassign Assistant"
                              >
                                Change
                              </button>
                            </div>
                          ) : (
                            <button
                              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm font-medium flex items-center gap-1"
                              onClick={(e) => handleAssignAssistant(e, project.id)}
                              title="Assign Assistant"
                            >
                              <FiUser size={14} />
                              Assign
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="md:hidden">
            {projects.length === 0 ? (
              <div className="p-4 text-center text-gray-500 font-medium">No projects found</div>
            ) : (
              <div className="divide-y divide-gray-200">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors animate-in fade-in duration-200"
                    onClick={() => handleRowClick(project)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-sm font-semibold text-gray-900">{project.leadCode || `#${project.id}`}</div>
                    </div>
                    <div className="grid grid-cols-1 gap-y-1 text-xs">
                      <div>
                        <span className="font-medium">Name:</span> {project.projectName || project.project_name}
                      </div>
                      <div>
                        <span className="font-medium">Contact:</span> {project.leadContactName || "N/A"}
                      </div>
                      <div>
                        <span className="font-medium">Created:</span> {formatDate(project.createdAt)}
                      </div>
                      <div className="flex gap-4 mt-2">
                        <div>
                          <span className="font-medium">PO:</span>{" "}
                          {project.leadDocuments && project.leadDocuments.length > 0 ? (
                            <>
                              {(() => {
                                const latestPO = project.leadDocuments.find((doc) => doc.documentType === "po_document")
                                return latestPO ? (
                                  <a
                                    href={latestPO.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 underline"
                                    onClick={(e) => e.stopPropagation()}
                                    title={latestPO.fileName}
                                  >
                                    View ({latestPO.fileName.substring(0, 5)}...)
                                  </a>
                                ) : (
                                  <span className="text-gray-400">No PO</span>
                                )
                              })()}
                            </>
                          ) : (
                            <span className="text-gray-400">No PO</span>
                          )}
                        </div>
                        <div>
                          <span className="font-medium">BOQ:</span>{" "}
                          {project.hasBOQ ? (
                            <button onClick={(e) => handleViewBOQ(e, project.id)} className="text-green-600 underline">
                              View
                            </button>
                          ) : (
                            <span className="text-gray-400">No BOQ</span>
                          )}
                          {project.leadDocuments &&
                            project.leadDocuments.length > 0 &&
                            (() => {
                              const latestBOQ = project.leadDocuments.find((doc) => doc.documentType === "boq_document")
                              return latestBOQ ? (
                                <a
                                  href={latestBOQ.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 underline ml-2"
                                  onClick={(e) => e.stopPropagation()}
                                  title={latestBOQ.fileName}
                                >
                                  PDF
                                </a>
                              ) : null
                            })()}
                        </div>
                        <div>
                          <span className="font-medium">Proposal:</span>{" "}
                          {project.proposalFileUrl ? (
                            <a
                              href={project.proposalFileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View
                            </a>
                          ) : (
                            <span className="text-gray-400">No Proposal</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-center mt-2">
                      <button
                        onClick={(e) =>
                          handleManageInvoices(e, project.id, project.projectName || project.project_name)
                        }
                        className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors text-sm font-medium flex items-center gap-1"
                        title="Manage PI/TI Invoices"
                      >
                        <FiFileText size={14} />
                        Manage PI/TI
                      </button>
                    </div>

                    <div className="mt-2 flex justify-center">
                      {project.assignedAssistant ? (
                        <div className="text-center">
                          <div className="text-xs font-medium text-gray-900">
                            {project.assignedAssistant.firstName} {project.assignedAssistant.lastName}
                          </div>
                          {project.assignedAssistant.designation && (
                            <div className="text-xs text-gray-500">{project.assignedAssistant.designation}</div>
                          )}
                          <button
                            className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs mt-1"
                            onClick={(e) => handleAssignAssistant(e, project.id)}
                            title="Reassign Assistant"
                          >
                            Change
                          </button>
                        </div>
                      ) : (
                        <button
                          className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium flex items-center gap-1"
                          onClick={(e) => handleAssignAssistant(e, project.id)}
                          title="Assign Assistant"
                        >
                          <FiUser size={12} />
                          Assign
                        </button>
                      )}
                    </div>
                    <div className="flex justify-center mt-2">
                      <FiChevronRight
                        className={`text-gray-400 transition-transform ${expandedRows[project.id] ? "rotate-90" : ""}`}
                        size={16}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

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
          Showing {projects.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{" "}
          {Math.min(currentPage * itemsPerPage, totalResults)} of {totalResults} projects
        </div>
      </div>

      <AssignAssistantModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        projectId={selectedProjectId}
        onAssign={handleAssignSuccess}
      />

      <BOQModal isOpen={showBOQModal} onClose={() => setShowBOQModal(false)} projectId={selectedBOQProjectId} />

      <InvoiceManagementModal
        isOpen={showInvoiceModal}
        onClose={() => {
          setShowInvoiceModal(false)
          setSelectedInvoiceProjectId(null)
          setSelectedInvoiceProjectName(null)
        }}
        onSuccess={handleInvoiceManagementSuccess}
        projectId={selectedInvoiceProjectId}
        projectName={selectedInvoiceProjectName}
      />
    </div>
  )
}

export default Recievable
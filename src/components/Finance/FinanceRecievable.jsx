"use client"

import { useState, useEffect, useCallback, Fragment } from "react"
import {
  FiAlertCircle,
  FiCheck,
  FiX,
  FiFileText,
  FiDownload,
  FiChevronRight,
} from "react-icons/fi"
import { receivableService } from "../../services/receivableService"
import { financeReceivableService } from "../../services/financeReceivableService"

// ─── BOQ Modal (read-only, same as Accounts) ────────────────────────────────
function BOQModal({ isOpen, onClose, projectId }) {
  const [boqData, setBOQData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [collapsedCategories, setCollapsedCategories] = useState({})

  useEffect(() => {
    if (isOpen && projectId) fetchBOQData()
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
                    <div className="text-lg font-semibold">₹{boqData.totalInstallationAmount?.toFixed(2) || "0.00"}</div>
                  </div>
                  <div>
                    <span className="font-medium text-green-700">Grand Total:</span>
                    <div className="text-xl font-bold">₹{boqData.grandTotal?.toFixed(2) || "0.00"}</div>
                  </div>
                </div>
              </div>

              {/* BOQ Items */}
              {boqData.items && boqData.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Make</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supply Rate</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Installation Rate</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supply Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Installation Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.entries(
                        boqData.items.reduce((groups, item) => {
                          const cat = item.categoryName || "Uncategorized"
                          if (!groups[cat]) groups[cat] = []
                          groups[cat].push(item)
                          return groups
                        }, {}),
                      ).map(([categoryName, categoryItems]) => (
                        <Fragment key={categoryName}>
                          <tr
                            className="bg-gray-100 cursor-pointer hover:bg-gray-200 transition-colors"
                            onClick={() =>
                              setCollapsedCategories((prev) => ({
                                ...prev,
                                [categoryName]: !prev[categoryName],
                              }))
                            }
                          >
                            <td colSpan="8" className="px-4 py-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                              <div className="flex items-center gap-2">
                                <FiChevronRight
                                  size={16}
                                  className={`transition-transform ${collapsedCategories[categoryName] ? "" : "rotate-90"}`}
                                />
                                {categoryName} ({categoryItems.length} {categoryItems.length === 1 ? "item" : "items"})
                              </div>
                            </td>
                          </tr>
                          {!collapsedCategories[categoryName] &&
                            categoryItems.map((item, index) => (
                              <tr key={item.id || index}>
                                <td className="px-4 py-3">
                                  <div className="text-sm font-medium text-gray-900">{item.productName || "Unknown Product"}</div>
                                  <div className="text-xs text-gray-500">HSN: {item.hsnCode || "N/A"}</div>
                                  <div className="text-xs text-gray-400">UOM: {item.uom || "N/A"}</div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">{item.make || "-"}</td>
                                <td className="px-4 py-3 text-sm text-gray-900">{item.qty || 0}</td>
                                <td className="px-4 py-3 text-sm text-gray-900">₹{item.supplyRate?.toFixed(2) || "0.00"}</td>
                                <td className="px-4 py-3 text-sm text-gray-900">₹{item.installationRate?.toFixed(2) || "0.00"}</td>
                                <td className="px-4 py-3 text-sm text-gray-900">₹{item.supplyAmount?.toFixed(2) || "0.00"}</td>
                                <td className="px-4 py-3 text-sm text-gray-900">₹{item.installationAmount?.toFixed(2) || "0.00"}</td>
                                <td className="px-4 py-3 text-sm font-semibold text-gray-900">₹{item.total?.toFixed(2) || "0.00"}</td>
                              </tr>
                            ))}
                        </Fragment>
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

// ─── Invoice Modal (READ-ONLY for Finance) ───────────────────────────────────
function InvoiceViewModal({ isOpen, onClose, projectId, projectName }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const itemsPerPage = 10

  const [searchQuery, setSearchQuery] = useState("")
  const [invoiceTypeFilter, setInvoiceTypeFilter] = useState("")
  const [approvalStatusFilter, setApprovalStatusFilter] = useState("")
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("")

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
    } catch (err) {
      setError("Failed to fetch invoices")
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchQuery, invoiceTypeFilter, approvalStatusFilter, paymentStatusFilter, projectId])

  useEffect(() => {
    if (isOpen) fetchInvoices()
  }, [isOpen, fetchInvoices])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, invoiceTypeFilter, approvalStatusFilter, paymentStatusFilter])

  const clearFilters = () => {
    setSearchQuery("")
    setInvoiceTypeFilter("")
    setApprovalStatusFilter("")
    setPaymentStatusFilter("")
    setCurrentPage(1)
  }

  const formatDate = (dateString) => {
    if (!dateString) return ""
    return new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
  }

  const getApprovalStatusColor = (status) => {
    switch (status) {
      case "APPROVED": return "bg-green-100 text-green-800"
      case "REJECTED": return "bg-red-100 text-red-800"
      default: return "bg-yellow-100 text-yellow-800"
    }
  }

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case "FULL_AMOUNT_RECEIVED": return "bg-green-100 text-green-800"
      case "PARTIALLY_RECEIVED": return "bg-blue-100 text-blue-800"
      case "ADVANCE_RECEIVED": return "bg-purple-100 text-purple-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-7xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-semibold">
            PI/TI Invoices {projectName && `- ${projectName}`}
          </h3>
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

          {/* Filters */}
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
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.map((invoice) => (
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
                      {/* READ-ONLY: badge instead of dropdown */}
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getApprovalStatusColor(invoice.approvalStatus)}`}>
                          {invoice.approvalStatus || "PENDING"}
                        </span>
                      </td>
                      {/* READ-ONLY: badge instead of dropdown */}
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(invoice.paymentStatus)}`}>
                          {invoice.paymentStatus || "PENDING"}
                        </span>
                      </td>
                      {/* READ-ONLY: plain text instead of date input */}
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {invoice.sharedDate ? formatDate(invoice.sharedDate) : "—"}
                      </td>
                      {/* Documents: view/download links only */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {invoice.fileUrl && (
                            <a
                              href={invoice.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs"
                            >
                              <FiFileText size={12} /> Invoice
                            </a>
                          )}
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-4 flex justify-center items-center gap-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className="px-3 py-1 rounded-md border text-sm disabled:opacity-50"
              >
                Prev
              </button>
              <div className="px-3 py-1 text-sm">Page {currentPage} of {totalPages}</div>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
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

        {/* Footer — Close only, no Save Changes button */}
        <div className="border-t p-4 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Finance Receivable Page ────────────────────────────────────────────
function FinanceRecievable() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [projects, setProjects] = useState([])
  const [successMessage, setSuccessMessage] = useState(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const itemsPerPage = 10

  const [searchQuery, setSearchQuery] = useState("")
  const [projectNameFilter, setProjectNameFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  const [showBOQModal, setShowBOQModal] = useState(false)
  const [selectedBOQProjectId, setSelectedBOQProjectId] = useState(null)

  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [selectedInvoiceProjectId, setSelectedInvoiceProjectId] = useState(null)
  const [selectedInvoiceProjectName, setSelectedInvoiceProjectName] = useState(null)

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const page = currentPage - 1
      const data = await receivableService.getProjects(page, itemsPerPage, searchQuery, projectNameFilter, statusFilter)
      setProjects(data.content || [])
      setTotalPages(data.totalPages || 1)
      setTotalResults(data.totalItems || 0)
    } catch (err) {
      setError("Failed to fetch projects")
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchQuery, projectNameFilter, statusFilter])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, projectNameFilter, statusFilter])

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber)
    if (window.innerWidth < 768) window.scrollTo(0, 0)
  }

  const handleHandoverStatusChange = async (e, project) => {
    e.stopPropagation()
    const newStatus = e.target.value
    try {
      await financeReceivableService.updateHandoverStatus(project.id, newStatus)
      setSuccessMessage("Handover status updated successfully!")
      fetchProjects()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError("Failed to update handover status")
    }
  }

  const handleViewBOQ = (e, projectId) => {
    e.stopPropagation()
    setSelectedBOQProjectId(projectId)
    setShowBOQModal(true)
  }

  const handleViewInvoices = (e, projectId, projectName) => {
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
    return new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
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

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mx-2 md:mx-0">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search Project ID, Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <input
            type="text"
            placeholder="Filter by Project Name"
            value={projectNameFilter}
            onChange={(e) => setProjectNameFilter(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
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
          <button
            onClick={clearFilters}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm p-3 md:p-6 mx-2 md:mx-0">
        {loading && (
          <div className="flex justify-center my-4">
            <div className="relative w-8 h-8">
              <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-200 rounded-full animate-pulse"></div>
              <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-600 rounded-full animate-spin border-t-transparent"></div>
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-lg border border-gray-200 animate-in fade-in duration-200">

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {["Project ID", "Project Name", "Lead Contact", "Created Date", "PO Copy", "BOQ", "Proposal Copy", "PI/TI", "Handover Status"].map((header) => (
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
                    <tr key={project.id} className="hover:bg-gray-50 transition-colors animate-in fade-in duration-200">

                      {/* Project ID */}
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900">
                          {project.leadCode || `#${project.id}`}
                        </div>
                      </td>

                      {/* Project Name */}
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {project.projectName || project.project_name}
                        </div>
                      </td>

                      {/* Lead Contact */}
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{project.leadContactName || "N/A"}</div>
                        {project.leadContactPhone && (
                          <div className="text-xs text-gray-500">{project.leadContactPhone}</div>
                        )}
                      </td>

                      {/* Created Date */}
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{formatDate(project.createdAt)}</div>
                      </td>

                      {/* PO Copy */}
                      <td className="px-6 py-4">
                        {(() => {
                          const po = project.leadDocuments?.find((doc) => doc.documentType === "po_document")
                          return po ? (
                            <a
                              href={po.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                              title={po.fileName}
                            >
                              <FiDownload size={14} />
                              <span className="text-xs font-medium">PO</span>
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400">No PO</span>
                          )
                        })()}
                      </td>

                      {/* BOQ */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-start gap-2">
                          {project.hasBOQ ? (
                            <button
                              onClick={(e) => handleViewBOQ(e, project.id)}
                              className="text-green-600 hover:text-green-800 flex items-center gap-1 transition-colors"
                            >
                              <FiFileText size={14} />
                              <span className="text-xs font-medium">View</span>
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">No BOQ</span>
                          )}
                          {(() => {
                            const boqDoc = project.leadDocuments?.find((doc) => doc.documentType === "boq_document")
                            return boqDoc ? (
                              <a
                                href={boqDoc.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs"
                                title={boqDoc.fileName}
                              >
                                <FiDownload size={14} />
                                <span className="text-xs font-medium">PDF</span>
                              </a>
                            ) : null
                          })()}
                        </div>
                      </td>

                      {/* Proposal Copy */}
                      <td className="px-6 py-4">
                        {(() => {
                          const proposal = project.leadDocuments?.find(
                            (doc) => doc.documentType === "proposal" && doc.status === "1"
                          )
                          return proposal ? (
                            <a
                              href={proposal.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                              title={proposal.fileName}
                            >
                              <FiDownload size={14} />
                              <span className="text-xs font-medium">Proposal</span>
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400">No Proposal</span>
                          )
                        })()}
                      </td>

                      {/* PI/TI - View only button */}
                      <td className="px-6 py-4">
                        <button
                          onClick={(e) => handleViewInvoices(e, project.id, project.projectName || project.project_name)}
                          className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors text-sm font-medium flex items-center gap-1"
                        >
                          <FiFileText size={14} />
                          View
                        </button>
                      </td>

                      {/* Handover Status — only Finance action */}
                      <td className="px-6 py-4">
                        <select
                          value={project.handoverFromFinance || "PENDING"}
                          onChange={(e) => handleHandoverStatusChange(e, project)}
                          className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="COMPLETE">Handover to Project</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden">
            {projects.length === 0 ? (
              <div className="p-4 text-center text-gray-500 font-medium">No projects found</div>
            ) : (
              <div className="divide-y divide-gray-200">
                {projects.map((project) => (
                  <div key={project.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-sm font-semibold text-gray-900">{project.leadCode || `#${project.id}`}</div>
                    </div>
                    <div className="grid grid-cols-1 gap-y-1 text-xs">
                      <div><span className="font-medium">Name:</span> {project.projectName || project.project_name}</div>
                      <div><span className="font-medium">Contact:</span> {project.leadContactName || "N/A"}</div>
                      <div><span className="font-medium">Created:</span> {formatDate(project.createdAt)}</div>
                    </div>
                    <div className="flex gap-3 mt-3 flex-wrap">
                      {(() => {
                        const po = project.leadDocuments?.find((doc) => doc.documentType === "po_document")
                        return po
                          ? <a href={po.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-xs">PO</a>
                          : <span className="text-gray-400 text-xs">No PO</span>
                      })()}
                      {project.hasBOQ
                        ? <button onClick={(e) => handleViewBOQ(e, project.id)} className="text-green-600 underline text-xs">BOQ</button>
                        : <span className="text-gray-400 text-xs">No BOQ</span>
                      }
                      {(() => {
                        const proposal = project.leadDocuments?.find((doc) => doc.documentType === "proposal" && doc.status === "1")
                        return proposal
                          ? <a href={proposal.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-xs">Proposal</a>
                          : <span className="text-gray-400 text-xs">No Proposal</span>
                      })()}
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <button
                        onClick={(e) => handleViewInvoices(e, project.id, project.projectName || project.project_name)}
                        className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-md text-xs font-medium flex items-center gap-1"
                      >
                        <FiFileText size={12} /> View PI/TI
                      </button>
                      <select
                        value={project.handoverFromFinance || "PENDING"}
                        onChange={(e) => handleHandoverStatusChange(e, project)}
                        className="text-xs border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="COMPLETE">Handover to Project</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex justify-center items-center gap-2 flex-wrap">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || loading}
              className="px-3 py-1 rounded-md border text-sm disabled:opacity-50"
            >
              Prev
            </button>
            <div className="md:hidden px-3 py-1 text-sm">Page {currentPage} of {totalPages}</div>
            <div className="hidden md:flex">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) pageNum = i + 1
                else if (currentPage <= 3) pageNum = i + 1
                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i
                else pageNum = currentPage - 2 + i
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

      <BOQModal
        isOpen={showBOQModal}
        onClose={() => { setShowBOQModal(false); setSelectedBOQProjectId(null) }}
        projectId={selectedBOQProjectId}
      />

      <InvoiceViewModal
        isOpen={showInvoiceModal}
        onClose={() => {
          setShowInvoiceModal(false)
          setSelectedInvoiceProjectId(null)
          setSelectedInvoiceProjectName(null)
        }}
        projectId={selectedInvoiceProjectId}
        projectName={selectedInvoiceProjectName}
      />
    </div>
  )
}

export default FinanceRecievable

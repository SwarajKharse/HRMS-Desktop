"use client"
import { useState, useEffect, useCallback } from "react"
import { materialRequisitionService } from "../../services/materialRequisitionService"
import { purchaseInvoiceService } from "../../services/purchaseInvoiceService"
import { FiSave, FiX, FiEye, FiEdit3 } from "react-icons/fi"
import PurchaseMTRDetailsModal from "./PurchaseMTRDetailsModal"

// Helper function to format dates for display
const formatDate = (dateString) => {
  if (!dateString) return ""
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}

const getWorkflowStatus = async (req) => {
  const {
    status,
    assignedPurchaser,
    projectManagerStatus,
    purchaseMTR,
    poUploaded,
    purchaseManagerApprovalStatus,
    purchaseOrderId,
    poApprovalStatus,
  } = req

  if (purchaseMTR === 0) {
    return {
      text: "No Purchase Required",
      color: "text-blue-600 bg-blue-50",
    }
  }

  if (!assignedPurchaser) {
    return {
      text: "Purchaser Not Assigned",
      color: "text-red-600 bg-red-50",
    }
  }

  const hasPOUploaded = poUploaded || (purchaseOrderId && purchaseOrderId > 0)

  let piData = null
  if (
    hasPOUploaded &&
    purchaseOrderId &&
    (poApprovalStatus === "APPROVED" || purchaseManagerApprovalStatus === "APPROVED")
  ) {
    try {
      piData = await purchaseInvoiceService.getPurchaseInvoiceByPOId(purchaseOrderId)
      if (piData && piData.id) {
        // Valid PI found
      } else {
        piData = null
      }
    } catch (error) {
      piData = null
    }
  }

  // PI status checks
  if (piData && piData.id) {
    if (piData.approvalStatus === "APPROVED") {
      return {
        text: "PI Approved - Payment Processing",
        color: "text-green-600 bg-green-50",
      }
    }

    if (piData.approvalStatus === "REJECTED") {
      return {
        text: "PI Rejected - Needs Revision",
        color: "text-red-600 bg-red-50",
      }
    }

    if (piData.approvalStatus === "UNDER_REVIEW") {
      return {
        text: "PI Under Review",
        color: "text-yellow-600 bg-yellow-50",
      }
    }

    return {
      text: "PI Uploaded - Approval Pending",
      color: "text-orange-600 bg-orange-50",
    }
  }

  if (hasPOUploaded) {
    if (poApprovalStatus === "APPROVED") {
      return {
        text: "PO Approved - PI Pending Upload",
        color: "text-blue-600 bg-blue-50",
      }
    }

    if (poApprovalStatus === "REJECTED") {
      return {
        text: "PO Rejected - Needs Revision",
        color: "text-red-600 bg-red-50",
      }
    }

    if (poApprovalStatus === "UNDER_REVIEW") {
      return {
        text: "PO Under Review",
        color: "text-yellow-600 bg-yellow-50",
      }
    }

    // This is the default case when PO is uploaded but not yet reviewed
    return {
      text: "PO Uploaded - Approval Pending",
      color: "text-orange-600 bg-orange-50",
    }
  }

  if (purchaseManagerApprovalStatus === "APPROVED" || projectManagerStatus === "APPROVED") {
    return {
      text: "Vendor Approved - PO Pending Upload",
      color: "text-green-600 bg-green-50",
    }
  }

  if (assignedPurchaser && !projectManagerStatus) {
    return {
      text: "Purchaser Assigned - PM Approval Pending",
      color: "text-yellow-600 bg-yellow-50",
    }
  }

  if (projectManagerStatus === "REJECTED" || purchaseManagerApprovalStatus === "REJECTED") {
    return {
      text: "Rejected by Project Manager",
      color: "text-red-600 bg-red-50",
    }
  }

  switch (status) {
    case "APPROVED":
      return {
        text: "Approved",
        color: "text-green-600 bg-green-50",
      }
    case "REJECTED":
      return {
        text: "Rejected",
        color: "text-red-600 bg-red-50",
      }
    case "Completed":
      return {
        text: "Completed",
        color: "text-green-600 bg-green-50",
      }
    case "Partially Filled":
      return {
        text: "Partially Filled",
        color: "text-orange-600 bg-orange-50",
      }
    default:
      return {
        text: "Pending",
        color: "text-gray-600 bg-gray-50",
      }
  }
}

export default function MaterialRequisitionPurchase() {
  const [requisitions, setRequisitions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [workflowStatuses, setWorkflowStatuses] = useState({})
  const [editingMtrId, setEditingMtrId] = useState(null)
  const [editedMtrData, setEditedMtrData] = useState({})
  const [editingPaymentStatus, setEditingPaymentStatus] = useState(null)
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState("")
  const [filters, setFilters] = useState({
    itemName: "",
    status: "All",
    priority: "All",
    mtrDateFrom: "",
    mtrDateTo: "",
  })
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedMTRForDetails, setSelectedMTRForDetails] = useState(null)

  const fetchMaterialRequisitions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const queryParams = new URLSearchParams({
        page: currentPage,
        size: pageSize,
        ...(filters.itemName && { itemName: filters.itemName }),
        ...(filters.status !== "All" && { status: filters.status }),
        ...(filters.priority !== "All" && { priority: filters.priority }),
        ...(filters.mtrDateFrom && { mtrDateFrom: filters.mtrDateFrom }),
        ...(filters.mtrDateTo && { mtrDateTo: filters.mtrDateTo }),
      }).toString()

      const data = await materialRequisitionService.fetchMaterialRequisitions(queryParams)

      const formattedRequisitions = (data.content || []).map((req) => {
        return {
          ...req,
          mtrQty: Number.parseFloat(req.mtrQty || 0),
          stockAlloted: Number.parseFloat(req.stockAlloted || 0),
          purchaseMTR: Number.parseFloat(req.purchaseMTR || 0),
          dcQty: Number.parseFloat(req.dcQty || 0),
        }
      })

      setRequisitions(formattedRequisitions)
      setTotalPages(data.totalPages || 0)
      setCurrentPage(data.number || 0)

      const statusPromises = formattedRequisitions.map(async (req) => {
        const status = await getWorkflowStatus(req)
        return { id: req.id, status }
      })

      const statuses = await Promise.all(statusPromises)
      const statusMap = {}
      statuses.forEach(({ id, status }) => {
        statusMap[id] = status
      })
      setWorkflowStatuses(statusMap)
    } catch (e) {
      console.error("Failed to fetch material requisitions:", e)
      setError("Failed to load material requisitions. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, filters])

  useEffect(() => {
    fetchMaterialRequisitions()
  }, [fetchMaterialRequisitions])

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters((prevFilters) => ({ ...prevFilters, [name]: value }))
  }

  const handleSelectFilterChange = (name, value) => {
    setFilters((prevFilters) => ({ ...prevFilters, [name]: value }))
  }

  const handleApplyFilters = () => {
    setCurrentPage(0)
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const renderPaginationItems = () => {
    const items = []
    const maxPagesToShow = 5
    let startPage = Math.max(0, currentPage - Math.floor(maxPagesToShow / 2))
    const endPage = Math.min(totalPages - 1, startPage + maxPagesToShow - 1)

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(0, endPage - maxPagesToShow + 1)
    }

    if (startPage > 0) {
      items.push(
        <li key="first">
          <button
            onClick={() => handlePageChange(0)}
            className="flex h-9 w-9 items-center justify-center whitespace-nowrap rounded-md border border-gray-300 bg-white px-3 text-sm shadow-sm transition-colors hover:bg-gray-100"
            aria-label="Go to first page"
          >
            1
          </button>
        </li>,
      )
      if (startPage > 1) {
        items.push(
          <li key="ellipsis-start">
            <span className="flex h-9 w-9 items-center justify-center whitespace-nowrap rounded-md border border-gray-300 bg-white px-3 text-sm shadow-sm">
              ...
            </span>
          </li>,
        )
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <li key={i}>
          <button
            onClick={() => handlePageChange(i)}
            className={`flex h-9 w-9 items-center justify-center whitespace-nowrap rounded-md border border-gray-300 px-3 text-sm shadow-sm transition-colors ${
              i === currentPage ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-white hover:bg-gray-100"
            }`}
            aria-current={i === currentPage ? "page" : undefined}
          >
            {i + 1}
          </button>
        </li>,
      )
    }

    if (endPage < totalPages - 1) {
      if (endPage < totalPages - 2) {
        items.push(
          <li key="ellipsis-end">
            <span className="flex h-9 w-9 items-center justify-center whitespace-nowrap rounded-md border border-gray-300 bg-white px-3 text-sm shadow-sm">
              ...
            </span>
          </li>,
        )
      }
      items.push(
        <li key="last">
          <button
            onClick={() => handlePageChange(totalPages - 1)}
            className="flex h-9 w-9 items-center justify-center whitespace-nowrap rounded-md border border-gray-300 bg-white px-3 text-sm shadow-sm transition-colors hover:bg-gray-100"
            aria-label="Go to last page"
          >
            {totalPages}
          </button>
        </li>,
      )
    }
    return items
  }

  const handleEditClick = (e, req) => {
    e.stopPropagation()
    setEditingMtrId(req.id)
    setEditedMtrData({ ...req })
  }

  const handleCancelClick = (e) => {
    e.stopPropagation()
    setEditingMtrId(null)
    setEditedMtrData({})
  }

  const handleInputChange = (e, field) => {
    const { value } = e.target
    setEditedMtrData((prev) => {
      const newData = { ...prev, [field]: value }
      if (field === "mtrQty" || field === "stockAlloted") {
        const mtrQty = Number.parseFloat(newData.mtrQty || 0)
        const stockAlloted = Number.parseFloat(newData.stockAlloted || 0)
        newData.purchaseMTR = Math.max(0, mtrQty - stockAlloted).toFixed(2)
      }
      return newData
    })
  }

  const handleSaveClick = async (e, mtrId) => {
    e.stopPropagation()
    setLoading(true)
    setError(null)
    try {
      const payload = {
        mtrQty: Number.parseFloat(editedMtrData.mtrQty),
        stockAlloted: Number.parseFloat(editedMtrData.stockAlloted),
        purchaseMTR: Number.parseFloat(editedMtrData.purchaseMTR),
        remarks: editedMtrData.remarks,
        expectedDeliveryDate: editedMtrData.expectedDeliveryDate,
        priority: editedMtrData.priority,
        mtrCode: editedMtrData.mtrCode,
        status: editedMtrData.status,
      }

      const currentUserId = 181 // Replace with actual user ID from context/auth

      await materialRequisitionService.updateMaterialRequisition(mtrId, payload, currentUserId)

      setRequisitions((prev) => prev.map((req) => (req.id === mtrId ? { ...req, ...editedMtrData } : req)))
      setEditingMtrId(null)
      setEditedMtrData({})
    } catch (e) {
      console.error("Failed to save material requisition:", e)
      setError(`Failed to save material requisition: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetailsClick = (e, req) => {
    e.stopPropagation()
    setSelectedMTRForDetails(req)
    setShowDetailsModal(true)
  }

  const refreshRequisitionStatus = async (reqId) => {
    const req = requisitions.find((r) => r.id === reqId)
    if (req) {
      const status = await getWorkflowStatus(req)
      setWorkflowStatuses((prev) => ({
        ...prev,
        [reqId]: status,
      }))
    }
  }

  const handlePaymentStatusChange = (piId, currentStatus) => {
    setEditingPaymentStatus(piId)
    setSelectedPaymentStatus(currentStatus || "PENDING")
  }

  const handlePaymentStatusSave = async (piId) => {
    try {
      setLoading(true)
      await purchaseInvoiceService.updatePaymentStatus(piId, selectedPaymentStatus)
      setEditingPaymentStatus(null)
      await fetchMaterialRequisitions()
    } catch (error) {
      console.error("Error updating payment status:", error)
      setError("Failed to update payment status")
      setTimeout(() => setError(null), 3000)
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentStatusCancel = () => {
    setEditingPaymentStatus(null)
    setSelectedPaymentStatus("")
  }

  useEffect(() => {
    const interval = setInterval(async () => {
      const poApprovedReqs = requisitions.filter(
        (req) =>
          req.poUploaded &&
          req.purchaseOrderId &&
          (req.poApprovalStatus === "APPROVED" || req.purchaseManagerApprovalStatus === "APPROVED"),
      )

      if (poApprovedReqs.length > 0) {
        for (const req of poApprovedReqs) {
          await refreshRequisitionStatus(req.id)
        }
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [requisitions])

  return (
    <div className="container mx-auto p-4 bg-gray-50 min-h-screen">
      <div className="rounded-xl border border-gray-200 bg-white text-gray-900 shadow-lg">
        <div className="flex flex-col space-y-1.5 p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold leading-none tracking-tight text-blue-700">Material Requisitions</h2>
          </div>
        </div>
        <div className="p-6 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div>
              <label
                htmlFor="itemName"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 block mb-1 text-blue-800"
              >
                Item Name
              </label>
              <input
                id="itemName"
                name="itemName"
                placeholder="Filter by item name"
                value={filters.itemName}
                onChange={handleFilterChange}
                className="flex h-10 w-full rounded-md border border-blue-300 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div>
              <label
                htmlFor="status"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 block mb-1 text-blue-800"
              >
                Status
              </label>
              <select
                id="status"
                name="status"
                value={filters.status}
                onChange={(e) => handleSelectFilterChange("status", e.target.value)}
                className="flex h-10 w-full rounded-md border border-blue-300 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="All">All</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="Partially Filled">Partially Filled</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="priority"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 block mb-1 text-blue-800"
              >
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                value={filters.priority}
                onChange={(e) => handleSelectFilterChange("priority", e.target.value)}
                className="flex h-10 w-full rounded-md border border-blue-300 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="All">All</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="mtrDateFrom"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 block mb-1 text-blue-800"
              >
                MTR Date From
              </label>
              <input
                id="mtrDateFrom"
                name="mtrDateFrom"
                type="date"
                value={filters.mtrDateFrom}
                onChange={handleFilterChange}
                className="flex h-10 w-full rounded-md border border-blue-300 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div>
              <label
                htmlFor="mtrDateTo"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 block mb-1 text-blue-800"
              >
                MTR Date To
              </label>
              <input
                id="mtrDateTo"
                name="mtrDateTo"
                type="date"
                value={filters.mtrDateTo}
                onChange={handleFilterChange}
                className="flex h-10 w-full rounded-md border border-blue-300 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleApplyFilters}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2"
              >
                Apply Filters
              </button>
            </div>
          </div>
          {loading ? (
            <div className="text-center py-8 text-gray-600">Loading requisitions...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">{error}</div>
          ) : requisitions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No material requisitions found.</div>
          ) : (
            <>
              <div className="relative w-full overflow-auto rounded-lg border border-gray-200 shadow-sm">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b bg-gray-100">
                    <tr className="border-b transition-colors hover:bg-gray-100">
                      <th className="h-12 px-4 text-left align-middle font-semibold text-gray-700">MTR Code</th>
                      <th className="h-12 px-4 text-left align-middle font-semibold text-gray-700">Project Name</th>
                      <th className="h-12 px-4 text-left align-middle font-semibold text-gray-700">Product Name</th>
                      <th className="h-12 px-4 text-left align-middle font-semibold text-gray-700">MTR Qty</th>
                      <th className="h-12 px-4 text-left align-middle font-semibold text-gray-700">Stock Allotted</th>
                      <th className="h-12 px-4 text-left align-middle font-semibold text-gray-700">Purchase MTR</th>
                      <th className="h-12 px-4 text-left align-middle font-semibold text-gray-700">PI Status</th>
                      <th className="h-12 px-4 text-left align-middle font-semibold text-gray-700">Payment Status</th>
                      <th className="h-12 px-4 text-left align-middle font-semibold text-gray-700">Payment Receipt</th>
                      <th className="h-12 px-4 text-left align-middle font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {requisitions.map((req) => {
                      return (
                        <tr
                          key={req.id}
                          className={`border-b transition-colors ${
                            editingMtrId === req.id ? "bg-blue-50" : "hover:bg-gray-50"
                          }`}
                        >
                          <td className="p-4 align-middle text-gray-700 font-medium">{req.mtrCode || "N/A"}</td>
                          <td className="p-4 align-middle text-gray-700">{req.projectName || "N/A"}</td>
                          <td className="p-4 align-middle text-gray-700">{req.productName || "N/A"}</td>
                          <td className="p-4 align-middle text-gray-700">
                            {editingMtrId === req.id ? (
                              <input
                                type="number"
                                step="0.01"
                                value={editedMtrData.mtrQty}
                                readOnly
                                className="w-24 p-1 border rounded bg-gray-100 text-gray-600 focus:outline-none"
                              />
                            ) : (
                              req.mtrQty
                            )}
                          </td>
                          <td className="p-4 align-middle text-gray-700">
                            {editingMtrId === req.id ? (
                              <input
                                type="number"
                                step="0.01"
                                value={editedMtrData.stockAlloted}
                                onChange={(e) => handleInputChange(e, "stockAlloted")}
                                className="w-24 p-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                              />
                            ) : (
                              req.stockAlloted
                            )}
                          </td>
                          <td className="p-4 align-middle text-gray-700">
                            {editingMtrId === req.id ? (
                              <input
                                type="number"
                                step="0.01"
                                value={editedMtrData.purchaseMTR}
                                readOnly
                                className="w-24 p-1 border rounded bg-gray-100 text-gray-600"
                              />
                            ) : (
                              req.purchaseMTR
                            )}
                          </td>
                          <td className="p-4 align-middle">
                            {req.piId ? (
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  req.piStatus === "APPROVED" || req.piStatus === "Approve"
                                    ? "bg-green-100 text-green-800"
                                    : req.piStatus === "REJECTED"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {req.piStatus || "PENDING"}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">N/A</span>
                            )}
                          </td>
                          <td className="p-4 align-middle">
                            {req.piId ? (
                              editingPaymentStatus === req.piId ? (
                                <div className="flex items-center gap-2">
                                  <select
                                    value={selectedPaymentStatus}
                                    onChange={(e) => setSelectedPaymentStatus(e.target.value)}
                                    className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    <option value="PENDING">PENDING</option>
                                    <option value="PARTIALLY_PAID">PARTIALLY_PAID</option>
                                    <option value="PAID">PAID</option>
                                  </select>
                                  <button
                                    onClick={() => handlePaymentStatusSave(req.piId)}
                                    className="text-green-600 hover:text-green-800"
                                    title="Save"
                                  >
                                    <FiSave size={14} />
                                  </button>
                                  <button
                                    onClick={handlePaymentStatusCancel}
                                    className="text-red-600 hover:text-red-800"
                                    title="Cancel"
                                  >
                                    <FiX size={14} />
                                  </button>
                                </div>
                              ) : (
                                <span
                                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 ${
                                    req.paymentStatus === "PAID"
                                      ? "bg-green-100 text-green-800"
                                      : req.paymentStatus === "PARTIALLY_PAID"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-gray-100 text-gray-800"
                                  }`}
                                  onClick={() => handlePaymentStatusChange(req.piId, req.paymentStatus)}
                                  title="Click to edit payment status"
                                >
                                  {req.paymentStatus || "PENDING"}
                                </span>
                              )
                            ) : (
                              <span className="text-xs text-gray-400">N/A</span>
                            )}
                          </td>
                          <td className="p-4 align-middle">
                            {req.paymentReceiptUrl ? (
                              <a
                                href={req.paymentReceiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 underline hover:text-blue-800 text-xs"
                              >
                                View Receipt
                              </a>
                            ) : (
                              <span className="text-xs text-gray-400">No Receipt</span>
                            )}
                          </td>
                          <td className="p-4 align-middle">
                            {editingMtrId === req.id ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={(e) => handleSaveClick(e, req.id)}
                                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700 h-9 px-3 py-1"
                                  title="Save changes"
                                >
                                  <FiSave size={16} />
                                </button>
                                <button
                                  onClick={handleCancelClick}
                                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-gray-300 text-gray-700 hover:bg-gray-400 h-9 px-3 py-1"
                                  title="Cancel editing"
                                >
                                  <FiX size={16} />
                                </button>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <button
                                  onClick={(e) => handleEditClick(e, req)}
                                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-yellow-100 text-yellow-700 hover:bg-yellow-200 h-9 px-3 py-1"
                                  title="Edit Stock Allotted"
                                >
                                  <FiEdit3 size={16} />
                                </button>
                                <button
                                  onClick={(e) => handleViewDetailsClick(e, req)}
                                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 h-9 px-3 py-1"
                                  title="View all details"
                                >
                                  <FiEye size={16} />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <nav className="mx-auto flex w-full justify-center py-4">
                <ul className="flex flex-row items-center gap-1">
                  <li>
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 0}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:opacity-50 hover:bg-gray-100 h-9 px-4 py-2 gap-1 pr-2.5 text-gray-700"
                      aria-label="Go to previous page"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                      >
                        <path d="m15 18-6-6 6-6"></path>
                      </svg>
                      <span>Previous</span>
                    </button>
                  </li>
                  {renderPaginationItems()}
                  <li>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages - 1}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:opacity-50 hover:bg-gray-100 h-9 px-4 py-2 gap-1 pl-2.5 text-gray-700"
                      aria-label="Go to next page"
                    >
                      <span>Next</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                      >
                        <path d="m9 18 6-6-6-6"></path>
                      </svg>
                    </button>
                  </li>
                </ul>
              </nav>
            </>
          )}
        </div>
      </div>
      {showDetailsModal && (
        <PurchaseMTRDetailsModal
          mtr={selectedMTRForDetails}
          onClose={() => {
            setShowDetailsModal(false)
            fetchMaterialRequisitions()
          }}
        />
      )}
    </div>
  )
}
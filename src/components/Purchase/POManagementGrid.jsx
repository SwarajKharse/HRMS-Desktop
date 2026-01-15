"use client"

import { useState, useEffect, useCallback } from "react"
import { purchaseOrderService } from "../../services/purchaseOrderService"
import { grnService } from "../../services/grnService"
import { purchaseInvoiceService } from "../../services/purchaseInvoiceService"
import { useAuth } from "../../contexts/AuthContext"

const POManagementGrid = () => {
  const { user } = useAuth()
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [pageSize] = useState(10)
  const [message, setMessage] = useState({ type: "", text: "" })

  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [materialStatusFilter, setMaterialStatusFilter] = useState("")
  const [poStatusFilter, setPOStatusFilter] = useState("")
  const [approvalStatusFilter, setApprovalStatusFilter] = useState("")

  // Modals
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedPO, setSelectedPO] = useState(null)
  const [poDetails, setPODetails] = useState(null)
  const [showGRNModal, setShowGRNModal] = useState(false)
  const [showMaterialStatusModal, setShowMaterialStatusModal] = useState(false)
  const [newMaterialStatus, setNewMaterialStatus] = useState("")
  const [showPOStatusModal, setShowPOStatusModal] = useState(false)
  const [newPOStatus, setNewPOStatus] = useState("")

  // GRN Upload fields
  const [grnCopyFile, setGrnCopyFile] = useState(null)
  const [testCertificateFile, setTestCertificateFile] = useState(null)
  const [invoiceCopyFile, setInvoiceCopyFile] = useState(null)
  const [payableAmount, setPayableAmount] = useState("")
  const [expectedPayableDate, setExpectedPayableDate] = useState("")
  const [grnRemarks, setGrnRemarks] = useState("")
  const [uploadingGRN, setUploadingGRN] = useState(false)

  const [selectedGRN, setSelectedGRN] = useState(null)
  const [showGRNApprovalModal, setShowGRNApprovalModal] = useState(false)
  const [grnApprovalRemarks, setGrnApprovalRemarks] = useState("")
  const [grnApprovalStatus, setGrnApprovalStatus] = useState("") // New state for GRN status
  const [processingGRN, setProcessingGRN] = useState(false)

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: "", text: "" }), 5000)
  }

  const fetchPurchaseOrders = useCallback(async () => {
    setLoading(true)
    try {
      const data = await purchaseOrderService.getPurchaseOrdersPaginated({
        page: currentPage,
        size: pageSize,
        search: searchTerm,
        materialStatus: materialStatusFilter,
        poStatus: poStatusFilter,
        approvalStatus: approvalStatusFilter,
      })

      setPurchaseOrders(data.content || [])
      setTotalPages(data.totalPages || 0)
    } catch (error) {
      console.error("Error fetching purchase orders:", error)
      showMessage("error", "Failed to fetch purchase orders")
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, searchTerm, materialStatusFilter, poStatusFilter, approvalStatusFilter])

  useEffect(() => {
    fetchPurchaseOrders()
  }, [fetchPurchaseOrders])

  const handleViewDetails = async (po) => {
    setSelectedPO(po)
    try {
      // Fetch PO with GRNs and PIs
      const poWithGRNs = await purchaseOrderService.getPOWithGRNs(po.id)
      const grns = await grnService.getGRNsByPO(po.id)
      const pis = await purchaseInvoiceService.getPurchaseInvoicesByPO(po.id)

      setPODetails({
        ...poWithGRNs,
        grns: grns || [],
        pis: pis || [],
      })
      setShowDetailsModal(true)
    } catch (error) {
      console.error("Error fetching PO details:", error)
      showMessage("error", "Failed to fetch PO details")
    }
  }

  const handleChangeMaterialStatus = (po) => {
    setSelectedPO(po)
    setNewMaterialStatus(po.materialStatus || "MATERIAL_YET_TO_DISPATCH")
    setShowMaterialStatusModal(true)
  }

  const handleUpdateMaterialStatus = async () => {
    if (!selectedPO || !newMaterialStatus) return

    try {
      await purchaseOrderService.updateMaterialStatus(selectedPO.id, newMaterialStatus)
      showMessage("success", "Material status updated successfully!")
      setShowMaterialStatusModal(false)
      fetchPurchaseOrders()
    } catch (error) {
      console.error("Error updating material status:", error)
      showMessage("error", "Failed to update material status")
    }
  }

  const handleChangePOStatus = (po) => {
    setSelectedPO(po)
    setNewPOStatus(po.poStatus || "OPEN")
    setShowPOStatusModal(true)
  }

  const handleUpdatePOStatus = async () => {
    if (!selectedPO || !newPOStatus) return

    try {
      await purchaseOrderService.updatePOStatus(selectedPO.id, newPOStatus)
      showMessage("success", "PO status updated successfully!")
      setShowPOStatusModal(false)
      fetchPurchaseOrders()
    } catch (error) {
      console.error("Error updating PO status:", error)
      showMessage("error", "Failed to update PO status")
    }
  }

  const handleOpenGRNModal = (po) => {
    if (po.materialStatus !== "GRN_DONE") {
      showMessage("error", "Material status must be 'GRN Done' to upload GRN")
      return
    }
    setSelectedPO(po)
    setShowGRNModal(true)
  }

  const handleUploadGRN = async () => {
    if (!grnCopyFile || !payableAmount || !expectedPayableDate) {
      showMessage("error", "Please fill in all required fields")
      return
    }

    try {
      setUploadingGRN(true)
      const formData = new FormData()
      formData.append("poId", selectedPO.id)
      if (grnCopyFile) formData.append("grnCopyFile", grnCopyFile)
      if (testCertificateFile) formData.append("testCertificateFile", testCertificateFile)
      if (invoiceCopyFile) formData.append("invoiceCopyFile", invoiceCopyFile)
      formData.append("payableAmount", payableAmount)
      formData.append("expectedPayableDate", expectedPayableDate)
      formData.append("uploadedBy", user?.userId || user?.id || 1)
      if (grnRemarks) formData.append("remarks", grnRemarks)

      console.log("[v0] Uploading GRN with formData:", {
        poId: selectedPO.id,
        payableAmount,
        expectedPayableDate,
        files: {
          grnFile: grnCopyFile?.name,
          testCert: testCertificateFile?.name,
          invoiceCopy: invoiceCopyFile?.name,
        },
      })

      const response = await grnService.uploadGRN(formData)
      console.log("[v0] GRN upload response:", response)

      showMessage("success", "GRN uploaded successfully!")

      if (selectedPO) {
        console.log("[v0] Fetching updated GRN data for PO:", selectedPO.id)
        try {
          const grns = await grnService.getGRNsByPO(selectedPO.id)
          const pis = await purchaseInvoiceService.getPurchaseInvoicesByPO(selectedPO.id)
          const updatedPO = await purchaseOrderService.getPurchaseOrderById(selectedPO.id)

          console.log("[v0] Updated GRNs:", grns)

          setPODetails({
            ...updatedPO,
            grns: grns || [],
            pis: pis || [],
          })

          setShowGRNModal(false)
          await fetchPurchaseOrders()
        } catch (fetchError) {
          console.error("[v0] Error fetching updated data:", fetchError)
          showMessage("warning", "GRN uploaded but could not refresh data. Please refresh the page.")
          setShowGRNModal(false)
        }
      }

      resetGRNModal()
      setUploadingGRN(false)
    } catch (error) {
      console.error("[v0] Error uploading GRN:", error)
      showMessage("error", error.response?.data?.message || "Failed to upload GRN")
      setUploadingGRN(false)
    }
  }

  const resetGRNModal = () => {
    setSelectedPO(null)
    setGrnCopyFile(null)
    setTestCertificateFile(null)
    setInvoiceCopyFile(null)
    setPayableAmount("")
    setExpectedPayableDate("")
    setGrnRemarks("")
  }

  const handleApproveGRN = (grn) => {
    setSelectedGRN(grn)
    setShowGRNApprovalModal(true)
  }

  const handleSubmitGRNApproval = async () => {
    if (!selectedGRN || !grnApprovalStatus) return

    try {
      setProcessingGRN(true)
      const approvalData = {
        approverId: user?.userId || user?.id || 1,
        remarks: grnApprovalRemarks,
        approvalStatus: grnApprovalStatus,
      }

      await grnService.approveGRN(selectedGRN.id, approvalData)
      showMessage("success", `GRN ${grnApprovalStatus === "APPROVED" ? "approved" : "rejected"} successfully!`)
      setShowGRNApprovalModal(false)
      setGrnApprovalRemarks("")
      setGrnApprovalStatus("")
      setSelectedGRN(null)

      // Refresh details if modal is open
      if (showDetailsModal && selectedPO) {
        handleViewDetails(selectedPO)
      }
      fetchPurchaseOrders()
    } catch (error) {
      console.error("Error processing GRN approval:", error)
      showMessage("error", "Failed to process GRN approval")
    } finally {
      setProcessingGRN(false)
    }
  }

  const handleTransferToAccounts = async (grn) => {
    if (window.confirm("Transfer this GRN to Accounts department?")) {
      try {
        await grnService.transferToAccounts(grn.id, user?.userId || user?.id || 1)
        showMessage("success", "GRN transferred to Accounts successfully!")

        // Refresh details if modal is open
        if (showDetailsModal && selectedPO) {
          handleViewDetails(selectedPO)
        }
        fetchPurchaseOrders()
      } catch (error) {
        console.error("Error transferring to accounts:", error)
        showMessage("error", "Failed to transfer GRN to Accounts")
      }
    }
  }

  const getMaterialStatusBadge = (status) => {
    const config = {
      MATERIAL_YET_TO_DISPATCH: { color: "bg-gray-100 text-gray-800", label: "Yet to Dispatch" },
      IN_TRANSIT: { color: "bg-blue-100 text-blue-800", label: "In Transit" },
      RECEIVED: { color: "bg-yellow-100 text-yellow-800", label: "Received" },
      GRN_DONE: { color: "bg-green-100 text-green-800", label: "GRN Done" },
    }[status] || { color: "bg-gray-100 text-gray-800", label: "Unknown" }

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const getPOStatusBadge = (status, po) => {
    return (
      <button
        onClick={() => handleChangePOStatus(po)}
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 ${
          status === "CLOSED" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        }`}
      >
        {status === "CLOSED" ? "Closed" : "Open"}
      </button>
    )
  }

  return (
    <div className="container mx-auto p-4 bg-gray-50 min-h-screen">
      <div className="rounded-xl border border-gray-200 bg-white shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-blue-700">Purchase Order Management</h2>
        </div>

        {message.text && (
          <div
            className={`mx-6 mt-4 p-3 rounded-md ${message.type === "success" ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800"}`}
          >
            {message.text}
          </div>
        )}

        {/* Filters */}
        <div className="p-6 space-y-4 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Search PO Number or MTR Code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={materialStatusFilter}
              onChange={(e) => setMaterialStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Material Status</option>
              <option value="MATERIAL_YET_TO_DISPATCH">Yet to Dispatch</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="RECEIVED">Received</option>
              <option value="GRN_DONE">GRN Done</option>
            </select>
            <select
              value={poStatusFilter}
              onChange={(e) => setPOStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All PO Status</option>
              <option value="OPEN">Open</option>
              <option value="CLOSED">Closed</option>
            </select>
            <select
              value={approvalStatusFilter}
              onChange={(e) => setApprovalStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Approval Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <button
            onClick={fetchPurchaseOrders}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Apply Filters
          </button>
        </div>

        {/* Table */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : purchaseOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No purchase orders found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">PO Number</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Material Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">PO Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Approval Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Created Date</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseOrders.map((po) => (
                    <tr key={po.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">{po.poNumber}</td>
                      <td className="px-4 py-3">{getMaterialStatusBadge(po.materialStatus)}</td>
                      <td className="px-4 py-3">{getPOStatusBadge(po.poStatus, po)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            po.approvalStatus === "APPROVED"
                              ? "bg-green-100 text-green-800"
                              : po.approvalStatus === "REJECTED"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {po.approvalStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">{new Date(po.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewDetails(po)}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => handleChangeMaterialStatus(po)}
                            className="px-3 py-1 text-blue-600 border border-blue-600 rounded hover:bg-blue-50 text-sm font-medium"
                          >
                            Change Status
                          </button>
                          {po.materialStatus === "GRN_DONE" && (
                            <button
                              onClick={() => handleOpenGRNModal(po)}
                              className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm"
                            >
                              Upload GRN
                            </button>
                          )}
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
            <div className="flex justify-center gap-2 mt-4">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
                disabled={currentPage === 0}
                className="px-4 py-2 border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2">
                Page {currentPage + 1} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
                disabled={currentPage === totalPages - 1}
                className="px-4 py-2 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && poDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">PO Details - {poDetails.poNumber}</h3>
                <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* PO Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Purchase Order Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">PO Number:</span> {poDetails.poNumber}
                  </div>
                  <div>
                    <span className="font-medium">Material Status:</span>{" "}
                    {getMaterialStatusBadge(poDetails.materialStatus)}
                  </div>
                  <div>
                    <span className="font-medium">PO Status:</span> {getPOStatusBadge(poDetails.poStatus)}
                  </div>
                  <div>
                    <span className="font-medium">Created:</span> {new Date(poDetails.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* GRNs */}
              <div>
                <h4 className="font-semibold mb-3">Goods Receipt Notes ({poDetails.grns?.length || 0})</h4>
                {poDetails.grns && poDetails.grns.length > 0 ? (
                  <div className="space-y-3">
                    {poDetails.grns.map((grn) => (
                      <div key={grn.id} className="border border-gray-200 p-4 rounded-lg bg-gray-50">
                        <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                          <div>
                            <span className="font-medium">GRN Number:</span> {grn.grnNumber}
                          </div>
                          <div>
                            <span className="font-medium">Payable Amount:</span> ₹{grn.payableAmount?.toLocaleString()}
                          </div>
                          <div>
                            <span className="font-medium">Expected Date:</span>{" "}
                            {new Date(grn.expectedPayableDate).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium">PM Approval:</span>{" "}
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                grn.purchaseManagerApprovalStatus === "APPROVED"
                                  ? "bg-green-100 text-green-800"
                                  : grn.purchaseManagerApprovalStatus === "REJECTED"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {grn.purchaseManagerApprovalStatus}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">Handed to Accounts:</span>{" "}
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                grn.handedOverToAccounts ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {grn.handedOverToAccounts ? "Yes" : "No"}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">Uploaded:</span>{" "}
                            {new Date(grn.createdAt).toLocaleDateString()}
                          </div>
                          {grn.grnCopyUrl && (
                            <div>
                              <a
                                href={grn.grnCopyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm"
                              >
                                View GRN Copy
                              </a>
                            </div>
                          )}
                          {grn.testCertificateUrl && (
                            <div>
                              <a
                                href={grn.testCertificateUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm"
                              >
                                View Test Certificate
                              </a>
                            </div>
                          )}
                          {grn.invoiceCopyUrl && (
                            <div>
                              <a
                                href={grn.invoiceCopyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm"
                              >
                                View Invoice Copy
                              </a>
                            </div>
                          )}
                          {grn.remarks && (
                            <div className="col-span-2">
                              <span className="font-medium">Remarks:</span> {grn.remarks}
                            </div>
                          )}
                          {grn.approvalRemarks && (
                            <div className="col-span-2">
                              <span className="font-medium">Approval Remarks:</span> {grn.approvalRemarks}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
                          {(grn.purchaseManagerApprovalStatus === "PENDING" || !grn.purchaseManagerApprovalStatus) && (
                            <button
                              onClick={() => handleApproveGRN(grn)}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                            >
                              Approve/Reject
                            </button>
                          )}
                          {grn.purchaseManagerApprovalStatus === "APPROVED" && !grn.handedOverToAccounts && (
                            <button
                              onClick={() => handleTransferToAccounts(grn)}
                              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                            >
                              Transfer to Accounts
                            </button>
                          )}
                          {grn.handedOverToAccounts && (
                            <span className="text-sm text-green-600 font-medium">✓ Transferred to Accounts</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No GRNs uploaded yet</p>
                )}
              </div>

              {/* PIs */}
              <div>
                <h4 className="font-semibold mb-3">Purchase Invoices ({poDetails.pis?.length || 0})</h4>
                {poDetails.pis && poDetails.pis.length > 0 ? (
                  <div className="space-y-3">
                    {poDetails.pis.map((pi) => (
                      <div key={pi.id} className="border border-gray-200 p-4 rounded-lg">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="font-medium">PI Number:</span>{" "}
                            <a
                              href={`/purchase-invoices/${pi.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline font-medium"
                            >
                              {pi.piNumber}
                            </a>
                          </div>
                          <div>
                            <span className="font-medium">Amount:</span> ₹{pi.payableAmount}
                          </div>
                          <div>
                            <span className="font-medium">Project:</span> {pi.projectName}
                          </div>
                          <div>
                            <span className="font-medium">Status:</span> {pi.approvalStatus}
                          </div>
                          <div>
                            <span className="font-medium">Payment Status:</span>{" "}
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                pi.paymentDoneDate ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {pi.paymentDoneDate ? "Paid" : "Pending"}
                            </span>
                          </div>
                          {pi.paymentDoneDate && (
                            <div>
                              <span className="font-medium">Payment Date:</span>{" "}
                              {new Date(pi.paymentDoneDate).toLocaleDateString()}
                            </div>
                          )}
                          {pi.paymentReceiptUrl && (
                            <div>
                              <a
                                href={pi.paymentReceiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm font-medium"
                              >
                                View Payment Receipt
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No PIs uploaded yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Material Status Modal */}
      {showMaterialStatusModal && selectedPO && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Update Material Status</h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-blue-50 p-3 rounded">
                <p className="text-sm">
                  <span className="font-medium">PO Number:</span> {selectedPO.poNumber}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Material Status</label>
                <select
                  value={newMaterialStatus}
                  onChange={(e) => setNewMaterialStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="MATERIAL_YET_TO_DISPATCH">Material yet to be dispatch</option>
                  <option value="IN_TRANSIT">In Transit</option>
                  <option value="RECEIVED">Received</option>
                  <option value="GRN_DONE">GRN Done</option>
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowMaterialStatusModal(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateMaterialStatus}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change PO Status Modal */}
      {showPOStatusModal && selectedPO && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Change PO Status - {selectedPO.poNumber}</h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">PO Status</label>
                <select
                  value={newPOStatus}
                  onChange={(e) => setNewPOStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="OPEN">Open</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPOStatusModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdatePOStatus}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showGRNApprovalModal && selectedGRN && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">GRN Approval - {selectedGRN.grnNumber}</h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-blue-50 p-3 rounded space-y-2 text-sm">
                <div>
                  <span className="font-medium">Payable Amount:</span> ₹{selectedGRN.payableAmount?.toLocaleString()}
                </div>
                <div>
                  <span className="font-medium">Expected Date:</span>{" "}
                  {new Date(selectedGRN.expectedPayableDate).toLocaleDateString()}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">GRN Status</label>
                <select
                  value={grnApprovalStatus}
                  onChange={(e) => setGrnApprovalStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Approval Remarks</label>
                <textarea
                  value={grnApprovalRemarks}
                  onChange={(e) => setGrnApprovalRemarks(e.target.value)}
                  rows={3}
                  placeholder="Enter remarks for approval/rejection..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowGRNApprovalModal(false)
                    setGrnApprovalRemarks("")
                    setGrnApprovalStatus("")
                    setSelectedGRN(null)
                  }}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                  disabled={processingGRN}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitGRNApproval}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300"
                  disabled={processingGRN}
                >
                  {processingGRN ? "Processing..." : "Submit"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GRN Upload Modal */}
      {showGRNModal && selectedPO && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Upload GRN - {selectedPO.poNumber}</h3>
                <button onClick={resetGRNModal} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  GRN Copy <span className="text-red-500">*</span>
                </label>
                <input type="file" onChange={(e) => setGrnCopyFile(e.target.files[0])} className="w-full text-sm" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Test Certificate</label>
                <input
                  type="file"
                  onChange={(e) => setTestCertificateFile(e.target.files[0])}
                  className="w-full text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Invoice Copy</label>
                <input type="file" onChange={(e) => setInvoiceCopyFile(e.target.files[0])} className="w-full text-sm" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Payable Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={payableAmount}
                  onChange={(e) => setPayableAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Expected Payable Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={expectedPayableDate}
                  onChange={(e) => setExpectedPayableDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Remarks</label>
                <textarea
                  value={grnRemarks}
                  onChange={(e) => setGrnRemarks(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button onClick={resetGRNModal} className="px-4 py-2 border rounded hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  onClick={handleUploadGRN}
                  disabled={uploadingGRN || !grnCopyFile || !payableAmount || !expectedPayableDate}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300"
                >
                  {uploadingGRN ? "Uploading..." : "Upload GRN"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default POManagementGrid

"use client"

import { useState, useEffect, useCallback } from "react"
import { comparisonSheetService } from "../../../services/comparisonSheetService"
import { purchaseInvoiceService } from "../../../services/purchaseInvoiceService"
import { useAuth } from "../../../contexts/AuthContext"

const PIUploadTab = () => {
  const { user } = useAuth()

  // Modal state
  const [showPIModal, setShowPIModal] = useState(false)
  const [selectedPOForPI, setSelectedPOForPI] = useState(null)

  // Table state
  const [approvedPOs, setApprovedPOs] = useState([])
  const [tableLoading, setTableLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [pageSize] = useState(10)
  const [piListByPO, setPIListByPO] = useState({})

  // Form state
  const [piFile, setPIFile] = useState(null)
  const [shareStatus, setShareStatus] = useState("")
  const [payableAmount, setPayableAmount] = useState("")
  const [selectedProjectName, setSelectedProjectName] = useState("")
  const [expectedPaymentDate, setExpectedPaymentDate] = useState("")
  const [piRemarks, setPIRemarks] = useState("")
  const [projectNames, setProjectNames] = useState([])
  const [uploadingPI, setUploadingPI] = useState(false)
  const [loadingPIData, setLoadingPIData] = useState(false)
  const [existingPIData, setExistingPIData] = useState(null)
  const [expandedPIHistory, setExpandedPIHistory] = useState({})

  // Message state
  const [message, setMessage] = useState({ type: "", text: "" })

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: "", text: "" }), 3000)
  }

  // Fetch approved POs (both PM and FM approved) - Fixed to use correct API
  const fetchApprovedPOs = useCallback(async () => {
    setTableLoading(true)
    try {
      const requisitionFilters = {
        page: currentPage,
        size: pageSize,
        assignedPurchaser: user?.userId || 1,
        pmApprovalStatus: "APPROVED",
      }

      const data = await comparisonSheetService.getPMApprovedMaterialRequisitions(requisitionFilters)
      
      const approvedData = []
      const pisByPO = {}

      // Fetch PO details for each approved MTR
      for (const req of data.content || []) {
        try {
          console.log("[v0] Requisition data:", req)
          const poStatus = await comparisonSheetService.checkPOStatus(req.id)

          // Only include if both PM and FM are approved
          if (
            poStatus.hasPO &&
            poStatus.latestPO?.approvalStatus === "APPROVED" &&
            poStatus.latestPO?.financeManagerApprovalStatus === "APPROVED"
          ) {
            // Get material description from boqMtr or req
            const materialDesc = req.productName || poStatus.latestPO?.boqMtr?.productName || "N/A"
            console.log("[v0] Material Description:", materialDesc)
            
            // Add the BOQ MTR data with PO details
            approvedData.push({
              id: req.id,
              mtrId: req.id,
              projectName: req.projectName,
              materialDescription: materialDesc,
              purchaseMTR: req.purchaseMTR || poStatus.latestPO?.boqMtr?.purchaseMTR,
              pmApprovalStatus: req.pmApprovalStatus,
              pmApprovalDate: req.pmApprovalDate,
              poNumber: poStatus.latestPO?.poNumber,
              poDate: poStatus.latestPO?.createdAt,
              poId: poStatus.latestPO?.id,
              pmApproval: poStatus.latestPO?.approvalStatus,
              fmApproval: poStatus.latestPO?.financeManagerApprovalStatus,
            })

            // Fetch PI list if PO exists
            if (poStatus.latestPO?.id) {
              try {
                const piList = await purchaseInvoiceService.getPurchaseInvoicesByPO(poStatus.latestPO.id)
                if (piList && piList.length > 0) {
                  pisByPO[poStatus.latestPO.id] = piList
                }
              } catch (error) {
                console.log(`No PI found for PO ${poStatus.latestPO.id}`)
              }
            }
          }
        } catch (error) {
          console.error(`Error checking PO status for MTR ${req.id}:`, error)
        }
      }
      
      setApprovedPOs(approvedData)
      setTotalPages(data.totalPages || 0)
      setPIListByPO(pisByPO)
    } catch (error) {
      console.error("Failed to fetch approved POs:", error)
      setApprovedPOs([])
    } finally {
      setTableLoading(false)
    }
  }, [currentPage, pageSize, user])

  // Fetch project names
  const fetchProjectNames = useCallback(async () => {
    try {
      const projects = await purchaseInvoiceService.getProjectNames()
      setProjectNames(projects || [])
    } catch (error) {
      console.error("Error fetching project names:", error)
    }
  }, [])

  // Fetch existing PI data
  useEffect(() => {
    const fetchExistingPI = async () => {
      if (!selectedPOForPI?.poId) return

      setLoadingPIData(true)
      try {
        const existingPI = await purchaseInvoiceService.getLatestPurchaseInvoiceByPO(selectedPOForPI.poId)
        if (existingPI) {
          setExistingPIData(existingPI)
          setPayableAmount(existingPI.payableAmount?.toString() || "")
          setSelectedProjectName(existingPI.projectName || "")
          setExpectedPaymentDate(existingPI.expectedPaymentDate || "")
          setPIRemarks(existingPI.remarks || "")
          setShareStatus(existingPI.shareStatus || "")
        } else {
          setExistingPIData(null)
        }
      } catch (error) {
        console.error("Error fetching existing PI data:", error)
        setExistingPIData(null)
      } finally {
        setLoadingPIData(false)
      }
    }

    fetchExistingPI()
  }, [selectedPOForPI])

  useEffect(() => {
    fetchProjectNames()
  }, [fetchProjectNames])

  useEffect(() => {
    fetchApprovedPOs()
  }, [fetchApprovedPOs])

  // Handle PI upload
  const handleUploadPI = async () => {
    if (!piFile || !shareStatus || !payableAmount || !selectedProjectName || !expectedPaymentDate) {
      showMessage("error", "Please fill in all required fields to submit")
      return
    }

    try {
      setUploadingPI(true)
      const formData = new FormData()
      formData.append("file", piFile)
      formData.append("shareStatus", shareStatus)
      formData.append("payableAmount", payableAmount)
      formData.append("projectName", selectedProjectName)
      formData.append("expectedPaymentDate", expectedPaymentDate)
      formData.append("remarks", piRemarks)
      formData.append("poId", selectedPOForPI.poId)
      formData.append("uploadedBy", user?.userId || user?.id || 1)

      await purchaseInvoiceService.uploadPurchaseInvoice(formData)

      showMessage("success", "PI submitted successfully to Accounts!")

      closePIModal()
      fetchApprovedPOs()
    } catch (error) {
      console.error("Error submitting PI:", error)
      showMessage("error", "Error submitting PI. Please try again.")
    } finally {
      setUploadingPI(false)
    }
  }

  // Reset PI modal
  const resetPIModal = () => {
    setSelectedPOForPI(null)
    setPIFile(null)
    setShareStatus("")
    setPayableAmount("")
    setSelectedProjectName("")
    setExpectedPaymentDate("")
    setPIRemarks("")
    setExistingPIData(null)
  }

  // Close PI modal
  const closePIModal = () => {
    resetPIModal()
    setShowPIModal(false)
  }

  // Open PI modal
  const openPIModal = (poData) => {
    setSelectedPOForPI(poData)
    setShowPIModal(true)
  }

  // Render PI upload modal
  const renderPIModal = () => {
    if (!showPIModal || !selectedPOForPI) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 flex flex-col" style={{ height: "auto", maxHeight: "90vh" }}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Upload Purchase Invoice</h2>
            <button onClick={closePIModal} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Message */}
          {message.text && (
            <div
              className={`mx-6 mt-4 p-3 rounded-md ${
                message.type === "success"
                  ? "bg-green-50 border border-green-200 text-green-800"
                  : "bg-red-50 border border-red-200 text-red-800"
              }`}
            >
              <div className="flex items-center">
                {message.type === "success" ? (
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 01-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                <span className="text-sm font-medium">{message.text}</span>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {/* PO Details */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Purchase Order Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-600 font-medium">PO Number:</span>
                  <p className="text-blue-900">{selectedPOForPI.poNumber || "N/A"}</p>
                </div>
                <div>
                  <span className="text-blue-600 font-medium">Uploaded Date:</span>
                  <p className="text-blue-900">
                    {selectedPOForPI.uploadDate
                      ? new Date(selectedPOForPI.uploadDate).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {/* PI File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PI Document <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  onChange={(e) => setPIFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  disabled={uploadingPI}
                />
                {piFile && <p className="text-xs text-green-600 mt-1">✓ {piFile.name}</p>}
              </div>

              {/* Share Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Share Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={shareStatus}
                  onChange={(e) => setShareStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  disabled={uploadingPI}
                >
                  <option value="">Select Status</option>
                  <option value="SHARED">Shared</option>
                  <option value="NOT_SHARED">Not Shared</option>
                </select>
              </div>

              {/* Payable Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payable Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={payableAmount}
                  onChange={(e) => setPayableAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="0.00"
                  disabled={uploadingPI}
                />
              </div>

              {/* Project Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedProjectName}
                  onChange={(e) => setSelectedProjectName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  disabled={uploadingPI}
                >
                  <option value="">Select Project</option>
                  {projectNames.map((project) => (
                    <option key={project} value={project}>
                      {project}
                    </option>
                  ))}
                </select>
              </div>

              {/* Expected Payment Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Payment Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={expectedPaymentDate}
                  onChange={(e) => setExpectedPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  disabled={uploadingPI}
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
                <textarea
                  value={piRemarks}
                  onChange={(e) => setPIRemarks(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  rows={3}
                  placeholder="Add any additional remarks..."
                  disabled={uploadingPI}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
            <button
              onClick={closePIModal}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium text-sm"
              disabled={uploadingPI}
            >
              Cancel
            </button>
            <button
              onClick={handleUploadPI}
              disabled={uploadingPI}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium text-sm disabled:bg-gray-400"
            >
              {uploadingPI ? "Uploading..." : "Submit PI"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Render approved POs table
  const renderApprovedPOsTable = () => {
    if (tableLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading approved POs...</div>
        </div>
      )
    }

    if (approvedPOs.length === 0) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">No approved POs found. Upload a PO first.</div>
        </div>
      )
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left p-4 font-semibold text-gray-900 text-sm">Project Name</th>
              <th className="text-left p-4 font-semibold text-gray-900 text-sm">Product Name</th>
              <th className="text-left p-4 font-semibold text-gray-900 text-sm">Quantity</th>
              <th className="text-left p-4 font-semibold text-gray-900 text-sm">PM Approval</th>
              <th className="text-left p-4 font-semibold text-gray-900 text-sm">FM Approval</th>
              <th className="text-left p-4 font-semibold text-gray-900 text-sm">PI Details</th>
              <th className="text-left p-4 font-semibold text-gray-900 text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {approvedPOs.map((po) => {
              const poId = po.poId
              const piList = piListByPO[poId] || []
                const latestPI = piList.length > 0 ? piList[piList.length - 1] : null
                
              return (
                <tr key={po.mtrId} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-4 text-sm text-gray-900">{po.projectName || "N/A"}</td>
                  <td className="p-4 text-sm text-gray-600 max-w-[200px]">
                    <div className="truncate" title={po.materialDescription}>
                      {po.materialDescription || "N/A"}
                    </div>
                  </td>
                  <td className="p-4 text-sm font-medium text-gray-900">{po.purchaseMTR || "N/A"}</td>
                  <td className="p-4 text-sm">
                    <div
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        latestPI?.purchaseManagerApprovalStatus === "APPROVED"
                          ? "bg-green-100 text-green-800"
                          : latestPI?.purchaseManagerApprovalStatus === "REJECTED"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-gray-800"
                      }`}
                    >
                      {latestPI?.purchaseManagerApprovalStatus || "PENDING"}
                    </div>
                  </td>
                  <td className="p-4 text-sm">
                    <div
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        latestPI?.financeManagerApprovalStatus === "APPROVED"
                          ? "bg-green-100 text-green-800"
                          : latestPI?.financeManagerApprovalStatus === "REJECTED"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-gray-800"
                      }`}
                    >
                      {latestPI?.financeManagerApprovalStatus || "PENDING"}
                    </div>
                  </td>
                  <td className="p-4 text-sm">
                    {latestPI ? (
                      <div className="space-y-1">
                        <div className="text-xs text-gray-600">
                          <span className="font-medium">PI:</span> {latestPI.piNumber || "N/A"}
                        </div>
                        {latestPI.fileName && (
                          <a
                            href={latestPI.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 underline hover:text-blue-800 block truncate max-w-[150px]"
                            title={latestPI.fileName}
                          >
                            {latestPI.fileName}
                          </a>
                        )}
                        <div
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            latestPI.purchaseManagerApprovalStatus === "APPROVED"
                              ? "bg-green-100 text-green-800"
                              : latestPI.purchaseManagerApprovalStatus === "REJECTED"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {latestPI.purchaseManagerApprovalStatus || "PENDING"}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-500 text-xs">No PI yet</span>
                    )}
                  </td>
                  <td className="p-4 text-sm">
                    <button
                      onClick={() => openPIModal(po)}
                      className="inline-flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 font-medium"
                    >
                      Upload PI
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6 pb-4">
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage + 1} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage === totalPages - 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Upload Purchase Invoice</h2>
          <button
            onClick={fetchApprovedPOs}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
          >
            Refresh
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {renderApprovedPOsTable()}
        </div>
      </div>

      {/* PI Upload Modal */}
      {renderPIModal()}
    </div>
  )
}

export default PIUploadTab
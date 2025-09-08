"use client"

import { useState, useEffect, useCallback } from "react"
import { comparisonSheetService } from "../../../services/comparisonSheetService"
import { useAuth } from "../../../contexts/AuthContext"
import VendorDropdownPOUpload from "./VendorDropdownPOUpload"

const POUploadWithVendorSelection = () => {
  const { user } = useAuth()
  const [showModal, setShowModal] = useState(true) // Opens modal on page load
  const [showTableView, setShowTableView] = useState(false)

  const [requisitions, setRequisitions] = useState([])
  const [tableLoading, setTableLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [pageSize] = useState(10)
  const [poStatusMap, setPOStatusMap] = useState({}) // Adding state to track PO status for each MTR

  const [currentStep, setCurrentStep] = useState(1)
  const [selectedVendor, setSelectedVendor] = useState("")
  const [selectedMTRs, setSelectedMTRs] = useState([])
  const [mtrs, setMtrs] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadedPOs, setUploadedPOs] = useState([])
  const [showPODetails, setShowPODetails] = useState(false)
  const [poFile, setPOFile] = useState(null)
  const [poNumber, setPONumber] = useState("")
  const [message, setMessage] = useState({ type: "", text: "" })

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => {
      setMessage({ type: "", text: "" })
    }, 5000)
  }

  const fetchTableData = useCallback(async () => {
    setTableLoading(true)
    try {
      const requisitionFilters = {
        page: currentPage,
        size: pageSize,
        assignedPurchaser: user?.userId || 1,
        pmApprovalStatus: "APPROVED",
      }

      const data = await comparisonSheetService.getPMApprovedMaterialRequisitions(requisitionFilters)
      setRequisitions(data.content || [])
      setTotalPages(data.totalPages || 0)

      const poStatuses = {}
      for (const req of data.content || []) {
        try {
          const poStatus = await comparisonSheetService.checkPOStatus(req.id)
          poStatuses[req.id] = {
            hasPO: poStatus.hasPO,
            poNumber: poStatus.latestPO?.poNumber || null,
            fileName: poStatus.latestPO?.fileName || null,
            uploadDate: poStatus.latestPO?.createdAt || null,
            approvalStatus: poStatus.latestPO?.approvalStatus || "PENDING",
            fileUrl : poStatus.latestPO?.fileUrl || null
          }
        } catch (error) {
          console.error(`Error checking PO status for MTR ${req.id}:`, error)
          poStatuses[req.id] = { hasPO: false, poNumber: null, uploadDate: null }
        }
      }
      setPOStatusMap(poStatuses)
    } catch (error) {
      console.error("Failed to fetch material requisitions:", error)
      setRequisitions([])
    } finally {
      setTableLoading(false)
    }
  }, [currentPage, pageSize, user?.id])

  useEffect(() => {
    if (!showModal) {
      setShowTableView(true)
      fetchTableData()
    }
  }, [showModal, fetchTableData])

  useEffect(() => {
    if (selectedVendor && currentStep === 2) {
      fetchMTRsByVendor()
    }
  }, [selectedVendor, currentStep])

  const fetchMTRsByVendor = async () => {
    try {
      setLoading(true)
      console.log("[v0] selectedVendor value:", selectedVendor)
      console.log("[v0] selectedVendor type:", typeof selectedVendor)

      const mtrData = await comparisonSheetService.getMTRsByApprovedVendor({
        vendorName: selectedVendor,
        assignedPurchaser: user?.userId || 1,
      })
      setMtrs(mtrData || [])
      setSelectedMTRs(mtrData?.map((mtr) => mtr.id) || [])
    } catch (error) {
      console.error("Error fetching MTRs:", error)
      setMtrs([])
      setSelectedMTRs([])
    } finally {
      setLoading(false)
    }
  }

  const handleVendorSelect = (vendorName) => {
    console.log("[v0] handleVendorSelect received:", vendorName)
    console.log("[v0] vendor type:", typeof vendorName)

    setSelectedVendor(vendorName)
    setCurrentStep(2)
  }

  const handleBackToVendorSelection = () => {
    setSelectedVendor("")
    setSelectedMTRs([])
    setMtrs([])
    setPOFile(null)
    setPONumber("")
    setCurrentStep(1)
  }

  const handleBackToMTRSelection = () => {
    setPOFile(null)
    setPONumber("")
    setCurrentStep(2)
  }

  const handleMTRToggle = (mtrId) => {
    setSelectedMTRs((prev) => (prev.includes(mtrId) ? prev.filter((id) => id !== mtrId) : [...prev, mtrId]))
  }

  const handleSelectAllMTRs = () => {
    if (selectedMTRs.length === mtrs.length) {
      setSelectedMTRs([])
    } else {
      setSelectedMTRs(mtrs.map((mtr) => mtr.id))
    }
  }

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
      setPOFile(file)
      setCurrentStep(3)
    }
  }

  const handleUploadPO = async () => {
    if (!poFile || selectedMTRs.length === 0 || !poNumber.trim()) {
      showMessage("error", "Please enter PO Number, select a file and MTRs to upload")
      return
    }

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append("file", poFile)
      selectedMTRs.forEach((mtrId) => {
        formData.append("mtrIds", mtrId)
      })
      formData.append("vendorName", selectedVendor)
      formData.append("uploadedBy", user?.id || 1)
      formData.append("poNumber", poNumber.trim())

      const result = await comparisonSheetService.uploadPOForMTRs(formData)

      showMessage("success", `PO uploaded successfully for ${selectedMTRs.length} MTRs!`)

      const updatedPOStatusMap = { ...poStatusMap }
      selectedMTRs.forEach((mtrId) => {
        console.log(mtrId)
        console.log(poFile)
        updatedPOStatusMap[mtrId] = {
          hasPO: true,
          poNumber: poNumber.trim(),
          uploadDate: new Date().toISOString(),
          fileName: poFile.name,
          approvalStatus: "PENDING",
          fileUrl : poFile.fileUrl
        }
      })
      setPOStatusMap(updatedPOStatusMap)

      setTimeout(() => {
        handleClose()
      }, 2000)
    } catch (error) {
      console.error("Error uploading PO:", error)
      showMessage("error", "Error uploading PO. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const resetModal = () => {
    setCurrentStep(1)
    setSelectedVendor("")
    setSelectedMTRs([])
    setMtrs([])
    setPOFile(null)
    setUploadedPOs([])
    setShowPODetails(false)
    setPONumber("")
  }

  const handleClose = () => {
    setShowModal(false)
    resetModal()
  }

  const handleOpenModal = () => {
    setShowModal(true)
    setShowTableView(false)
    resetModal()
  }

  const renderTableView = () => (
    <div className="container mx-auto p-4 bg-gray-50 min-h-screen">
      <div className="rounded-xl border border-gray-200 bg-white text-gray-900 shadow-lg">
        <div className="flex flex-col space-y-1.5 p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold leading-none tracking-tight text-blue-700">
                Purchase Order Management
              </h2>
              {/* <p className="text-sm text-gray-600">Manage PO uploads for approved MTRs</p> */}
            </div>
            <button
              onClick={handleOpenModal}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2"
            >
              Upload PO
            </button>
          </div>
        </div>
        <div className="p-6 pt-0">
          {tableLoading ? (
            <div className="text-center py-8 text-gray-600">Loading requisitions...</div>
          ) : requisitions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No approved material requisitions found.</div>
          ) : (
            <div className="relative w-full overflow-auto rounded-lg border border-gray-200 shadow-sm">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b bg-gray-100">
                  <tr className="border-b transition-colors hover:bg-gray-100">
                    <th className="h-12 px-4 text-left align-middle font-semibold text-gray-700">MTR Code</th>
                    <th className="h-12 px-4 text-left align-middle font-semibold text-gray-700">Project Name</th>
                    <th className="h-12 px-4 text-left align-middle font-semibold text-gray-700">Product Name</th>
                    <th className="h-12 px-4 text-left align-middle font-semibold text-gray-700">MTR Qty</th>
                    <th className="h-12 px-4 text-left align-middle font-semibold text-gray-700">Purchase MTR</th>
                    <th className="h-12 px-4 text-left align-middle font-semibold text-gray-700">Upload PO</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {requisitions.map((req) => (
                    <tr key={req.id} className="border-b transition-colors hover:bg-gray-50">
                      <td
                        className="p-4 align-middle text-gray-700 font-medium break-words overflow-hidden"
                        title={req.mtrCode}
                      >
                        {req.mtrCode || "N/A"}
                      </td>
                      <td
                        className="p-4 align-middle text-gray-700 break-words overflow-hidden"
                        title={req.projectName}
                      >
                        {req.projectName || "N/A"}
                      </td>
                      <td
                        className="p-4 align-middle text-gray-700 break-words overflow-hidden"
                        title={req.productName}
                      >
                        {req.productName || "N/A"}
                      </td>
                      <td className="p-4 align-middle text-gray-700">{req.mtrQty}</td>
                      <td className="p-4 align-middle text-gray-700">{req.purchaseMTR}</td>
                      <td className="p-4 align-middle">
                        {poStatusMap[req.id]?.hasPO ? (
                          <div className="space-y-1">
                            <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              PO Uploaded
                            </div>
                            <div className="text-xs text-gray-600">PO: {poStatusMap[req.id]?.poNumber}</div>
                            {poStatusMap[req.id]?.fileName && (
                              <div className="text-xs text-indigo-600 hover:text-gray-500"><a href={poStatusMap[req.id]?.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{poStatusMap[req.id].poNumber}</a></div>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={handleOpenModal}
                            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-green-100 text-green-700 hover:bg-green-200 h-9 px-3 py-1"
                            title="Upload PO for this MTR"
                          >
                            Upload PO
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  if (!showModal && showTableView) {
    return renderTableView()
  }

  if (!showModal) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 flex flex-col" style={{ height: "90vh" }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Upload Purchase Order</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

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
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              <span className="text-sm font-medium">{message.text}</span>
            </div>
          </div>
        )}

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${currentStep >= 1 ? "text-blue-600" : "text-gray-400"}`}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= 1 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
                }`}
              >
                1
              </div>
              <span className="font-medium">Select Vendor</span>
            </div>
            <div className={`flex items-center space-x-2 ${currentStep >= 2 ? "text-blue-600" : "text-gray-400"}`}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= 2 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
                }`}
              >
                2
              </div>
              <span className="font-medium">Select MTRs</span>
            </div>
            <div className={`flex items-center space-x-2 ${currentStep >= 3 ? "text-blue-600" : "text-gray-400"}`}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= 3 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
                }`}
              >
                3
              </div>
              <span className="font-medium">Upload PO</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto p-6">
            {/* Step 1: Select Vendor */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Step 1: Select Vendor</h3>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Choose Vendor</label>
                  <VendorDropdownPOUpload
                    value={selectedVendor}
                    onChange={handleVendorSelect}
                    placeholder="Search and select vendor..."
                  />
                </div>
              </div>
            )}

            {/* Step 2: Select MTRs */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Step 2: Select MTRs</h3>
                  <button
                    onClick={handleBackToVendorSelection}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    ← Back to Vendor Selection
                  </button>
                </div>

                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-sm text-blue-800">
                    Selected Vendor: <span className="font-medium">{selectedVendor}</span>
                  </p>
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="text-gray-500">Loading MTRs...</div>
                  </div>
                ) : mtrs.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-500">No MTRs found for this vendor</div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        {selectedMTRs.length} of {mtrs.length} MTRs selected
                      </div>
                      <button
                        onClick={handleSelectAllMTRs}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        {selectedMTRs.length === mtrs.length ? "Deselect All" : "Select All"}
                      </button>
                    </div>

                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
                          <div className="col-span-1">Select</div>
                          <div className="col-span-2">MTR ID</div>
                          <div className="col-span-3">Project Name</div>
                          <div className="col-span-2">Quantity</div>
                          <div className="col-span-2">Status</div>
                          <div className="col-span-2">Created Date</div>
                        </div>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {mtrs.map((mtr) => (
                          <div key={mtr.id} className="px-4 py-3 border-b border-gray-100 hover:bg-gray-50">
                            <div className="grid grid-cols-12 gap-4 items-center text-sm">
                              <div className="col-span-1">
                                <input
                                  type="checkbox"
                                  checked={selectedMTRs.includes(mtr.id)}
                                  onChange={() => handleMTRToggle(mtr.id)}
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                              </div>
                              <div
                                className="col-span-2 font-medium break-words overflow-hidden text-ellipsis"
                                title={mtr.id}
                              >
                                {mtr.id}
                              </div>
                              <div
                                className="col-span-3 break-words overflow-hidden"
                                title={mtr.projectName || mtr.description}
                              >
                                {mtr.projectName || mtr.description || "N/A"}
                              </div>
                              <div className="col-span-2">{mtr.quantity || "N/A"}</div>
                              <div className="col-span-2">
                                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                  {mtr.pmApprovalStatus || mtr.status || "Pending"}
                                </span>
                              </div>
                              <div className="col-span-2">
                                {mtr.createdAt ? new Date(mtr.createdAt).toLocaleDateString() : "N/A"}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={() => setCurrentStep(3)}
                        disabled={selectedMTRs.length === 0}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        Continue to Upload ({selectedMTRs.length} MTRs)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Upload PO */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Step 3: Upload PO</h3>
                  <button
                    onClick={handleBackToMTRSelection}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    ← Back to MTR Selection
                  </button>
                </div>

                <div className="bg-blue-50 p-4 rounded-md space-y-2">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Vendor:</span> {selectedVendor}
                  </p>
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Selected MTRs:</span> {selectedMTRs.length} items
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      PO Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={poNumber}
                      onChange={(e) => setPONumber(e.target.value)}
                      placeholder="Enter Purchase Order Number"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Purchase Order File <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx"
                      onChange={handleFileSelect}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {poFile && <p className="mt-2 text-sm text-green-600">Selected: {poFile.name}</p>}
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={resetModal}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUploadPO}
                      disabled={!poFile || selectedMTRs.length === 0 || !poNumber.trim() || uploading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {uploading ? "Uploading..." : "Upload PO"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default POUploadWithVendorSelection
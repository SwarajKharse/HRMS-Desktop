"use client"

import { useState, useEffect } from "react"
import { FiX, FiUpload, FiCheck, FiAlertCircle } from "react-icons/fi"
import { purchaseOrderService } from "../../../services/purchaseOrderService"

const POUploadModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Step 1: Vendor Selection
  const [vendors, setVendors] = useState([])
  const [selectedVendor, setSelectedVendor] = useState("")

  // Step 2: MTR Selection
  const [vendorMTRs, setVendorMTRs] = useState([])
  const [selectedMTRs, setSelectedMTRs] = useState([])

  // Step 3: PO Upload Details
  const [poNumber, setPONumber] = useState("")
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadedPODetails, setUploadedPODetails] = useState(null)

  useEffect(() => {
    if (isOpen) {
      fetchVendors()
      resetForm()
    }
  }, [isOpen])

  const resetForm = () => {
    setStep(1)
    setSelectedVendor("")
    setVendorMTRs([])
    setSelectedMTRs([])
    setPONumber("")
    setSelectedFile(null)
    setUploadedPODetails(null)
    setError("")
    setSuccess("")
  }

  const fetchVendors = async () => {
    try {
      setLoading(true)
      const vendorList = await purchaseOrderService.getAllVendors()
      setVendors(vendorList)
    } catch (err) {
      setError("Failed to fetch vendors")
    } finally {
      setLoading(false)
    }
  }

  const fetchMTRsByVendor = async (vendorName) => {
    try {
      setLoading(true)
      const mtrs = await purchaseOrderService.getMTRsByVendor(vendorName)
      setVendorMTRs(mtrs)
      setSelectedMTRs(mtrs.map((mtr) => mtr.id))
    } catch (err) {
      setError("Failed to fetch MTRs for selected vendor")
      setVendorMTRs([])
      setSelectedMTRs([])
    } finally {
      setLoading(false)
    }
  }

  const handleVendorNext = async () => {
    if (!selectedVendor.trim()) {
      setError("Please select a vendor")
      return
    }

    setError("")
    await fetchMTRsByVendor(selectedVendor)
    setStep(2)
  }

  const handleMTRSelectionNext = () => {
    if (selectedMTRs.length === 0) {
      setError("Please select at least one MTR")
      return
    }
    setError("")
    setStep(3)
  }

  const handleMTRSelection = (mtrId, isSelected) => {
    if (isSelected) {
      setSelectedMTRs([...selectedMTRs, mtrId])
    } else {
      setSelectedMTRs(selectedMTRs.filter((id) => id !== mtrId))
    }
  }

  const handleSelectAllMTRs = (selectAll) => {
    if (selectAll) {
      setSelectedMTRs(vendorMTRs.map((mtr) => mtr.id))
    } else {
      setSelectedMTRs([])
    }
  }

  const handleFileUpload = async () => {
    if (!poNumber.trim()) {
      setError("Please enter PO number")
      return
    }

    if (!selectedFile) {
      setError("Please select a file")
      return
    }

    try {
      setLoading(true)
      setError("")

      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("vendorName", selectedVendor)
      formData.append("poNumber", poNumber)

      selectedMTRs.forEach((id) => formData.append("mtrIds", id))

      // Add current user ID if available
      const currentUserId = 1 // Replace with actual current user ID
      formData.append("uploadedBy", currentUserId)

      const result = await purchaseOrderService.uploadPurchaseOrder(formData)

      if (result.success) {
        setUploadedPODetails({
          poNumber: poNumber,
          vendorName: selectedVendor,
          fileName: selectedFile.name,
          mtrCount: selectedMTRs.length,
          uploadedAt: new Date().toLocaleString(),
        })
        setSuccess("Purchase Order uploaded successfully for all selected MTRs!")
        setTimeout(() => {
          onClose()
        }, 3000)
      } else {
        setError(result.message || "Failed to upload PO")
      }
    } catch (err) {
      setError("Failed to upload Purchase Order")
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type (optional)
      const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"]
      if (!allowedTypes.includes(file.type)) {
        setError("Please select a PDF or image file")
        return
      }

      // Validate file size (optional - 10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setError("File size should be less than 10MB")
        return
      }

      setSelectedFile(file)
      setError("")
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-blue-700">Upload Purchase Order</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <FiX className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${step >= 1 ? "text-blue-600" : "text-gray-400"}`}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? "bg-blue-600 text-white" : "bg-gray-300"}`}
              >
                1
              </div>
              <span className="ml-2 text-sm font-medium">Select Vendor</span>
            </div>
            <div className={`flex items-center ${step >= 2 ? "text-blue-600" : "text-gray-400"}`}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? "bg-blue-600 text-white" : "bg-gray-300"}`}
              >
                2
              </div>
              <span className="ml-2 text-sm font-medium">Select MTRs</span>
            </div>
            <div className={`flex items-center ${step >= 3 ? "text-blue-600" : "text-gray-400"}`}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? "bg-blue-600 text-white" : "bg-gray-300"}`}
              >
                3
              </div>
              <span className="ml-2 text-sm font-medium">Upload PO</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <FiAlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center">
              <FiCheck className="w-5 h-5 text-green-500 mr-2" />
              <span className="text-green-700 text-sm">{success}</span>
            </div>
          )}

          {/* Step 1: Vendor Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-800">Select Vendor</h4>
              <div className="space-y-3">
                <select
                  value={selectedVendor}
                  onChange={(e) => setSelectedVendor(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a vendor...</option>
                  {vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.vendorName}>
                      {vendor.vendorName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 2: MTR Selection */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gray-800">MTRs for {selectedVendor}</h4>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleSelectAllMTRs(true)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => handleSelectAllMTRs(false)}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {vendorMTRs.length > 0 ? (
                <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                  <div className="p-3 bg-gray-50 border-b text-sm font-medium text-gray-700">
                    Found {vendorMTRs.length} MTR(s) assigned to this vendor
                  </div>
                  {vendorMTRs.map((mtr) => (
                    <label key={mtr.id} className="flex items-center p-4 hover:bg-gray-50 border-b border-gray-100">
                      <input
                        type="checkbox"
                        checked={selectedMTRs.includes(mtr.id)}
                        onChange={(e) => handleMTRSelection(mtr.id, e.target.checked)}
                        className="mr-3 w-4 h-4 text-blue-600"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{mtr.itemName || mtr.description}</div>
                        <div className="text-xs text-gray-500">
                          MTR Code: {mtr.mtrCode} | Project: {mtr.projectName}
                        </div>
                        <div className="text-xs text-gray-500">
                          Qty: {mtr.mtrQty} | Priority: {mtr.priority} | Status: {mtr.status}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">No MTRs found for the selected vendor</div>
              )}
            </div>
          )}

          {/* Step 3: Upload Details */}
          {step === 3 && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-800">Upload Purchase Order</h4>

              {/* Selected MTRs Summary */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h5 className="text-sm font-semibold text-blue-800 mb-2">
                  Uploading PO for {selectedMTRs.length} MTR(s) from {selectedVendor}
                </h5>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">PO Number *</label>
                <input
                  type="text"
                  placeholder="Enter PO number"
                  value={poNumber}
                  onChange={(e) => setPONumber(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload File *</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <FiUpload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      {selectedFile ? selectedFile.name : "Click to upload or drag and drop"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG up to 10MB</p>
                  </label>
                </div>
              </div>

              {uploadedPODetails && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h5 className="text-sm font-semibold text-green-800 mb-2">Upload Details:</h5>
                  <div className="text-sm text-green-700 space-y-1">
                    <div>PO Number: {uploadedPODetails.poNumber}</div>
                    <div>Vendor: {uploadedPODetails.vendorName}</div>
                    <div>File: {uploadedPODetails.fileName}</div>
                    <div>MTRs Count: {uploadedPODetails.mtrCount}</div>
                    <div>Uploaded At: {uploadedPODetails.uploadedAt}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <button
            onClick={() => (step > 1 ? setStep(step - 1) : onClose())}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            disabled={loading}
          >
            {step > 1 ? "Back" : "Cancel"}
          </button>

          <button
            onClick={() => {
              if (step === 1) handleVendorNext()
              else if (step === 2) handleMTRSelectionNext()
              else if (step === 3) handleFileUpload()
            }}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            )}
            {step === 3 ? "Upload" : "Next"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default POUploadModal
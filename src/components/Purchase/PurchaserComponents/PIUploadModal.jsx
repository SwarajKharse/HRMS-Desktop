"use client"
import { useState } from "react"
import { FiX, FiUpload, FiFile } from "react-icons/fi"
import { motion } from "framer-motion"
import { purchaseInvoiceService } from "../../../services/purchaseInvoiceService"
import { useAuth } from "../../../contexts/AuthContext"

export default function PIUploadModal({ mtr, purchaseOrder, onClose, onSuccess }) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    piNumber: "",
    payableAmount: "",
    expectedPaymentDate: "",
    remarks: "",
  })
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      // Validate file type (PDF only)
      if (selectedFile.type !== "application/pdf") {
        setError("Only PDF files are allowed")
        return
      }
      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB")
        return
      }
      setFile(selectedFile)
      setError("")
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    // Validation
    if (!formData.piNumber.trim()) {
      setError("PI Number is required")
      return
    }
    if (!formData.payableAmount || Number.parseFloat(formData.payableAmount) <= 0) {
      setError("Valid Payable Amount is required")
      return
    }
    if (!formData.expectedPaymentDate) {
      setError("Expected Payment Date is required")
      return
    }
    if (!file) {
      setError("Please select a PI document to upload")
      return
    }

    setLoading(true)

    try {
      const piData = {
        piNumber: formData.piNumber.trim(),
        payableAmount: Number.parseFloat(formData.payableAmount),
        expectedPaymentDate: formData.expectedPaymentDate,
        projectName: mtr.projectName,
        remarks: formData.remarks.trim(),
        poId: purchaseOrder.id,
        mtrId: mtr.id,
        uploadedBy: user?.userId || user?.id,
      }

      await purchaseInvoiceService.uploadPurchaseInvoice(piData, file)

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Error uploading Purchase Invoice:", error)
      setError(error.response?.data?.message || "Failed to upload Purchase Invoice. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b bg-blue-50">
          <h3 className="text-lg font-bold text-blue-700">Upload Purchase Invoice</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-blue-100">
            <FiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {error && <div className="mx-4 mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}

        <form onSubmit={handleSubmit} className="p-6 overflow-auto flex-1">
          <div className="space-y-4">
            {/* MTR and PO Info */}
            <div className="p-4 bg-gray-50 rounded-lg border">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Associated Details</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">MTR Code:</p>
                  <p className="font-semibold text-gray-800">{mtr.mtrCode}</p>
                </div>
                <div>
                  <p className="text-gray-600">Project Name:</p>
                  <p className="font-semibold text-gray-800">{mtr.projectName}</p>
                </div>
                <div>
                  <p className="text-gray-600">PO Number:</p>
                  <p className="font-semibold text-blue-600">{purchaseOrder.poNumber}</p>
                </div>
                <div>
                  <p className="text-gray-600">Product:</p>
                  <p className="font-semibold text-gray-800">{mtr.productName}</p>
                </div>
              </div>
            </div>

            {/* PI Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PI Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="piNumber"
                value={formData.piNumber}
                onChange={handleInputChange}
                placeholder="Enter Purchase Invoice Number"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
                required
              />
            </div>

            {/* Payable Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payable Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="payableAmount"
                value={formData.payableAmount}
                onChange={handleInputChange}
                placeholder="Enter payable amount"
                step="0.01"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
                required
              />
            </div>

            {/* Expected Payment Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expected Payment Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="expectedPaymentDate"
                value={formData.expectedPaymentDate}
                onChange={handleInputChange}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
                required
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upload PI Document (PDF only) <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                <label className="flex-1 flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                  <div className="text-center">
                    <FiFile className="mx-auto h-8 w-8 text-gray-400" />
                    <span className="mt-2 block text-sm font-medium text-gray-600">
                      {file ? file.name : "Click to select PI document"}
                    </span>
                    <span className="mt-1 block text-xs text-gray-500">PDF, max 10MB</span>
                  </div>
                  <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" disabled={loading} />
                </label>
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                placeholder="Enter any additional remarks or notes"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>
          </div>
        </form>

        <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <FiUpload size={16} />
            {loading ? "Uploading..." : "Upload PI"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
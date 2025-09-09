"use client"
import { useState, useEffect } from "react"
import { FiX, FiUpload, FiDownload, FiTrash2 } from "react-icons/fi"
import { motion } from "framer-motion"
import { purchaseOrderService } from "../../../services/purchaseOrderService"
import POUploadModal from "./POUploadModal"

// Helper function to format dates for display
const formatDate = (dateString) => {
  if (!dateString) return "N/A"
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}

export default function MTRDetailsModal({ mtr, onClose }) {
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [showPOUploadModal, setShowPOUploadModal] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (mtr && mtr.id) {
      fetchPurchaseOrders()
    }
  }, [mtr])

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true)
      const pos = await purchaseOrderService.getPurchaseOrdersByMTR(mtr.id)
      setPurchaseOrders(pos)
    } catch (err) {
      console.error("Failed to fetch purchase orders:", err)
      setError("Failed to load purchase orders")
    } finally {
      setLoading(false)
    }
  }

  const handleRemovePO = async (poId) => {
    if (!window.confirm("Are you sure you want to remove this PO from this MTR?")) {
      return
    }

    try {
      setLoading(true)
      await purchaseOrderService.removePOFromMTR(mtr.id, poId)
      await fetchPurchaseOrders() // Refresh the list
    } catch (err) {
      console.error("Failed to remove PO:", err)
      setError("Failed to remove purchase order")
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPO = (filePath, fileName) => {
    // Create a download link - you may need to adjust this based on your file serving setup
    const downloadUrl = `${process.env.REACT_APP_API_URL}/files/${filePath}`
    const link = document.createElement("a")
    link.href = downloadUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePOUploadComplete = () => {
    setShowPOUploadModal(false)
    fetchPurchaseOrders() // Refresh the PO list
  }

  if (!mtr) return null

  return (
    <>
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
          className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-bold text-blue-700">Material Requisition Details</h3>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
              <FiX className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="flex-1 overflow-auto">
            <div className="p-6">
              {/* MTR Basic Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">MTR Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-600">MTR Code:</p>
                      <p className="font-semibold">{mtr.mtrCode || "N/A"}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-600">Product Name:</p>
                      <p className="font-semibold">{mtr.productName || "N/A"}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-600">Project Name:</p>
                      <p className="font-semibold">{mtr.projectName || "N/A"}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-600">Status:</p>
                      <p className="font-semibold">{mtr.status}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">Quantities</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-600">MTR Qty:</p>
                      <p className="font-semibold">{mtr.mtrQty}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-600">Stock Allotted:</p>
                      <p className="font-semibold">{mtr.stockAlloted}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-600">Purchase MTR:</p>
                      <p className="font-semibold">{mtr.purchaseMTR}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-600">DC Qty:</p>
                      <p className="font-semibold">{mtr.dcQty}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Purchase Orders Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-gray-800">Purchase Orders</h4>
                  <button
                    onClick={() => setShowPOUploadModal(true)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <FiUpload className="w-4 h-4 mr-2" />
                    Upload PO
                  </button>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-600 mt-2">Loading purchase orders...</p>
                  </div>
                ) : purchaseOrders.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <FiUpload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-2">No purchase orders uploaded yet</p>
                    <p className="text-gray-500 text-sm">Click "Upload PO" to add purchase orders for this MTR</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {purchaseOrders.map((po) => (
                      <div
                        key={po.id}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-4">
                              <div>
                                <p className="font-semibold text-gray-800">{po.poNumber}</p>
                                <p className="text-sm text-gray-600">Vendor: {po.vendorName}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">File: {po.fileName}</p>
                                <p className="text-xs text-gray-500">
                                  Uploaded: {formatDate(po.createdAt)}
                                  {po.uploadedByName && ` by ${po.uploadedByName}`}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleDownloadPO(po.filePath, po.fileName)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Download PO"
                            >
                              <FiDownload className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRemovePO(po.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove PO from this MTR"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Additional MTR Details */}
              <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">Dates & Priority</h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium text-gray-600">MTR Date:</p>
                      <p>{formatDate(mtr.mtrDate)}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-600">Expected Delivery:</p>
                      <p>{formatDate(mtr.expectedDeliveryDate)}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-600">Priority:</p>
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          mtr.priority === "HIGH"
                            ? "bg-red-100 text-red-800"
                            : mtr.priority === "MEDIUM"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                        }`}
                      >
                        {mtr.priority}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">Additional Info</h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium text-gray-600">Remarks:</p>
                      <p className="break-words">{mtr.remarks || "N/A"}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-600">Created At:</p>
                      <p>{formatDate(mtr.createdAt)}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-600">Last Updated:</p>
                      <p>{formatDate(mtr.updatedAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end p-4 border-t bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>

      {/* PO Upload Modal */}
      {showPOUploadModal && (
        <POUploadModal isOpen={showPOUploadModal} onClose={handlePOUploadComplete} selectedMTRs={[mtr]} />
      )}
    </>
  )
}
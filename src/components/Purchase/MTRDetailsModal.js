"use client"
import { useState, useEffect } from "react"
import { FiX, FiSave, FiCheck, FiXCircle } from "react-icons/fi"
import { motion } from "framer-motion"
import { comparisonSheetService } from "../../services/comparisonSheetService"

// Helper function to format dates for display
const formatDate = (dateString) => {
  if (!dateString) return "N/A"
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}

export default function MTRDetailsModal({ mtr, onClose, onSave }) {
  const [purchasers, setPurchasers] = useState([])
  const [selectedPurchaser, setSelectedPurchaser] = useState(mtr?.assignedPurchaser || "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [mtrData, setMtrData] = useState(mtr)
  const [mtrLoading, setMtrLoading] = useState(false)
  const [selectedVendorDetails, setSelectedVendorDetails] = useState(null)

  const [pmApprovalStatus, setPmApprovalStatus] = useState(mtr?.pmApprovalStatus || "PENDING")
  const [pmApprovalRemarks, setPmApprovalRemarks] = useState(mtr?.pmApprovalRemarks || "")
  const [pmApprovalLoading, setPmApprovalLoading] = useState(false)

  useEffect(() => {
    const loadPurchasers = async () => {
      try {
        const purchaserList = await comparisonSheetService.getPurchasers()
        setPurchasers(purchaserList)
      } catch (error) {
        console.error("Error fetching purchasers:", error)
      }
    }

    loadPurchasers()
    fetchMTRData()
  }, [])

  const fetchMTRData = async () => {
    if (!mtr?.id) return

    setMtrLoading(true)
    try {
      const mtrWithComparisonSheet = await comparisonSheetService.getMaterialRequisitionById(mtr.id)
      setMtrData(mtrWithComparisonSheet)

      if (mtrWithComparisonSheet.selectedVendor && mtrWithComparisonSheet.comparisonSheetId) {
        await fetchSelectedVendorDetails(
          mtrWithComparisonSheet.comparisonSheetId,
          mtrWithComparisonSheet.selectedVendor,
        )
      }
    } catch (error) {
      console.error("Error fetching MTR data:", error)
    } finally {
      setMtrLoading(false)
    }
  }

  const fetchSelectedVendorDetails = async (comparisonSheetId, selectedVendorName) => {
    try {
      const comparisonSheetData = await comparisonSheetService.getComparisonSheet(mtr.id)
      if (comparisonSheetData && comparisonSheetData.length > 0) {
        const latestComparisonSheet = comparisonSheetData[comparisonSheetData.length - 1]
        if (latestComparisonSheet.comparisonItems) {
          const vendorDetails = latestComparisonSheet.comparisonItems.find(
            (item) => item.vendorName === selectedVendorName,
          )
          if (vendorDetails) {
            setSelectedVendorDetails(vendorDetails)
          }
        }
      }
    } catch (error) {
      console.error("Error fetching selected vendor details:", error)
    }
  }

  const handleSaveAssignedPurchaser = async () => {
    if (!selectedPurchaser) {
      setError("Please select a purchaser")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      await comparisonSheetService.assignPurchaser(mtrData.id, Number.parseInt(selectedPurchaser))
      setSuccess("Purchaser assigned successfully!")

      // Call parent onSave if provided
      if (onSave) {
        onSave({ ...mtrData, assignedPurchaser: Number.parseInt(selectedPurchaser) })
      }
    } catch (error) {
      console.error("Error assigning purchaser:", error)
      setError("Failed to assign purchaser. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSavePMApproval = async () => {
    if (!pmApprovalStatus || pmApprovalStatus === "PENDING") {
      setError("Please select an approval status")
      return
    }

    setPmApprovalLoading(true)
    setError("")
    setSuccess("")

    try {
      await comparisonSheetService.updatePMApprovalStatus(mtrData.id, pmApprovalStatus, pmApprovalRemarks)
      setSuccess("PM approval status updated successfully!")

      // Call parent onSave if provided
      if (onSave) {
        onSave({
          ...mtrData,
          pmApprovalStatus,
          pmApprovalRemarks,
          pmApprovalDate: new Date().toISOString(),
        })
      }
    } catch (error) {
      console.error("Error updating PM approval:", error)
      setError("Failed to update PM approval status. Please try again.")
    } finally {
      setPmApprovalLoading(false)
    }
  }

  if (!mtrData) return null

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
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-bold text-blue-700">Material Requisition Details</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <FiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {error && <div className="mx-4 mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}
        {success && (
          <div className="mx-4 mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">{success}</div>
        )}

        <div className="p-6 overflow-auto flex-1 text-gray-800">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <p className="text-sm font-medium text-gray-600">MTR Code:</p>
              <p className="font-semibold">{mtrData.mtrCode || "N/A"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm font-medium text-gray-600">Product Name:</p>
              <p className="font-semibold">{mtrData.productName || "N/A"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm font-medium text-gray-600">Project Name:</p>
              <p className="font-semibold">{mtrData.projectName || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">MTR Qty:</p>
              <p>{mtrData.mtrQty}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Stock Allotted:</p>
              <p>{mtrData.stockAlloted}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Purchase MTR:</p>
              <p>{mtrData.purchaseMTR}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">DC Qty:</p>
              <p>{mtrData.dcQty}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">MTR Date:</p>
              <p>{formatDate(mtrData.mtrDate)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Expected Delivery:</p>
              <p>{formatDate(mtrData.expectedDeliveryDate)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Priority:</p>
              <p>{mtrData.priority}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm font-medium text-gray-600">Status:</p>
              <p>{mtrData.status}</p>
            </div>

            <div className="col-span-2 mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-md font-semibold text-blue-800 mb-3">Assign Purchaser</h4>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="text-sm font-medium text-blue-700 block mb-1">Select Purchaser:</label>
                  <select
                    value={selectedPurchaser}
                    onChange={(e) => setSelectedPurchaser(e.target.value)}
                    className="w-full h-10 rounded-md border border-blue-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  >
                    <option value="">-- Select Purchaser --</option>
                    {purchasers.map((purchaser) => (
                      <option key={purchaser.id} value={purchaser.id}>
                        {purchaser.firstName} {purchaser.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleSaveAssignedPurchaser}
                  disabled={loading || !selectedPurchaser}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed h-10 px-4 py-2 gap-2"
                >
                  <FiSave size={16} />
                  {loading ? "Saving..." : "Save"}
                </button>
              </div>
            </div>

            {mtrData.selectedVendor && (
              <div className="col-span-2 mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-md font-semibold text-gray-800 mb-3">Selected Vendor & PM Approval</h4>

                <div className="mb-4 p-3 bg-white rounded border">
                  <p className="text-sm font-medium text-gray-700 mb-2">Selected Vendor Details:</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <p className="text-xs font-medium text-gray-600">Vendor Name:</p>
                      <p className="font-semibold text-blue-600">{mtrData.selectedVendor}</p>
                    </div>
                    {selectedVendorDetails && (
                      <>
                        <div>
                          <p className="text-xs font-medium text-gray-600">Rate:</p>
                          <p className="font-semibold text-green-600">₹{selectedVendorDetails.rate}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-600">Value:</p>
                          <p className="font-semibold text-green-600">₹{selectedVendorDetails.value}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-600">Lead Time:</p>
                          <p className="font-semibold text-orange-600">{selectedVendorDetails.leadTime || "N/A"}</p>
                        </div>
                      </>
                    )}
                  </div>
                  {!selectedVendorDetails && mtrLoading && (
                    <p className="text-sm text-gray-500 mt-2">Loading vendor details...</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Current Approval Status:</p>
                    <div className="flex items-center gap-2">
                      {mtrData.pmApprovalStatus === "APPROVED" && <FiCheck className="text-green-600" />}
                      {mtrData.pmApprovalStatus === "REJECTED" && <FiXCircle className="text-red-600" />}
                      <span
                        className={`font-semibold ${
                          mtrData.pmApprovalStatus === "APPROVED"
                            ? "text-green-600"
                            : mtrData.pmApprovalStatus === "REJECTED"
                              ? "text-red-600"
                              : "text-yellow-600"
                        }`}
                      >
                        {mtrData.pmApprovalStatus || "PENDING"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Approval Date:</p>
                    <p>{formatDate(mtrData.pmApprovalDate)}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Update Approval Status:</label>
                    <select
                      value={pmApprovalStatus}
                      onChange={(e) => setPmApprovalStatus(e.target.value)}
                      className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={pmApprovalLoading}
                    >
                      <option value="PENDING">Pending</option>
                      <option value="APPROVED">Approved</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Remarks:</label>
                    <textarea
                      value={pmApprovalRemarks}
                      onChange={(e) => setPmApprovalRemarks(e.target.value)}
                      placeholder="Enter approval remarks for selected vendor..."
                      rows={3}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={pmApprovalLoading}
                    />
                  </div>

                  <button
                    onClick={handleSavePMApproval}
                    disabled={pmApprovalLoading || pmApprovalStatus === "PENDING"}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed h-10 px-4 py-2 gap-2"
                  >
                    <FiSave size={16} />
                    {pmApprovalLoading ? "Saving..." : "Update Vendor Approval"}
                  </button>
                </div>

                {mtrData.pmApprovalRemarks && (
                  <div className="mt-3 p-3 bg-white rounded border">
                    <p className="text-sm font-medium text-gray-700">Previous Remarks:</p>
                    <p className="text-sm text-gray-700">{mtrData.pmApprovalRemarks}</p>
                  </div>
                )}
              </div>
            )}

            <div className="col-span-2">
              <p className="text-sm font-medium text-gray-600">Remarks:</p>
              <p className="break-words">{mtrData.remarks || "N/A"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm font-medium text-gray-600">Created At:</p>
              <p>{formatDate(mtrData.createdAt)}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm font-medium text-gray-600">Last Updated:</p>
              <p>{formatDate(mtrData.updatedAt)}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end p-4 border-t bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

"use client"
import { useState, useEffect } from "react"
import { FiX, FiSave } from "react-icons/fi"
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

  useEffect(() => {
    fetchPurchasers()
  }, [])

  const fetchPurchasers = async () => {
    try {
      const purchasersList = await comparisonSheetService.getPurchasers()
      setPurchasers(purchasersList)
    } catch (error) {
      console.error("Error fetching purchasers:", error)
      setError("Failed to load purchasers")
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
      await comparisonSheetService.assignPurchaser(mtr.id, Number.parseInt(selectedPurchaser))
      setSuccess("Purchaser assigned successfully!")

      // Call parent onSave if provided
      if (onSave) {
        onSave({ ...mtr, assignedPurchaser: Number.parseInt(selectedPurchaser) })
      }
    } catch (error) {
      console.error("Error assigning purchaser:", error)
      setError("Failed to assign purchaser. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!mtr) return null

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
              <p className="font-semibold">{mtr.mtrCode || "N/A"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm font-medium text-gray-600">Product Name:</p>
              <p className="font-semibold">{mtr.productName || "N/A"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm font-medium text-gray-600">Project Name:</p>
              <p className="font-semibold">{mtr.projectName || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">MTR Qty:</p>
              <p>{mtr.mtrQty}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Stock Allotted:</p>
              <p>{mtr.stockAlloted}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Purchase MTR:</p>
              <p>{mtr.purchaseMTR}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">DC Qty:</p>
              <p>{mtr.dcQty}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">MTR Date:</p>
              <p>{formatDate(mtr.mtrDate)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Expected Delivery:</p>
              <p>{formatDate(mtr.expectedDeliveryDate)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Priority:</p>
              <p>{mtr.priority}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm font-medium text-gray-600">Status:</p>
              <p>{mtr.status}</p>
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

            <div className="col-span-2">
              <p className="text-sm font-medium text-gray-600">Remarks:</p>
              <p className="break-words">{mtr.remarks || "N/A"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm font-medium text-gray-600">Created At:</p>
              <p>{formatDate(mtr.createdAt)}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm font-medium text-gray-600">Last Updated:</p>
              <p>{formatDate(mtr.updatedAt)}</p>
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

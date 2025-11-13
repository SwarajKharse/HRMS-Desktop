"use client"
import { useState, useEffect } from "react"
import { FiX, FiPlus, FiEdit2, FiTrash2, FiAlertCircle } from "react-icons/fi"
import { motion } from "framer-motion"
import { materialRequisitionService } from "../../services/materialRequisitionService"

const formatDate = (dateString) => {
  if (!dateString) return "N/A"
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}

export default function StoreManagerMTRDetailsModal({ mtr, onClose, currentUserId }) {
  const [dcQtyList, setDcQtyList] = useState([])
  const [showAddDCQty, setShowAddDCQty] = useState(false)
  const [editingDCQty, setEditingDCQty] = useState(null)
  const [dcQtyForm, setDcQtyForm] = useState({
    dcQty: "",
    dcDate: "",
    remarks: "",
  })
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  useEffect(() => {
    if (mtr?.id) {
      fetchDCQtyList()
    }
  }, [mtr?.id])

  const fetchDCQtyList = async () => {
    try {
      const data = await materialRequisitionService.getDCQtyByMtrId(mtr.id)
      setDcQtyList(data)
    } catch (error) {
      console.error("Failed to fetch DC Qty list:", error)
      setErrorMessage("Failed to fetch DC Qty list")
    }
  }

  const handleAddDCQty = () => {
    setShowAddDCQty(true)
    setEditingDCQty(null)
    setDcQtyForm({ dcQty: "", dcDate: "", remarks: "" })
    setErrorMessage("")
  }

  const handleEditDCQty = (dcQty) => {
    setEditingDCQty(dcQty)
    setShowAddDCQty(true)
    setDcQtyForm({
      dcQty: dcQty.dcQty || "",
      dcDate: dcQty.dcDate || "",
      remarks: dcQty.remarks || "",
    })
    setErrorMessage("")
  }

  const handleSaveDCQty = async () => {
    if (!dcQtyForm.dcQty || !dcQtyForm.dcDate) {
      setErrorMessage("Please fill in DC Qty and DC Date")
      return
    }

    setLoading(true)
    setErrorMessage("")
    try {
      if (editingDCQty) {
        await materialRequisitionService.updateDCQty(editingDCQty.id, dcQtyForm, currentUserId)
      } else {
        await materialRequisitionService.addDCQty(mtr.id, dcQtyForm, currentUserId)
      }
      await fetchDCQtyList()
      setShowAddDCQty(false)
      setDcQtyForm({ dcQty: "", dcDate: "", remarks: "" })
      setEditingDCQty(null)
    } catch (error) {
      console.error("Failed to save DC Qty:", error)
      setErrorMessage("Failed to save DC Qty")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDCQty = async (dcQtyId) => {
    if (deleteConfirm !== dcQtyId) {
      setDeleteConfirm(dcQtyId)
      return
    }

    setErrorMessage("")
    try {
      await materialRequisitionService.deleteDCQty(dcQtyId)
      await fetchDCQtyList()
      setDeleteConfirm(null)
    } catch (error) {
      console.error("Failed to delete DC Qty:", error)
      setErrorMessage("Failed to delete DC Qty")
    }
  }

  const totalDCQty = dcQtyList.reduce((sum, item) => sum + (item.dcQty || 0), 0)

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
        className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-bold text-blue-700">Material Requisition Details</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <FiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-auto flex-1 text-gray-800">
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
              <FiAlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMessage}</span>
              <button onClick={() => setErrorMessage("")} className="ml-auto text-red-500 hover:text-red-700">
                <FiX className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-6">
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
            <div className="col-span-2">
              <p className="text-sm font-medium text-gray-600">Remarks:</p>
              <p className="break-words">{mtr.remarks || "N/A"}</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-md font-bold text-gray-800">DC Quantities</h4>
                <p className="text-sm text-gray-600">Total: {totalDCQty}</p>
              </div>
              <button
                onClick={handleAddDCQty}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <FiPlus className="w-4 h-4" />
                Add DC Qty
              </button>
            </div>

            {showAddDCQty && (
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h5 className="font-semibold mb-3 text-gray-800">{editingDCQty ? "Edit DC Qty" : "Add New DC Qty"}</h5>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">DC Qty *</label>
                    <input
                      type="number"
                      value={dcQtyForm.dcQty}
                      onChange={(e) => setDcQtyForm({ ...dcQtyForm, dcQty: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter quantity"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">DC Date *</label>
                    <input
                      type="date"
                      value={dcQtyForm.dcDate}
                      onChange={(e) => setDcQtyForm({ ...dcQtyForm, dcDate: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                    <textarea
                      value={dcQtyForm.remarks}
                      onChange={(e) => setDcQtyForm({ ...dcQtyForm, remarks: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                      rows="2"
                      placeholder="Enter remarks"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleSaveDCQty}
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
                  >
                    {loading ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddDCQty(false)
                      setEditingDCQty(null)
                      setDcQtyForm({ dcQty: "", dcDate: "", remarks: "" })
                      setErrorMessage("")
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {dcQtyList.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No DC Quantities added yet</p>
              ) : (
                dcQtyList.map((dcQty) => (
                  <div key={dcQty.id} className="bg-white border rounded-lg p-3 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-1">
                        <span className="font-semibold text-lg text-blue-600">{dcQty.dcQty}</span>
                        <span className="text-sm text-gray-600">{formatDate(dcQty.dcDate)}</span>
                      </div>
                      {dcQty.remarks && <p className="text-sm text-gray-600 mb-1">{dcQty.remarks}</p>}
                      <p className="text-xs text-gray-400">
                        Added by: {dcQty.addedByName || "N/A"} | {formatDate(dcQty.createdAt)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditDCQty(dcQty)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      {deleteConfirm === dcQty.id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleDeleteDCQty(dcQty.id)}
                            className="px-2 py-1 text-xs bg-red-600 text-white rounded-md hover:bg-red-700"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleDeleteDCQty(dcQty.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
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
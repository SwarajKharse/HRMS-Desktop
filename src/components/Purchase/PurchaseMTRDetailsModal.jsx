"use client"
import { useState, useEffect } from "react"
import { FiX, FiSave, FiCheck, FiXCircle, FiFileText, FiDownload, FiPlus, FiEdit3, FiTrash2 } from "react-icons/fi"
import { motion } from "framer-motion"
import { comparisonSheetService } from "../../services/comparisonSheetService"
import { purchaseInvoiceService } from "../../services/purchaseInvoiceService"
import { materialRequisitionService } from "../../services/materialRequisitionService"
import { useAuth } from "../../contexts/AuthContext"

// Helper function to format dates for display
const formatDate = (dateString) => {
  if (!dateString) return "N/A"
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}

export default function PurchaseMTRDetailsModal({ mtr, onClose, onSave }) {
  const { user } = useAuth()
  const [purchasers, setPurchasers] = useState([])
  const [selectedPurchaser, setSelectedPurchaser] = useState(mtr?.assignedPurchaser || "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [mtrData, setMtrData] = useState(mtr)
  const [mtrLoading, setMtrLoading] = useState(false)
  const [selectedVendorDetails, setSelectedVendorDetails] = useState(null)

  const [purchaseManagerApprovalStatus, setPurchaseManagerApprovalStatus] = useState(
    mtr?.purchaseManagerApprovalStatus || "PENDING",
  )
  const [purchaseManagerApprovalRemarks, setPurchaseManagerApprovalRemarks] = useState(
    mtr?.purchaseManagerApprovalRemarks || "",
  )
  const [purchaseManagerApprovalLoading, setPurchaseManagerApprovalLoading] = useState(false)

  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [poLoading, setPOLoading] = useState(false)
  const [selectedPO, setSelectedPO] = useState(null)
  const [poApprovalStatus, setPOApprovalStatus] = useState("PENDING")
  const [poApprovalRemarks, setPOApprovalRemarks] = useState("")
  const [poApprovalLoading, setPOApprovalLoading] = useState(false)

  const [piData, setPIData] = useState(null)
  const [piLoading, setPILoading] = useState(false)
  const [piApprovalStatus, setPIApprovalStatus] = useState("PENDING")
  const [piApprovalRemarks, setPIApprovalRemarks] = useState("")
  const [piApprovalLoading, setPIApprovalLoading] = useState(false)

  const [dcQtyList, setDcQtyList] = useState([])
  const [dcQtyLoading, setDcQtyLoading] = useState(false)
  const [showAddDcQty, setShowAddDcQty] = useState(false)
  const [editingDcQtyId, setEditingDcQtyId] = useState(null)
  const [dcQtyForm, setDcQtyForm] = useState({
    dcQty: "",
    dcDate: new Date().toISOString().split("T")[0],
    remarks: "",
  })
  const [deletingDcQtyId, setDeletingDcQtyId] = useState(null)

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
    fetchPurchaseOrders()
    fetchDcQtyList()
  }, [])

  const fetchDcQtyList = async () => {
    if (!mtr?.id) return

    setDcQtyLoading(true)
    try {
      const dcQtyData = await materialRequisitionService.getDCQtyByMtrId(mtr.id)
      setDcQtyList(dcQtyData || [])
    } catch (error) {
      console.error("Error fetching DC Qty list:", error)
      setDcQtyList([])
    } finally {
      setDcQtyLoading(false)
    }
  }

  const handleDcQtySubmit = async () => {
    if (!dcQtyForm.dcQty || Number.parseFloat(dcQtyForm.dcQty) <= 0) {
      setError("Please enter a valid DC Qty")
      return
    }

    setDcQtyLoading(true)
    setError("")
    setSuccess("")

    try {
      const currentUserId = user?.userId || user?.id

      if (editingDcQtyId) {
        await materialRequisitionService.updateDCQty(editingDcQtyId, dcQtyForm, currentUserId)
        setSuccess("DC Qty updated successfully!")
      } else {
        await materialRequisitionService.addDCQty(mtr.id, dcQtyForm, currentUserId)
        setSuccess("DC Qty added successfully!")
      }

      // Reset form and refresh list
      setDcQtyForm({ dcQty: "", dcDate: new Date().toISOString().split("T")[0], remarks: "" })
      setShowAddDcQty(false)
      setEditingDcQtyId(null)
      await fetchDcQtyList()

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000)
    } catch (error) {
      console.error("Error saving DC Qty:", error)
      setError("Failed to save DC Qty. Please try again.")
    } finally {
      setDcQtyLoading(false)
    }
  }

  const handleEditDcQty = (dcQty) => {
    setEditingDcQtyId(dcQty.id)
    setDcQtyForm({
      dcQty: dcQty.dcQty,
      dcDate: dcQty.dcDate,
      remarks: dcQty.remarks || "",
    })
    setShowAddDcQty(true)
    setError("")
  }

  const handleDeleteDcQty = async (dcQtyId) => {
    setDcQtyLoading(true)
    setError("")
    setSuccess("")

    try {
      await materialRequisitionService.deleteDCQty(dcQtyId)
      setSuccess("DC Qty deleted successfully!")
      setDeletingDcQtyId(null)
      await fetchDcQtyList()

      setTimeout(() => setSuccess(""), 3000)
    } catch (error) {
      console.error("Error deleting DC Qty:", error)
      setError("Failed to delete DC Qty. Please try again.")
    } finally {
      setDcQtyLoading(false)
    }
  }

  const handleCancelDcQtyForm = () => {
    setShowAddDcQty(false)
    setEditingDcQtyId(null)
    setDcQtyForm({ dcQty: "", dcDate: new Date().toISOString().split("T")[0], remarks: "" })
    setError("")
  }

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

  const fetchPurchaseOrders = async () => {
    if (!mtr?.id) return

    setPOLoading(true)
    try {
      const pos = await comparisonSheetService.getPOsByMtrIdWithDetails(mtr.id)
      setPurchaseOrders(pos || [])

      if (pos && pos.length > 0) {
        setSelectedPO(pos[0])
        setPOApprovalStatus(pos[0].approvalStatus || "PENDING")
        setPOApprovalRemarks(pos[0].approvalRemarks || "")
        await fetchPIDataForPO(pos[0].id)
      }
    } catch (error) {
      console.error("Error fetching purchase orders:", error)
      setPurchaseOrders([])
    } finally {
      setPOLoading(false)
    }
  }

  const fetchPIDataForPO = async (poId) => {
    if (!poId) return

    setPILoading(true)
    try {
      const pi = await purchaseInvoiceService.getPurchaseInvoiceByPOId(poId)
      if (pi) {
        setPIData(pi)
        setPIApprovalStatus(pi.approvalStatus || "PENDING")
        setPIApprovalRemarks(pi.approvalRemarks || "")
      } else {
        setPIData(null)
        setPIApprovalStatus("PENDING")
        setPIApprovalRemarks("")
      }
    } catch (error) {
      console.error("Error fetching PI data:", error)
      setPIData(null)
      setPIApprovalStatus("PENDING")
      setPIApprovalRemarks("")
    } finally {
      setPILoading(false)
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

  const handleSavePurchaseManagerApproval = async () => {
    if (!purchaseManagerApprovalStatus || purchaseManagerApprovalStatus === "PENDING") {
      setError("Please select an approval status")
      return
    }

    setPurchaseManagerApprovalLoading(true)
    setError("")
    setSuccess("")

    try {
      await comparisonSheetService.updatePurchaseManagerApprovalStatus(
        mtrData.id,
        purchaseManagerApprovalStatus,
        purchaseManagerApprovalRemarks,
      )
      setSuccess("Purchase Manager approval status updated successfully!")

      if (onSave) {
        onSave({
          ...mtrData,
          purchaseManagerApprovalStatus,
          purchaseManagerApprovalRemarks,
          purchaseManagerApprovalDate: new Date().toISOString(),
        })
      }
    } catch (error) {
      console.error("Error updating Purchase Manager approval:", error)
      setError("Failed to update Purchase Manager approval status. Please try again.")
    } finally {
      setPurchaseManagerApprovalLoading(false)
    }
  }

  const handleSavePOApproval = async () => {
    if (!selectedPO || !poApprovalStatus || poApprovalStatus === "PENDING") {
      setError("Please select a PO and approval status")
      return
    }

    setPOApprovalLoading(true)
    setError("")
    setSuccess("")

    try {
      const currentUserId = user?.userId || user?.id
      await comparisonSheetService.approvePO(selectedPO.id, poApprovalStatus, poApprovalRemarks, currentUserId)
      setSuccess("PO approval status updated successfully!")

      const updatedPOs = purchaseOrders.map((po) =>
        po.id === selectedPO.id
          ? {
              ...po,
              approvalStatus: poApprovalStatus,
              approvalRemarks: poApprovalRemarks,
              approvalDate: new Date().toISOString(),
            }
          : po,
      )
      setPurchaseOrders(updatedPOs)
      setSelectedPO((prev) => ({ ...prev, approvalStatus: poApprovalStatus, approvalRemarks: poApprovalRemarks }))

      if (onSave) {
        onSave({ ...mtrData, purchaseOrders: updatedPOs })
      }
    } catch (error) {
      console.error("Error updating PO approval:", error)
      setError("Failed to update PO approval status. Please try again.")
    } finally {
      setPOApprovalLoading(false)
    }
  }

  const handleSavePIApproval = async () => {
    if (!piData || !piApprovalStatus || piApprovalStatus === "PENDING") {
      setError("Please select an approval status for the Purchase Invoice")
      return
    }

    setPIApprovalLoading(true)
    setError("")
    setSuccess("")

    try {
      const approvalData = {
        approvalStatus: piApprovalStatus,
        remarks: piApprovalRemarks,
        approvedBy: user?.userId || user?.id,
      }

      await purchaseInvoiceService.approvePurchaseInvoice(piData.id, approvalData)
      setSuccess("Purchase Invoice approval status updated successfully!")

      setPIData((prev) => ({
        ...prev,
        approvalStatus: piApprovalStatus,
        approvalRemarks: piApprovalRemarks,
        approvalDate: new Date().toISOString(),
        approvedBy: user,
      }))

      if (onSave) {
        onSave({ ...mtrData, piApprovalStatus: piApprovalStatus })
      }
    } catch (error) {
      console.error("Error updating PI approval:", error)
      setError("Failed to update Purchase Invoice approval status. Please try again.")
    } finally {
      setPIApprovalLoading(false)
    }
  }

  if (!mtrData) return null

  const totalDcQty = dcQtyList.reduce((sum, item) => sum + Number.parseFloat(item.dcQty || 0), 0)

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
        className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-bold text-blue-700">Material Requisition Details</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <FiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError("")} className="text-red-700 hover:text-red-900">
              <FiX />
            </button>
          </div>
        )}
        {success && (
          <div className="mx-4 mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded flex justify-between items-center">
            <span>{success}</span>
            <button onClick={() => setSuccess("")} className="text-green-700 hover:text-green-900">
              <FiX />
            </button>
          </div>
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

            <div className="col-span-2 mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-md font-semibold text-green-800">DC Qty Management</h4>
                <button
                  onClick={() => setShowAddDcQty(!showAddDcQty)}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700 h-9 px-3 py-1 gap-2"
                  disabled={dcQtyLoading}
                >
                  <FiPlus size={16} />
                  {editingDcQtyId ? "Cancel Edit" : "Add DC Qty"}
                </button>
              </div>

              {showAddDcQty && (
                <div className="mb-4 p-3 bg-white rounded border border-green-300">
                  <h5 className="text-sm font-semibold text-green-700 mb-2">
                    {editingDcQtyId ? "Edit DC Qty" : "Add New DC Qty"}
                  </h5>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">DC Qty *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={dcQtyForm.dcQty}
                        onChange={(e) => setDcQtyForm({ ...dcQtyForm, dcQty: e.target.value })}
                        placeholder="Enter DC Qty"
                        className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        disabled={dcQtyLoading}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">DC Date *</label>
                      <input
                        type="date"
                        value={dcQtyForm.dcDate}
                        onChange={(e) => setDcQtyForm({ ...dcQtyForm, dcDate: e.target.value })}
                        className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        disabled={dcQtyLoading}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Remarks</label>
                      <input
                        type="text"
                        value={dcQtyForm.remarks}
                        onChange={(e) => setDcQtyForm({ ...dcQtyForm, remarks: e.target.value })}
                        placeholder="Optional remarks"
                        className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        disabled={dcQtyLoading}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDcQtySubmit}
                      disabled={dcQtyLoading}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 h-9 px-4 py-1 gap-2"
                    >
                      <FiSave size={16} />
                      {dcQtyLoading ? "Saving..." : editingDcQtyId ? "Update" : "Add"}
                    </button>
                    <button
                      onClick={handleCancelDcQtyForm}
                      disabled={dcQtyLoading}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-gray-300 text-gray-700 hover:bg-gray-400 h-9 px-4 py-1"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="mb-3">
                <p className="text-sm font-medium text-green-700">
                  Total DC Qty: <span className="text-lg font-bold">{totalDcQty.toFixed(2)}</span>
                </p>
              </div>

              {dcQtyLoading && !showAddDcQty ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">Loading DC Qty list...</p>
                </div>
              ) : dcQtyList.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">No DC Qty entries found. Click "Add DC Qty" to add one.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-green-100 border-b border-green-200">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-green-800">DC Qty</th>
                        <th className="px-3 py-2 text-left font-semibold text-green-800">DC Date</th>
                        <th className="px-3 py-2 text-left font-semibold text-green-800">Remarks</th>
                        <th className="px-3 py-2 text-left font-semibold text-green-800">Added By</th>
                        <th className="px-3 py-2 text-left font-semibold text-green-800">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dcQtyList.map((dcQty) => (
                        <tr key={dcQty.id} className="border-b border-green-100 hover:bg-green-50">
                          <td className="px-3 py-2 font-medium text-gray-700">{dcQty.dcQty}</td>
                          <td className="px-3 py-2 text-gray-700">{formatDate(dcQty.dcDate)}</td>
                          <td className="px-3 py-2 text-gray-700">{dcQty.remarks || "-"}</td>
                          <td className="px-3 py-2 text-gray-700">{dcQty.addedByName || `User ${dcQty.addedBy}`}</td>
                          <td className="px-3 py-2">
                            {deletingDcQtyId === dcQty.id ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleDeleteDcQty(dcQty.id)}
                                  className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                                  disabled={dcQtyLoading}
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setDeletingDcQtyId(null)}
                                  className="text-xs bg-gray-300 text-gray-700 px-2 py-1 rounded hover:bg-gray-400"
                                  disabled={dcQtyLoading}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEditDcQty(dcQty)}
                                  className="text-blue-600 hover:text-blue-800"
                                  title="Edit DC Qty"
                                  disabled={dcQtyLoading}
                                >
                                  <FiEdit3 size={16} />
                                </button>
                                <button
                                  onClick={() => setDeletingDcQtyId(dcQty.id)}
                                  className="text-red-600 hover:text-red-800"
                                  title="Delete DC Qty"
                                  disabled={dcQtyLoading}
                                >
                                  <FiTrash2 size={16} />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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
                <h4 className="text-md font-semibold text-gray-800 mb-3">
                  Selected Vendor & Purchase Manager Approval
                </h4>

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
                      {mtrData.purchaseManagerApprovalStatus === "APPROVED" && <FiCheck className="text-green-600" />}
                      {mtrData.purchaseManagerApprovalStatus === "REJECTED" && <FiXCircle className="text-red-600" />}
                      <span
                        className={`font-semibold ${
                          mtrData.purchaseManagerApprovalStatus === "APPROVED"
                            ? "text-green-600"
                            : mtrData.purchaseManagerApprovalStatus === "REJECTED"
                              ? "text-red-600"
                              : "text-yellow-600"
                        }`}
                      >
                        {mtrData.purchaseManagerApprovalStatus || "PENDING"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Approval Date:</p>
                    <p>{formatDate(mtrData.purchaseManagerApprovalDate)}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Update Approval Status:</label>
                    <select
                      value={purchaseManagerApprovalStatus}
                      onChange={(e) => setPurchaseManagerApprovalStatus(e.target.value)}
                      className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={purchaseManagerApprovalLoading}
                    >
                      <option value="PENDING">Pending</option>
                      <option value="APPROVED">Approved</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Remarks:</label>
                    <textarea
                      value={purchaseManagerApprovalRemarks}
                      onChange={(e) => setPurchaseManagerApprovalRemarks(e.target.value)}
                      placeholder="Enter approval remarks for selected vendor..."
                      rows={3}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={purchaseManagerApprovalLoading}
                    />
                  </div>

                  <button
                    onClick={handleSavePurchaseManagerApproval}
                    disabled={purchaseManagerApprovalLoading || purchaseManagerApprovalStatus === "PENDING"}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed h-10 px-4 py-2 gap-2"
                  >
                    <FiSave size={16} />
                    {purchaseManagerApprovalLoading ? "Saving..." : "Update Vendor Approval"}
                  </button>
                </div>

                {mtrData.purchaseManagerApprovalRemarks && (
                  <div className="mt-3 p-3 bg-white rounded border">
                    <p className="text-sm font-medium text-gray-700">Previous Remarks:</p>
                    <p className="text-sm text-gray-700">{mtrData.purchaseManagerApprovalRemarks}</p>
                  </div>
                )}
              </div>
            )}

            {purchaseOrders.length > 0 && (
              <div className="col-span-2 mt-4 p-4 bg-yellow-50 rounded-lg border border-orange-200">
                <h4 className="text-md font-semibold text-orange-800 mb-3">Purchase Order Approval</h4>

                {poLoading ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">Loading purchase orders...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-orange-700 block mb-1">Select Purchase Order:</label>
                      <select
                        value={selectedPO?.id || ""}
                        onChange={(e) => {
                          const po = purchaseOrders.find((p) => p.id === Number.parseInt(e.target.value))
                          setSelectedPO(po)
                          setPOApprovalStatus(po?.approvalStatus || "PENDING")
                          setPOApprovalRemarks(po?.approvalRemarks || "")
                          if (po) {
                            fetchPIDataForPO(po.id)
                          }
                        }}
                        className="w-full h-10 rounded-md border border-orange-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        disabled={poApprovalLoading}
                      >
                        <option value="">-- Select PO --</option>
                        {purchaseOrders.map((po) => (
                          <option key={po.id} value={po.id}>
                            {po.poNumber} - {po.fileName}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedPO && (
                      <>
                        <div className="p-3 bg-white rounded border">
                          <p className="text-sm font-medium text-gray-700 mb-2">Selected PO Details:</p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <div>
                              <p className="text-xs font-medium text-gray-600">PO Number:</p>
                              <p className="font-semibold text-orange-600">{selectedPO.poNumber}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-600">File:</p>
                              <a
                                href={selectedPO.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 underline hover:text-blue-800 text-sm"
                              >
                                {selectedPO.fileName}
                              </a>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-600">Current Status:</p>
                              <div className="flex items-center gap-2">
                                {selectedPO.approvalStatus === "APPROVED" && <FiCheck className="text-green-600" />}
                                {selectedPO.approvalStatus === "REJECTED" && <FiXCircle className="text-red-600" />}
                                <span
                                  className={`font-semibold ${
                                    selectedPO.approvalStatus === "APPROVED"
                                      ? "text-green-600"
                                      : selectedPO.approvalStatus === "REJECTED"
                                        ? "text-red-600"
                                        : "text-yellow-600"
                                  }`}
                                >
                                  {selectedPO.approvalStatus || "PENDING"}
                                </span>
                              </div>
                            </div>
                          </div>
                          {selectedPO.approvalDate && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-gray-600">Approval Date:</p>
                              <p className="text-sm">{formatDate(selectedPO.approvalDate)}</p>
                            </div>
                          )}
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-orange-700 block mb-1">
                              Update Approval Status:
                            </label>
                            <select
                              value={poApprovalStatus}
                              onChange={(e) => setPOApprovalStatus(e.target.value)}
                              className="w-full h-10 rounded-md border border-orange-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                              disabled={poApprovalLoading}
                            >
                              <option value="PENDING">Pending</option>
                              <option value="APPROVED">Approved</option>
                              <option value="REJECTED">Rejected</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-orange-700 block mb-1">Approval Remarks:</label>
                            <textarea
                              value={poApprovalRemarks}
                              onChange={(e) => setPOApprovalRemarks(e.target.value)}
                              placeholder="Enter approval remarks for the purchase order..."
                              rows={3}
                              className="w-full rounded-md border border-orange-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                              disabled={poApprovalLoading}
                            />
                          </div>

                          <button
                            onClick={handleSavePOApproval}
                            disabled={poApprovalLoading || poApprovalStatus === "PENDING"}
                            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed h-10 px-4 py-2 gap-2"
                          >
                            <FiSave size={16} />
                            {poApprovalLoading ? "Saving..." : "Update PO Approval"}
                          </button>
                        </div>

                        {selectedPO.approvalRemarks && (
                          <div className="p-3 bg-white rounded border">
                            <p className="text-sm font-medium text-gray-700">Previous Approval Remarks:</p>
                            <p className="text-sm text-gray-700">{selectedPO.approvalRemarks}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {selectedPO && (
              <div className="col-span-2 mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="text-md font-semibold text-purple-800 mb-3">Purchase Invoice Approval</h4>

                {piLoading ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">Loading purchase invoice data...</p>
                  </div>
                ) : piData ? (
                  <div className="space-y-4">
                    {piData.uploadedBy?.id !== user?.userId && piData.uploadedBy?.id !== user?.id ? (
                      <>
                        <div className="p-3 bg-white rounded border border-purple-300">
                          <div className="flex items-center gap-2 mb-2">
                            <FiFileText className="text-purple-600" />
                            <p className="text-sm font-medium text-purple-700">
                              Purchase Invoice Details (Uploaded by another user):
                            </p>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <div>
                              <p className="text-xs font-medium text-gray-600">PI Number:</p>
                              <p className="font-semibold text-purple-600">{piData.piNumber}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-600">Payable Amount:</p>
                              <p className="font-semibold text-green-600">₹{piData.payableAmount}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-600">Project:</p>
                              <p className="font-semibold text-blue-600">{piData.projectName}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-600">Expected Payment:</p>
                              <p className="font-semibold text-orange-600">{formatDate(piData.expectedPaymentDate)}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-600">Uploaded By:</p>
                              <p className="font-semibold text-gray-700">
                                {piData.uploadedBy?.firstName} {piData.uploadedBy?.lastName}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-600">Current Status:</p>
                              <div className="flex items-center gap-2">
                                {piData.approvalStatus === "APPROVED" && <FiCheck className="text-green-600" />}
                                {piData.approvalStatus === "REJECTED" && <FiXCircle className="text-red-600" />}
                                <span
                                  className={`font-semibold ${
                                    piData.approvalStatus === "APPROVED"
                                      ? "text-green-600"
                                      : piData.approvalStatus === "REJECTED"
                                        ? "text-red-600"
                                        : "text-yellow-600"
                                  }`}
                                >
                                  {piData.approvalStatus || "PENDING"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {piData.fileUrl && (
                            <div className="mt-3 pt-3 border-t border-purple-200">
                              <div className="flex items-center gap-2">
                                <FiDownload className="text-purple-600" />
                                <a
                                  href={piData.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-purple-600 underline hover:text-purple-800 text-sm font-medium"
                                >
                                  Download PI Document: {piData.fileName}
                                </a>
                              </div>
                            </div>
                          )}

                          {piData.remarks && (
                            <div className="mt-3 pt-3 border-t border-purple-200">
                              <p className="text-xs font-medium text-gray-600">Remarks:</p>
                              <p className="text-sm text-gray-700">{piData.remarks}</p>
                            </div>
                          )}
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-purple-700 block mb-1">Approval Status:</label>
                            <select
                              value={piApprovalStatus}
                              onChange={(e) => setPIApprovalStatus(e.target.value)}
                              className="w-full h-10 rounded-md border border-purple-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                              disabled={piApprovalLoading}
                            >
                              <option value="PENDING">Pending</option>
                              <option value="APPROVED">Approved</option>
                              <option value="REJECTED">Rejected</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-purple-700 block mb-1">Approval Remarks:</label>
                            <textarea
                              value={piApprovalRemarks}
                              onChange={(e) => setPIApprovalRemarks(e.target.value)}
                              placeholder="Enter approval remarks for the purchase invoice..."
                              rows={3}
                              className="w-full rounded-md border border-purple-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                              disabled={piApprovalLoading}
                            />
                          </div>

                          <button
                            onClick={handleSavePIApproval}
                            disabled={piApprovalLoading || piApprovalStatus === "PENDING"}
                            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed h-10 px-4 py-2 gap-2"
                          >
                            <FiSave size={16} />
                            {piApprovalLoading ? "Saving..." : "Update PI Approval"}
                          </button>
                        </div>

                        {piData.approvalRemarks && (
                          <div className="p-3 bg-white rounded border">
                            <p className="text-sm font-medium text-gray-700">Previous PI Approval Remarks:</p>
                            <p className="text-sm text-gray-700">{piData.approvalRemarks}</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="p-3 bg-blue-50 rounded border border-blue-200">
                        <p className="text-sm text-blue-700">
                          <FiFileText className="inline mr-2" />
                          Purchase Invoice was uploaded by you. No approval required.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 rounded border border-gray-200">
                    <p className="text-sm text-gray-600">
                      <FiFileText className="inline mr-2" />
                      No Purchase Invoice found for this Purchase Order.
                    </p>
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
"use client"

import { useState, useEffect } from "react"
import { FiX, FiChevronDown, FiChevronUp, FiPlus, FiTrash2, FiCheck, FiXCircle } from "react-icons/fi"
import { motion, AnimatePresence } from "framer-motion"
import VendorDropdown from "./VendorDropdown"
import { comparisonSheetService } from "../../../services/comparisonSheetService"

// Helper function to format dates for display
const formatDate = (dateString) => {
  if (!dateString) return "N/A"
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}

export default function ComparisionSheetModal({ mtr, onClose, onSave }) {
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false)
  const [isComparisonExpanded, setIsComparisonExpanded] = useState(true)
  const [comparisons, setComparisons] = useState([
    { id: 1, vendorName: "", qty: mtr?.purchaseMTR || 0, rate: 0, value: 0, leadTime: "" },
    { id: 2, vendorName: "", qty: mtr?.purchaseMTR || 0, rate: 0, value: 0, leadTime: "" },
    { id: 3, vendorName: "", qty: mtr?.purchaseMTR || 0, rate: 0, value: 0, leadTime: "" },
  ])
  const [selectedVendor, setSelectedVendor] = useState("")
  const [loading, setSaving] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    const loadComparisonSheetData = async () => {
      if (!mtr?.id) {
        console.log("[v0] No MTR ID available")
        return
      }

      setIsLoadingData(true)
      try {
        console.log("[v0] Fetching MTR with comparison sheet data for ID:", mtr.id)

        // Fetch the complete MTR data with comparison sheet information
        const mtrWithComparisonData = await comparisonSheetService.getMTRWithComparisonSheet(mtr.id)
        console.log("[v0] MTR with comparison sheet data:", mtrWithComparisonData)

        // Check if comparison sheet exists and load the data
        if (mtrWithComparisonData.comparisonSheetId && mtrWithComparisonData.comparisonSheetCreated) {
          console.log("[v0] Loading comparison sheet data for ID:", mtrWithComparisonData.comparisonSheetId)
          const comparisonSheetData = await comparisonSheetService.getComparisonSheetById(
            mtrWithComparisonData.comparisonSheetId,
          )

          console.log("[v0] Raw API response:", comparisonSheetData)
          console.log("[v0] API response comparisonItems:", comparisonSheetData?.comparisonItems)

          // Update comparisons with loaded data
          if (
            comparisonSheetData &&
            comparisonSheetData.comparisonItems &&
            comparisonSheetData.comparisonItems.length > 0
          ) {
            console.log("[v0] Processing comparison items:", comparisonSheetData.comparisonItems)
            const loadedComparisons = comparisonSheetData.comparisonItems.map((item, index) => ({
              id: index + 1,
              vendorName: item.vendor?.vendorName || "", // Access vendor name through vendor object
              qty: item.quantity || mtr?.purchaseMTR || 0, // Use quantity instead of qty
              rate: item.rate || 0,
              value: item.value || 0,
              leadTime: item.leadTime || "",
            }))

            console.log("[v0] Loaded comparisons:", loadedComparisons)

            // Ensure we have at least 3 rows
            while (loadedComparisons.length < 3) {
              loadedComparisons.push({
                id: loadedComparisons.length + 1,
                vendorName: "",
                qty: mtr?.purchaseMTR || 0,
                rate: 0,
                value: 0,
                leadTime: "",
              })
            }

            console.log("[v0] Final comparisons to set:", loadedComparisons)
            setComparisons(loadedComparisons)
          } else {
            console.log("[v0] No comparison items found in API response")
          }

          if (comparisonSheetData.selectedVendor) {
            const selectedVendorName =
              typeof comparisonSheetData.selectedVendor === "string"
                ? comparisonSheetData.selectedVendor
                : comparisonSheetData.selectedVendor.vendorName
            console.log("[v0] Setting selected vendor:", selectedVendorName)
            setSelectedVendor(selectedVendorName)
          }
        } else {
          console.log("[v0] No comparison sheet data found for this MTR")
        }
      } catch (error) {
        console.error("[v0] Error loading comparison sheet data:", error)
        console.error("[v0] Error details:", error.message, error.stack)
        setError("Error loading comparison sheet data")
      } finally {
        setIsLoadingData(false)
      }
    }

    loadComparisonSheetData()
  }, [mtr?.id]) // Updated dependency to only watch for MTR ID changes

  const updateComparison = (id, field, value) => {
    setComparisons((prev) =>
      prev.map((comp) => {
        if (comp.id === id) {
          const updated = { ...comp, [field]: value }
          if (field === "qty" || field === "rate") {
            updated.value = (Number.parseFloat(updated.qty) || 0) * (Number.parseFloat(updated.rate) || 0)
          }
          return updated
        }
        return comp
      }),
    )
  }

  const addComparison = () => {
    const newId = Math.max(...comparisons.map((c) => c.id)) + 1
    setComparisons((prev) => [
      ...prev,
      {
        id: newId,
        vendorName: "",
        qty: mtr?.purchaseMTR || 0,
        rate: 0,
        value: 0,
        leadTime: "",
      },
    ])
  }

  const removeComparison = (id) => {
    if (comparisons.length > 3) {
      setComparisons((prev) => prev.filter((comp) => comp.id !== id))
    }
  }

  const vendorOptions = comparisons
    .filter((comp) => comp.vendorName.trim() !== "")
    .map((comp) => comp.vendorName.trim())

  const handleSave = async () => {
    setError("")
    setSuccess("")

    const invalidComparisons = comparisons.filter((comp) => !comp.vendorName.trim())
    if (invalidComparisons.length > 0) {
      setError("Please fill in all vendor names")
      return
    }

    if (!selectedVendor) {
      setError("Please select a vendor")
      return
    }

    setSaving(true)
    try {
      const comparisonData = {
        boqMtrId: mtr.id,
        items: comparisons.map((comp) => ({
          vendorName: comp.vendorName.trim(),
          qty: Number.parseFloat(comp.qty) || 0,
          rate: Number.parseFloat(comp.rate) || 0,
          value: comp.value,
          leadTime: comp.leadTime.trim(),
        })),
        selectedVendor: selectedVendor.trim(),
        createdBy: "1",
      }

      console.log("[v0] Saving comparison data:", comparisonData)

      if (onSave) {
        await onSave(comparisonData)
      }

      setSuccess("Comparison sheet saved successfully!")
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (error) {
      console.error("Error saving comparison sheet:", error)
      setError("Error saving comparison sheet. Please try again.")
    } finally {
      setSaving(false)
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
        className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-blue-50">
          <h3 className="text-lg font-bold text-blue-700">
            Comparison Sheet - Material Requisition
            {isLoadingData && <span className="ml-2 text-sm text-blue-500">(Loading...)</span>}
          </h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <FiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Error and Success Message Display */}
        {(error || success) && (
          <div className={`p-4 ${error ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"} border-b`}>
            <p className={`text-sm ${error ? "text-red-700" : "text-green-700"}`}>{error || success}</p>
          </div>
        )}

        {isLoadingData ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading comparison sheet data...</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="min-h-0">
              {/* Material Requisition Details - Collapsible */}
              <div className="border-b border-blue-200">
                <button
                  onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <h4 className="text-md font-semibold text-blue-600">Material Requisition Details</h4>
                  {isDetailsExpanded ? (
                    <FiChevronUp className="w-5 h-5 text-blue-600" />
                  ) : (
                    <FiChevronDown className="w-5 h-5 text-blue-600" />
                  )}
                </button>

                <AnimatePresence>
                  {isDetailsExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 pt-0 border-l-4 border-blue-400">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="font-medium text-blue-600">MTR Code:</p>
                            <p className="font-semibold">{mtr.mtrCode || "N/A"}</p>
                          </div>
                          <div>
                            <p className="font-medium text-blue-600">Product Name:</p>
                            <p className="font-semibold">{mtr.productName || "N/A"}</p>
                          </div>
                          <div>
                            <p className="font-medium text-blue-600">Project Name:</p>
                            <p className="font-semibold">{mtr.projectName || "N/A"}</p>
                          </div>
                          <div>
                            <p className="font-medium text-blue-600">MTR Qty:</p>
                            <p>{mtr.mtrQty}</p>
                          </div>
                          <div>
                            <p className="font-medium text-blue-600">Purchase MTR:</p>
                            <p className="font-semibold text-blue-600">{mtr.purchaseMTR}</p>
                          </div>
                          <div>
                            <p className="font-medium text-blue-600">Priority:</p>
                            <p
                              className={`font-medium ${
                                mtr.priority === "HIGH"
                                  ? "text-red-600"
                                  : mtr.priority === "MEDIUM"
                                    ? "text-yellow-600"
                                    : "text-green-600"
                              }`}
                            >
                              {mtr.priority}
                            </p>
                          </div>
                          <div>
                            <p className="font-medium text-blue-600">Status:</p>
                            <p>{mtr.status}</p>
                          </div>
                          <div>
                            <p className="font-medium text-blue-600">Expected Delivery:</p>
                            <p>{formatDate(mtr.expectedDeliveryDate)}</p>
                          </div>
                          <div>
                            <p className="font-medium text-blue-600">PM Approval:</p>
                            <div className="flex items-center gap-2">
                              {mtr.boqMtr?.pmApprovalStatus === "APPROVED" && <FiCheck className="text-green-600" />}
                              {mtr.boqMtr?.pmApprovalStatus === "REJECTED" && <FiXCircle className="text-red-600" />}
                              <span
                                className={`font-semibold ${
                                  mtr.boqMtr?.pmApprovalStatus === "APPROVED"
                                    ? "text-green-600"
                                    : mtr.boqMtr?.pmApprovalStatus === "REJECTED"
                                      ? "text-red-600"
                                      : "text-yellow-600"
                                }`}
                              >
                                {mtr.boqMtr?.pmApprovalStatus || "PENDING"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {mtr.boqMtr?.pmApprovalStatus && mtr.boqMtr.pmApprovalStatus !== "PENDING" && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="font-medium text-gray-600">Approval Date:</p>
                                <p>{formatDate(mtr.boqMtr?.pmApprovalDate)}</p>
                              </div>
                              {mtr.boqMtr?.pmApprovalRemarks && (
                                <div className="col-span-2">
                                  <p className="font-medium text-gray-600">PM Remarks:</p>
                                  <p className="text-gray-700">{mtr.boqMtr.pmApprovalRemarks}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Comparison Sheet - Collapsible */}
              <div className="border-b border-amber-200">
                <button
                  onClick={() => setIsComparisonExpanded(!isComparisonExpanded)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <h4 className="text-md font-semibold text-amber-700">Vendor Comparison Sheet</h4>
                  {isComparisonExpanded ? (
                    <FiChevronUp className="w-5 h-5 text-amber-600" />
                  ) : (
                    <FiChevronDown className="w-5 h-5 text-amber-600" />
                  )}
                </button>

                <AnimatePresence>
                  {isComparisonExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="p-6 border-l-4 border-amber-400">
                        <div className="flex items-center justify-between mb-4">
                          <h5 className="text-lg font-semibold text-amber-700">Vendor Comparisons</h5>
                          <button
                            onClick={addComparison}
                            className="flex items-center gap-2 px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                          >
                            <FiPlus className="w-4 h-4" />
                            Add More
                          </button>
                        </div>

                        {/* Comparison Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full border border-gray-200 rounded-lg">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">
                                  Vendor Name
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Qty</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Rate</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">
                                  Value
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">
                                  Lead Time
                                </th>
                                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 border-b">
                                  Action
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {comparisons.map((comparison, index) => (
                                <tr key={comparison.id} className="border-b hover:bg-gray-50">
                                  <td className="px-4 py-3 relative">
                                    <VendorDropdown
                                      value={comparison.vendorName}
                                      onChange={(vendorName) =>
                                        updateComparison(comparison.id, "vendorName", vendorName)
                                      }
                                      placeholder="Select or add vendor"
                                    />
                                  </td>
                                  <td className="px-4 py-3">
                                    <input
                                      type="number"
                                      value={comparison.qty}
                                      onChange={(e) => updateComparison(comparison.id, "qty", e.target.value)}
                                      step="0.01"
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  </td>
                                  <td className="px-4 py-3">
                                    <input
                                      type="number"
                                      value={comparison.rate}
                                      onChange={(e) => updateComparison(comparison.id, "rate", e.target.value)}
                                      step="0.01"
                                      placeholder="0.00"
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  </td>
                                  <td className="px-4 py-3">
                                    <input
                                      type="number"
                                      value={comparison.value.toFixed(2)}
                                      readOnly
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                                    />
                                  </td>
                                  <td className="px-4 py-3">
                                    <input
                                      type="text"
                                      value={comparison.leadTime}
                                      onChange={(e) => updateComparison(comparison.id, "leadTime", e.target.value)}
                                      placeholder="e.g., 7 days"
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    {comparisons.length > 3 && (
                                      <button
                                        onClick={() => removeComparison(comparison.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                      >
                                        <FiTrash2 className="w-4 h-4" />
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Vendor Selection */}
                        <div className="mt-6">
                          <label className="block text-sm font-medium text-amber-700 mb-2">
                            Select Vendor for MTR:
                          </label>
                          {mtr.boqMtr?.pmApprovalStatus === "APPROVED" && (
                            <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded-md">
                              <p className="text-sm text-green-700 font-medium">
                                ✓ Vendor selection is locked - PM has approved the selected vendor
                              </p>
                            </div>
                          )}
                          <div className="w-full max-w-md relative">
                            {console.log("[v0] Vendor options for final dropdown:", vendorOptions)}
                            <select
                              value={selectedVendor}
                              onChange={(e) => setSelectedVendor(e.target.value)}
                              disabled={mtr.boqMtr?.pmApprovalStatus === "APPROVED"}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                              <option value="">-- Select Vendor --</option>
                              {vendorOptions.length > 0 ? (
                                vendorOptions.map((vendor, index) => (
                                  <option key={index} value={vendor}>
                                    {vendor}
                                  </option>
                                ))
                              ) : (
                                <option value="" disabled>
                                  No vendors selected in comparison items above
                                </option>
                              )}
                            </select>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || mtr.boqMtr?.pmApprovalStatus === "APPROVED"}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {mtr.boqMtr?.pmApprovalStatus === "APPROVED"
              ? "Vendor Approved - Cannot Modify"
              : loading
                ? "Saving..."
                : "Save Comparison Sheet"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}